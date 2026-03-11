import { createRouter } from "../types.js";
import { eq, sql } from "drizzle-orm";
import { createHmac } from "crypto";
import { db } from "../db/index.js";
import {
  whatsappConnections,
  conversations,
  messages,
  agents,
  crmClients,
} from "../db/schema.js";
import { runAgent } from "../agents/base-agent.js";

const webhooksRoute = createRouter();

// ── GET /webhooks/whatsapp — Verificación de Meta ──────────────────────────

webhooksRoute.get("/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return c.text(challenge ?? "", 200);
  }

  return c.text("Forbidden", 403);
});

// ── POST /webhooks/whatsapp — Mensajes entrantes ───────────────────────────

webhooksRoute.post("/whatsapp", async (c) => {
  // 1. Verificar firma HMAC
  const signature = c.req.header("X-Hub-Signature-256") ?? "";
  const body = await c.req.text();

  const expected =
    "sha256=" +
    createHmac("sha256", process.env.META_APP_SECRET ?? "")
      .update(body)
      .digest("hex");

  if (signature !== expected) {
    console.warn("[webhook] Firma HMAC inválida");
    return c.text("Forbidden", 403);
  }

  // 2. Parsear payload
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return c.text("Bad Request", 400);
  }

  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value?.messages?.[0]) {
    // Puede ser una notificación de estado (delivered, read) — ignorar
    return c.json({ ok: true });
  }

  const waMessage = value.messages[0];
  const contactInfo = value.contacts?.[0];
  const phoneNumberId = value.metadata?.phone_number_id;

  // Solo procesamos mensajes de texto por ahora
  if (waMessage.type !== "text") {
    return c.json({ ok: true });
  }

  const incomingText: string = waMessage.text?.body ?? "";
  const contactPhone: string = waMessage.from;
  const contactName: string = contactInfo?.profile?.name ?? contactPhone;
  const waMessageId: string = waMessage.id;

  // 3. Buscar la conexión de WhatsApp por phone_number_id
  const conn = await db.query.whatsappConnections.findFirst({
    where: eq(whatsappConnections.phoneNumberId, phoneNumberId),
  });

  if (!conn) {
    console.warn(`[webhook] No se encontró conexión para phoneNumberId: ${phoneNumberId}`);
    return c.json({ ok: true });
  }

  // 4. Cargar agente con FAQs y productos
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, conn.agentId),
    with: { faqs: true, products: true },
  });

  if (!agent || agent.status !== "active") {
    return c.json({ ok: true });
  }

  // 5. Obtener o crear conversación
  let conversation = await db.query.conversations.findFirst({
    where:
      eq(conversations.agentId, conn.agentId) &&
      eq(conversations.contactPhone, contactPhone),
  });

  if (!conversation) {
    [conversation] = await db
      .insert(conversations)
      .values({
        agentId: conn.agentId,
        contactPhone,
        contactName,
        status: "bot_handling",
      })
      .returning();

    // Crear o actualizar CRM
    await db
      .insert(crmClients)
      .values({
        agentId: conn.agentId,
        phone: contactPhone,
        name: contactName,
        totalConversations: 1,
      })
      .onConflictDoUpdate({
        target: [crmClients.agentId, crmClients.phone],
        set: {
          lastContactAt: new Date(),
          totalConversations: sql`crm_clients.total_conversations + 1`,
        },
      });
  }

  // Si la conversación está en modo humano, no responder con el bot
  if (conversation.status === "human_handling") {
    // Guardar el mensaje del usuario pero no responder automáticamente
    await db.insert(messages).values({
      conversationId: conversation.id,
      agentId: conn.agentId,
      role: "user",
      content: incomingText,
      waMessageId,
    });
    return c.json({ ok: true });
  }

  // 6. Cargar últimos 20 mensajes (historial)
  const history = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversation.id),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
    limit: 20,
  });

  const historyForAgent = history
    .reverse()
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  // 7. Guardar mensaje entrante
  await db.insert(messages).values({
    conversationId: conversation.id,
    agentId: conn.agentId,
    role: "user",
    content: incomingText,
    waMessageId,
  });

  // 8. Ejecutar el agente IA
  let responseText: string;
  try {
    responseText = await runAgent({
      agent: agent as any,
      faqs: (agent as any).faqs ?? [],
      products: (agent as any).products ?? [],
      history: historyForAgent,
      incomingMessage: incomingText,
    });
  } catch (err) {
    console.error("[webhook] Error en agente IA:", err);
    responseText =
      "Lo siento, en este momento no puedo responder. Por favor intenta más tarde.";
  }

  // 9. Guardar respuesta del asistente
  await db.insert(messages).values({
    conversationId: conversation.id,
    agentId: conn.agentId,
    role: "assistant",
    content: responseText,
  });

  // 10. Actualizar contadores
  await db
    .update(conversations)
    .set({
      lastMessage: responseText,
      lastMessageAt: new Date(),
      messageCount: conversation.messageCount + 2,
      contactName,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversation.id));

  await db
    .update(agents)
    .set({
      messageCount: agent.messageCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, conn.agentId));

  // 11. Enviar respuesta por WhatsApp Cloud API
  await sendWhatsAppMessage(
    conn.phoneNumberId!,
    conn.accessToken!,
    contactPhone,
    responseText
  );

  return c.json({ ok: true });
});

// ── Helper: Enviar mensaje por Meta Cloud API ──────────────────────────────

async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
) {
  const url = `https://graph.facebook.com/${process.env.META_API_VERSION ?? "v19.0"}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[whatsapp] Error enviando mensaje:", err);
  }
}

export default webhooksRoute;
