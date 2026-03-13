import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkLimit } from "../middleware/plan.js";

const agentsRoute = createRouter();

agentsRoute.use("*", authMiddleware);

// GET /agents
agentsRoute.get("/", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;

  // Superadmin ve TODOS los agentes de todas las organizaciones
  if (role === "superadmin") {
    const result = await db.query.agents.findMany({
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      with: { user: true, organization: true },
    });
    return c.json(result);
  }

  // Usuarios normales ven solo sus agentes
  const result = await db.query.agents.findMany({
    where: eq(agents.userId, userId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });

  return c.json(result);
});

// GET /agents/:id
agentsRoute.get("/:id", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const id = c.req.param("id");

  // Superadmin puede ver cualquier agente
  if (role === "superadmin") {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, id),
      with: { user: true, organization: true },
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);
    return c.json(agent);
  }

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, id), eq(agents.userId, userId)),
  });

  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  return c.json({ ...agent, calConnected: !!agent.calAccessToken });
});

// POST /agents
agentsRoute.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      hotelName: z.string().min(1),
      personality: z.string().optional().default(""),
      tone: z.string().optional().default("friendly"),
      language: z.string().optional().default("es"),
      algorithmType: z
        .enum([
          "hotel",
          "restaurant",
          "ecommerce",
          "whatsapp-store",
          "appointments",
          "inmobiliaria",
        ])
        .optional(),
      communicationStyle: z.record(z.unknown()).optional(),
      socialLinks: z.record(z.unknown()).optional(),
      avatar: z.string().optional(),
      webhookUrl: z.string().url().optional(),
      apiKey: z.string().optional(),
      organizationId: z.string().uuid().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const planTier = c.get("planTier") as string;
    const role = c.get("role") as string;
    const data = c.req.valid("json");

    const currentAgents = await db.query.agents.findMany({
      where: eq(agents.userId, userId),
    });

    // Superadmin bypasses plan limits
    if (role !== "superadmin" && !checkLimit(planTier, "agents", currentAgents.length)) {
      return c.json(
        {
          message: `Tu plan ${planTier} solo permite ${
            planTier === "starter" ? 1 : planTier === "pro" ? 3 : 10
          } agente(s). Actualiza tu plan para crear más.`,
        },
        403
      );
    }

    const [agent] = await db
      .insert(agents)
      .values({ ...data, userId })
      .returning();

    return c.json(agent, 201);
  }
);

// PATCH /agents/:id
agentsRoute.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      hotelName: z.string().min(1).optional(),
      personality: z.string().optional(),
      tone: z.string().optional(),
      language: z.string().optional(),
      algorithmType: z
        .enum([
          "hotel",
          "restaurant",
          "ecommerce",
          "whatsapp-store",
          "appointments",
          "inmobiliaria",
        ])
        .optional(),
      communicationStyle: z.record(z.unknown()).optional(),
      socialLinks: z.record(z.unknown()).optional(),
      avatar: z.string().optional(),
      systemPrompt: z.string().optional(),
      knowledgeBase: z.string().optional(),
      webhookUrl: z.string().url().nullable().optional(),
      apiKey: z.string().nullable().optional(),
      adminPhone: z.string().nullable().optional(),
      escalationPhone: z.string().nullable().optional(),
      trainedAt: z.string().nullable().optional(),
      catalogs: z.array(z.object({
        title: z.string(),
        url: z.string(),
        fileName: z.string(),
      })).nullable().optional(),
      conversationExamples: z.array(z.object({
        id: z.string(),
        userMessage: z.string(),
        agentResponse: z.string(),
      })).nullable().optional(),
      organizationId: z.string().uuid().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // Superadmin puede editar cualquier agente
    if (role === "superadmin") {
      const existing = await db.query.agents.findFirst({
        where: eq(agents.id, id),
      });
      if (!existing) return c.json({ message: "Agente no encontrado" }, 404);

      const [updated] = await db
        .update(agents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(agents.id, id))
        .returning();

      return c.json(updated);
    }

    const existing = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.userId, userId)),
    });
    if (!existing) return c.json({ message: "Agente no encontrado" }, 404);

    const [updated] = await db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(agents.id, id), eq(agents.userId, userId)))
      .returning();

    return c.json(updated);
  }
);

// DELETE /agents/:id
agentsRoute.delete("/:id", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const id = c.req.param("id");

  if (role === "superadmin") {
    const existing = await db.query.agents.findFirst({
      where: eq(agents.id, id),
    });
    if (!existing) return c.json({ message: "Agente no encontrado" }, 404);
    await db.delete(agents).where(eq(agents.id, id));
    return c.body(null, 204);
  }

  const existing = await db.query.agents.findFirst({
    where: and(eq(agents.id, id), eq(agents.userId, userId)),
  });
  if (!existing) return c.json({ message: "Agente no encontrado" }, 404);

  await db
    .delete(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));

  return c.body(null, 204);
});

// PATCH /agents/:id/status
agentsRoute.patch(
  "/:id/status",
  zValidator("json", z.object({ status: z.enum(["active", "inactive", "testing", "setup"]) })),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const id = c.req.param("id");
    const { status } = c.req.valid("json");

    // Find the agent
    const existing = role === "superadmin"
      ? await db.query.agents.findFirst({ where: eq(agents.id, id) })
      : await db.query.agents.findFirst({ where: and(eq(agents.id, id), eq(agents.userId, userId)) });

    if (!existing) return c.json({ message: "Agente no encontrado" }, 404);

    // Validate completeness for testing/active
    if (status === "testing" || status === "active") {
      const missing: string[] = [];
      if (!existing.algorithmType) missing.push("Tipo de negocio");
      if (!existing.communicationStyle) missing.push("Estilo de comunicación");
      if (existing.faqCount < 1) missing.push("Preguntas frecuentes");
      if (!existing.webhookUrl) missing.push("Webhook");
      if (missing.length > 0) {
        return c.json({
          message: `Completa estos pasos antes de ${status === "testing" ? "probar" : "activar"}: ${missing.join(", ")}`,
          missing,
        }, 400);
      }
    }

    const previousStatus = existing.status;

    const whereClause = role === "superadmin"
      ? eq(agents.id, id)
      : and(eq(agents.id, id), eq(agents.userId, userId));

    const [updated] = await db
      .update(agents)
      .set({ status, updatedAt: new Date() })
      .where(whereClause!)
      .returning();

    // Send webhook notification on status change
    if (updated.webhookUrl && previousStatus !== status) {
      fetch(updated.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "agent.status_changed",
          agentId: updated.id,
          agentName: updated.name,
          status: updated.status,
          previousStatus,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}); // fire-and-forget
    }

    return c.json(updated);
  }
);

export default agentsRoute;
