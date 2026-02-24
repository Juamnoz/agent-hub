import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryStore {
  sessions: ChatSession[];
  createSession: (firstMessage: string) => string;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  deleteSession: (sessionId: string) => void;
}

export const useChatHistoryStore = create<ChatHistoryStore>()(
  persist(
    (set) => ({
      sessions: [],

      createSession: (firstMessage) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const title =
          firstMessage.length > 55
            ? firstMessage.slice(0, 55) + "…"
            : firstMessage;
        const session: ChatSession = {
          id,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return id;
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
      },
    }),
    { name: "lisa-chat-history" }
  )
);
