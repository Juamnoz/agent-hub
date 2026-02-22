"use client";

import Link from "next/link";
import { Bot, Settings } from "lucide-react";
import type { Agent } from "@/lib/mock-data";
import { useLocaleStore } from "@/stores/locale-store";
import { IconWhatsApp } from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";

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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-semibold truncate">{agent.name}</h3>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]}`} />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{agent.hotelName}</p>
            </div>
          </div>

          {/* Stats: 3 columns with dividers */}
          <div className="grid grid-cols-3 divide-x divide-border mt-2 pt-2 border-t border-border">
            <div className="flex flex-col items-center gap-0 px-1">
              <span className="text-[15px] font-bold tabular-nums leading-tight">
                {agent.messageCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">{t.agents.msgs}</span>
            </div>
            <div className="flex flex-col items-center gap-0 px-1">
              <span className="text-[15px] font-bold tabular-nums leading-tight">
                {agent.faqCount}
              </span>
              <span className="text-[10px] text-muted-foreground">{t.agents.faqs}</span>
            </div>
            <div className="flex flex-col items-center gap-0 px-1">
              <IconWhatsApp
                className={`h-5 w-5 ${
                  agent.whatsappConnected ? "text-[#25D366]" : "text-muted-foreground/30"
                }`}
              />
              <span className="text-[10px] text-muted-foreground">WhatsApp</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
