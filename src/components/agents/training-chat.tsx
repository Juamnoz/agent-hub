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
  Bot,
  Trash2,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { TrainingMessage, TrainingToolType } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WelcomeState({
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
        <Bot className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-lg font-bold text-foreground">
        {t.trainingChat.welcomeTitle.replace("{agentName}", agentName)}
      </h2>
      <p className="mt-1.5 max-w-xs text-center text-[13px] text-muted-foreground leading-relaxed">
        {t.trainingChat.welcomeSubtitle}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s.toolType}
            onClick={() => onSuggestedAction(s.toolType)}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-[0.97]"
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
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

  // Agent message
  const content = (message as TrainingMessage & { displayContent?: string }).displayContent ?? message.content;

  return (
    <div className="flex gap-2.5 px-4 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mt-0.5">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 px-4 py-2.5">
          <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {message.knowledgeSaved && content === message.content && (
          <div className="mt-1.5 flex justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
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
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool chips config
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

export function TrainingChat({ agentId }: { agentId: string }) {
  const { agents, trainingMessages, addTrainingMessage, clearTrainingMessages } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<(TrainingMessage & { displayContent?: string })[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedCount = useRef(0);

  const messages = trainingMessages.filter((m) => m.agentId === agentId);

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
        setIsTyping(true);
        scrollToBottom();
      } else if (msg.role === "agent") {
        setIsTyping(false);
        // Typewriter effect
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
  }, [messages, scrollToBottom]);

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

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    addTrainingMessage(agentId, trimmed);
  }, [input, agentId, addTrainingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToolClick = (toolType: TrainingToolType) => {
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
    if (file) {
      addTrainingMessage(agentId, t.trainingChat.fileUploaded, "file", file.name);
      e.target.value = "";
    }
  };

  const handleClear = () => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setIsTyping(false);
    lastProcessedCount.current = 0;
    clearTrainingMessages(agentId);
  };

  if (!agent) return null;

  return (
    <div className="flex h-[calc(100dvh-16rem)] flex-col rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold leading-tight">{agent.name}</h2>
            <p className="text-[11px] text-muted-foreground">{t.trainingChat.subtitle}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.trainingChat.clearChat}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeState agentName={agent.name} onSuggestedAction={handleToolClick} />
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
            placeholder={t.trainingChat.inputPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-orange-300 focus:bg-background focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
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

        {/* Tool chips */}
        <div className="flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-hide">
          {TOOL_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const label = t.trainingChat.tools[chip.labelKey as keyof typeof t.trainingChat.tools];
            return (
              <button
                key={chip.type}
                onClick={() => handleToolClick(chip.type)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-border active:scale-[0.97]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

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
