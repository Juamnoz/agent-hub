# LISA Backend — Arquitectura Completa

> **Para la IA:** Este archivo es la fuente de verdad para construir el backend de LISA.
> Describe la estructura de la base de datos, rutas de API, lógica de agentes con Vercel AI SDK
> y configuración de infraestructura (PostgreSQL + Docker + Traefik).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | [Hono](https://hono.dev/) — ligero, TypeScript-first, streaming nativo |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) — SQL tipado, migraciones |
| Base de datos | PostgreSQL 16 (ya desplegado con Docker + Traefik) |
| IA / Agentes | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` package) |
| Modelo LLM | Anthropic Claude (claude-sonnet-4-6) vía `@ai-sdk/anthropic` |
| WhatsApp | Meta Cloud API (Webhook) |
| Auth | JWT (access token 15min + refresh token 30 días) |
| Pagos | Wompi / Stripe |
| Queue | Bull + Redis (para jobs async: importaciones, webhooks) |

---

## Estructura del proyecto backend

```
api/
├── src/
│   ├── index.ts              # Punto de entrada — Hono app
│   ├── db/
│   │   ├── schema.ts         # Tablas Drizzle (fuente de verdad del schema)
│   │   ├── migrations/       # SQL generado por `drizzle-kit generate`
│   │   └── index.ts          # Pool de conexión PostgreSQL
│   ├── routes/
│   │   ├── auth.ts           # POST /v1/auth/*
│   │   ├── agents.ts         # CRUD /v1/agents
│   │   ├── faqs.ts           # /v1/agents/:id/faqs
│   │   ├── products.ts       # /v1/agents/:id/products
│   │   ├── integrations.ts   # /v1/agents/:id/integrations
│   │   ├── whatsapp.ts       # /v1/agents/:id/whatsapp
│   │   ├── conversations.ts  # /v1/agents/:id/conversations
│   │   ├── crm.ts            # /v1/agents/:id/crm
│   │   ├── reservations.ts   # /v1/agents/:id/reservations
│   │   ├── orders.ts         # /v1/agents/:id/orders
│   │   ├── menu.ts           # /v1/agents/:id/menu
│   │   ├── train.ts          # /v1/agents/:id/train (+ streaming chat)
│   │   ├── analytics.ts      # /v1/agents/:id/analytics
│   │   ├── billing.ts        # /v1/billing
│   │   └── webhooks.ts       # /webhooks/whatsapp (Meta Cloud API)
│   ├── agents/               # Vercel AI SDK — lógica de cada algoritmo
│   │   ├── base-agent.ts     # Función base: buildAgent(config, tools)
│   │   ├── hotel.ts          # Tools: check_availability, create_reservation
│   │   ├── restaurant.ts     # Tools: check_tables, get_menu, create_order
│   │   ├── ecommerce.ts      # Tools: search_products, create_order, track_order
│   │   ├── appointments.ts   # Tools: check_slots, book_appointment
│   │   ├── whatsapp-store.ts # Tools: browse_catalog, add_to_cart, checkout
│   │   └── inmobiliaria.ts   # Tools: search_properties, schedule_visit
│   ├── middleware/
│   │   ├── auth.ts           # Verificar JWT — extrae user del token
│   │   ├── plan.ts           # Verificar límites del plan (agents, messages, etc.)
│   │   └── rateLimit.ts      # Rate limiting por IP + por user
│   ├── lib/
│   │   ├── jwt.ts            # Generar y verificar tokens
│   │   ├── whatsapp.ts       # WhatsApp Cloud API — enviar mensajes
│   │   └── queue.ts          # Bull jobs (importaciones, webhooks async)
│   └── types.ts              # Tipos compartidos
├── Dockerfile
├── docker-compose.yml        # Para desarrollo local
└── drizzle.config.ts
```

---

## Schema PostgreSQL (Drizzle)

```ts
// src/db/schema.ts

import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const planTierEnum = pgEnum("plan_tier", ["starter", "pro", "business", "enterprise"]);
export const agentStatusEnum = pgEnum("agent_status", ["active", "inactive", "setup"]);
export const algorithmTypeEnum = pgEnum("algorithm_type", [
  "hotel", "restaurant", "ecommerce", "whatsapp-store", "appointments", "inmobiliaria"
]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "bot_handling", "human_handling", "resolved"
]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "human"]);
export const integrationCategoryEnum = pgEnum("integration_category", [
  "payments", "operations", "productivity", "ecommerce"
]);

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name:         text("name").notNull(),
  avatarUrl:    text("avatar_url"),
  planTier:     planTierEnum("plan_tier").notNull().default("starter"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

// ── Subscriptions (Billing) ───────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planTier:           planTierEnum("plan_tier").notNull(),
  status:             text("status").notNull().default("active"), // active | past_due | cancelled
  externalId:         text("external_id"),    // Stripe/Wompi subscription ID
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd:   timestamp("current_period_end"),
  cancelAtPeriodEnd:  boolean("cancel_at_period_end").notNull().default(false),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

// ── Agents ────────────────────────────────────────────────────────────────────

export const agents = pgTable("agents", {
  id:               uuid("id").primaryKey().defaultRandom(),
  userId:           uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  hotelName:        text("hotel_name").notNull(),   // Nombre del negocio
  avatar:           text("avatar"),                  // URL imagen
  status:           agentStatusEnum("status").notNull().default("setup"),
  algorithmType:    algorithmTypeEnum("algorithm_type"),
  personality:      text("personality").notNull().default(""),
  tone:             text("tone").notNull().default("friendly"), // formal | friendly | casual
  language:         text("language").notNull().default("es"),
  communicationStyle: jsonb("communication_style"),  // { region, register }
  socialLinks:      jsonb("social_links"),            // { website, instagram, ... }
  systemPrompt:     text("system_prompt"),            // prompt construido en el setup
  knowledgeBase:    text("knowledge_base"),           // contexto extra del negocio
  messageCount:     integer("message_count").notNull().default(0),
  faqCount:         integer("faq_count").notNull().default(0),
  productCount:     integer("product_count").notNull().default(0),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

// ── WhatsApp ──────────────────────────────────────────────────────────────────

export const whatsappConnections = pgTable("whatsapp_connections", {
  id:            uuid("id").primaryKey().defaultRandom(),
  agentId:       uuid("agent_id").notNull().unique().references(() => agents.id, { onDelete: "cascade" }),
  provider:      text("provider").notNull(), // meta | wati | coexistence
  phoneNumber:   text("phone_number").notNull(),
  phoneNumberId: text("phone_number_id"),    // Meta WABA phone number ID
  wabaId:        text("waba_id"),            // Meta WABA ID
  accessToken:   text("access_token"),       // ENCRYPTED — Meta access token
  apiKey:        text("api_key"),            // ENCRYPTED — WATI API key
  endpointUrl:   text("endpoint_url"),       // WATI endpoint
  verifiedAt:    timestamp("verified_at"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const faqs = pgTable("faqs", {
  id:        uuid("id").primaryKey().defaultRandom(),
  agentId:   uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  question:  text("question").notNull(),
  answer:    text("answer").notNull(),
  category:  text("category").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive:  boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Products ──────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id:          uuid("id").primaryKey().defaultRandom(),
  agentId:     uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  price:       integer("price").notNull().default(0), // en centavos
  category:    text("category").notNull().default(""),
  imageUrl:    text("image_url"),
  sku:         text("sku"),
  stock:       integer("stock"),
  variants:    jsonb("variants"),   // [{ name, options[] }]
  isActive:    boolean("is_active").notNull().default(true),
  sortOrder:   integer("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

// ── Integrations ──────────────────────────────────────────────────────────────

export const integrations = pgTable("integrations", {
  id:           uuid("id").primaryKey().defaultRandom(),
  agentId:      uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),          // wompi | shopify | gmail | ...
  category:     integrationCategoryEnum("category").notNull(),
  requiredPlan: planTierEnum("required_plan").notNull().default("starter"),
  enabled:      boolean("enabled").notNull().default(false),
  environment:  text("environment").default("sandbox"), // sandbox | production
  credentials:  jsonb("credentials"),   // ENCRYPTED en producción
  configured:   boolean("configured").notNull().default(false),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id:            uuid("id").primaryKey().defaultRandom(),
  agentId:       uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  contactPhone:  text("contact_phone").notNull(),
  contactName:   text("contact_name").notNull().default(""),
  messageCount:  integer("message_count").notNull().default(0),
  lastMessage:   text("last_message"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  status:        conversationStatusEnum("status").notNull().default("bot_handling"),
  tags:          jsonb("tags").notNull().default([]),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});

// ── Messages ──────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id:             uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  agentId:        uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  role:           messageRoleEnum("role").notNull(),
  content:        text("content").notNull(),
  matchedFaqId:   uuid("matched_faq_id").references(() => faqs.id),
  confidence:     integer("confidence"),     // 0-100
  waMessageId:    text("wa_message_id"),     // ID de Meta Cloud API
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

// ── CRM ───────────────────────────────────────────────────────────────────────

export const crmClients = pgTable("crm_clients", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  agentId:            uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  phone:              text("phone").notNull(),
  name:               text("name").notNull().default(""),
  email:              text("email"),
  firstContactAt:     timestamp("first_contact_at").notNull().defaultNow(),
  lastContactAt:      timestamp("last_contact_at").notNull().defaultNow(),
  totalConversations: integer("total_conversations").notNull().default(0),
  totalMessages:      integer("total_messages").notNull().default(0),
  tags:               jsonb("tags").notNull().default([]),
  notes:              text("notes"),
  status:             text("status").notNull().default("active"), // active | inactive | vip
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

// ── Reservations ──────────────────────────────────────────────────────────────

export const reservations = pgTable("reservations", {
  id:           uuid("id").primaryKey().defaultRandom(),
  agentId:      uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  clientName:   text("client_name").notNull(),
  clientPhone:  text("client_phone").notNull(),
  clientEmail:  text("client_email"),
  date:         text("date").notNull(),     // ISO date string
  time:         text("time").notNull(),
  partySize:    integer("party_size").notNull().default(1),
  roomType:     text("room_type"),          // hotel: tipo habitación
  notes:        text("notes"),
  status:       text("status").notNull().default("pending"), // pending | confirmed | cancelled
  source:       text("source").default("whatsapp"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id:           uuid("id").primaryKey().defaultRandom(),
  agentId:      uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  clientName:   text("client_name").notNull(),
  clientPhone:  text("client_phone").notNull(),
  items:        jsonb("items").notNull(),   // [{ productId, name, qty, price }]
  total:        integer("total").notNull(), // en centavos
  status:       text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

// ── Menu Items (restaurantes) ─────────────────────────────────────────────────

export const menuItems = pgTable("menu_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  agentId:     uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  price:       integer("price").notNull(),
  category:    text("category").notNull(),
  imageUrl:    text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  allergens:   jsonb("allergens").default([]),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

// ── Conversation Tags ─────────────────────────────────────────────────────────

export const conversationTags = pgTable("conversation_tags", {
  id:      uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name:    text("name").notNull(),
  color:   text("color").notNull(),
});

// ── Contacts (directorio interno del agente) ──────────────────────────────────

export const agentContacts = pgTable("agent_contacts", {
  id:          uuid("id").primaryKey().defaultRandom(),
  agentId:     uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  phone:       text("phone").notNull(),
  category:    text("category").notNull(),
  description: text("description"),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});
```

---

## Agentes con Vercel AI SDK

Cada agente en la DB tiene un `algorithmType` que determina qué **tools** tiene disponibles.
El backend construye el agente dinámicamente en cada mensaje entrante.

### Flujo de un mensaje WhatsApp

```
1. WhatsApp Cloud API → POST /webhooks/whatsapp
2. Verificar firma HMAC (header X-Hub-Signature-256)
3. Extraer: phoneNumber, mensaje, waMessageId
4. Buscar whatsapp_connections WHERE phone_number = ?
5. Cargar agent + faqs + products + reservations/orders (según algorithm_type)
6. Obtener o crear conversation WHERE agent_id = ? AND contact_phone = ?
7. Cargar últimos 20 mensajes (historia)
8. Construir agent con Vercel AI SDK:
   - system prompt con contexto del negocio
   - tools según algorithm_type
9. streamText() → acumular respuesta
10. Guardar mensaje user + mensaje assistant en DB
11. Incrementar agent.message_count
12. Enviar respuesta por WhatsApp Cloud API
```

### Estructura base del agente

```ts
// src/agents/base-agent.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { z } from "zod";

interface AgentContext {
  agent: Agent;
  faqs: FAQ[];
  products: Product[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  incomingMessage: string;
}

export async function runAgent(ctx: AgentContext) {
  const tools = buildTools(ctx);

  const result = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystemPrompt(ctx.agent, ctx.faqs),
    messages: [
      ...ctx.history,
      { role: "user", content: ctx.incomingMessage },
    ],
    tools,
    maxSteps: 5,  // Permite tool calls encadenadas
  });

  return result.text;
}

function buildSystemPrompt(agent: Agent, faqs: FAQ[]): string {
  return `
Eres ${agent.name}, el asistente de WhatsApp de ${agent.hotelName}.

PERSONALIDAD: ${agent.personality}
TONO: ${agent.tone}
IDIOMA: ${agent.language}

CONOCIMIENTO BASE:
${agent.knowledgeBase ?? ""}

PREGUNTAS FRECUENTES:
${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}

INSTRUCCIONES:
- Responde SOLO en el idioma del cliente
- Si no sabes algo, no inventes — di que vas a consultar
- Mensajes cortos para WhatsApp (máx 3 párrafos)
- Usa los tools disponibles para acciones concretas
`.trim();
}
```

### Tools por tipo de algoritmo

```ts
// src/agents/hotel.ts
export function buildHotelTools(agentId: string, db: DrizzleDB) {
  return {
    check_availability: tool({
      description: "Verificar disponibilidad de habitaciones por fecha",
      parameters: z.object({
        checkIn: z.string().describe("Fecha entrada YYYY-MM-DD"),
        checkOut: z.string().describe("Fecha salida YYYY-MM-DD"),
        guests: z.number().default(1),
      }),
      execute: async ({ checkIn, checkOut, guests }) => {
        const reservations = await db.query.reservations.findMany({
          where: and(
            eq(reservations.agentId, agentId),
            eq(reservations.status, "confirmed"),
          ),
        });
        // Calcular disponibilidad según reservas existentes
        return { available: true, roomTypes: ["Standard", "Suite"] };
      },
    }),

    create_reservation: tool({
      description: "Crear una reserva cuando el cliente acepta",
      parameters: z.object({
        clientName: z.string(),
        clientPhone: z.string(),
        date: z.string(),
        time: z.string(),
        roomType: z.string(),
        partySize: z.number().default(1),
        notes: z.string().optional(),
      }),
      execute: async (data) => {
        const reservation = await db.insert(reservations).values({
          agentId,
          ...data,
          status: "confirmed",
          source: "whatsapp",
        }).returning();
        return { success: true, reservationId: reservation[0].id };
      },
    }),
  };
}
```

---

## Rutas de la API (resumen)

```
POST   /v1/auth/login
POST   /v1/auth/register
GET    /v1/auth/me
POST   /v1/auth/refresh
POST   /v1/auth/logout

GET    /v1/agents
POST   /v1/agents
GET    /v1/agents/:id
PATCH  /v1/agents/:id
DELETE /v1/agents/:id
PATCH  /v1/agents/:id/status

GET    /v1/agents/:id/faqs
POST   /v1/agents/:id/faqs
PATCH  /v1/agents/:id/faqs/:faqId
DELETE /v1/agents/:id/faqs/:faqId
PATCH  /v1/agents/:id/faqs/reorder

GET    /v1/agents/:id/products
POST   /v1/agents/:id/products
PATCH  /v1/agents/:id/products/:productId
DELETE /v1/agents/:id/products/:productId
POST   /v1/agents/:id/products/import

GET    /v1/agents/:id/integrations
PATCH  /v1/agents/:id/integrations/:integId
PUT    /v1/agents/:id/integrations/:integId/config

GET    /v1/agents/:id/whatsapp
POST   /v1/agents/:id/whatsapp/connect
POST   /v1/agents/:id/whatsapp/verify
DELETE /v1/agents/:id/whatsapp

GET    /v1/agents/:id/conversations
GET    /v1/conversations/:convId
GET    /v1/conversations/:convId/messages
POST   /v1/conversations/:convId/messages
PATCH  /v1/conversations/:convId/mode
PATCH  /v1/conversations/:convId/resolve
POST   /v1/conversations/:convId/tags
DELETE /v1/conversations/:convId/tags/:tag

GET    /v1/agents/:id/crm
GET    /v1/agents/:id/crm/:clientId
PATCH  /v1/agents/:id/crm/:clientId

GET    /v1/agents/:id/contacts
POST   /v1/agents/:id/contacts
PATCH  /v1/agents/:id/contacts/:contactId
DELETE /v1/agents/:id/contacts/:contactId

GET    /v1/agents/:id/reservations
POST   /v1/agents/:id/reservations
PATCH  /v1/agents/:id/reservations/:resId
PATCH  /v1/agents/:id/reservations/:resId/cancel

GET    /v1/agents/:id/orders
GET    /v1/agents/:id/orders/:orderId
PATCH  /v1/agents/:id/orders/:orderId

GET    /v1/agents/:id/menu
POST   /v1/agents/:id/menu
PATCH  /v1/agents/:id/menu/:itemId
DELETE /v1/agents/:id/menu/:itemId

GET    /v1/agents/:id/train
PATCH  /v1/agents/:id/train
POST   /v1/agents/:id/train/chat        ← STREAMING (SSE)

GET    /v1/agents/:id/analytics?period=30d

GET    /v1/billing/subscription
PATCH  /v1/billing/subscription
PATCH  /v1/billing/subscription/cancel
GET    /v1/billing/usage
GET    /v1/billing/invoices

GET    /v1/agents/:id/social
PUT    /v1/agents/:id/social

GET    /webhooks/whatsapp               ← Verificación Meta
POST   /webhooks/whatsapp               ← Mensajes entrantes
```

---

## Middleware de autenticación

```ts
// src/middleware/auth.ts
import { verifyToken } from "../lib/jwt";

export const authMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ message: "No autorizado" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token);
    c.set("userId", payload.sub);
    c.set("planTier", payload.planTier);
    await next();
  } catch {
    return c.json({ message: "Token inválido" }, 401);
  }
};
```

## Middleware de límites del plan

```ts
// src/middleware/plan.ts
// Verifica que el usuario no exceda los límites del plan antes de crear
const PLAN_LIMITS = {
  starter:    { agents: 1,        messages: 1000,  whatsapp: 1, integrations: 2 },
  pro:        { agents: 3,        messages: 3000,  whatsapp: 3, integrations: 5 },
  business:   { agents: 10,       messages: 15000, whatsapp: 5, integrations: Infinity },
  enterprise: { agents: Infinity, messages: Infinity, whatsapp: Infinity, integrations: Infinity },
};

export function checkAgentLimit(planTier: string, currentCount: number): boolean {
  const limit = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS]?.agents ?? 0;
  return currentCount < limit;
}
```

---

## Variables de entorno

```env
# api/.env

# Servidor
PORT=3001
NODE_ENV=production

# Base de datos
DATABASE_URL=postgresql://user:password@postgres:5432/lisa

# JWT
JWT_SECRET=your-super-secret-256-bit-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Anthropic (Vercel AI SDK)
ANTHROPIC_API_KEY=sk-ant-...

# Meta Cloud API (WhatsApp)
META_APP_ID=...
META_APP_SECRET=...
META_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
META_API_VERSION=v19.0

# Redis (Bull queues)
REDIS_URL=redis://redis:6379

# Wompi (pagos Colombia)
WOMPI_PUBLIC_KEY=pub_...
WOMPI_PRIVATE_KEY=prv_...
WOMPI_EVENT_KEY=...

# Cifrado de credenciales de integraciones
ENCRYPTION_KEY=32-byte-hex-key
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
```

---

## Docker Compose (desarrollo)

```yaml
# api/docker-compose.yml
version: "3.9"

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://lisa:lisa@postgres:5432/lisa
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src  # hot reload en desarrollo

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lisa
      POSTGRES_PASSWORD: lisa
      POSTGRES_DB: lisa
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## Traefik (producción)

```yaml
# Etiquetas para el servicio api en docker-compose de producción
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.api.rule=Host(`api.tu-dominio.com`)"
  - "traefik.http.routers.api.entrypoints=websecure"
  - "traefik.http.routers.api.tls.certresolver=letsencrypt"
  - "traefik.http.services.api.loadbalancer.server.port=3001"
```

---

## Cómo migrar el frontend de mock → API real

### Paso 1: Configurar variable de entorno
```env
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
```

### Paso 2: Implementar autenticación
Crear página `/login` que llame `authApi.login()` y guarde el token con `setToken()`.

### Paso 3: Actualizar los stores uno a uno
Reemplazar las llamadas a mock data por llamadas a la API.

**Ejemplo — loadFaqs:**
```ts
// ANTES (mock):
loadFaqs: (agentId) => {
  const faqs = mockFaqs.filter((faq) => faq.agentId === agentId);
  set({ faqs });
},

// DESPUÉS (API real):
loadFaqs: async (agentId) => {
  if (!API_ENABLED) {
    set({ faqs: mockFaqs.filter(f => f.agentId === agentId) });
    return;
  }
  const faqs = await faqsApi.list(agentId);
  set({ faqs });
},
```

**Ejemplo — addFaq:**
```ts
// ANTES (mock):
addFaq: (faqData) => {
  const newFaq = { ...faqData, id: crypto.randomUUID(), sortOrder: ... };
  set(state => ({ faqs: [...state.faqs, newFaq] }));
},

// DESPUÉS (API real):
addFaq: async (faqData) => {
  if (!API_ENABLED) { /* mock logic */ return; }
  const newFaq = await faqsApi.create(faqData.agentId, faqData);
  set(state => ({ faqs: [...state.faqs, newFaq] }));
},
```

El patrón se repite para todos los recursos: `API_ENABLED ? apiCall() : mockFallback()`.

---

## Orden de implementación del backend

1. **Setup base**: Hono + Drizzle + PostgreSQL + auth JWT
2. **CRUD de agents**: el bloque más importante para el frontend
3. **FAQs, products, integrations**: datos de configuración
4. **WhatsApp webhook**: corazón del producto — recibir y responder mensajes
5. **Vercel AI SDK**: integrar el LLM con tools por algorithm_type
6. **Conversations y CRM**: construidos con los datos reales del webhook
7. **Billing**: integrar Wompi/Stripe, enforcer de límites de plan
8. **Reservations / Orders / Menu**: módulos por industria
9. **Analytics**: agregar métricas de los mensajes guardados
