import type { Context, Next } from "hono";
import { verifyToken } from "../lib/jwt.js";

export const authMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ message: "No autorizado" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("planTier", payload.planTier);
    c.set("role", payload.role ?? "member");
    c.set("orgId", payload.orgId ?? "");
    await next();
  } catch {
    return c.json({ message: "Token inválido o expirado" }, 401);
  }
};

/** Middleware que requiere rol superadmin */
export const requireSuperAdmin = async (c: Context, next: Next) => {
  const role = c.get("role");
  if (role !== "superadmin") {
    return c.json({ message: "Acceso denegado: se requiere superadmin" }, 403);
  }
  await next();
};
