"use client";

import Link from "next/link";
import { Bot, MessageSquare, HelpCircle, ChevronRight } from "lucide-react";
import type { Agent } from "@/lib/mock-data";
import { useLocaleStore } from "@/stores/locale-store";

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  setup: "bg-amber-50 text-amber-700",
};

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { t } = useLocaleStore();
  const statusLabel = t.agents.status[agent.status] ?? agent.status;

  return (
    <Link href={`/agents/${agent.id}`} className="group block">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.98] hover:shadow-md">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold truncate">{agent.name}</h3>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]}`} />
            </div>
            <p className="text-[13px] text-muted-foreground truncate">{agent.hotelName}</p>
          </div>

          {/* Chevron */}
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-400" />
        </div>

        {/* Bottom stats row */}
        <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{agent.messageCount.toLocaleString()}</span>
            <span>{t.agents.msgs}</span>
          </div>
          <div className="h-3 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{agent.faqCount}</span>
            <span>{t.agents.faqs}</span>
          </div>
          <span
            className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[agent.status]}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
