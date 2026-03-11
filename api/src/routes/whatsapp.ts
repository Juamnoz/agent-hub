import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { whatsappConnections, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const whatsappRoute = createRouter();
whatsappRoute.use("*", authMiddleware);

async function verifyAgentOwnership(
  agentId: string,
  userId: string,
  role: string,
  c: any
): Promise<boolean> {
  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) {
    c.json({ message: "Agente no encontrado" }, 404);
    return false;
  }
  return true;
}

// GET /agents/:agentId/whatsapp
whatsappRoute.get("/:agentId/whatsapp", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

  const conn = await db.query.whatsappConnections.findFirst({
    where: eq(whatsappConnections.agentId, agentId),
  });

  if (!conn) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    phoneNumber: conn.phoneNumber,
    provider: conn.provider,
    wabaId: conn.wabaId,
    phoneNumberId: conn.phoneNumberId,
    verifiedAt: conn.verifiedAt,
  });
});

// POST /agents/:agentId/whatsapp/connect
whatsappRoute.post(
  "/:agentId/whatsapp/connect",
  zValidator(
    "json",
    z.object({
      provider: z.enum(["meta", "wati", "coexistence"]),
      phoneNumber: z.string().min(5),
      phoneNumberId: z.string().optional(),
      wabaId: z.string().optional(),
      apiKey: z.string().optional(),
      endpointUrl: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const data = c.req.valid("json");

    if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

    // Eliminar conexión anterior si existe
    await db
      .delete(whatsappConnections)
      .where(eq(whatsappConnections.agentId, agentId));

    await db.insert(whatsappConnections).values({
      agentId,
      provider: data.provider,
      phoneNumber: data.phoneNumber,
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      apiKey: data.apiKey,      // En producción: cifrar con ENCRYPTION_KEY
      endpointUrl: data.endpointUrl,
    });

    return c.json({ success: true, verificationCode: "META_VERIFY_123" });
  }
);

// POST /agents/:agentId/whatsapp/verify
whatsappRoute.post(
  "/:agentId/whatsapp/verify",
  zValidator("json", z.object({ code: z.string() })),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");

    if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

    const [conn] = await db
      .update(whatsappConnections)
      .set({ verifiedAt: new Date() })
      .where(eq(whatsappConnections.agentId, agentId))
      .returning();

    if (!conn) return c.json({ message: "Conexión no encontrada" }, 404);

    return c.json({
      connected: true,
      phoneNumber: conn.phoneNumber,
      provider: conn.provider,
      verifiedAt: conn.verifiedAt,
    });
  }
);

// DELETE /agents/:agentId/whatsapp
whatsappRoute.delete("/:agentId/whatsapp", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

  await db
    .delete(whatsappConnections)
    .where(eq(whatsappConnections.agentId, agentId));

  return c.body(null, 204);
});

export default whatsappRoute;
