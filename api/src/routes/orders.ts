import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const ordersRoute = createRouter();
ordersRoute.use("*", authMiddleware);

// GET /agents/:agentId/orders
ordersRoute.get("/:agentId/orders", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const status = c.req.query("status");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const result = await db.query.orders.findMany({
    where: eq(orders.agentId, agentId),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });

  const filtered = status ? result.filter((o) => o.status === status) : result;

  return c.json(filtered);
});

// GET /agents/:agentId/orders/:orderId
ordersRoute.get("/:agentId/orders/:orderId", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const orderId = c.req.param("orderId");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.agentId, agentId)),
  });

  if (!order) return c.json({ message: "Pedido no encontrado" }, 404);

  return c.json(order);
});

// PATCH /agents/:agentId/orders/:orderId
ordersRoute.patch(
  "/:agentId/orders/:orderId",
  zValidator(
    "json",
    z.object({
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const orderId = c.req.param("orderId");
    const data = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const [updated] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.agentId, agentId)))
      .returning();

    if (!updated) return c.json({ message: "Pedido no encontrado" }, 404);

    return c.json(updated);
  }
);

export default ordersRoute;
