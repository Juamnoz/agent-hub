"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  DollarSign,
  Clock,
  UtensilsCrossed,
  HelpCircle,
  Table2,
  Send,
  CheckCircle2,
  Sparkles,
  Trash2,
  Bot,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { TrainingMessage, TrainingToolType } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Mock responses for creation mode
// ---------------------------------------------------------------------------

const CREATION_RESPONSES: Record<string, string[]> = {
  hotel: [
    "¡Excelente! Voy a crear un agente especializado para tu hotel. ¿Cómo se llama tu hotel?",
  ],
  restaurant: [
    "¡Perfecto! Voy a configurar un agente para tu restaurante. ¿Cuál es el nombre de tu restaurante?",
  ],
  ecommerce: [
    "¡Genial! Voy a preparar un agente para tu tienda online. ¿Cómo se llama tu tienda?",
  ],
  appointment: [
    "¡Muy bien! Voy a crear un agente para gestionar citas y reservas. ¿Cuál es el nombre de tu negocio?",
  ],
  default: [
    "¡Entendido! Voy a ayudarte a configurar tu agente. ¿Podrías contarme un poco más sobre tu negocio?",
  ],
};

// ---------------------------------------------------------------------------
// Copilot mode responses
// ---------------------------------------------------------------------------

const COPILOT_RESPONSES: Record<string, string> = {
  metrics:
    "Esta semana tus 2 agentes activos respondieron 187 mensajes en total (+22% vs semana pasada). Playa Azul lidera con 1,247 mensajes acumulados y tiempo de respuesta de 4.2s. Sierra Nevada tiene 834 mensajes. ¿Quieres detalles de alguno?",
  improve:
    "Encontré 2 oportunidades de mejora:\n\n1. Playa Azul tiene solo 8 FAQs — los agentes similares tienen 30+. Te recomiendo agregar preguntas sobre check-in, wifi y desayuno.\n\n2. Sierra Nevada no tiene WhatsApp conectado, lo que limita su alcance.\n\n¿Por cuál empezamos?",
  create:
    "¡Claro! Para crear un nuevo agente necesito saber ¿qué tipo de negocio es? Hotel, restaurante, tienda online, consultorio...",
  status:
    "Estado actual de tus agentes:\n\n🟢 Playa Azul Assistant — Activo, WhatsApp conectado, 8 FAQs\n🟢 Sierra Nevada Concierge — Activo, WhatsApp desconectado, 6 FAQs\n\nAmbos están respondiendo en menos de 5 segundos. El plan Pro te permite hasta 3 agentes.",
  faqs:
    "Para agregar FAQs efectivas a tu agente, te recomiendo incluir: preguntas de horario, precios, ubicación, proceso de compra/reserva y políticas de cancelación. ¿A qué agente le agregamos FAQs?",
  default:
    "Entendido. Soy tu copiloto de IA — puedo ayudarte con métricas de tus agentes, sugerirte mejoras, configurar integraciones o crear nuevos agentes. ¿Qué necesitas?",
};

function getCopilotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("métrica") || lower.includes("estadística") || lower.includes("cómo van") || lower.includes("como van") || lower.includes("resultados") || lower.includes("semana")) {
    return COPILOT_RESPONSES.metrics;
  }
  if (lower.includes("mejorar") || lower.includes("suger") || lower.includes("qué debo") || lower.includes("que debo") || lower.includes("oportunidad")) {
    return COPILOT_RESPONSES.improve;
  }
  if (lower.includes("crear") || lower.includes("nuevo agente") || lower.includes("agregar agente")) {
    return COPILOT_RESPONSES.create;
  }
  if (lower.includes("estado") || lower.includes("activo") || lower.includes("status") || lower.includes("mis agentes")) {
    return COPILOT_RESPONSES.status;
  }
  if (lower.includes("faq") || lower.includes("pregunta") || lower.includes("respuesta")) {
    return COPILOT_RESPONSES.faqs;
  }
  return COPILOT_RESPONSES.default;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopilotWelcomeState({ onSuggestion }: { onSuggestion: (text: string, key: string) => void }) {
  const chips = [
    { key: "metrics", label: "¿Cómo van mis agentes?" },
    { key: "improve", label: "¿Qué debo mejorar?" },
    { key: "status", label: "Ver estado general" },
    { key: "create", label: "Crear un agente" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="text-[16px] font-bold text-foreground text-center">
        ¿En qué te ayudo hoy?
      </h2>
      <p className="mt-1 max-w-[260px] text-center text-[13px] text-muted-foreground leading-relaxed">
        Pregúntame por métricas, configuración o cómo mejorar tus agentes.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => onSuggestion(c.label, c.key)}
            className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.97]"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrainingWelcomeState({
  agentName,
  onSuggestedAction,
}: {
  agentName: string;
  onSuggestedAction: (toolType: TrainingToolType) => void;
}) {
  const { t } = useLocaleStore();

  const suggestions: { toolType: TrainingToolType; icon: React.ReactNode; label: string }[] = [
    { toolType: "prices", icon: <DollarSign className="h-4 w-4" />, label: t.trainingChat.tools.prices },
    { toolType: "schedule", icon: <Clock className="h-4 w-4" />, label: t.trainingChat.tools.schedule },
    { toolType: "faq", icon: <HelpCircle className="h-4 w-4" />, label: t.trainingChat.tools.faqs },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-lg font-bold text-foreground">
        {t.lisa.welcomeTrainingTitle.replace("{agentName}", agentName)}
      </h2>
      <p className="mt-1.5 max-w-xs text-center text-[13px] text-muted-foreground leading-relaxed">
        {t.lisa.welcomeTrainingSubtitle.replace("{agentName}", agentName)}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s.toolType}
            onClick={() => onSuggestedAction(s.toolType)}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.97]"
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: TrainingMessage & { displayContent?: string } }) {
  const { t } = useLocaleStore();

  if (message.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t.trainingChat.knowledgeSaved}
        </span>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
          {message.attachmentName && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-orange-600">
              <Paperclip className="h-3 w-3" />
              {message.attachmentName}
            </div>
          )}
          <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Lisa/agent message
  const content = (message as TrainingMessage & { displayContent?: string }).displayContent ?? message.content;

  return (
    <div className="flex gap-2.5 px-4 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-orange-50 dark:bg-orange-500/10 px-4 py-2.5">
          <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {message.knowledgeSaved && content === message.content && (
          <div className="mt-1.5 flex justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {t.trainingChat.knowledgeSaved}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 px-4 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-orange-50 dark:bg-orange-500/10 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool chips config (for training mode)
// ---------------------------------------------------------------------------

const TOOL_CHIPS: {
  type: TrainingToolType;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}[] = [
  { type: "file", icon: Paperclip, labelKey: "uploadFile" },
  { type: "prices", icon: DollarSign, labelKey: "prices" },
  { type: "schedule", icon: Clock, labelKey: "schedule" },
  { type: "menu", icon: UtensilsCrossed, labelKey: "menu" },
  { type: "faq", icon: HelpCircle, labelKey: "faqs" },
  { type: "sheets", icon: Table2, labelKey: "sheets" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface LisaChatProps {
  agentId?: string;
}

export function LisaChat({ agentId }: LisaChatProps) {
  const { agents, trainingMessages, addTrainingMessage, clearTrainingMessages } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;

  // For creation mode, we use a local messages state
  const [creationMessages, setCreationMessages] = useState<(TrainingMessage & { displayContent?: string })[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<(TrainingMessage & { displayContent?: string })[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedCount = useRef(0);
  const msgIdCounter = useRef(0);

  const isCreationMode = !agentId;

  // Training mode messages from store
  const trainingMsgs = agentId ? trainingMessages.filter((m) => m.agentId === agentId) : [];
  const messages = isCreationMode ? creationMessages : trainingMsgs;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Process new messages with typewriter effect for agent messages
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
        if (!isCreationMode) setIsTyping(true);
        scrollToBottom();
      } else if (msg.role === "agent") {
        setIsTyping(false);
        const fullContent = msg.content;
        let i = 0;
        setDisplayedMessages((prev) => [...prev, { ...msg, displayContent: "" }]);

        const typewrite = () => {
          if (i <= fullContent.length) {
            setDisplayedMessages((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex((m) => m.id === msg.id);
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], displayContent: fullContent.slice(0, i) };
              }
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
  }, [messages, scrollToBottom, isCreationMode]);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, []);

  // Auto-grow textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  // Creation mode: add message locally + simulate Lisa response
  const addCreationMessage = useCallback((content: string, responseKey?: string) => {
    const userMsg: TrainingMessage & { displayContent?: string } = {
      id: `lisa-${++msgIdCounter.current}`,
      agentId: "lisa-creation",
      role: "user",
      content,
    };
    setCreationMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate Lisa response after delay
    setTimeout(() => {
      // Copilot mode: use contextual responses
      let responseContent: string;
      if (responseKey && COPILOT_RESPONSES[responseKey]) {
        responseContent = COPILOT_RESPONSES[responseKey];
      } else if (responseKey && CREATION_RESPONSES[responseKey]) {
        const responses = CREATION_RESPONSES[responseKey];
        responseContent = responses[Math.floor(Math.random() * responses.length)];
      } else {
        responseContent = getCopilotResponse(content);
      }
      const agentMsg: TrainingMessage & { displayContent?: string } = {
        id: `lisa-${++msgIdCounter.current}`,
        agentId: "lisa-creation",
        role: "agent",
        content: responseContent,
      };
      setCreationMessages((prev) => [...prev, agentMsg]);
    }, 800 + Math.random() * 400);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isCreationMode) {
      addCreationMessage(trimmed);
    } else if (agentId) {
      addTrainingMessage(agentId, trimmed);
    }
  }, [input, isCreationMode, agentId, addCreationMessage, addTrainingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToolClick = (toolType: TrainingToolType) => {
    if (!agentId) return;
    if (toolType === "file") {
      fileInputRef.current?.click();
      return;
    }
    const promptKey = toolType as keyof typeof t.trainingChat.toolPrompts;
    const prompt = t.trainingChat.toolPrompts[promptKey];
    if (prompt) {
      addTrainingMessage(agentId, prompt, toolType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && agentId) {
      addTrainingMessage(agentId, t.trainingChat.fileUploaded, "file", file.name);
      e.target.value = "";
    }
  };

  const handleClear = () => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setIsTyping(false);
    lastProcessedCount.current = 0;
    if (isCreationMode) {
      setCreationMessages([]);
    } else if (agentId) {
      clearTrainingMessages(agentId);
    }
  };

  const handleCreationSuggestion = (text: string, key: string) => {
    addCreationMessage(text, key);
  };

  // For training mode, if agent not found, show nothing
  if (agentId && !agent) return null;

  const headerTitle = isCreationMode ? "Lisa" : agent?.name ?? "Lisa";
  const headerSubtitle = isCreationMode ? t.lisa.subtitle : t.trainingChat.subtitle;

  return (
    <div className="flex h-[calc(100dvh-16rem)] flex-col rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold leading-tight">{headerTitle}</h2>
            <p className="text-[11px] text-muted-foreground">{headerSubtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.trainingChat.clearChat}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          isCreationMode ? (
            <CopilotWelcomeState onSuggestion={handleCreationSuggestion} />
          ) : (
            <TrainingWelcomeState agentName={agent!.name} onSuggestedAction={handleToolClick} />
          )
        ) : (
          <div className="py-4 space-y-1">
            {displayedMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card">
        <div className="flex items-end gap-2 px-3 py-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isCreationMode ? "Pregúntale algo a Lisa..." : t.trainingChat.inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-orange-300 focus:bg-background focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Tool chips - only in training mode */}
        {!isCreationMode && (
          <div className="flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-hide">
            {TOOL_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const label = t.trainingChat.tools[chip.labelKey as keyof typeof t.trainingChat.tools];
              return (
                <button
                  key={chip.type}
                  onClick={() => handleToolClick(chip.type)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.97]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
