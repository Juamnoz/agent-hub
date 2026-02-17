import { create } from "zustand";
import {
  type Agent,
  type FAQ,
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
  mockAgents,
  mockFaqs,
  mockContacts,
  mockConversations,
  mockMessages,
  mockConversationTags,
  mockCRMClients,
  mockDashboardStats,
  mockWeeklyMessages,
  mockIntegrations,
  mockTrainingResponses,
  PLAN_INTEGRATION_LIMITS,
  CURRENT_PLAN,
} from "@/lib/mock-data";
import { sendWebhook } from "@/lib/webhook";

interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  faqs: FAQ[];
  contacts: HotelContact[];
  conversations: Conversation[];
  messages: Message[];
  conversationTags: ConversationTag[];
  clients: CRMClient[];
  integrations: Integration[];
  stats: DashboardStats;
  weeklyMessages: WeeklyMessageData[];

  // Agent CRUD
  setCurrentAgent: (agent: Agent | null) => void;
  addAgent: (
    agent: Omit<
      Agent,
      "id" | "userId" | "createdAt" | "updatedAt" | "messageCount" | "faqCount"
    >
  ) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;

  // FAQ CRUD
  loadFaqs: (agentId: string) => void;
  addFaq: (faq: Omit<FAQ, "id" | "sortOrder">) => void;
  updateFaq: (id: string, updates: Partial<FAQ>) => void;
  deleteFaq: (id: string) => void;

  // Contact CRUD
  loadContacts: (agentId: string) => void;
  addContact: (contact: Omit<HotelContact, "id">) => void;
  updateContact: (id: string, updates: Partial<HotelContact>) => void;
  deleteContact: (id: string) => void;

  // Conversations
  loadConversations: (agentId: string) => void;
  loadMessages: (conversationId: string) => void;
  toggleConversationMode: (conversationId: string) => void;
  setConversationStatus: (conversationId: string, status: import("@/lib/mock-data").ConversationStatus) => void;
  resolveConversation: (conversationId: string) => void;
  addMessageToConversation: (conversationId: string, content: string) => void;
  addTagToConversation: (conversationId: string, tag: string) => void;
  removeTagFromConversation: (conversationId: string, tag: string) => void;

  // Conversation Tags
  loadConversationTags: (agentId: string) => void;
  addConversationTag: (agentId: string, name: string, color: string) => void;

  // CRM Clients
  loadClients: (agentId: string) => void;
  updateClient: (id: string, updates: Partial<CRMClient>) => void;

  // Integrations
  loadIntegrations: (agentId: string) => void;
  toggleIntegration: (integrationId: string) => void;
  updateIntegrationConfig: (integrationId: string, config: {
    environment?: "sandbox" | "production";
    credentials: Record<string, string>;
  }) => void;

  // Training Chat
  trainingMessages: TrainingMessage[];
  addTrainingMessage: (agentId: string, content: string, toolType?: TrainingToolType, attachmentName?: string) => void;
  clearTrainingMessages: (agentId: string) => void;

  // Stats
  loadStats: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: mockAgents,
  currentAgent: null,
  faqs: [],
  contacts: [],
  conversations: [],
  messages: [],
  conversationTags: [],
  clients: [],
  integrations: [],
  trainingMessages: [],
  stats: mockDashboardStats,
  weeklyMessages: mockWeeklyMessages,

  // -----------------------------------------------------------------------
  // Agent CRUD
  // -----------------------------------------------------------------------

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  addAgent: (agentData) => {
    const now = new Date().toISOString();
    const newAgent: Agent = {
      ...agentData,
      id: crypto.randomUUID(),
      userId: "user-001",
      messageCount: 0,
      faqCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ agents: [...state.agents, newAgent] }));
    sendWebhook("agent.created", { agent: newAgent });
  },

  updateAgent: (id, updates) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id
          ? { ...agent, ...updates, updatedAt: new Date().toISOString() }
          : agent
      ),
      currentAgent:
        state.currentAgent?.id === id
          ? {
              ...state.currentAgent,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : state.currentAgent,
    }));
    const updatedAgent = get().agents.find((a) => a.id === id);
    sendWebhook("agent.updated", { agent: updatedAgent, updates });
  },

  deleteAgent: (id) => {
    const deletedAgent = get().agents.find((a) => a.id === id);
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      currentAgent:
        state.currentAgent?.id === id ? null : state.currentAgent,
      faqs:
        state.currentAgent?.id === id
          ? []
          : state.faqs.filter((faq) => faq.agentId !== id),
      contacts: state.contacts.filter((c) => c.agentId !== id),
    }));
    sendWebhook("agent.deleted", { agent: deletedAgent });
  },

  // -----------------------------------------------------------------------
  // FAQ CRUD
  // -----------------------------------------------------------------------

  loadFaqs: (agentId) => {
    const faqs = mockFaqs.filter((faq) => faq.agentId === agentId);
    set({ faqs });
  },

  addFaq: (faqData) => {
    const { faqs } = get();
    const maxOrder = faqs.reduce(
      (max, faq) => Math.max(max, faq.sortOrder),
      0
    );
    const newFaq: FAQ = {
      ...faqData,
      id: crypto.randomUUID(),
      sortOrder: maxOrder + 1,
    };
    set((state) => ({
      faqs: [...state.faqs, newFaq],
      agents: state.agents.map((agent) =>
        agent.id === faqData.agentId
          ? { ...agent, faqCount: agent.faqCount + 1 }
          : agent
      ),
    }));
    sendWebhook("faq.created", { faq: newFaq });
  },

  updateFaq: (id, updates) => {
    set((state) => ({
      faqs: state.faqs.map((faq) =>
        faq.id === id ? { ...faq, ...updates } : faq
      ),
    }));
    const updatedFaq = get().faqs.find((f) => f.id === id);
    sendWebhook("faq.updated", { faq: updatedFaq, updates });
  },

  deleteFaq: (id) => {
    const faqToDelete = get().faqs.find((faq) => faq.id === id);
    set((state) => ({
      faqs: state.faqs.filter((faq) => faq.id !== id),
      agents: faqToDelete
        ? state.agents.map((agent) =>
            agent.id === faqToDelete.agentId
              ? { ...agent, faqCount: Math.max(0, agent.faqCount - 1) }
              : agent
          )
        : state.agents,
    }));
    sendWebhook("faq.deleted", { faq: faqToDelete });
  },

  // -----------------------------------------------------------------------
  // Contact CRUD
  // -----------------------------------------------------------------------

  loadContacts: (agentId) => {
    const contacts = mockContacts.filter((c) => c.agentId === agentId);
    set({ contacts });
  },

  addContact: (contactData) => {
    const newContact: HotelContact = {
      ...contactData,
      id: crypto.randomUUID(),
    };
    set((state) => ({ contacts: [...state.contacts, newContact] }));
    sendWebhook("settings.updated", { action: "contact.created", contact: newContact });
  },

  updateContact: (id, updates) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    const updated = get().contacts.find((c) => c.id === id);
    sendWebhook("settings.updated", { action: "contact.updated", contact: updated, updates });
  },

  deleteContact: (id) => {
    const toDelete = get().contacts.find((c) => c.id === id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));
    sendWebhook("settings.updated", { action: "contact.deleted", contact: toDelete });
  },

  // -----------------------------------------------------------------------
  // Conversations
  // -----------------------------------------------------------------------

  loadConversations: (agentId) => {
    const conversations = mockConversations.filter((c) => c.agentId === agentId);
    set({ conversations });
  },

  loadMessages: (conversationId) => {
    const messages = mockMessages.filter((m) => m.conversationId === conversationId);
    set({ messages });
  },

  toggleConversationMode: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              status: c.status === "bot_handling" ? "human_handling" as const : "bot_handling" as const,
            }
          : c
      ),
    }));
  },

  setConversationStatus: (conversationId, status) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, status } : c
      ),
    }));
  },

  resolveConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, status: "resolved" as const } : c
      ),
    }));
  },

  addMessageToConversation: (conversationId, content) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      agentId: conv.agentId,
      role: "human",
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messageCount: c.messageCount + 1,
              lastMessage: content,
              lastMessageAt: newMessage.createdAt,
            }
          : c
      ),
    }));
  },

  addTagToConversation: (conversationId, tag) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId && !c.tags.includes(tag)
          ? { ...c, tags: [...c.tags, tag] }
          : c
      ),
    }));
  },

  removeTagFromConversation: (conversationId, tag) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, tags: c.tags.filter((t) => t !== tag) }
          : c
      ),
    }));
  },

  // -----------------------------------------------------------------------
  // Conversation Tags
  // -----------------------------------------------------------------------

  loadConversationTags: (agentId) => {
    const tags = mockConversationTags.filter((t) => t.agentId === agentId);
    set({ conversationTags: tags });
  },

  addConversationTag: (agentId, name, color) => {
    const newTag: ConversationTag = {
      id: crypto.randomUUID(),
      agentId,
      name,
      color,
    };
    set((state) => ({
      conversationTags: [...state.conversationTags, newTag],
    }));
  },

  // -----------------------------------------------------------------------
  // CRM Clients
  // -----------------------------------------------------------------------

  loadClients: (agentId) => {
    const clients = mockCRMClients.filter((c) => c.agentId === agentId);
    set({ clients });
  },

  updateClient: (id, updates) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  // -----------------------------------------------------------------------
  // Integrations
  // -----------------------------------------------------------------------

  loadIntegrations: (agentId) => {
    const integrations = mockIntegrations.filter((i) => i.agentId === agentId);
    set({ integrations });
  },

  toggleIntegration: (integrationId) => {
    const { integrations } = get();
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    // If enabling, check plan limit
    if (!integration.enabled) {
      const activeCount = integrations.filter((i) => i.enabled).length;
      const limit = PLAN_INTEGRATION_LIMITS[CURRENT_PLAN];
      if (activeCount >= limit) return;
    }

    set({
      integrations: integrations.map((i) =>
        i.id === integrationId ? { ...i, enabled: !i.enabled } : i
      ),
    });
  },

  updateIntegrationConfig: (integrationId, config) => {
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === integrationId
          ? { ...i, ...(config.environment ? { environment: config.environment } : {}), credentials: config.credentials, configured: true }
          : i
      ),
    }));
  },

  // -----------------------------------------------------------------------
  // Training Chat
  // -----------------------------------------------------------------------

  addTrainingMessage: (agentId, content, toolType, attachmentName) => {
    const userMsg: TrainingMessage = {
      id: crypto.randomUUID(),
      agentId,
      role: "user",
      content,
      toolType,
      attachmentName,
    };
    set((state) => ({
      trainingMessages: [...state.trainingMessages, userMsg],
    }));

    // Simulate agent response after delay
    const responseKey = toolType && mockTrainingResponses[toolType] ? toolType : "general";
    const responses = mockTrainingResponses[responseKey];
    const response = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
      const agentMsg: TrainingMessage = {
        id: crypto.randomUUID(),
        agentId,
        role: "agent",
        content: response,
        toolType,
        knowledgeSaved: true,
      };
      set((state) => ({
        trainingMessages: [...state.trainingMessages, agentMsg],
      }));
    }, 1500);
  },

  clearTrainingMessages: (agentId) => {
    set((state) => ({
      trainingMessages: state.trainingMessages.filter((m) => m.agentId !== agentId),
    }));
  },

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  loadStats: () => {
    const { agents } = get();
    set({
      stats: {
        ...mockDashboardStats,
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status === "active").length,
      },
    });
  },
}));
