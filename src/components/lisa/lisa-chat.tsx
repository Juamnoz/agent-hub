"use client";

import { useState, useRef, useEffect, useCallback, type ComponentType } from "react";
import {
  Plus,
  Paperclip,
  DollarSign,
  Clock,
  UtensilsCrossed,
  HelpCircle,
  Table2,
  Send,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Check,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Agent, TrainingMessage, TrainingToolType } from "@/lib/mock-data";

// ─── Response bank ─────────────────────────────────────────────────────────────

const COPILOT_RESPONSES: Record<string, string> = {
  metrics:
    "Esta semana tus 2 agentes activos respondieron 187 mensajes en total (+22% vs semana pasada). Playa Azul lidera con 1,247 mensajes acumulados y tiempo de respuesta de 4.2s. Sierra Nevada tiene 834 mensajes. ¿Quieres ver detalles de alguno?",
  improve:
    "Encontré 2 oportunidades de mejora:\n\n1. Playa Azul tiene solo 8 FAQs — los agentes similares tienen 30+. Te recomiendo agregar preguntas sobre check-in, wifi y desayuno.\n\n2. Sierra Nevada no tiene WhatsApp conectado, lo que limita su alcance.\n\n¿Por cuál empezamos?",
  create:
    "¡Claro! Para crear un nuevo agente necesito saber: ¿qué tipo de negocio es? Hotel, restaurante, tienda online, consultorio...",
  status:
    "Estado actual de tus agentes:\n\n🟢 Playa Azul Assistant — Activo, WhatsApp conectado, 8 FAQs\n🟢 Sierra Nevada Concierge — Activo, WhatsApp desconectado, 6 FAQs\n\nAmbos responden en menos de 5 segundos. Tu plan Pro permite hasta 3 agentes.",
  faqs:
    "Para agregar FAQs efectivas te recomiendo incluir: preguntas de horario, precios, ubicación, proceso de compra/reserva y políticas de cancelación. ¿A qué agente le agregamos FAQs?",
  prices:
    "¡Perfecto! Puedo ayudarte a actualizar la lista de precios. ¿Tienes los precios en un archivo CSV o prefieres dictarlos aquí? También puedo importarlos desde Google Sheets.",
  schedule:
    "Vamos a actualizar los horarios. ¿Cuáles son los días y horarios de atención? También puedo importarlos si los tienes en un archivo.",
  sheets:
    "¡Excelente! Para importar desde Google Sheets necesito el link público de tu hoja. Asegúrate de que esté configurada como compartida con cualquier persona.",
  default:
    "Entendido. Soy tu copiloto de IA — puedo ayudarte con métricas de tus agentes, sugerirte mejoras, configurar integraciones o crear nuevos agentes. ¿Qué necesitas?",
};

function getCopilotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("métrica") || lower.includes("estadística") || lower.includes("cómo van") || lower.includes("como van") || lower.includes("semana")) return COPILOT_RESPONSES.metrics;
  if (lower.includes("mejorar") || lower.includes("suger") || lower.includes("qué debo") || lower.includes("que debo") || lower.includes("oportunidad")) return COPILOT_RESPONSES.improve;
  if (lower.includes("crear") || lower.includes("nuevo agente")) return COPILOT_RESPONSES.create;
  if (lower.includes("estado") || lower.includes("activo") || lower.includes("status") || lower.includes("mis agentes")) return COPILOT_RESPONSES.status;
  if (lower.includes("faq") || lower.includes("pregunta") || lower.includes("respuesta")) return COPILOT_RESPONSES.faqs;
  if (lower.includes("precio") || lower.includes("tarifa") || lower.includes("costo")) return COPILOT_RESPONSES.prices;
  if (lower.includes("horario") || lower.includes("turno") || lower.includes("disponib")) return COPILOT_RESPONSES.schedule;
  if (lower.includes("sheets") || lower.includes("excel") || lower.includes("hoja")) return COPILOT_RESPONSES.sheets;
  return COPILOT_RESPONSES.default;
}

// ─── Attachment options ────────────────────────────────────────────────────────

const ATTACHMENT_OPTIONS: {
  type: TrainingToolType;
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
}[] = [
  { type: "file",     icon: Paperclip,      label: "Subir archivo",        description: "PDF, Word, imagen…" },
  { type: "faq",      icon: HelpCircle,     label: "Preguntas frecuentes", description: "FAQs del negocio" },
  { type: "prices",   icon: DollarSign,     label: "Lista de precios",     description: "Tarifas y costos" },
  { type: "schedule", icon: Clock,          label: "Horarios",             description: "Disponibilidad y turnos" },
  { type: "menu",     icon: UtensilsCrossed,label: "Menú o catálogo",      description: "Carta o productos" },
  { type: "sheets",   icon: Table2,         label: "Google Sheets",        description: "Importar hoja de cálculo" },
];

const STATUS_DOT: Record<string, string> = {
  active:   "bg-emerald-500",
  inactive: "bg-gray-400",
  setup:    "bg-amber-500",
};

// ─── Attachment Menu ───────────────────────────────────────────────────────────

function AttachmentMenu({ onSelect }: { onSelect: (type: TrainingToolType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 460, damping: 28, mass: 0.5 }}
      className="absolute bottom-full left-0 mb-2 w-[236px] overflow-hidden rounded-2xl bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.14)] ring-1 ring-border backdrop-blur-sm z-50"
    >
      {ATTACHMENT_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.type}
            onClick={() => onSelect(opt.type)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/80 active:bg-muted"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div>
              <p className="text-[15px] font-medium leading-tight">{opt.label}</p>
              <p className="text-[13px] text-muted-foreground">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Agent Selector (Claude model selector style) ──────────────────────────────

function AgentSelector({
  agents,
  selectedAgentId,
  onSelect,
}: {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = agents.find((a) => a.id === selectedAgentId);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-muted active:bg-muted/70"
      >
        <span className="max-w-[110px] truncate">{selected?.name ?? "Todos"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 28, mass: 0.5 }}
            className="absolute bottom-full left-0 mb-2 w-[272px] max-h-[340px] overflow-y-auto rounded-2xl bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.14)] ring-1 ring-border backdrop-blur-sm z-50"
          >
            {/* All agents */}
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/80 ${selectedAgentId === null ? "bg-orange-50 dark:bg-orange-500/10" : ""}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm overflow-hidden">
                <img src="/lisa-isologo-white.png" alt="Lisa" className="h-5 w-5 object-contain" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-semibold">Todos los agentes</p>
                <p className="text-[13px] text-muted-foreground">Vista general del negocio</p>
              </div>
              {selectedAgentId === null && <Check className="h-4 w-4 shrink-0 text-orange-500" />}
            </button>

            {agents.length > 0 && <div className="mx-4 h-px bg-border" />}

            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { onSelect(a.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/80 ${selectedAgentId === a.id ? "bg-orange-50 dark:bg-orange-500/10" : ""}`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm">
                    {a.avatar ? (
                      <img src={a.avatar} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-700 dark:bg-neutral-600">
                        <Bot className="h-4 w-4 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${STATUS_DOT[a.status] ?? "bg-gray-400"}`}
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-semibold truncate">{a.name}</p>
                  <p className="text-[13px] text-muted-foreground truncate">{a.hotelName}</p>
                </div>
                {selectedAgentId === a.id && <Check className="h-4 w-4 shrink-0 text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: TrainingMessage & { displayContent?: string } }) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-[14px] font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Conocimiento guardado
        </span>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
          {message.attachmentName && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[14px] font-medium text-orange-600">
              <Paperclip className="h-3 w-3" />
              {message.attachmentName}
            </div>
          )}
          <p className="text-[16px] text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const content = message.displayContent ?? message.content;
  return (
    <div className="flex gap-2.5 px-4 py-1">
      <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <img src="/lisa-isologo-orange.png" alt="Lisa" className="h-full w-full object-contain" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-orange-50 dark:bg-orange-500/10 px-4 py-2.5">
          <p className="text-[16px] text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {message.knowledgeSaved && content === message.content && (
          <div className="mt-1.5 flex justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-0.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Conocimiento guardado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 px-4 py-1">
      <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <img src="/lisa-isologo-orange.png" alt="Lisa" className="h-full w-full object-contain" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Welcome Screen (Claude-style) ────────────────────────────────────────────

const SUGGESTIONS = [
  { key: "metrics", label: "¿Cómo van mis agentes?" },
  { key: "improve", label: "¿Qué debo mejorar?" },
  { key: "status",  label: "Ver estado general" },
  { key: "create",  label: "Crear un agente" },
];

function WelcomeScreen({
  userName,
  agents,
  selectedAgentId,
  onAgentSelect,
  onSuggestion,
}: {
  userName: string;
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (id: string | null) => void;
  onSuggestion: (text: string, key: string) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
      {/* Logo — Lisa wordmark naranja transparente */}
      <motion.div
        className="mb-4"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
      >
        <img
          src="/lisa-logo-orange.png"
          alt="Lisa"
          className="h-40 w-auto object-contain drop-shadow-[0_4px_24px_rgba(249,115,22,0.35)]"
        />
      </motion.div>

      {/* Greeting — user first, then question */}
      <motion.p
        className="text-center text-[29px] font-bold leading-snug tracking-tight text-foreground"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, type: "spring", stiffness: 340, damping: 28 }}
      >
        {greeting}, {userName}
      </motion.p>

      {/* Question: which agent? */}
      <motion.p
        className="mt-2 text-[17px] text-muted-foreground text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 28 }}
      >
        ¿Con cuál agente trabajamos hoy?
      </motion.p>

      {/* Agent selector chips */}
      {agents.length > 0 && (
        <motion.div
          className="mt-5 flex flex-wrap justify-center gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 320, damping: 28 }}
        >
          {/* "All" chip */}
          <button
            onClick={() => onAgentSelect(null)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[15px] font-medium shadow-sm transition-all active:scale-[0.96] ${
              selectedAgentId === null
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Todos
          </button>
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => onAgentSelect(a.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[15px] font-medium shadow-sm transition-all active:scale-[0.96] ${
                selectedAgentId === a.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-md">
                {a.avatar ? (
                  <img src={a.avatar} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-700 dark:bg-neutral-600">
                    <Bot className="h-3 w-3 text-neutral-400" />
                  </div>
                )}
              </div>
              {a.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* Divider */}
      <motion.p
        className="mt-6 text-[13px] font-medium uppercase tracking-widest text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
      >
        o pregunta algo
      </motion.p>

      {/* Suggestion chips */}
      <motion.div
        className="mt-3 flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, type: "spring", stiffness: 320, damping: 28 }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => onSuggestion(s.label, s.key)}
            className="rounded-full border border-border bg-card px-4 py-2 text-[15px] font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.96]"
          >
            {s.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Input Card (Claude-style) ────────────────────────────────────────────────

interface InputCardProps {
  input: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onAttachment: (type: TrainingToolType) => void;
  onFileSelect: (file: File) => void;
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (id: string | null) => void;
  isTrainingMode: boolean;
  placeholder?: string;
}

function InputCard({
  input,
  onChange,
  onSend,
  onAttachment,
  onFileSelect,
  agents,
  selectedAgentId,
  onAgentSelect,
  isTrainingMode,
  placeholder,
}: InputCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  // Close attachment menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setAttachOpen(false);
      }
    }
    if (attachOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [attachOpen]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAttachSelect = (type: TrainingToolType) => {
    setAttachOpen(false);
    if (type === "file") {
      fileInputRef.current?.click();
    } else {
      onAttachment(type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = "";
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      {/* The card — unified container like Claude's input */}
      {/* NOTE: no overflow-hidden here — dropdowns need to escape the card */}
      <div className="rounded-[20px] bg-card ring-1 ring-border shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "¿En qué puedo ayudarte hoy?"}
          rows={1}
          className="block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ maxHeight: 120 }}
        />

        {/* Toolbar — [ + ] [ Agent ▾ ]  ·····  [ → ] */}
        <div className="flex items-center gap-0.5 px-2.5 pb-3 pt-1">
          {/* + button */}
          <div ref={attachRef} className="relative">
            <button
              onClick={() => setAttachOpen((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                attachOpen
                  ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Adjuntar"
            >
              <Plus className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {attachOpen && <AttachmentMenu onSelect={handleAttachSelect} />}
            </AnimatePresence>
          </div>

          {/* Agent selector — only in copilot mode */}
          {!isTrainingMode && agents.length > 0 && (
            <AgentSelector
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelect={onAgentSelect}
            />
          )}

          <div className="flex-1" />

          {/* Send */}
          <motion.button
            onClick={onSend}
            disabled={!input.trim()}
            whileTap={{ scale: 0.84 }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            <Send className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface LisaChatProps {
  agentId?: string;
  className?: string;
}

export function LisaChat({ agentId, className }: LisaChatProps) {
  const { agents, trainingMessages, addTrainingMessage, clearTrainingMessages } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;

  const [creationMessages, setCreationMessages] = useState<(TrainingMessage & { displayContent?: string })[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<(TrainingMessage & { displayContent?: string })[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedCount = useRef(0);
  const msgIdCounter = useRef(0);

  const isTrainingMode = !!agentId;
  const trainingMsgs = agentId ? trainingMessages.filter((m) => m.agentId === agentId) : [];
  const messages = isTrainingMode ? trainingMsgs : creationMessages;
  const hasMessages = messages.length > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Process new messages → typewriter for agent responses
  useEffect(() => {
    if (messages.length <= lastProcessedCount.current) {
      if (messages.length === 0) {
        setDisplayedMessages([]);
        lastProcessedCount.current = 0;
        setIsTyping(false);
      }
      return;
    }

    const newMessages = messages.slice(lastProcessedCount.current);
    lastProcessedCount.current = messages.length;

    for (const msg of newMessages) {
      if (msg.role === "user") {
        setDisplayedMessages((prev) => [...prev, msg]);
        setIsTyping(true);
        scrollToBottom();
      } else if (msg.role === "agent") {
        setIsTyping(false);
        const full = msg.content;
        let i = 0;
        setDisplayedMessages((prev) => [...prev, { ...msg, displayContent: "" }]);
        const typewrite = () => {
          if (i <= full.length) {
            setDisplayedMessages((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex((m) => m.id === msg.id);
              if (idx !== -1) updated[idx] = { ...updated[idx], displayContent: full.slice(0, i) };
              return updated;
            });
            i++;
            typewriterRef.current = setTimeout(typewrite, 12);
            scrollToBottom();
          }
        };
        typewrite();
      }
    }
  }, [messages, scrollToBottom]);

  useEffect(() => () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); }, []);

  const addCreationMessage = useCallback((content: string, responseKey?: string) => {
    setCreationMessages((prev) => [
      ...prev,
      { id: `lisa-${++msgIdCounter.current}`, agentId: "lisa-creation", role: "user", content },
    ]);
    setIsTyping(true);
    setTimeout(() => {
      const responseContent =
        responseKey && COPILOT_RESPONSES[responseKey]
          ? COPILOT_RESPONSES[responseKey]
          : getCopilotResponse(content);
      setCreationMessages((prev) => [
        ...prev,
        { id: `lisa-${++msgIdCounter.current}`, agentId: "lisa-creation", role: "agent", content: responseContent },
      ]);
    }, 800 + Math.random() * 400);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    if (isTrainingMode && agentId) {
      addTrainingMessage(agentId, trimmed);
    } else {
      addCreationMessage(trimmed);
    }
  }, [input, isTrainingMode, agentId, addTrainingMessage, addCreationMessage]);

  const handleAttachment = useCallback(
    (type: TrainingToolType) => {
      if (isTrainingMode && agentId) {
        const promptKey = type as keyof typeof t.trainingChat.toolPrompts;
        const prompt = t.trainingChat.toolPrompts[promptKey];
        if (prompt) addTrainingMessage(agentId, prompt, type);
      } else {
        const copilotKey: Record<string, string> = {
          faq: "faqs", prices: "prices", schedule: "schedule", sheets: "sheets",
        };
        const userMsg: Record<string, string> = {
          faq:      "Quiero agregar preguntas frecuentes a mi agente",
          prices:   "Quiero actualizar los precios de mi agente",
          schedule: "Quiero actualizar los horarios",
          menu:     "Quiero actualizar el menú o catálogo",
          sheets:   "Quiero importar datos desde Google Sheets",
        };
        addCreationMessage(userMsg[type] ?? "Quiero agregar información", copilotKey[type]);
      }
    },
    [isTrainingMode, agentId, t.trainingChat.toolPrompts, addTrainingMessage, addCreationMessage]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (isTrainingMode && agentId) {
        addTrainingMessage(agentId, t.trainingChat.fileUploaded, "file", file.name);
      } else {
        addCreationMessage(`Archivo subido: ${file.name}`, "faqs");
      }
    },
    [isTrainingMode, agentId, t.trainingChat.fileUploaded, addTrainingMessage, addCreationMessage]
  );

  const handleClear = useCallback(() => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setIsTyping(false);
    lastProcessedCount.current = 0;
    if (isTrainingMode && agentId) {
      clearTrainingMessages(agentId);
    } else {
      setCreationMessages([]);
    }
  }, [isTrainingMode, agentId, clearTrainingMessages]);

  if (isTrainingMode && !agent) return null;

  // User name for greeting — replace with user auth when available
  const userName = "Juan";

  return (
    <div className={className ?? "flex h-[calc(100dvh-16rem)] flex-col overflow-hidden"}>

      {/* Header — appears only when there are messages or in training mode */}
      <AnimatePresence>
        {(hasMessages || isTrainingMode) && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="shrink-0 border-b border-border"
          >
            <div className="flex items-center justify-between px-4 py-3 lg:max-w-[720px] lg:mx-auto">
            <div className="flex items-center gap-2">
              <img src="/lisa-isologo-orange.png" alt="Lisa" className="h-10 w-10 object-contain" />
              <p className="text-[16px] font-semibold">
                {isTrainingMode ? agent?.name : "Lisa"}
              </p>
              {isTrainingMode && agent?.hotelName && (
                <span className="text-[14px] text-muted-foreground">— {agent.hotelName}</span>
              )}
            </div>
            {hasMessages && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages / Welcome */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        {/* ── Fondo con mini-logos sutiles (estilo WhatsApp) ── */}
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
            { top: "93%", left: "10%", size: 20, rotate: -16, icon: "bot" },
            { top: "93%", left: "50%", size: 26, rotate: 9,   icon: "brain" },
            { top: "93%", left: "88%", size: 22, rotate: -3,  icon: "brain" },
          ].map((item, i) =>
            item.icon === "bot" ? (
              <svg
                key={i}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute text-foreground"
                style={{
                  top: item.top,
                  left: item.left,
                  width: item.size,
                  height: item.size,
                  transform: `rotate(${item.rotate}deg)`,
                }}
              >
                <path d="M12 8V4H8" /><path d="M12 8V4h4" />
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <circle cx="9" cy="13" r="1.5" />
                <circle cx="15" cy="13" r="1.5" />
                <path d="M6 17h4" /><path d="M14 17h4" />
              </svg>
            ) : (
              <svg
                key={i}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute text-foreground"
                style={{
                  top: item.top,
                  left: item.left,
                  width: item.size,
                  height: item.size,
                  transform: `rotate(${item.rotate}deg)`,
                }}
              >
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
        {!hasMessages ? (
          isTrainingMode ? (
            /* Training mode welcome */
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
              <motion.div
                className="mb-5"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
              >
                <img src="/lisa-logo-orange.png" alt="Lisa" className="h-28 w-auto object-contain drop-shadow-[0_4px_20px_rgba(249,115,22,0.35)]" />
              </motion.div>
              <motion.h2
                className="text-[19px] font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                {t.lisa.welcomeTrainingTitle.replace("{agentName}", agent!.name)}
              </motion.h2>
              <motion.p
                className="mt-2 max-w-xs text-center text-[15px] text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                {t.lisa.welcomeTrainingSubtitle.replace("{agentName}", agent!.name)}
              </motion.p>
            </div>
          ) : (
            /* Copilot welcome (Claude-style) */
            <WelcomeScreen
                userName={userName}
                agents={agents}
                selectedAgentId={selectedAgentId}
                onAgentSelect={setSelectedAgentId}
                onSuggestion={addCreationMessage}
              />
          )
        ) : (
          /* Messages */
          <div className="py-4 space-y-1 lg:max-w-[720px] lg:mx-auto lg:w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {displayedMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 440, damping: 28, mass: 0.7 }}
                >
                  <MessageBubble message={msg} />
                </motion.div>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: "spring", stiffness: 440, damping: 28 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input card — always visible at bottom */}
      <motion.div
        className="shrink-0 lg:max-w-[720px] lg:mx-auto lg:w-full"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.12 }}
      >
        <InputCard
          input={input}
          onChange={setInput}
          onSend={handleSend}
          onAttachment={handleAttachment}
          onFileSelect={handleFileSelect}
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentSelect={setSelectedAgentId}
          isTrainingMode={isTrainingMode}
          placeholder={
            isTrainingMode
              ? t.trainingChat.inputPlaceholder
              : "¿En qué puedo ayudarte hoy?"
          }
        />
      </motion.div>
    </div>
  );
}
