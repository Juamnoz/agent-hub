"use client";

import Link from "next/link";
import { Bot, Settings, MessageSquare, CalendarDays, ShoppingCart, Building2 } from "lucide-react";
import type { Agent } from "@/lib/mock-data";
import { useLocaleStore } from "@/stores/locale-store";
import { useAgentStore } from "@/stores/agent-store";
import { IconWhatsApp } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ModuleSlot = { icon: React.ElementType; label: string; path: string; color: string } | null;

function getModuleSlot(agent: Agent): ModuleSlot {
  const t = agent.algorithmType;
  if (t === "hotel" || t === "restaurant")
    return { icon: CalendarDays, label: "Reservas", path: `/agents/${agent.id}/reservations`, color: "text-blue-500" };
  if (t === "appointments")
    return { icon: CalendarDays, label: "Citas", path: `/agents/${agent.id}/reservations`, color: "text-violet-500" };
  if (t === "ecommerce" || t === "whatsapp-store")
    return { icon: ShoppingCart, label: "Pedidos", path: `/agents/${agent.id}/orders`, color: "text-violet-500" };
  if (t === "inmobiliaria")
    return { icon: Building2, label: "Propiedades", path: `/agents/${agent.id}/properties`, color: "text-teal-500" };
  return null;
}

function getQualityScore(agent: Agent): number {
  let score = 0;
  score += Math.min(agent.faqCount / 20, 1) * 40;
  if (agent.whatsappConnected) score += 25;
  if (agent.productCount > 0) score += Math.min(agent.productCount / 10, 1) * 20;
  const links = agent.socialLinks;
  if (links && Object.values(links).some(Boolean)) score += 15;
  return Math.round(score);
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
  const moduleSlot = getModuleSlot(agent);
  const score = getQualityScore(agent);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (agent.status === "setup") return;
    const next = agent.status === "active" ? "inactive" : "active";
    updateAgent(agent.id, { status: next });
    toast.success(next === "active" ? "Agente activado" : "Agente pausado");
  }

  const qualityColor =
    score >= 80 ? "text-emerald-500" :
    score >= 50 ? "text-amber-500" :
    "text-rose-400";

  return (
    <div className={cn("relative group", className)}>
      {/* Settings — visible on hover, top-right */}
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

          {/* Top row: avatar + name + dot + WA icon */}
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
            {/* WhatsApp indicator — small, right of name area */}
            <IconWhatsApp
              className={`h-[15px] w-[15px] shrink-0 mr-7 transition-colors ${
                agent.whatsappConnected ? "text-[#25D366]" : "text-muted-foreground/20"
              }`}
            />
          </div>

          {/* Stats: 3 columns — Calidad | Mensajes | Módulo */}
          <div className="grid grid-cols-3 divide-x divide-border mt-2 pt-2 border-t border-border items-stretch">

            {/* Calidad — sutil */}
            <div className="flex flex-col items-center justify-between gap-1 px-1 py-1.5">
              <span className={`text-[17px] font-bold tabular-nums leading-tight ${qualityColor}`}>
                {score}
                <span className="text-[11px] font-normal text-muted-foreground/40">%</span>
              </span>
              <span className="text-[12px] text-muted-foreground/60">Calidad</span>
            </div>

            {/* Mensajes */}
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

            {/* Módulo principal */}
            {moduleSlot ? (
              <Link
                href={moduleSlot.path}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-between gap-1 px-1.5 py-1.5"
              >
                <span className="flex items-center justify-center">
                  <moduleSlot.icon className={`h-[18px] w-[18px] ${moduleSlot.color}`} />
                </span>
                <span className="text-[12px] text-muted-foreground/60">{moduleSlot.label}</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-between gap-1 px-1.5 py-1.5">
                <span className="flex items-center justify-center h-[18px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                </span>
                <span className="text-[12px] text-muted-foreground/40">—</span>
              </div>
            )}

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
