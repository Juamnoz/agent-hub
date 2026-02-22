"use client";

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
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { LisaChat } from "@/components/lisa/lisa-chat";
import { AgentCard } from "@/components/agents/agent-card";
import type { Agent } from "@/lib/mock-data";

// ── Alert generation ─────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LisaPage() {
  const { agents } = useAgentStore();

  const activeAgents = agents.filter((a) => a.status === "active");
  const totalMessages = agents.reduce((sum, a) => sum + a.messageCount, 0);
  const alerts = buildAlerts(agents);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-5">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">{greeting}</p>
          <h1 className="text-[20px] font-bold leading-tight">Tu copiloto de IA</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex justify-around px-2">
        <StatPill
          icon={<Bot className="h-3.5 w-3.5" />}
          label="Activos"
          value={`${activeAgents.length}/${agents.length}`}
          color="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
        />
        <StatPill
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Mensajes"
          value={totalMessages.toLocaleString()}
          color="text-blue-500"
          iconBg="bg-blue-50 dark:bg-blue-500/15"
        />
        <StatPill
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Esta semana"
          value="+22%"
          color="text-orange-500"
          iconBg="bg-orange-50 dark:bg-orange-500/15"
        />
      </div>

      {/* ── Agentes ── */}
      {agents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[13px] font-semibold">Tus agentes</p>
            <Link
              href="/agents/new"
              className="flex items-center gap-1 text-[12px] font-medium text-orange-500"
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
                className="w-[260px] shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Smart alerts / suggestions ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-muted-foreground px-0.5">
            Lisa sugiere
          </p>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* ── Chat ── */}
      <div className="space-y-2">
        <p className="text-[12px] font-medium text-muted-foreground px-0.5">
          Pregúntale a Lisa
        </p>
        <LisaChat />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`${color} mb-0.5`}>{icon}</div>
      <p className="text-[17px] font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
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
        <p className="text-[11px] font-semibold text-muted-foreground truncate">
          {alert.agentName}
        </p>
        <p className="text-[13px] font-medium leading-tight">{alert.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span
          className={`text-[12px] font-semibold ${
            isWarning ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
          }`}
        >
          {alert.action}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}
