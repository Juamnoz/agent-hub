/**
 * api.ts — Contrato de API de LISA
 *
 * Este archivo define TODAS las rutas del backend como funciones TypeScript tipadas.
 * Cuando el backend esté listo, los stores dejarán de usar mock-data y llamarán
 * estas funciones directamente.
 *
 * Base URL: NEXT_PUBLIC_API_URL (ej. https://api.lisa.ai/v1)
 * Auth: Bearer JWT en header Authorization
 */

import type {
  Agent,
  FAQ,
  Product,
  HotelContact,
  Conversation,
  ConversationTag,
  Message,
  CRMClient,
  Integration,
  Reservation,
  Order,
  MenuItem,
  AlgorithmType,
  CommunicationStyle,
} from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
export const API_ENABLED = !!API_BASE;

// ─────────────────────────────────────────────────────────────────────────────
// Auth token (browser only)
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "lisa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // Primary: direct key
  const direct = localStorage.getItem(TOKEN_KEY);
  if (direct) return direct;
  // Fallback: read from Zustand persisted store
  try {
    const raw = localStorage.getItem("lisa-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        // Sync it back so next call is fast
        localStorage.setItem(TOKEN_KEY, token);
        return token;
      }
    }
  } catch {}
  return null;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let _refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const raw = localStorage.getItem("lisa-auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const refreshToken = parsed?.state?.refreshToken;
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        // Update Zustand persisted store with new token
        parsed.state.token = data.token;
        localStorage.setItem("lisa-auth", JSON.stringify(parsed));
        return data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number>; _retried?: boolean } = {}
): Promise<T> {
  const { params, _retried, ...init } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
        {}
      )
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && !_retried && typeof window !== "undefined") {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
    // Refresh failed — clear auth and redirect to login
    clearToken();
    localStorage.removeItem("lisa-auth");
    window.location.href = "/sign-in";
    throw new ApiError(401, "Sesión expirada");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth — POST /auth/*
// ─────────────────────────────────────────────────────────────────────────────

export interface UserOrganization {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  planTier: "starter" | "pro" | "business" | "enterprise";
  role: "superadmin" | "owner" | "admin" | "member";
  organizations: UserOrganization[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  /** Iniciar sesión con email y contraseña */
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /** Registrar nuevo usuario */
  register: (data: { name: string; email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Obtener usuario autenticado */
  me: () => apiFetch<AuthUser>("/auth/me"),

  /** Renovar token */
  refresh: (refreshToken: string) =>
    apiFetch<{ token: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  /** Cerrar sesión (invalida el refresh token en el servidor) */
  logout: () =>
    apiFetch<void>("/auth/logout", { method: "POST" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Agents — /agents
// ─────────────────────────────────────────────────────────────────────────────

export type CreateAgentPayload = Pick<
  Agent,
  | "name"
  | "hotelName"
  | "personality"
  | "tone"
  | "language"
  | "algorithmType"
  | "communicationStyle"
  | "socialLinks"
  | "avatar"
>;

export const agentsApi = {
  /** Listar todos los agentes del usuario autenticado */
  list: () => apiFetch<Agent[]>("/agents"),

  /** Obtener un agente por ID */
  get: (id: string) => apiFetch<Agent>(`/agents/${id}`),

  /** Crear nuevo agente */
  create: (data: CreateAgentPayload) =>
    apiFetch<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Actualizar agente (PATCH — enviar solo los campos a cambiar) */
  update: (id: string, data: Partial<Agent>) =>
    apiFetch<Agent>(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /** Eliminar agente */
  delete: (id: string) =>
    apiFetch<void>(`/agents/${id}`, { method: "DELETE" }),

  /** Cambiar estado del agente */
  setStatus: (id: string, status: "active" | "inactive" | "testing" | "setup") =>
    apiFetch<Agent>(`/agents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// FAQs — /agents/:agentId/faqs
// ─────────────────────────────────────────────────────────────────────────────

export type CreateFAQPayload = Omit<FAQ, "id" | "sortOrder">;

export const faqsApi = {
  list: (agentId: string) => apiFetch<FAQ[]>(`/agents/${agentId}/faqs`),

  create: (agentId: string, data: CreateFAQPayload) =>
    apiFetch<FAQ>(`/agents/${agentId}/faqs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (agentId: string, faqId: string, data: Partial<FAQ>) =>
    apiFetch<FAQ>(`/agents/${agentId}/faqs/${faqId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (agentId: string, faqId: string) =>
    apiFetch<void>(`/agents/${agentId}/faqs/${faqId}`, { method: "DELETE" }),

  /** Reordenar FAQs (drag & drop) */
  reorder: (agentId: string, orderedIds: string[]) =>
    apiFetch<void>(`/agents/${agentId}/faqs/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ orderedIds }),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Products / Catálogo — /agents/:agentId/products
// ─────────────────────────────────────────────────────────────────────────────

export type CreateProductPayload = Omit<Product, "id" | "sortOrder">;

export const productsApi = {
  list: (agentId: string) => apiFetch<Product[]>(`/agents/${agentId}/products`),

  create: (agentId: string, data: CreateProductPayload) =>
    apiFetch<Product>(`/agents/${agentId}/products`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (agentId: string, productId: string, data: Partial<Product>) =>
    apiFetch<Product>(`/agents/${agentId}/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (agentId: string, productId: string) =>
    apiFetch<void>(`/agents/${agentId}/products/${productId}`, {
      method: "DELETE",
    }),

  /**
   * Importar productos desde fuente externa (Shopify, WooCommerce, Google Sheets)
   * El backend procesa la importación de forma asíncrona.
   */
  import: (
    agentId: string,
    source: "shopify" | "woocommerce" | "google-sheets" | "csv",
    payload: { url?: string; token?: string; sheetId?: string }
  ) =>
    apiFetch<{ jobId: string; count: number }>(`/agents/${agentId}/products/import`, {
      method: "POST",
      body: JSON.stringify({ source, ...payload }),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Integrations — /agents/:agentId/integrations
// ─────────────────────────────────────────────────────────────────────────────

export const integrationsApi = {
  list: (agentId: string) =>
    apiFetch<Integration[]>(`/agents/${agentId}/integrations`),

  /** Habilitar o deshabilitar una integración */
  toggle: (agentId: string, integrationId: string, enabled: boolean) =>
    apiFetch<Integration>(`/agents/${agentId}/integrations/${integrationId}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),

  /** Guardar credenciales de la integración (Wompi, Shopify, etc.) */
  configure: (
    agentId: string,
    integrationId: string,
    config: {
      environment?: "sandbox" | "production";
      credentials: Record<string, string>;
    }
  ) =>
    apiFetch<Integration>(
      `/agents/${agentId}/integrations/${integrationId}/config`,
      { method: "PUT", body: JSON.stringify(config) }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp — /agents/:agentId/whatsapp
// ─────────────────────────────────────────────────────────────────────────────

export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  provider?: "meta" | "wati" | "coexistence";
  wabaId?: string;
  phoneNumberId?: string;
  verifiedAt?: string;
}

export interface WhatsAppConnectPayload {
  provider: "meta" | "wati" | "coexistence";
  phoneNumber: string;
  /** Solo para Meta: ID del número de teléfono en WABA */
  phoneNumberId?: string;
  /** Solo para Meta: ID de la cuenta WABA */
  wabaId?: string;
  /** Solo para WATI: API key */
  apiKey?: string;
  /** Solo para WATI: URL del endpoint */
  endpointUrl?: string;
}

export const whatsappApi = {
  /** Estado actual de la conexión */
  status: (agentId: string) =>
    apiFetch<WhatsAppStatus>(`/agents/${agentId}/whatsapp`),

  /**
   * Iniciar conexión WhatsApp.
   * Para Meta: el backend registra el webhook y devuelve QR o URL de verificación.
   */
  connect: (agentId: string, data: WhatsAppConnectPayload) =>
    apiFetch<{ success: boolean; verificationCode?: string }>(
      `/agents/${agentId}/whatsapp/connect`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  /** Verificar número con código OTP (Meta) */
  verify: (agentId: string, code: string) =>
    apiFetch<WhatsAppStatus>(`/agents/${agentId}/whatsapp/verify`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  /** Desconectar WhatsApp */
  disconnect: (agentId: string) =>
    apiFetch<void>(`/agents/${agentId}/whatsapp`, { method: "DELETE" }),

  /**
   * Endpoint de webhook para Meta Cloud API.
   * El backend expone: GET /webhooks/whatsapp (verificación) y POST /webhooks/whatsapp (mensajes).
   * NO se llama desde el frontend — es registrado en Meta for Developers.
   */
  WEBHOOK_URL: `${API_BASE}/webhooks/whatsapp`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversations — /agents/:agentId/conversations
// ─────────────────────────────────────────────────────────────────────────────

export interface ConversationsListParams {
  status?: "bot_handling" | "human_handling" | "resolved";
  page?: number;
  pageSize?: number;
}

export const conversationsApi = {
  list: (agentId: string, params?: ConversationsListParams) =>
    apiFetch<PaginatedResponse<Conversation>>(
      `/agents/${agentId}/conversations`,
      { params: params as Record<string, string | number> }
    ),

  get: (conversationId: string) =>
    apiFetch<Conversation>(`/conversations/${conversationId}`),

  /** Obtener mensajes de una conversación */
  messages: (conversationId: string) =>
    apiFetch<Message[]>(`/conversations/${conversationId}/messages`),

  /**
   * Enviar mensaje desde el panel (modo humano).
   * El backend lo envía por WhatsApp Cloud API.
   */
  sendMessage: (conversationId: string, content: string) =>
    apiFetch<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, role: "human" }),
    }),

  /** Cambiar modo: bot_handling ↔ human_handling */
  toggleMode: (conversationId: string) =>
    apiFetch<Conversation>(`/conversations/${conversationId}/mode`, {
      method: "PATCH",
    }),

  /** Resolver conversación */
  resolve: (conversationId: string) =>
    apiFetch<Conversation>(`/conversations/${conversationId}/resolve`, {
      method: "PATCH",
    }),

  /** Añadir / quitar etiqueta */
  addTag: (conversationId: string, tag: string) =>
    apiFetch<Conversation>(`/conversations/${conversationId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    }),

  removeTag: (conversationId: string, tag: string) =>
    apiFetch<Conversation>(`/conversations/${conversationId}/tags/${encodeURIComponent(tag)}`, {
      method: "DELETE",
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversation Tags — /agents/:agentId/tags
// ─────────────────────────────────────────────────────────────────────────────

export const conversationTagsApi = {
  list: (agentId: string) =>
    apiFetch<ConversationTag[]>(`/agents/${agentId}/tags`),

  create: (agentId: string, name: string, color: string) =>
    apiFetch<ConversationTag>(`/agents/${agentId}/tags`, {
      method: "POST",
      body: JSON.stringify({ name, color }),
    }),

  delete: (agentId: string, tagId: string) =>
    apiFetch<void>(`/agents/${agentId}/tags/${tagId}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// CRM — /agents/:agentId/crm
// ─────────────────────────────────────────────────────────────────────────────

export const crmApi = {
  list: (agentId: string) => apiFetch<CRMClient[]>(`/agents/${agentId}/crm`),

  get: (agentId: string, clientId: string) =>
    apiFetch<CRMClient>(`/agents/${agentId}/crm/${clientId}`),

  update: (agentId: string, clientId: string, data: Partial<CRMClient>) =>
    apiFetch<CRMClient>(`/agents/${agentId}/crm/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Contacts (directorio interno) — /agents/:agentId/contacts
// ─────────────────────────────────────────────────────────────────────────────

export const contactsApi = {
  list: (agentId: string) =>
    apiFetch<HotelContact[]>(`/agents/${agentId}/contacts`),

  create: (agentId: string, data: Omit<HotelContact, "id">) =>
    apiFetch<HotelContact>(`/agents/${agentId}/contacts`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (agentId: string, contactId: string, data: Partial<HotelContact>) =>
    apiFetch<HotelContact>(`/agents/${agentId}/contacts/${contactId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (agentId: string, contactId: string) =>
    apiFetch<void>(`/agents/${agentId}/contacts/${contactId}`, {
      method: "DELETE",
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Reservations — /agents/:agentId/reservations
// ─────────────────────────────────────────────────────────────────────────────

export const reservationsApi = {
  list: (agentId: string, params?: { status?: string; date?: string }) =>
    apiFetch<Reservation[]>(`/agents/${agentId}/reservations`, {
      params: params as Record<string, string | number>,
    }),

  create: (agentId: string, data: Omit<Reservation, "id" | "createdAt">) =>
    apiFetch<Reservation>(`/agents/${agentId}/reservations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (agentId: string, reservationId: string, data: Partial<Reservation>) =>
    apiFetch<Reservation>(`/agents/${agentId}/reservations/${reservationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  cancel: (agentId: string, reservationId: string) =>
    apiFetch<Reservation>(
      `/agents/${agentId}/reservations/${reservationId}/cancel`,
      { method: "PATCH" }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Orders — /agents/:agentId/orders
// ─────────────────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (agentId: string, params?: { status?: string }) =>
    apiFetch<Order[]>(`/agents/${agentId}/orders`, {
      params: params as Record<string, string | number>,
    }),

  get: (agentId: string, orderId: string) =>
    apiFetch<Order>(`/agents/${agentId}/orders/${orderId}`),

  update: (agentId: string, orderId: string, data: Partial<Order>) =>
    apiFetch<Order>(`/agents/${agentId}/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu — /agents/:agentId/menu
// ─────────────────────────────────────────────────────────────────────────────

export const menuApi = {
  list: (agentId: string) => apiFetch<MenuItem[]>(`/agents/${agentId}/menu`),

  create: (agentId: string, data: Omit<MenuItem, "id">) =>
    apiFetch<MenuItem>(`/agents/${agentId}/menu`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (agentId: string, itemId: string, data: Partial<MenuItem>) =>
    apiFetch<MenuItem>(`/agents/${agentId}/menu/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (agentId: string, itemId: string) =>
    apiFetch<void>(`/agents/${agentId}/menu/${itemId}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Training / AI Config — /agents/:agentId/train
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentTrainConfig {
  algorithmType: AlgorithmType;
  personality: string;
  tone: "formal" | "friendly" | "casual";
  communicationStyle: CommunicationStyle;
  systemPromptOverride?: string;
  /** Contexto adicional que el agente usa en cada respuesta */
  knowledgeBase?: string;
}

export const trainApi = {
  getConfig: (agentId: string) =>
    apiFetch<AgentTrainConfig>(`/agents/${agentId}/train`),

  updateConfig: (agentId: string, data: Partial<AgentTrainConfig>) =>
    apiFetch<AgentTrainConfig>(`/agents/${agentId}/train`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * Enviar mensaje de entrenamiento al agente (usa Vercel AI SDK streaming).
   * El backend procesa con streamText() y guarda el conocimiento en la DB.
   * Devuelve un ReadableStream (text/event-stream).
   */
  chat: (agentId: string, message: string) =>
    fetch(`${API_BASE}/v1/agents/${agentId}/train/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ message }),
    }),

  deploy: (agentId: string) =>
    apiFetch<{ success: boolean; trainedAt: string; agent_id: string }>(
      `/agents/${agentId}/train/deploy`,
      { method: "POST" }
    ),

  changeMode: (agentId: string, status: "active" | "inactive" | "testing") =>
    apiFetch<{ success: boolean; status: string; mode: string }>(
      `/agents/${agentId}/train/mode`,
      { method: "POST", body: JSON.stringify({ status }) }
    ),

  /** Partial update — only re-processes the changed section in n8n */
  update: (agentId: string, updateType: "prompt" | "faqs" | "products" | "catalogs" | "phones" | "social_links") =>
    apiFetch<{ success: boolean; update_type: string; agent_id: string }>(
      `/agents/${agentId}/train/update`,
      { method: "POST", body: JSON.stringify({ update_type: updateType }) }
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Billing / Planes — /billing
// ─────────────────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  planTier: "starter" | "pro" | "business" | "enterprise";
  status: "active" | "past_due" | "cancelled";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageStats {
  agentCount: number;
  messageCount: number;
  whatsappCount: number;
  integrationCount: number;
  periodStart: string;
  periodEnd: string;
}

export const billingApi = {
  /** Suscripción activa del usuario */
  subscription: () => apiFetch<Subscription>("/billing/subscription"),

  /** Métricas de uso del período actual */
  usage: () => apiFetch<UsageStats>("/billing/usage"),

  /**
   * Cambiar de plan.
   * El backend actualiza en Stripe/Wompi y en la DB.
   */
  changePlan: (planTier: "starter" | "pro" | "business" | "enterprise") =>
    apiFetch<Subscription>("/billing/subscription", {
      method: "PATCH",
      body: JSON.stringify({ planTier }),
    }),

  /** Cancelar suscripción (al final del período) */
  cancel: () =>
    apiFetch<Subscription>("/billing/subscription/cancel", {
      method: "PATCH",
    }),

  /** Historial de facturas */
  invoices: () =>
    apiFetch<
      Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        date: string;
        pdfUrl: string;
      }>
    >("/billing/invoices"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics — /agents/:agentId/analytics
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentAnalytics {
  totalConversations: number;
  totalMessages: number;
  avgResponseTimeMs: number;
  resolutionRate: number;
  humanHandoffRate: number;
  topFaqs: Array<{ faqId: string; question: string; hits: number }>;
  messagesPerDay: Array<{ date: string; count: number }>;
}

export const analyticsApi = {
  agent: (agentId: string, period: "7d" | "30d" | "90d" = "30d") =>
    apiFetch<AgentAnalytics>(`/agents/${agentId}/analytics`, {
      params: { period },
    }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Social Links — /agents/:agentId/social
// ─────────────────────────────────────────────────────────────────────────────

export const socialApi = {
  get: (agentId: string) =>
    apiFetch<Agent["socialLinks"]>(`/agents/${agentId}/social`),

  update: (agentId: string, data: Agent["socialLinks"]) =>
    apiFetch<Agent["socialLinks"]>(`/agents/${agentId}/social`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
