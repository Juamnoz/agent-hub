"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Bot,
  Activity,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { type Agent, PLAN_AGENT_LIMITS, CURRENT_PLAN } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/analytics/stats-card";
import { AgentCard } from "@/components/agents/agent-card";

export default function DashboardPage() {
  const { agents, stats, loadStats } = useAgentStore();
  const { t } = useLocaleStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const weeklyChange =
    stats.messagesLastWeek > 0
      ? Math.round(
          ((stats.messagesThisWeek - stats.messagesLastWeek) /
            stats.messagesLastWeek) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats - 2x2 grid on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          title={t.dashboard.totalAgents}
          value={`${stats.totalAgents}/${PLAN_AGENT_LIMITS[CURRENT_PLAN] === Infinity ? "∞" : PLAN_AGENT_LIMITS[CURRENT_PLAN]}`}
          icon={Bot}
          accentColor="blue"
        />
        <StatsCard
          title={t.dashboard.activeAgents}
          value={stats.activeAgents}
          icon={Activity}
          accentColor="emerald"
        />
        <StatsCard
          title={t.dashboard.messagesThisWeek}
          value={stats.messagesThisWeek}
          trend={{ value: weeklyChange, label: t.dashboard.vsLastWeek }}
          icon={MessageSquare}
          accentColor="violet"
        />
        <StatsCard
          title={t.dashboard.avgResponseTime}
          value={stats.avgResponseTime}
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* Your Agents Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">{t.dashboard.yourAgents}</h2>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full px-3.5 text-[13px] font-medium bg-orange-500 hover:bg-orange-600"
          >
            <Link href="/agents/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t.dashboard.createAgent}
            </Link>
          </Button>
        </div>

        {agents.length > 0 ? (
          <div className="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
            {agents.map((agent: Agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-[17px] font-semibold mb-1">
              {t.dashboard.noAgentsTitle}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-5 max-w-[280px] mx-auto leading-relaxed">
              {t.dashboard.noAgentsDescription}
            </p>
            <Button
              asChild
              className="h-10 rounded-full px-5 text-[14px] font-medium bg-orange-500 hover:bg-orange-600"
            >
              <Link href="/agents/new">
                <Plus className="mr-2 h-4 w-4" />
                {t.dashboard.createFirstAgent}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
