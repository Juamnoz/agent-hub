import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, memberships, organizations } from "../db/schema.js";
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { authMiddleware } from "../middleware/auth.js";

const auth = createRouter();

/** Helper: build user response with orgs */
async function buildUserResponse(user: typeof users.$inferSelect) {
  // Superadmin sees ALL organizations
  if (user.role === "superadmin") {
    const allOrgs = await db.query.organizations.findMany({
      orderBy: (o, { asc }) => [asc(o.name)],
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      planTier: user.planTier,
      role: user.role,
      organizations: allOrgs.map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        logoUrl: o.logoUrl,
        role: "superadmin" as const,
      })),
      createdAt: user.createdAt,
    };
  }

  const userMemberships = await db.query.memberships.findMany({
    where: eq(memberships.userId, user.id),
    with: { organization: true },
  });

  const orgs = userMemberships.map((m) => ({
    id: m.organization.id,
    slug: m.organization.slug,
    name: m.organization.name,
    logoUrl: m.organization.logoUrl,
    role: m.role,
  }));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    planTier: user.planTier,
    role: user.role,
    organizations: orgs,
    createdAt: user.createdAt,
  };
}

/** Helper: sign tokens for a user */
async function signTokensForUser(user: typeof users.$inferSelect) {
  // Get first org if any
  const firstMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });

  const [token, refreshToken] = await Promise.all([
    signToken({
      sub: user.id,
      email: user.email,
      planTier: user.planTier,
      role: user.role,
      orgId: firstMembership?.organizationId,
    }),
    signRefreshToken(user.id),
  ]);

  return { token, refreshToken };
}

// POST /auth/register
auth.post(
  "/register",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })
  ),
  async (c) => {
    const { name, email, password } = c.req.valid("json");

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return c.json({ message: "El email ya está registrado" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

    const { token, refreshToken } = await signTokensForUser(user);
    const userData = await buildUserResponse(user);

    return c.json({ token, refreshToken, user: userData }, 201);
  }
);

// POST /auth/login
auth.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().min(1),
      password: z.string().min(1),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    // Try by email, username, or name (case-insensitive)
    const input = email.trim();
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.email, input),
        sql`lower(${users.username}) = lower(${input})`,
        sql`lower(${users.name}) = lower(${input})`
      ),
    });
    if (!user) {
      return c.json({ message: "Credenciales inválidas" }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ message: "Credenciales inválidas" }, 401);
    }

    const { token, refreshToken } = await signTokensForUser(user);
    const userData = await buildUserResponse(user);

    return c.json({ token, refreshToken, user: userData });
  }
);

// GET /auth/me
auth.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) {
    return c.json({ message: "Usuario no encontrado" }, 404);
  }

  const userData = await buildUserResponse(user);
  return c.json(userData);
});

// POST /auth/refresh
auth.post(
  "/refresh",
  zValidator("json", z.object({ refreshToken: z.string() })),
  async (c) => {
    const { refreshToken } = c.req.valid("json");

    try {
      const { sub } = await verifyRefreshToken(refreshToken);
      const user = await db.query.users.findFirst({
        where: eq(users.id, sub),
      });
      if (!user) {
        return c.json({ message: "Usuario no encontrado" }, 404);
      }

      const firstMembership = await db.query.memberships.findFirst({
        where: eq(memberships.userId, user.id),
      });

      const token = await signToken({
        sub: user.id,
        email: user.email,
        planTier: user.planTier,
        role: user.role,
        orgId: firstMembership?.organizationId,
      });

      return c.json({ token });
    } catch {
      return c.json({ message: "Refresh token inválido" }, 401);
    }
  }
);

// POST /auth/logout
auth.post("/logout", authMiddleware, (c) => {
  return c.json({ message: "Sesión cerrada" });
});

export default auth;
