import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { reservations, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const reservationsRoute = createRouter();
reservationsRoute.use("*", authMiddleware);

// GET /agents/:agentId/reservations
reservationsRoute.get("/:agentId/reservations", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const status = c.req.query("status");
  const date = c.req.query("date");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const result = await db.query.reservations.findMany({
    where: eq(reservations.agentId, agentId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const filtered = result
    .filter((r) => !status || r.status === status)
    .filter((r) => !date || r.date === date);

  return c.json(filtered);
});

// POST /agents/:agentId/reservations
reservationsRoute.post(
  "/:agentId/reservations",
  zValidator(
    "json",
    z.object({
      clientName: z.string().min(1),
      clientPhone: z.string().min(5),
      clientEmail: z.string().email().optional(),
      date: z.string(),
      time: z.string(),
      partySize: z.number().int().min(1).optional().default(1),
      roomType: z.string().optional(),
      notes: z.string().optional(),
      status: z.string().optional().default("pending"),
      source: z.string().optional().default("panel"),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const data = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const [reservation] = await db
      .insert(reservations)
      .values({ ...data, agentId })
      .returning();

    return c.json(reservation, 201);
  }
);

// PATCH /agents/:agentId/reservations/:resId
reservationsRoute.patch(
  "/:agentId/reservations/:resId",
  zValidator(
    "json",
    z.object({
      clientName: z.string().min(1).optional(),
      clientPhone: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      partySize: z.number().int().optional(),
      roomType: z.string().optional(),
      notes: z.string().optional(),
      status: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const resId = c.req.param("resId");
    const data = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const [updated] = await db
      .update(reservations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(reservations.id, resId), eq(reservations.agentId, agentId)))
      .returning();

    if (!updated) return c.json({ message: "Reserva no encontrada" }, 404);

    return c.json(updated);
  }
);

// PATCH /agents/:agentId/reservations/:resId/cancel
reservationsRoute.patch("/:agentId/reservations/:resId/cancel", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const resId = c.req.param("resId");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const [updated] = await db
    .update(reservations)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(reservations.id, resId), eq(reservations.agentId, agentId)))
    .returning();

  if (!updated) return c.json({ message: "Reserva no encontrada" }, 404);

  return c.json(updated);
});

export default reservationsRoute;
