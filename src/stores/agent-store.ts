import { create } from "zustand";
import {
  type Agent,
  type FAQ,
  type Product,
  type HotelContact,
  type Conversation,
  type ConversationTag,
  type Message,
  type CRMClient,
  type DashboardStats,
  type WeeklyMessageData,
  type Integration,
  type AlgorithmType,
  type CommunicationStyle,
  type TrainingMessage,
  type TrainingToolType,
  type Reservation,
  type Order,
  type MenuItem,
  mockAgents,
  mockFaqs,
  mockProducts,
  mockContacts,
  mockConversations,
  mockMessages,
  mockConversationTags,
  mockCRMClients,
  mockDashboardStats,
  mockWeeklyMessages,
  mockIntegrations,
  mockTrainingResponses,
  mockReservations,
  mockOrders,
  mockMenuItems,
} from "@/lib/mock-data";
import {
  API_ENABLED,
  agentsApi,
  faqsApi,
  productsApi,
  conversationsApi,
  reservationsApi,
  ordersApi,
  menuApi,
  crmApi,
  contactsApi,
  analyticsApi,
} from "@/lib/api";
import { usePlanStore } from "@/stores/plan-store";
import { sendWebhook } from "@/lib/webhook";

interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  faqs: FAQ[];
  products: Product[];
  contacts: HotelContact[];
  conversations: Conversation[];
  messages: Message[];
  conversationTags: ConversationTag[];
  clients: CRMClient[];
  integrations: Integration[];
  stats: DashboardStats;
  weeklyMessages: WeeklyMessageData[];
  reservations: Reservation[];
  orders: Order[];
  menuItems: MenuItem[];
  loadingAgents: boolean;

  // Loaders
  loadAgents: () => Promise<void>;
  setCurrentAgent: (agent: Agent | null) => void;
  addAgent: (agent: Omit<Agent, "id" | "userId" | "createdAt" | "updatedAt" | "messageCount" | "faqCount" | "productCount">) => Promise<string>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  loadProducts: (agentId: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id" | "sortOrder">) => Promise<void>;
  importProducts: (agentId: string, source: string, newProducts: Omit<Product, "id" | "sortOrder">[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  loadFaqs: (agentId: string) => Promise<void>;
  addFaq: (faq: Omit<FAQ, "id" | "sortOrder">) => Promise<void>;
  updateFaq: (id: string, updates: Partial<FAQ>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;

  loadContacts: (agentId: string) => Promise<void>;
  addContact: (contact: Omit<HotelContact, "id">) => Promise<void>;
  updateContact: (id: string, updates: Partial<HotelContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  loadConversations: (agentId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  toggleConversationMode: (conversationId: string) => Promise<void>;
  setConversationStatus: (conversationId: string, status: import("@/lib/mock-data").ConversationStatus) => void;
  resolveConversation: (conversationId: string) => Promise<void>;
  addMessageToConversation: (conversationId: string, content: string) => Promise<void>;
  addTagToConversation: (conversationId: string, tag: string) => void;
  removeTagFromConversation: (conversationId: string, tag: string) => void;

  loadConversationTags: (agentId: string) => void;
  addConversationTag: (agentId: string, name: string, color: string) => void;

  loadClients: (agentId: string) => Promise<void>;
  updateClient: (id: string, updates: Partial<CRMClient>) => void;

  loadIntegrations: (agentId: string) => void;
  toggleIntegration: (integrationId: string) => void;
  updateIntegrationConfig: (integrationId: string, config: { environment?: "sandbox" | "production"; credentials: Record<string, string> }) => void;

  loadReservations: (agentId: string) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, "id" | "createdAt">) => Promise<void>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;

  loadOrders: (agentId: string) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => void;

  loadMenuItems: (agentId: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  trainingMessages: TrainingMessage[];
  addTrainingMessage: (agentId: string, content: string, toolType?: TrainingToolType, attachmentName?: string) => void;
  clearTrainingMessages: (agentId: string) => void;

  loadStats: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  currentAgent: null,
  faqs: [],
  products: [],
  contacts: [],
  conversations: [],
  messages: [],
  conversationTags: [],
  clients: [],
  integrations: [],
  trainingMessages: [],
  stats: mockDashboardStats,
  weeklyMessages: mockWeeklyMessages,
  reservations: [],
  orders: [],
  menuItems: [],
  loadingAgents: false,

  // ── Agents ────────────────────────────────────────────────────────────────

  loadAgents: async () => {
    set({ loadingAgents: true });
    try {
      if (API_ENABLED) {
        const agents = await agentsApi.list();
        set({ agents: agents as Agent[], loadingAgents: false });
      } else {
        set({ agents: mockAgents, loadingAgents: false });
      }
    } catch {
      set({ agents: mockAgents, loadingAgents: false });
    }
  },

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  addAgent: async (agentData) => {
    if (API_ENABLED) {
      const agent = await agentsApi.create(agentData as any);
      set((state) => ({ agents: [...state.agents, agent as Agent] }));
      return agent.id;
    }
    const now = new Date().toISOString();
    const newAgent: Agent = { ...agentData, id: crypto.randomUUID(), userId: "user-001", messageCount: 0, faqCount: 0, productCount: 0, createdAt: now, updatedAt: now };
    set((state) => ({ agents: [...state.agents, newAgent] }));
    sendWebhook("agent.created", { agent: newAgent });
    return newAgent.id;
  },

  updateAgent: async (id, updates) => {
    if (API_ENABLED) {
      const updated = await agentsApi.update(id, updates as any);
      set((state) => ({
        agents: state.agents.map((a) => a.id === id ? { ...a, ...updated } : a),
        currentAgent: state.currentAgent?.id === id ? { ...state.currentAgent, ...updated } : state.currentAgent,
      }));
      return;
    }
    set((state) => ({
      agents: state.agents.map((a) => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a),
      currentAgent: state.currentAgent?.id === id ? { ...state.currentAgent, ...updates, updatedAt: new Date().toISOString() } : state.currentAgent,
    }));
  },

  deleteAgent: async (id) => {
    if (API_ENABLED) {
      await agentsApi.delete(id);
    }
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      currentAgent: state.currentAgent?.id === id ? null : state.currentAgent,
    }));
  },

  // ── Products ──────────────────────────────────────────────────────────────

  loadProducts: async (agentId) => {
    if (API_ENABLED) {
      const products = await productsApi.list(agentId);
      set({ products: products as Product[] });
    } else {
      set({ products: mockProducts.filter((p) => p.agentId === agentId) });
    }
  },

  addProduct: async (productData) => {
    if (API_ENABLED) {
      const product = await productsApi.create(productData.agentId, productData as any);
      set((state) => ({ products: [...state.products, product as Product] }));
      return;
    }
    const { products } = get();
    const newProduct: Product = { ...productData, id: crypto.randomUUID(), sortOrder: products.length };
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  importProducts: (agentId, source, newProducts) => {
    const { products } = get();
    const created: Product[] = newProducts.map((p, i) => ({ ...p, id: crypto.randomUUID(), sortOrder: products.length + i }));
    set((state) => ({ products: [...state.products, ...created] }));
  },

  updateProduct: async (id, updates) => {
    const product = get().products.find((p) => p.id === id);
    if (API_ENABLED && product) {
      await productsApi.update(product.agentId, id, updates as any);
    }
    set((state) => ({ products: state.products.map((p) => p.id === id ? { ...p, ...updates } : p) }));
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id);
    if (API_ENABLED && product) {
      await productsApi.delete(product.agentId, id);
    }
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  // ── FAQs ──────────────────────────────────────────────────────────────────

  loadFaqs: async (agentId) => {
    if (API_ENABLED) {
      const faqs = await faqsApi.list(agentId);
      set({ faqs: faqs as FAQ[] });
    } else {
      set({ faqs: mockFaqs.filter((f) => f.agentId === agentId) });
    }
  },

  addFaq: async (faqData) => {
    if (API_ENABLED) {
      const faq = await faqsApi.create(faqData.agentId, faqData as any);
      set((state) => ({ faqs: [...state.faqs, faq as FAQ] }));
      return;
    }
    const { faqs } = get();
    const newFaq: FAQ = { ...faqData, id: crypto.randomUUID(), sortOrder: faqs.length };
    set((state) => ({ faqs: [...state.faqs, newFaq] }));
  },

  updateFaq: async (id, updates) => {
    const faq = get().faqs.find((f) => f.id === id);
    if (API_ENABLED && faq) {
      await faqsApi.update(faq.agentId, id, updates as any);
    }
    set((state) => ({ faqs: state.faqs.map((f) => f.id === id ? { ...f, ...updates } : f) }));
  },

  deleteFaq: async (id) => {
    const faq = get().faqs.find((f) => f.id === id);
    if (API_ENABLED && faq) {
      await faqsApi.delete(faq.agentId, id);
    }
    set((state) => ({ faqs: state.faqs.filter((f) => f.id !== id) }));
  },

  // ── Contacts ──────────────────────────────────────────────────────────────

  loadContacts: async (agentId) => {
    if (API_ENABLED) {
      try {
        const contacts = await contactsApi.list(agentId);
        set({ contacts: contacts as HotelContact[] });
      } catch {
        set({ contacts: mockContacts.filter((c) => c.agentId === agentId) });
      }
    } else {
      set({ contacts: mockContacts.filter((c) => c.agentId === agentId) });
    }
  },

  addContact: async (contactData) => {
    if (API_ENABLED) {
      const contact = await contactsApi.create(contactData.agentId, contactData as any);
      set((state) => ({ contacts: [...state.contacts, contact as HotelContact] }));
      return;
    }
    set((state) => ({ contacts: [...state.contacts, { ...contactData, id: crypto.randomUUID() }] }));
  },

  updateContact: async (id, updates) => {
    const contact = get().contacts.find((c) => c.id === id);
    if (API_ENABLED && contact) {
      await contactsApi.update(contact.agentId, id, updates as any);
    }
    set((state) => ({ contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  },

  deleteContact: async (id) => {
    const contact = get().contacts.find((c) => c.id === id);
    if (API_ENABLED && contact) {
      await contactsApi.delete(contact.agentId, id);
    }
    set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
  },

  // ── Conversations ─────────────────────────────────────────────────────────

  loadConversations: async (agentId) => {
    if (API_ENABLED) {
      try {
        const res = await conversationsApi.list(agentId);
        set({ conversations: (res.data ?? res) as Conversation[] });
      } catch {
        set({ conversations: mockConversations.filter((c) => c.agentId === agentId) });
      }
    } else {
      set({ conversations: mockConversations.filter((c) => c.agentId === agentId) });
    }
  },

  loadMessages: async (conversationId) => {
    if (API_ENABLED) {
      try {
        const msgs = await conversationsApi.messages(conversationId);
        set({ messages: msgs as Message[] });
      } catch {
        set({ messages: mockMessages.filter((m) => m.conversationId === conversationId) });
      }
    } else {
      set({ messages: mockMessages.filter((m) => m.conversationId === conversationId) });
    }
  },

  toggleConversationMode: async (conversationId) => {
    if (API_ENABLED) {
      try { await conversationsApi.toggleMode(conversationId); } catch {}
    }
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, status: c.status === "bot_handling" ? "human_handling" as const : "bot_handling" as const }
          : c
      ),
    }));
  },

  setConversationStatus: (conversationId, status) => {
    set((state) => ({ conversations: state.conversations.map((c) => c.id === conversationId ? { ...c, status } : c) }));
  },

  resolveConversation: async (conversationId) => {
    if (API_ENABLED) {
      try { await conversationsApi.resolve(conversationId); } catch {}
    }
    set((state) => ({ conversations: state.conversations.map((c) => c.id === conversationId ? { ...c, status: "resolved" as const } : c) }));
  },

  addMessageToConversation: async (conversationId, content) => {
    if (API_ENABLED) {
      try { await conversationsApi.sendMessage(conversationId, content); } catch {}
    }
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const newMessage: Message = { id: crypto.randomUUID(), conversationId, agentId: conv.agentId, role: "human", content, createdAt: new Date().toISOString() };
    set((state) => ({
      messages: [...state.messages, newMessage],
      conversations: state.conversations.map((c) => c.id === conversationId ? { ...c, messageCount: c.messageCount + 1, lastMessage: content, lastMessageAt: newMessage.createdAt } : c),
    }));
  },

  addTagToConversation: (conversationId, tag) => {
    set((state) => ({ conversations: state.conversations.map((c) => c.id === conversationId && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c) }));
  },

  removeTagFromConversation: (conversationId, tag) => {
    set((state) => ({ conversations: state.conversations.map((c) => c.id === conversationId ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c) }));
  },

  // ── Conversation Tags ─────────────────────────────────────────────────────

  loadConversationTags: (agentId) => {
    set({ conversationTags: mockConversationTags.filter((t) => t.agentId === agentId) });
  },

  addConversationTag: (agentId, name, color) => {
    set((state) => ({ conversationTags: [...state.conversationTags, { id: crypto.randomUUID(), agentId, name, color }] }));
  },

  // ── CRM ───────────────────────────────────────────────────────────────────

  loadClients: async (agentId) => {
    if (API_ENABLED) {
      try {
        const clients = await crmApi.list(agentId);
        set({ clients: clients as CRMClient[] });
      } catch {
        set({ clients: mockCRMClients.filter((c) => c.agentId === agentId) });
      }
    } else {
      set({ clients: mockCRMClients.filter((c) => c.agentId === agentId) });
    }
  },

  updateClient: (id, updates) => {
    set((state) => ({ clients: state.clients.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  },

  // ── Integrations ──────────────────────────────────────────────────────────

  loadIntegrations: (agentId) => {
    set({ integrations: mockIntegrations.filter((i) => i.agentId === agentId) });
  },

  toggleIntegration: (integrationId) => {
    const { integrations } = get();
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;
    if (!integration.enabled) {
      const activeCount = integrations.filter((i) => i.enabled).length;
      if (!usePlanStore.getState().canAddIntegration(activeCount)) return;
    }
    set({ integrations: integrations.map((i) => i.id === integrationId ? { ...i, enabled: !i.enabled } : i) });
  },

  updateIntegrationConfig: (integrationId, config) => {
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === integrationId ? { ...i, ...(config.environment ? { environment: config.environment } : {}), credentials: config.credentials, configured: true } : i
      ),
    }));
  },

  // ── Reservations ──────────────────────────────────────────────────────────

  loadReservations: async (agentId) => {
    if (API_ENABLED) {
      try {
        const res = await reservationsApi.list(agentId);
        set({ reservations: res as Reservation[] });
      } catch {
        set({ reservations: mockReservations.filter((r) => r.agentId === agentId) });
      }
    } else {
      set({ reservations: mockReservations.filter((r) => r.agentId === agentId) });
    }
  },

  addReservation: async (reservationData) => {
    if (API_ENABLED) {
      const res = await reservationsApi.create(reservationData.agentId, reservationData as any);
      set((state) => ({ reservations: [...state.reservations, res as Reservation] }));
      return;
    }
    set((state) => ({ reservations: [...state.reservations, { ...reservationData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }));
  },

  updateReservation: async (id, updates) => {
    const res = get().reservations.find((r) => r.id === id);
    if (API_ENABLED && res) {
      try { await reservationsApi.update(res.agentId, id, updates as any); } catch {}
    }
    set((state) => ({ reservations: state.reservations.map((r) => r.id === id ? { ...r, ...updates } : r) }));
  },

  // ── Orders ────────────────────────────────────────────────────────────────

  loadOrders: async (agentId) => {
    if (API_ENABLED) {
      try {
        const orders = await ordersApi.list(agentId);
        set({ orders: orders as Order[] });
      } catch {
        set({ orders: mockOrders.filter((o) => o.agentId === agentId) });
      }
    } else {
      set({ orders: mockOrders.filter((o) => o.agentId === agentId) });
    }
  },

  updateOrder: (id, updates) => {
    set((state) => ({ orders: state.orders.map((o) => o.id === id ? { ...o, ...updates } : o) }));
  },

  // ── Menu ──────────────────────────────────────────────────────────────────

  loadMenuItems: async (agentId) => {
    if (API_ENABLED) {
      try {
        const items = await menuApi.list(agentId);
        set({ menuItems: items as MenuItem[] });
      } catch {
        set({ menuItems: mockMenuItems.filter((m) => m.agentId === agentId) });
      }
    } else {
      set({ menuItems: mockMenuItems.filter((m) => m.agentId === agentId) });
    }
  },

  addMenuItem: async (itemData) => {
    if (API_ENABLED) {
      const item = await menuApi.create(itemData.agentId, itemData as any);
      set((state) => ({ menuItems: [...state.menuItems, item as MenuItem] }));
      return;
    }
    set((state) => ({ menuItems: [...state.menuItems, { ...itemData, id: crypto.randomUUID() }] }));
  },

  updateMenuItem: async (id, updates) => {
    const item = get().menuItems.find((m) => m.id === id);
    if (API_ENABLED && item) {
      await menuApi.update(item.agentId, id, updates as any);
    }
    set((state) => ({ menuItems: state.menuItems.map((m) => m.id === id ? { ...m, ...updates } : m) }));
  },

  deleteMenuItem: async (id) => {
    const item = get().menuItems.find((m) => m.id === id);
    if (API_ENABLED && item) {
      await menuApi.delete(item.agentId, id);
    }
    set((state) => ({ menuItems: state.menuItems.filter((m) => m.id !== id) }));
  },

  // ── Training Chat ─────────────────────────────────────────────────────────

  addTrainingMessage: (agentId, content, toolType, attachmentName) => {
    const userMsg: TrainingMessage = { id: crypto.randomUUID(), agentId, role: "user", content, toolType, attachmentName };
    set((state) => ({ trainingMessages: [...state.trainingMessages, userMsg] }));
    const responseKey = toolType && mockTrainingResponses[toolType] ? toolType : "general";
    const responses = mockTrainingResponses[responseKey];
    const response = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => {
      const agentMsg: TrainingMessage = { id: crypto.randomUUID(), agentId, role: "agent", content: response, toolType, knowledgeSaved: true };
      set((state) => ({ trainingMessages: [...state.trainingMessages, agentMsg] }));
    }, 1500);
  },

  clearTrainingMessages: (agentId) => {
    set((state) => ({ trainingMessages: state.trainingMessages.filter((m) => m.agentId !== agentId) }));
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  loadStats: () => {
    const { agents } = get();
    set({ stats: { ...mockDashboardStats, totalAgents: agents.length, activeAgents: agents.filter((a) => a.status === "active").length } });
  },
}));
