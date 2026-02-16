import { create } from "zustand";
import {
  type Agent,
  type FAQ,
  type HotelContact,
  type DashboardStats,
  type WeeklyMessageData,
  mockAgents,
  mockFaqs,
  mockContacts,
  mockDashboardStats,
  mockWeeklyMessages,
} from "@/lib/mock-data";
import { sendWebhook } from "@/lib/webhook";

interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  faqs: FAQ[];
  contacts: HotelContact[];
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

  // Stats
  loadStats: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: mockAgents,
  currentAgent: null,
  faqs: [],
  contacts: [],
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
