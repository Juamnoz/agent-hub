import { createRouter } from "../types.js";
import { eq, and, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { agents, conversations, messages } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const analyticsRoute = createRouter();
analyticsRoute.use("*", authMiddleware);

// GET /agents/:agentId/analytics?period=30d
analyticsRoute.get("/:agentId/analytics", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const period = (c.req.query("period") as "7d" | "30d" | "90d") ?? "30d";

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const allConversations = await db.query.conversations.findMany({
    where: and(
      eq(conversations.agentId, agentId),
      gte(conversations.createdAt, since)
    ),
  });

  const allMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.agentId, agentId),
      gte(messages.createdAt, since)
    ),
  });

  const resolved = allConversations.filter((c) => c.status === "resolved");
  const humanHandoff = allConversations.filter(
    (c) => c.status === "human_handling"
  );

  // Mensajes por día
  const messagesPerDay: Record<string, number> = {};
  for (const msg of allMessages) {
    const day = msg.createdAt.toISOString().split("T")[0];
    messagesPerDay[day] = (messagesPerDay[day] ?? 0) + 1;
  }

  return c.json({
    totalConversations: allConversations.length,
    totalMessages: allMessages.length,
    avgResponseTimeMs: 1800, // placeholder — calcular con timestamps reales
    resolutionRate:
      allConversations.length > 0
        ? Math.round((resolved.length / allConversations.length) * 100)
        : 0,
    humanHandoffRate:
      allConversations.length > 0
        ? Math.round((humanHandoff.length / allConversations.length) * 100)
        : 0,
    topFaqs: [],
    messagesPerDay: Object.entries(messagesPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  });
});

export default analyticsRoute;
