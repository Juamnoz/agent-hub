"use client";

import Link from "next/link";
import { Bot, Settings, MessageSquare } from "lucide-react";
import type { Agent } from "@/lib/mock-data";
import { useLocaleStore } from "@/stores/locale-store";
import { useAgentStore } from "@/stores/agent-store";
import { IconWhatsApp } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getQualityScore(agent: Agent): number {
  let score = 0;
  // FAQs: 0-40 pts (20+ FAQs = máximo)
  score += Math.min(agent.faqCount / 20, 1) * 40;
  // WhatsApp conectado: 25 pts
  if (agent.whatsappConnected) score += 25;
  // Productos: 0-20 pts (10+ productos = máximo)
  if (agent.productCount > 0) score += Math.min(agent.productCount / 10, 1) * 20;
  // Redes sociales: 15 pts (al menos 1)
  const links = agent.socialLinks;
  if (links && Object.values(links).some(Boolean)) score += 15;
  return Math.round(score);
}

function QualityBar({ score }: { score: number }) {
  const barColor =
    score >= 80 ? "bg-emerald-500" :
    score >= 50 ? "bg-amber-400" :
    "bg-rose-400";
  const textColor =
    score >= 80 ? "text-emerald-500" :
    score >= 50 ? "text-amber-500" :
    "text-rose-400";
  const label =
    score >= 80 ? "Alta" :
    score >= 50 ? "Media" :
    "Baja";
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="flex items-end gap-0.5">
        <span className="text-[17px] font-bold tabular-nums leading-tight text-foreground/80">{score}</span>
        <span className="text-[12px] text-muted-foreground/50 mb-0.5">%</span>
      </div>
      <div className="w-full h-1 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[12px] font-medium ${textColor}`}>{label}</span>
    </div>
  );
}

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
};

interface AgentCardProps {
  agent: Agent;
  className?: string;
}

export function AgentCard({ agent, className }: AgentCardProps) {
  const { t } = useLocaleStore();
  const { updateAgent } = useAgentStore();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (agent.status === "setup") return;
    const next = agent.status === "active" ? "inactive" : "active";
    updateAgent(agent.id, { status: next });
    toast.success(next === "active" ? "Agente activado" : "Agente pausado");
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Settings button — solo visible en hover, esquina superior derecha */}
      <Link
        href={`/agents/${agent.id}/settings`}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm ring-1 ring-border/60 backdrop-blur-sm"
        aria-label="Configuración"
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>

      <Link href={`/agents/${agent.id}`} className="block">
        <div className="rounded-2xl bg-card p-3 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.98] hover:shadow-md">
          {/* Top row: avatar + name + business + status dot */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm">
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-700 dark:bg-neutral-600">
                  <Bot className="h-[18px] w-[18px] text-neutral-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-semibold truncate">{agent.name}</h3>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]}`} />
              </div>
              <p className="text-[13px] text-muted-foreground truncate">{agent.hotelName}</p>
            </div>
          </div>

          {/* Stats: 3 columns */}
          <div className="grid grid-cols-3 divide-x divide-border mt-2 pt-2 border-t border-border items-stretch">

            {/* WhatsApp — primero */}
            <div className="flex flex-col items-center justify-between gap-1 px-1 py-1.5">
              <span className="flex flex-1 items-center justify-center">
                <IconWhatsApp
                  className={`h-[18px] w-[18px] ${
                    agent.whatsappConnected ? "text-[#25D366]" : "text-muted-foreground/25"
                  }`}
                />
              </span>
              <span className="text-[12px] text-muted-foreground/60">WhatsApp</span>
            </div>

            {/* Mensajes — clickable, texto plano con icono azul */}
            <Link
              href={`/agents/${agent.id}/conversations`}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center justify-between gap-1 px-1.5 py-1.5"
            >
              <span className="flex items-center justify-center">
                <MessageSquare className="h-[18px] w-[18px] text-blue-500" />
              </span>
              <span className="text-[12px] text-muted-foreground/60">Mensajes</span>
            </Link>

            {/* Calidad */}
            <div className="flex flex-col items-center justify-between gap-1 px-2 py-1.5 w-full">
              <span className="text-[15px] font-semibold leading-tight text-foreground/80">Calidad</span>
              <span className={`text-[13px] font-medium ${
                getQualityScore(agent) >= 80 ? "text-emerald-500" :
                getQualityScore(agent) >= 50 ? "text-amber-500" :
                "text-rose-400"
              }`}>
                {getQualityScore(agent) >= 80 ? "Alta" : getQualityScore(agent) >= 50 ? "Media" : "Baja"}
              </span>
            </div>

          </div>

          {/* Toggle activar/desactivar */}
          <div
            className="flex items-center justify-between mt-2 pt-2 border-t border-border px-0.5"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <span className={`text-[13px] font-medium ${agent.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
              {agent.status === "active" ? "Activo" : agent.status === "setup" ? "Configurando" : "Pausado"}
            </span>
            <button
              onClick={handleToggle}
              disabled={agent.status === "setup"}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                agent.status === "active"
                  ? "bg-emerald-500"
                  : agent.status === "setup"
                  ? "bg-muted-foreground/15 cursor-not-allowed"
                  : "bg-muted-foreground/25"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  agent.status === "active" ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
