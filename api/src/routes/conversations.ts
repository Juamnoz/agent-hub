import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { conversations, messages, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const conversationsRoute = createRouter();
conversationsRoute.use("*", authMiddleware);

// GET /agents/:agentId/conversations
conversationsRoute.get("/:agentId/conversations", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const status = c.req.query("status");
  const page = Number(c.req.query("page") ?? 1);
  const pageSize = Number(c.req.query("pageSize") ?? 20);

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const where =
    status && status !== "all"
      ? and(
          eq(conversations.agentId, agentId),
          eq(
            conversations.status,
            status as "bot_handling" | "human_handling" | "resolved"
          )
        )
      : eq(conversations.agentId, agentId);

  const all = await db.query.conversations.findMany({
    where,
    orderBy: [desc(conversations.lastMessageAt)],
  });

  const offset = (page - 1) * pageSize;
  const data = all.slice(offset, offset + pageSize);

  return c.json({ data, total: all.length, page, pageSize });
});

// GET /conversations/:convId
conversationsRoute.get("/conversations/:convId", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const convId = c.req.param("convId");

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: { agent: true },
  });

  if (!conv || (role !== "superadmin" && conv.agent.userId !== userId)) {
    return c.json({ message: "Conversación no encontrada" }, 404);
  }

  return c.json(conv);
});

// GET /conversations/:convId/messages
conversationsRoute.get("/conversations/:convId/messages", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const convId = c.req.param("convId");

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: { agent: true },
  });

  if (!conv || (role !== "superadmin" && conv.agent.userId !== userId)) {
    return c.json({ message: "Conversación no encontrada" }, 404);
  }

  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, convId),
    orderBy: [desc(messages.createdAt)],
    limit: 50,
  });

  return c.json(msgs.reverse());
});

// POST /conversations/:convId/messages (modo humano)
conversationsRoute.post(
  "/conversations/:convId/messages",
  zValidator(
    "json",
    z.object({ content: z.string().min(1), role: z.literal("human") })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const convId = c.req.param("convId");
    const { content } = c.req.valid("json");

    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, convId),
      with: { agent: true },
    });

    if (!conv || (role !== "superadmin" && conv.agent.userId !== userId)) {
      return c.json({ message: "Conversación no encontrada" }, 404);
    }

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        agentId: conv.agentId,
        role: "human",
        content,
      })
      .returning();

    // Actualizar last message
    await db
      .update(conversations)
      .set({
        lastMessage: content,
        lastMessageAt: new Date(),
        messageCount: conv.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, convId));

    return c.json(msg, 201);
  }
);

// PATCH /conversations/:convId/mode
conversationsRoute.patch("/conversations/:convId/mode", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const convId = c.req.param("convId");

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: { agent: true },
  });

  if (!conv || (role !== "superadmin" && conv.agent.userId !== userId)) {
    return c.json({ message: "Conversación no encontrada" }, 404);
  }

  const newStatus =
    conv.status === "bot_handling" ? "human_handling" : "bot_handling";

  const [updated] = await db
    .update(conversations)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(conversations.id, convId))
    .returning();

  return c.json(updated);
});

// PATCH /conversations/:convId/resolve
conversationsRoute.patch("/conversations/:convId/resolve", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const convId = c.req.param("convId");

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: { agent: true },
  });

  if (!conv || (role !== "superadmin" && conv.agent.userId !== userId)) {
    return c.json({ message: "Conversación no encontrada" }, 404);
  }

  const [updated] = await db
    .update(conversations)
    .set({ status: "resolved", updatedAt: new Date() })
    .where(eq(conversations.id, convId))
    .returning();

  return c.json(updated);
});

export default conversationsRoute;
