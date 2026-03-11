import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { faqs, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const faqsRoute = createRouter();

faqsRoute.use("*", authMiddleware);

// Verifica que el agente pertenece al usuario (superadmin puede acceder a todos)
async function getAgentOrFail(agentId: string, userId: string, role: string, c: any) {
  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) {
    c.json({ message: "Agente no encontrado" }, 404);
    return null;
  }
  return agent;
}

// GET /agents/:agentId/faqs
faqsRoute.get("/:agentId/faqs", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  if (!(await getAgentOrFail(agentId, userId, role, c))) return;

  const result = await db.query.faqs.findMany({
    where: eq(faqs.agentId, agentId),
    orderBy: [asc(faqs.sortOrder), asc(faqs.createdAt)],
  });

  return c.json(result);
});

// POST /agents/:agentId/faqs
faqsRoute.post(
  "/:agentId/faqs",
  zValidator(
    "json",
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      category: z.string().optional().default("general"),
      isActive: z.boolean().optional().default(true),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const data = c.req.valid("json");

    if (!(await getAgentOrFail(agentId, userId, role, c))) return;

    // Calcular sortOrder
    const existing = await db.query.faqs.findMany({
      where: eq(faqs.agentId, agentId),
    });
    const sortOrder = existing.length;

    const [faq] = await db
      .insert(faqs)
      .values({ ...data, agentId, sortOrder })
      .returning();

    // Actualizar contador del agente
    await db
      .update(agents)
      .set({ faqCount: existing.length + 1, updatedAt: new Date() })
      .where(eq(agents.id, agentId));

    return c.json(faq, 201);
  }
);

// PATCH /agents/:agentId/faqs/:faqId
faqsRoute.patch(
  "/:agentId/faqs/:faqId",
  zValidator(
    "json",
    z.object({
      question: z.string().min(1).optional(),
      answer: z.string().min(1).optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const faqId = c.req.param("faqId");
    const data = c.req.valid("json");

    if (!(await getAgentOrFail(agentId, userId, role, c))) return;

    const [updated] = await db
      .update(faqs)
      .set(data)
      .where(and(eq(faqs.id, faqId), eq(faqs.agentId, agentId)))
      .returning();

    if (!updated) return c.json({ message: "FAQ no encontrada" }, 404);

    return c.json(updated);
  }
);

// DELETE /agents/:agentId/faqs/:faqId
faqsRoute.delete("/:agentId/faqs/:faqId", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const faqId = c.req.param("faqId");

  if (!(await getAgentOrFail(agentId, userId, role, c))) return;

  await db
    .delete(faqs)
    .where(and(eq(faqs.id, faqId), eq(faqs.agentId, agentId)));

  // Actualizar contador
  const remaining = await db.query.faqs.findMany({
    where: eq(faqs.agentId, agentId),
  });
  await db
    .update(agents)
    .set({ faqCount: remaining.length, updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  return c.body(null, 204);
});

// PATCH /agents/:agentId/faqs/reorder
faqsRoute.patch(
  "/:agentId/faqs/reorder",
  zValidator("json", z.object({ orderedIds: z.array(z.string()) })),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const { orderedIds } = c.req.valid("json");

    if (!(await getAgentOrFail(agentId, userId, role, c))) return;

    // Actualizar sortOrder para cada FAQ
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(faqs)
          .set({ sortOrder: index })
          .where(and(eq(faqs.id, id), eq(faqs.agentId, agentId)))
      )
    );

    return c.json({ success: true });
  }
);

export default faqsRoute;
