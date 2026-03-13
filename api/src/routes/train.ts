import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { db } from "../db/index.js";
import { agents, faqs, products, whatsappConnections } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const trainRoute = createRouter();
trainRoute.use("*", authMiddleware);

// GET /agents/:agentId/train
trainRoute.get("/:agentId/train", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  return c.json({
    algorithmType: agent.algorithmType,
    personality: agent.personality,
    tone: agent.tone,
    communicationStyle: agent.communicationStyle,
    systemPrompt: agent.systemPrompt,
    knowledgeBase: agent.knowledgeBase,
  });
});

// PATCH /agents/:agentId/train
trainRoute.patch(
  "/:agentId/train",
  zValidator(
    "json",
    z.object({
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
      personality: z.string().optional(),
      tone: z.enum(["formal", "friendly", "casual"]).optional(),
      communicationStyle: z.record(z.unknown()).optional(),
      systemPromptOverride: z.string().optional(),
      knowledgeBase: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const data = c.req.valid("json");

    const existing = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!existing) return c.json({ message: "Agente no encontrado" }, 404);

    const [updated] = await db
      .update(agents)
      .set({
        ...(data.algorithmType && { algorithmType: data.algorithmType }),
        ...(data.personality !== undefined && { personality: data.personality }),
        ...(data.tone && { tone: data.tone }),
        ...(data.communicationStyle && {
          communicationStyle: data.communicationStyle,
        }),
        ...(data.systemPromptOverride !== undefined && {
          systemPrompt: data.systemPromptOverride,
        }),
        ...(data.knowledgeBase !== undefined && {
          knowledgeBase: data.knowledgeBase,
        }),
        updatedAt: new Date(),
      })
      .where(role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)))
      .returning();

    return c.json(updated);
  }
);

// POST /agents/:agentId/train/chat — Streaming SSE
trainRoute.post(
  "/:agentId/train/chat",
  zValidator("json", z.object({ message: z.string().min(1) })),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const { message } = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where: role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
      with: { faqs: true },
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const systemPrompt = `
Eres ${agent.name}, el asistente de WhatsApp de ${agent.hotelName}.
PERSONALIDAD: ${agent.personality}
TONO: ${agent.tone}
CONOCIMIENTO BASE: ${agent.knowledgeBase ?? ""}
PREGUNTAS FRECUENTES:
${(agent as any).faqs?.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") ?? ""}

Estás en modo ENTRENAMIENTO — el administrador del negocio te está probando.
Responde como lo harías con un cliente real de WhatsApp.
`.trim();

    const result = streamText({
      model: anthropic("claude-sonnet-4-6") as any,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    return result.toTextStreamResponse({
      headers: {
        "Access-Control-Allow-Origin":
          process.env.FRONTEND_URL ?? "http://localhost:3000",
      },
    });
  }
);

// POST /agents/:agentId/train/deploy — Send training payload to n8n
trainRoute.post("/:agentId/train/deploy", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  const agent = await db.query.agents.findFirst({
    where:
      role === "superadmin"
        ? eq(agents.id, agentId)
        : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    with: {
      faqs: true,
      products: true,
      whatsappConnection: true,
    },
  });
  if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

  if (!agent.algorithmType) {
    return c.json(
      { message: "El agente necesita un tipo de negocio configurado" },
      400
    );
  }

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Map products based on algorithm type
  const rawProducts = ((agent as any).products ?? []).filter((p: any) => p.isActive);
  const mapProduct = (p: any) => ({
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    category: p.category,
    image_url: p.imageUrl ?? null,
    sku: p.sku ?? null,
    variants: p.variants ?? null,
  });

  // Labels adapt to business type
  const catalogLabel: Record<string, string> = {
    hotel: "rooms",
    restaurant: "menu",
    ecommerce: "products",
    "whatsapp-store": "products",
    appointments: "services",
    inmobiliaria: "properties",
  };

  const n8nPayload = {
    update_type: "full",
    agent_id: agent.id,
    agent_slug: slugify(agent.name),
    agent_name: agent.name,
    business_name: agent.hotelName,
    organization_id: agent.organizationId ?? null,
    prompt: agent.systemPrompt ?? agent.personality ?? "",
    tone: agent.tone,
    algorithm_type: agent.algorithmType,
    communication_style: agent.communicationStyle ?? {},
    admin_phone: agent.adminPhone ?? "",
    escalation_phone: agent.escalationPhone ?? "",
    mode: agent.status === "active" ? "production" : "testing",
    waba_id: (agent as any).whatsappConnection?.wabaId ?? null,
    social_links: agent.socialLinks ?? {},
    api_key: agent.apiKey ?? null,
    avatar: agent.avatar ?? null,
    faqs: ((agent as any).faqs ?? [])
      .filter((f: any) => f.isActive)
      .map((f: any) => ({
        question: f.question,
        answer: f.answer,
        category: f.category,
      })),
    catalog_type: catalogLabel[agent.algorithmType] ?? "products",
    [catalogLabel[agent.algorithmType] ?? "products"]: rawProducts.map(mapProduct),
    catalogs: ((agent as any).catalogs ?? []).map((c: any) => ({
      name: c.title,
      title: c.title,
      url: c.url,
      fileName: c.fileName,
    })),
    conversation_examples: agent.conversationExamples ?? [],
    images: rawProducts
      .filter((p: any) => p.imageUrl)
      .map((p: any) => ({
        name: p.name,
        url: p.imageUrl,
        category: p.category ?? "general",
      })),
  };

  const N8N_WEBHOOK =
    process.env.N8N_TRAINING_WEBHOOK ??
    "https://devwebhookn8n.automatesolutions.tech/webhook/lisa";

  try {
    const resp = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    if (!resp.ok) {
      console.error("n8n webhook error:", resp.status, await resp.text());
    }
  } catch (err) {
    console.error("n8n webhook fetch error:", err);
  }

  // Mark agent as trained and clear dirty flag
  const now = new Date();
  const [updated] = await db
    .update(agents)
    .set({ trainedAt: now, updatedAt: now, configDirty: false })
    .where(eq(agents.id, agentId))
    .returning();

  return c.json({
    success: true,
    trainedAt: updated.trainedAt?.toISOString(),
    agent_id: agent.id,
  });
});

// POST /agents/:agentId/train/update — Partial update to n8n (only changed section)
trainRoute.post(
  "/:agentId/train/update",
  zValidator(
    "json",
    z.object({
      update_type: z.enum(["prompt", "faqs", "products", "catalogs", "phones", "social_links"]),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const { update_type } = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where:
        role === "superadmin"
          ? eq(agents.id, agentId)
          : and(eq(agents.id, agentId), eq(agents.userId, userId)),
      with: {
        faqs: true,
        products: true,
      },
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    const catalogLabel: Record<string, string> = {
      hotel: "rooms",
      restaurant: "menu",
      ecommerce: "products",
      "whatsapp-store": "products",
      appointments: "services",
      inmobiliaria: "properties",
    };

    // Base payload — always included
    const payload: Record<string, any> = {
      update_type,
      agent_id: agent.id,
      agent_name: agent.name,
      business_name: agent.hotelName,
      algorithm_type: agent.algorithmType,
      tone: agent.tone,
    };

    // Attach only the section that changed
    switch (update_type) {
      case "prompt":
        payload.prompt = agent.systemPrompt ?? agent.personality ?? "";
        payload.communication_style = agent.communicationStyle ?? {};
        payload.conversation_examples = agent.conversationExamples ?? [];
        break;
      case "faqs":
        payload.faqs = ((agent as any).faqs ?? [])
          .filter((f: any) => f.isActive)
          .map((f: any) => ({
            question: f.question,
            answer: f.answer,
            category: f.category,
          }));
        break;
      case "products": {
        const rawProducts = ((agent as any).products ?? []).filter((p: any) => p.isActive);
        const catKey = catalogLabel[agent.algorithmType ?? ""] ?? "products";
        payload.catalog_type = catKey;
        payload[catKey] = rawProducts.map((p: any) => ({
          name: p.name,
          description: p.description ?? "",
          price: p.price,
          category: p.category,
          image_url: p.imageUrl ?? null,
          sku: p.sku ?? null,
          variants: p.variants ?? null,
        }));
        payload.images = rawProducts
          .filter((p: any) => p.imageUrl)
          .map((p: any) => ({
            name: p.name,
            url: p.imageUrl,
            category: p.category ?? "general",
          }));
        payload.catalogs = ((agent as any).catalogs ?? []).map((c: any) => ({
          title: c.title, url: c.url, fileName: c.fileName,
        }));
        break;
      }
      case "catalogs":
        payload.catalogs = ((agent as any).catalogs ?? []).map((c: any) => ({
          title: c.title, url: c.url, fileName: c.fileName,
        }));
        break;
      case "phones":
        payload.admin_phone = agent.adminPhone ?? "";
        payload.escalation_phone = agent.escalationPhone ?? "";
        break;
      case "social_links":
        payload.social_links = agent.socialLinks ?? {};
        break;
    }

    const N8N_WEBHOOK =
      process.env.N8N_TRAINING_WEBHOOK ??
      "https://devwebhookn8n.automatesolutions.tech/webhook/lisa";

    try {
      const resp = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.error("n8n partial update error:", resp.status, await resp.text());
      }
    } catch (err) {
      console.error("n8n partial update fetch error:", err);
    }

    await db
      .update(agents)
      .set({ updatedAt: new Date() })
      .where(eq(agents.id, agentId));

    return c.json({ success: true, update_type, agent_id: agent.id });
  }
);

// POST /agents/:agentId/train/mode — Change agent mode and notify n8n
trainRoute.post(
  "/:agentId/train/mode",
  zValidator(
    "json",
    z.object({
      status: z.enum(["active", "inactive", "testing"]),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const { status } = c.req.valid("json");

    const agent = await db.query.agents.findFirst({
      where:
        role === "superadmin"
          ? eq(agents.id, agentId)
          : and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });
    if (!agent) return c.json({ message: "Agente no encontrado" }, 404);

    // Block mode changes for agents not yet trained
    if (agent.status === "setup" && !agent.trainedAt) {
      return c.json({ message: "El agente aún no ha sido entrenado" }, 400);
    }

    // Update status in DB
    const [updated] = await db
      .update(agents)
      .set({ status, updatedAt: new Date() })
      .where(eq(agents.id, agentId))
      .returning();

    // Notify n8n of mode change (if agent has webhook)
    if (agent.webhookUrl) {
      const mode = status === "active" ? "production" : status === "testing" ? "testing" : "off";
      try {
        await fetch(agent.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "mode_change",
            agent_id: agent.id,
            agent_name: agent.name,
            mode,
            admin_phone: agent.adminPhone ?? "",
          }),
        });
      } catch (err) {
        console.error("n8n mode webhook error:", err);
      }
    }

    return c.json({
      success: true,
      status: updated.status,
      mode: status === "active" ? "production" : status === "testing" ? "testing" : "off",
    });
  }
);

export default trainRoute;
