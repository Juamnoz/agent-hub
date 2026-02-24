"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Bot,
  Sparkles,
  Plus,
  Inbox,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { AgentCard } from "@/components/agents/agent-card";
import type { Agent, Conversation } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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

// ── Alert generation ──────────────────────────────────────────────────────────

interface AgentAlert {
  agentId: string;
  agentName: string;
  type: "warning" | "tip";
  text: string;
  href: string;
  action: string;
}

function buildAlerts(agents: Agent[]): AgentAlert[] {
  const alerts: AgentAlert[] = [];
  for (const agent of agents) {
    if (agent.status === "inactive") {
      alerts.push({
        agentId: agent.id,
        agentName: agent.name,
        type: "warning",
        text: "Agente pausado — no está respondiendo",
        href: `/agents/${agent.id}`,
        action: "Activar",
      });
    }
    if (!agent.whatsappConnected) {
      alerts.push({
        agentId: agent.id,
        agentName: agent.name,
        type: "warning",
        text: "WhatsApp no conectado",
        href: `/agents/${agent.id}/whatsapp`,
        action: "Conectar",
      });
    }
    if (agent.faqCount < 10) {
      alerts.push({
        agentId: agent.id,
        agentName: agent.name,
        type: "tip",
        text: `Solo ${agent.faqCount} FAQs — se recomiendan 20+`,
        href: `/agents/${agent.id}/faqs`,
        action: "Agregar",
      });
    }
  }
  return alerts.slice(0, 4);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PanelPage() {
  const { agents, conversations, loadConversations } = useAgentStore();

  // Cargar conversaciones de todos los agentes
  useEffect(() => {
    agents.forEach((agent) => loadConversations(agent.id));
  }, [agents, loadConversations]);

  const activeAgents = agents.filter((a) => a.status === "active");
  const totalMessages = agents.reduce((sum, a) => sum + a.messageCount, 0);
  const alerts = buildAlerts(agents);

  // Bandeja: escaladas primero, luego recientes, máx 5
  const inboxConvs = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      if (a.status === "human_handling" && b.status !== "human_handling") return -1;
      if (b.status === "human_handling" && a.status !== "human_handling") return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    return sorted.filter((c) => c.status !== "resolved").slice(0, 5);
  }, [conversations]);

  const pendingHumanCount = conversations.filter((c) => c.status === "human_handling").length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
  });

  return (
    <div className="space-y-5 lg:max-w-[800px] lg:mx-auto">

      {/* ── Greeting + Stats ── */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <p className="text-[15px] text-muted-foreground">{greeting}</p>
          <h1 className="text-[22px] font-bold leading-tight">Panel de control</h1>
        </div>
        <div className="flex items-center gap-4">
          <StatPill
            icon={<Bot className="h-3 w-3" />}
            label="Activos"
            value={`${activeAgents.length}/${agents.length}`}
          />
          <StatPill
            icon={<MessageSquare className="h-3 w-3" />}
            label="Mensajes"
            value={totalMessages.toLocaleString()}
          />
          <StatPill
            icon={<TrendingUp className="h-3 w-3" />}
            label="Semana"
            value="+22%"
          />
        </div>
      </motion.div>

      {/* ── Bandeja de entrada ── */}
      {inboxConvs.length > 0 && (
        <motion.div {...fadeUp(0.12)} className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold">Bandeja de entrada</p>
              {pendingHumanCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[12px] font-bold text-white">
                  {pendingHumanCount}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-border/60">
            {inboxConvs.map((conv) => {
              const agent = agents.find((a) => a.id === conv.agentId);
              return (
                <InboxRow
                  key={conv.id}
                  conv={conv}
                  agentName={agent?.name ?? "Agente"}
                />
              );
            })}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Navegar al primer agente con conversaciones
                const firstAgent = inboxConvs[0]
                  ? `/agents/${inboxConvs[0].agentId}/conversations`
                  : "/agents";
                window.location.href = firstAgent;
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[14px] font-medium text-orange-500 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
            >
              Ver todas las conversaciones
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Agentes ── */}
      {agents.length > 0 && (
        <motion.div {...fadeUp(0.18)} className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[15px] font-semibold">Tus agentes</p>
            <Link
              href="/agents/new"
              className="flex items-center gap-1 text-[14px] font-medium text-orange-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                className="w-[240px] shrink-0"
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Smart alerts ── */}
      {alerts.length > 0 && (
        <motion.div {...fadeUp(0.24)} className="space-y-2">
          <p className="text-[14px] font-medium text-muted-foreground px-0.5">
            Lisa sugiere
          </p>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Acceso rápido a Lisa chat ── */}
      <motion.div {...fadeUp(0.3)}>
      <Link
        href="/lisa"
        className="flex items-center gap-3 rounded-2xl bg-card ring-1 ring-orange-400/30 dark:ring-orange-500/20 px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all active:scale-[0.99] hover:ring-orange-400/60"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 dark:bg-orange-500/20">
          <img src="/lisa-isologo-orange.png" alt="Lisa" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-[16px] font-semibold text-foreground leading-tight">Pregúntale a Lisa</p>
          <p className="text-[13px] text-muted-foreground">Tu copiloto de IA</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </Link>
      </motion.div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InboxRow({ conv, agentName }: { conv: Conversation; agentName: string }) {
  const isHuman = conv.status === "human_handling";
  return (
    <Link
      href={`/agents/${conv.agentId}/conversations`}
      className={`flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/50 ${
        isHuman ? "bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10" : "hover:bg-muted/30"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(conv.contactName)} shadow-sm`}
      >
        <span className="text-[13px] font-bold text-white">{getInitials(conv.contactName)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-semibold truncate text-foreground">{conv.contactName}</span>
          {isHuman && (
            <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              HUMANO
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-muted-foreground truncate">{conv.lastMessage || "..."}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[13px] text-muted-foreground">{formatRelativeTime(conv.lastMessageAt)}</span>
        <span className="text-[12px] text-muted-foreground/60 truncate max-w-[60px] text-right">{agentName}</span>
      </div>
    </Link>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-foreground/50">
        {icon}
        <p className="text-[15px] font-semibold tabular-nums leading-tight text-foreground">{value}</p>
      </div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

function AlertCard({ alert }: { alert: AgentAlert }) {
  const isWarning = alert.type === "warning";
  return (
    <Link
      href={alert.href}
      className="flex items-center gap-3 rounded-2xl bg-card ring-1 ring-border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isWarning
            ? "bg-amber-50 dark:bg-amber-500/15"
            : "bg-blue-50 dark:bg-blue-500/15"
        }`}
      >
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <Lightbulb className="h-4 w-4 text-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-muted-foreground truncate">
          {alert.agentName}
        </p>
        <p className="text-[15px] font-medium leading-tight">{alert.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[14px] font-medium text-muted-foreground">
          {alert.action}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}
