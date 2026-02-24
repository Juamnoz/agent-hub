"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Search, Trash2, Clock } from "lucide-react";
import { useChatHistoryStore, type ChatSession } from "@/stores/chat-history-store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Hoy", items: [] },
    { label: "Ayer", items: [] },
    { label: "Esta semana", items: [] },
    { label: "Más antiguas", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups[0].items.push(s);
    else if (day >= yesterday) groups[1].items.push(s);
    else if (day >= weekAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

// ─── Chat Card ────────────────────────────────────────────────────────────────

function ChatCard({
  session,
  onDelete,
}: {
  session: ChatSession;
  onDelete: () => void;
}) {
  const msgCount = session.messages.length;
  const lastMsg = session.messages[session.messages.length - 1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group relative"
    >
      <Link
        href={`/lisa?chat=${session.id}`}
        className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm dark:hover:border-orange-500/30 dark:hover:bg-orange-500/5"
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/15">
          <img src="/lisa-isologo-orange.png" alt="Lisa" className="h-6 w-6 object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold text-foreground truncate pr-8">{session.title}</p>
          {lastMsg && (
            <p className="mt-0.5 text-[14px] text-muted-foreground truncate">
              {lastMsg.role === "user" ? "Tú: " : "Lisa: "}
              {lastMsg.content}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="shrink-0 text-right flex flex-col items-end gap-1">
          <span className="text-[13px] text-muted-foreground/60">{formatDate(session.updatedAt)}</span>
          {msgCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground/50">
              <MessageSquare className="h-3 w-3" />
              {msgCount}
            </span>
          )}
        </div>
      </Link>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
        aria-label="Eliminar conversación"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const { sessions, deleteSession } = useChatHistoryStore();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    : sessions;

  const groups = groupByDate(filtered);

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Chats con Lisa</h1>
          <p className="text-[15px] text-muted-foreground mt-0.5">
            {sessions.length === 0
              ? "No tienes conversaciones aún"
              : `${sessions.length} conversación${sessions.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <Link
          href="/lisa"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva
        </Link>
      </div>

      {/* Search */}
      {sessions.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversaciones…"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-[15px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors"
          />
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5">
            <img
              src="/lisa-logo-orange.png"
              alt="Lisa"
              className="h-28 w-auto object-contain drop-shadow-[0_4px_24px_rgba(249,115,22,0.35)] dark:hidden"
            />
            <img
              src="/lisa-logo-white.png"
              alt="Lisa"
              className="h-28 w-auto object-contain drop-shadow-[0_4px_24px_rgba(249,115,22,0.20)] hidden dark:block"
            />
          </div>
          <p className="text-[18px] font-semibold text-foreground">Aún no hay conversaciones</p>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xs leading-relaxed">
            Empieza una conversación con Lisa y aparecerá aquí para que puedas revisarla más tarde.
          </p>
          <Link
            href="/lisa"
            className="mt-6 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-[15px] font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Comenzar una conversación
          </Link>
        </div>
      )}

      {/* No search results */}
      {sessions.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[16px] font-medium text-foreground">Sin resultados</p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            No hay conversaciones que coincidan con "{search}"
          </p>
        </div>
      )}

      {/* Chat list */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                <p className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.label}
                </p>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {group.items.map((session) => (
                    <ChatCard
                      key={session.id}
                      session={session}
                      onDelete={() => deleteSession(session.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
