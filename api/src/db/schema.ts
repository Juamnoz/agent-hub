import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const planTierEnum = pgEnum("plan_tier", [
  "starter",
  "pro",
  "business",
  "enterprise",
]);

export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "owner",
  "admin",
  "member",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "inactive",
  "setup",
  "testing",
]);

export const algorithmTypeEnum = pgEnum("algorithm_type", [
  "hotel",
  "restaurant",
  "ecommerce",
  "whatsapp-store",
  "appointments",
  "inmobiliaria",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "bot_handling",
  "human_handling",
  "resolved",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "human",
]);

export const integrationCategoryEnum = pgEnum("integration_category", [
  "payments",
  "operations",
  "productivity",
  "ecommerce",
]);

// ── Organizations ─────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  agents: many(agents),
}));

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("member"),
  planTier: planTierEnum("plan_tier").notNull().default("starter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  memberships: many(memberships),
  agents: many(agents),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

// ── Memberships (users ↔ organizations) ──────────────────────────────────────

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

// ── Subscriptions (Billing) ───────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planTier: planTierEnum("plan_tier").notNull(),
  status: text("status").notNull().default("active"),
  externalId: text("external_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Agents ────────────────────────────────────────────────────────────────────

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  hotelName: text("hotel_name").notNull(),
  avatar: text("avatar"),
  status: agentStatusEnum("status").notNull().default("setup"),
  algorithmType: algorithmTypeEnum("algorithm_type"),
  personality: text("personality").notNull().default(""),
  tone: text("tone").notNull().default("friendly"),
  language: text("language").notNull().default("es"),
  communicationStyle: jsonb("communication_style"),
  socialLinks: jsonb("social_links"),
  systemPrompt: text("system_prompt"),
  knowledgeBase: text("knowledge_base"),
  webhookUrl: text("webhook_url"),
  apiKey: text("api_key"),
  adminPhone: text("admin_phone"),
  escalationPhone: text("escalation_phone"),
  trainedAt: timestamp("trained_at"),
  catalogs: jsonb("catalogs"),
  conversationExamples: jsonb("conversation_examples"),
  messageCount: integer("message_count").notNull().default(0),
  faqCount: integer("faq_count").notNull().default(0),
  productCount: integer("product_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, { fields: [agents.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
  }),
  whatsappConnection: one(whatsappConnections),
  faqs: many(faqs),
  products: many(products),
  integrations: many(integrations),
  conversations: many(conversations),
  reservations: many(reservations),
  orders: many(orders),
  menuItems: many(menuItems),
  crmClients: many(crmClients),
}));

// ── WhatsApp ──────────────────────────────────────────────────────────────────

export const whatsappConnections = pgTable("whatsapp_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => agents.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  phoneNumber: text("phone_number").notNull(),
  phoneNumberId: text("phone_number_id"),
  wabaId: text("waba_id"),
  accessToken: text("access_token"),
  apiKey: text("api_key"),
  endpointUrl: text("endpoint_url"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const whatsappConnectionsRelations = relations(whatsappConnections, ({ one }) => ({
  agent: one(agents, { fields: [whatsappConnections.agentId], references: [agents.id] }),
}));

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const faqsRelations = relations(faqs, ({ one }) => ({
  agent: one(agents, { fields: [faqs.agentId], references: [agents.id] }),
}));

// ── Products ──────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0),
  category: text("category").notNull().default(""),
  imageUrl: text("image_url"),
  sku: text("sku"),
  stock: integer("stock"),
  variants: jsonb("variants"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ one }) => ({
  agent: one(agents, { fields: [products.agentId], references: [agents.id] }),
}));

// ── Integrations ──────────────────────────────────────────────────────────────

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: integrationCategoryEnum("category").notNull(),
  requiredPlan: planTierEnum("required_plan").notNull().default("starter"),
  enabled: boolean("enabled").notNull().default(false),
  environment: text("environment").default("sandbox"),
  credentials: jsonb("credentials"),
  configured: boolean("configured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  contactPhone: text("contact_phone").notNull(),
  contactName: text("contact_name").notNull().default(""),
  messageCount: integer("message_count").notNull().default(0),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  status: conversationStatusEnum("status").notNull().default("bot_handling"),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    agent: one(agents, {
      fields: [conversations.agentId],
      references: [agents.id],
    }),
    messages: many(messages),
  })
);

// ── Messages ──────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  matchedFaqId: uuid("matched_faq_id").references(() => faqs.id),
  confidence: integer("confidence"),
  waMessageId: text("wa_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ── CRM ───────────────────────────────────────────────────────────────────────

export const crmClients = pgTable("crm_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  name: text("name").notNull().default(""),
  email: text("email"),
  firstContactAt: timestamp("first_contact_at").notNull().defaultNow(),
  lastContactAt: timestamp("last_contact_at").notNull().defaultNow(),
  totalConversations: integer("total_conversations").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  tags: jsonb("tags").notNull().default([]),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Reservations ──────────────────────────────────────────────────────────────

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  partySize: integer("party_size").notNull().default(1),
  roomType: text("room_type"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  source: text("source").default("whatsapp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  items: jsonb("items").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Menu Items (restaurantes) ─────────────────────────────────────────────────

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  allergens: jsonb("allergens").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Conversation Tags ─────────────────────────────────────────────────────────

export const conversationTags = pgTable("conversation_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// ── Agent Contacts (directorio interno) ──────────────────────────────────────

export const agentContacts = pgTable("agent_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type FAQ = typeof faqs.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CRMClient = typeof crmClients.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type WhatsAppConnection = typeof whatsappConnections.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
