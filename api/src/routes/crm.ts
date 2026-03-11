import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { crmClients, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const crmRoute = createRouter();
crmRoute.use("*", authMiddleware);

// GET /agents/:agentId/crm
crmRoute.get("/:agentId/crm", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const clients = await db.query.crmClients.findMany({
    where: eq(crmClients.agentId, agentId),
    orderBy: (c, { desc }) => [desc(c.lastContactAt)],
  });

  return c.json(clients);
});

// GET /agents/:agentId/crm/:clientId
crmRoute.get("/:agentId/crm/:clientId", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const clientId = c.req.param("clientId");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const client = await db.query.crmClients.findFirst({
    where: and(eq(crmClients.id, clientId), eq(crmClients.agentId, agentId)),
  });
  if (!client) return c.json({ message: "Cliente no encontrado" }, 404);

  return c.json(client);
});

// PATCH /agents/:agentId/crm/:clientId
crmRoute.patch(
  "/:agentId/crm/:clientId",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "inactive", "vip"]).optional(),
      tags: z.array(z.string()).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const clientId = c.req.param("clientId");
    const data = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const [updated] = await db
      .update(crmClients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(crmClients.id, clientId), eq(crmClients.agentId, agentId)))
      .returning();

    if (!updated) return c.json({ message: "Cliente no encontrado" }, 404);

    return c.json(updated);
  }
);

export default crmRoute;
