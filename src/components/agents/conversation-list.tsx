"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Bot,
  Shield,
  Send,
  CheckCircle2,
  User,
  Tag,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Conversation, Message, ConversationStatus } from "@/lib/mock-data";

function formatTime(dateStr: string, t: { today: string; yesterday: string }) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (days === 0) return time;
  if (days === 1) return t.yesterday;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const initialsColors = [
  "from-orange-400 to-orange-500",
  "from-violet-400 to-violet-500",
  "from-emerald-400 to-emerald-500",
  "from-amber-400 to-amber-500",
  "from-rose-400 to-rose-500",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return initialsColors[Math.abs(hash) % initialsColors.length];
}

function StatusBadge({ status, t }: { status: ConversationStatus; t: ReturnType<typeof useLocaleStore.getState>["t"] }) {
  const config = {
    bot_handling: { label: t.conversations.botHandling, icon: "🤖", bg: "bg-orange-100 text-orange-700" },
    human_handling: { label: t.conversations.humanHandling, icon: "👤", bg: "bg-amber-100 text-amber-700" },
    resolved: { label: t.conversations.resolved, icon: "✓", bg: "bg-green-100 text-green-700" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

type StatusFilter = "all" | ConversationStatus;

export function ConversationList({ agentId }: { agentId: string }) {
  const {
    conversations,
    messages,
    conversationTags,
    loadConversations,
    loadMessages,
    loadConversationTags,
  } = useAgentStore();
  const { t } = useLocaleStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    loadConversations(agentId);
    loadConversationTags(agentId);
  }, [agentId, loadConversations, loadConversationTags]);

  const filtered = useMemo(() => {
    let result = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.contactName.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [conversations, search, statusFilter]);

  const selected = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.conversations.filterAll },
    { key: "bot_handling", label: t.conversations.filterBot },
    { key: "human_handling", label: t.conversations.filterHuman },
    { key: "resolved", label: t.conversations.filterResolved },
  ];

  const humanCount = conversations.filter((c) => c.status === "human_handling").length;

  const countFor = (key: StatusFilter) => {
    if (key === "all") return conversations.length;
    return conversations.filter((c) => c.status === key).length;
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Conversation list */}
      <div
        className={`w-full flex-shrink-0 flex flex-col border-r border-border md:w-[340px] ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Needs attention banner */}
        {humanCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shrink-0">
              {humanCount}
            </span>
            <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
              {humanCount === 1 ? "1 conversación necesita tu atención" : `${humanCount} conversaciones necesitan tu atención`}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.conversations.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-muted/60 py-2 pl-9 pr-3 text-base outline-none placeholder:text-muted-foreground focus:bg-muted focus:ring-2 focus:ring-orange-500/20 transition-all text-foreground"
            />
          </div>
          {/* Status filter tabs */}
          <div className="flex gap-1">
            {filterButtons.map((fb) => {
              const count = countFor(fb.key);
              const isHumanTab = fb.key === "human_handling";
              return (
                <button
                  key={fb.key}
                  onClick={() => setStatusFilter(fb.key)}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
                    statusFilter === fb.key
                      ? isHumanTab && humanCount > 0
                        ? "bg-amber-500 text-white"
                        : "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{fb.label}</span>
                  {count > 0 && (
                    <span className={`rounded-full px-1 text-[9px] font-bold leading-none py-0.5 ${
                      statusFilter === fb.key ? "bg-white/25 text-white" : isHumanTab && humanCount > 0 ? "bg-amber-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="chat-messages-bg flex-1 overflow-y-auto relative">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-[14px] text-muted-foreground">{t.conversations.noConversations}</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onClick={() => setSelectedId(conv.id)}
                tags={conversationTags}
                t={t}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat view */}
      <div
        className={`flex-1 flex flex-col ${
          selectedId ? "flex" : "hidden md:flex"
        }`}
      >
        {selected ? (
          <ChatView
            conversation={selected}
            messages={messages}
            onBack={() => setSelectedId(null)}
            t={t}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="text-[14px] text-gray-400">{t.conversations.selectConversation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onClick,
  tags,
  t,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  tags: import("@/lib/mock-data").ConversationTag[];
  t: ReturnType<typeof useLocaleStore.getState>["t"];
}) {
  const isNeedsHuman = conversation.status === "human_handling";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-orange-50/60 dark:bg-orange-500/10" : isNeedsHuman ? "bg-amber-50/60 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10" : "hover:bg-muted/50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(
          conversation.contactName
        )} shadow-sm`}
      >
        <span className="text-[13px] font-semibold text-white">
          {getInitials(conversation.contactName)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[15px] font-semibold truncate text-foreground">{conversation.contactName}</span>
            <StatusBadge status={conversation.status} t={t} />
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatTime(conversation.lastMessageAt, t.conversations)}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">{conversation.lastMessage || "..."}</p>
        {conversation.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {conversation.tags.map((tagName) => {
              const tagDef = tags.find((tg) => tg.name === tagName);
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                  style={{ backgroundColor: tagDef?.color || "#6b7280" }}
                >
                  {tagName}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}

function ChatView({
  conversation,
  messages,
  onBack,
  t,
}: {
  conversation: Conversation;
  messages: Message[];
  onBack: () => void;
  t: ReturnType<typeof useLocaleStore.getState>["t"];
}) {
  const {
    setConversationStatus,
    addTagToConversation,
    removeTagFromConversation,
    conversationTags,
  } = useAgentStore();
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isHuman = conversation.status === "human_handling";
  const isResolved = conversation.status === "resolved";

  return (
    <>
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(
              conversation.contactName
            )}`}
          >
            <span className="text-[12px] font-semibold text-white">
              {getInitials(conversation.contactName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold leading-tight">{conversation.contactName}</h3>
            <p className="text-[12px] text-gray-400">{conversation.contactPhone}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Bot / Human iOS toggle */}
            <div className="flex items-center gap-1.5">
              <Bot className={`h-4 w-4 transition-colors ${!isHuman && !isResolved ? "text-orange-500" : "text-gray-300"}`} />
              <button
                onClick={() =>
                  setConversationStatus(
                    conversation.id,
                    isHuman ? "bot_handling" : "human_handling"
                  )
                }
                className={`relative h-[28px] w-[50px] rounded-full transition-colors duration-300 ${
                  isHuman ? "bg-amber-400" : "bg-orange-500"
                }`}
              >
                <span
                  className="absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    transform: isHuman ? "translateX(22px)" : "translateX(0px)",
                  }}
                />
              </button>
              <User className={`h-4 w-4 transition-colors ${isHuman ? "text-amber-500" : "text-gray-300"}`} />
            </div>
            {/* Resolve button */}
            <button
              onClick={() =>
                setConversationStatus(
                  conversation.id,
                  isResolved ? "bot_handling" : "resolved"
                )
              }
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                isResolved
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.conversations.resolved}</span>
            </button>
          </div>
        </div>
        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap pl-0 md:pl-12">
          {conversation.tags.map((tagName) => {
            const tagDef = conversationTags.find((tg) => tg.name === tagName);
            return (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: tagDef?.color || "#6b7280" }}
              >
                {tagName}
                <button
                  onClick={() => removeTagFromConversation(conversation.id, tagName)}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <div className="relative">
              <button
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {t.conversations.addTag}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showTagDropdown && (
                <TagDropdown
                  conversationId={conversation.id}
                  currentTags={conversation.tags}
                  onClose={() => setShowTagDropdown(false)}
                  t={t}
                />
              )}
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-bg flex-1 overflow-y-auto px-4 py-4 space-y-3 relative">
        {/* Fondo con mini-iconos sutiles — igual que Lisa chat */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.045] dark:opacity-[0.035] select-none">
          {[
            { top: "4%",  left: "8%",  size: 28, rotate: 15,  icon: "bot" },
            { top: "4%",  left: "55%", size: 22, rotate: -8,  icon: "brain" },
            { top: "4%",  left: "82%", size: 26, rotate: 20,  icon: "bot" },
            { top: "13%", left: "28%", size: 20, rotate: -12, icon: "brain" },
            { top: "13%", left: "70%", size: 24, rotate: 5,   icon: "bot" },
            { top: "22%", left: "5%",  size: 24, rotate: -5,  icon: "brain" },
            { top: "22%", left: "45%", size: 26, rotate: 18,  icon: "bot" },
            { top: "22%", left: "88%", size: 20, rotate: -15, icon: "brain" },
            { top: "31%", left: "18%", size: 22, rotate: 10,  icon: "bot" },
            { top: "31%", left: "62%", size: 28, rotate: -20, icon: "brain" },
            { top: "40%", left: "35%", size: 24, rotate: 8,   icon: "bot" },
            { top: "40%", left: "78%", size: 22, rotate: -6,  icon: "brain" },
            { top: "49%", left: "12%", size: 26, rotate: -14, icon: "brain" },
            { top: "49%", left: "52%", size: 20, rotate: 12,  icon: "bot" },
            { top: "49%", left: "90%", size: 24, rotate: 3,   icon: "bot" },
            { top: "58%", left: "25%", size: 22, rotate: -9,  icon: "brain" },
            { top: "58%", left: "68%", size: 26, rotate: 16,  icon: "bot" },
            { top: "67%", left: "5%",  size: 20, rotate: 7,   icon: "bot" },
            { top: "67%", left: "42%", size: 24, rotate: -18, icon: "brain" },
            { top: "67%", left: "82%", size: 22, rotate: 11,  icon: "bot" },
            { top: "76%", left: "18%", size: 26, rotate: -4,  icon: "brain" },
            { top: "76%", left: "60%", size: 20, rotate: 14,  icon: "bot" },
            { top: "85%", left: "32%", size: 24, rotate: -11, icon: "brain" },
            { top: "85%", left: "75%", size: 22, rotate: 6,   icon: "bot" },
            { top: "93%", left: "10%", size: 20, rotate: -16, icon: "brain" },
            { top: "93%", left: "50%", size: 26, rotate: 9,   icon: "brain" },
            { top: "93%", left: "88%", size: 22, rotate: -3,  icon: "bot" },
          ].map((item, i) =>
            item.icon === "bot" ? (
              <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute text-foreground"
                style={{ top: item.top, left: item.left, width: item.size, height: item.size, transform: `rotate(${item.rotate}deg)` }}>
                <path d="M12 8V4H8" /><path d="M12 8V4h4" />
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <circle cx="9" cy="13" r="1.5" /><circle cx="15" cy="13" r="1.5" />
                <path d="M6 17h4" /><path d="M14 17h4" />
              </svg>
            ) : (
              <svg key={i} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute text-foreground"
                style={{ top: item.top, left: item.left, width: item.size, height: item.size, transform: `rotate(${item.rotate}deg)` }}>
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                <path d="M6 18a4 4 0 0 1-1.967-.516" />
                <path d="M19.967 17.484A4 4 0 0 1 18 18" />
              </svg>
            )
          )}
        </div>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} t={t} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input — only in human mode */}
      {isHuman && <MessageInput conversationId={conversation.id} t={t} />}
    </>
  );
}

function TagDropdown({
  conversationId,
  currentTags,
  onClose,
  t,
}: {
  conversationId: string;
  currentTags: string[];
  onClose: () => void;
  t: ReturnType<typeof useLocaleStore.getState>["t"];
}) {
  const { conversationTags, addTagToConversation, removeTagFromConversation, addConversationTag } =
    useAgentStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const agentTags = conversationTags;
  const presetColors = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#6b7280"];

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl bg-white shadow-lg ring-1 ring-black/[0.08] py-1"
    >
      {agentTags.map((tag) => {
        const active = currentTags.includes(tag.name);
        return (
          <button
            key={tag.id}
            onClick={() => {
              if (active) removeTagFromConversation(conversationId, tag.name);
              else addTagToConversation(conversationId, tag.name);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-gray-50 transition-colors"
          >
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <span className="flex-1 text-left">{tag.name}</span>
            {active && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />}
          </button>
        );
      })}
      <div className="border-t border-gray-100 mt-1 pt-1">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-gray-500 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.conversations.createTag}
          </button>
        ) : (
          <div className="px-3 py-2 space-y-2">
            <input
              type="text"
              placeholder={t.conversations.tagName}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-orange-500/20"
              autoFocus
            />
            <div className="flex gap-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-5 w-5 rounded-full transition-all ${
                    newColor === c ? "ring-2 ring-offset-1 ring-orange-500" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                if (newName.trim()) {
                  const agentId = conversationTags[0]?.agentId;
                  if (agentId) {
                    addConversationTag(agentId, newName.trim(), newColor);
                    addTagToConversation(conversationId, newName.trim());
                  }
                  setNewName("");
                  setCreating(false);
                }
              }}
              className="w-full rounded-lg bg-orange-500 px-2 py-1 text-[12px] font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {t.conversations.createTag}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageInput({
  conversationId,
  t,
}: {
  conversationId: string;
  t: ReturnType<typeof useLocaleStore.getState>["t"];
}) {
  const [text, setText] = useState("");
  const { addMessageToConversation } = useAgentStore();

  const handleSend = () => {
    if (!text.trim()) return;
    addMessageToConversation(conversationId, text.trim());
    setText("");
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t.conversations.writeMessage}
          className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-base outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  t,
}: {
  message: Message;
  t: ReturnType<typeof useLocaleStore.getState>["t"];
}) {
  const isAgent = message.role === "assistant";
  const isHuman = message.role === "human";
  const isRight = isAgent || isHuman;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let bubbleClass: string;
  if (isAgent) {
    bubbleClass = "bg-orange-500 text-white rounded-br-md";
  } else if (isHuman) {
    bubbleClass = "bg-emerald-500 text-white rounded-br-md";
  } else {
    bubbleClass = "bg-gray-100 text-gray-900 rounded-bl-md";
  }

  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${bubbleClass}`}>
        {isAgent && (
          <div className="flex items-center gap-1 mb-1">
            <Bot className="h-3 w-3 opacity-70" />
            <span className="text-[10px] font-medium opacity-70">Bot</span>
          </div>
        )}
        {isHuman && (
          <div className="flex items-center gap-1 mb-1">
            <User className="h-3 w-3 opacity-70" />
            <span className="text-[10px] font-medium opacity-70">{t.conversations.you}</span>
          </div>
        )}
        <p className="text-[14px] leading-relaxed">{message.content}</p>
        <div
          className={`flex items-center gap-2 mt-1.5 ${
            isRight ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[10px] ${isRight ? "text-white/60" : "text-gray-400"}`}
          >
            {time}
          </span>
          {isAgent && message.confidence != null && (
            <span
              className={`flex items-center gap-0.5 text-[10px] font-medium ${
                message.confidence >= 0.9
                  ? "text-emerald-200"
                  : message.confidence >= 0.7
                  ? "text-amber-200"
                  : "text-red-200"
              }`}
            >
              <Shield className="h-2.5 w-2.5" />
              {Math.round(message.confidence * 100)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
