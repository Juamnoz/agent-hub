"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus, Bot, Activity, MessageSquare, Clock } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Agent } from "@/lib/mock-data";
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
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t.dashboard.totalAgents}
          value={stats.totalAgents}
          icon={Bot}
        />
        <StatsCard
          title={t.dashboard.activeAgents}
          value={stats.activeAgents}
          icon={Activity}
        />
        <StatsCard
          title={t.dashboard.messagesThisWeek}
          value={stats.messagesThisWeek}
          trend={{ value: weeklyChange, label: t.dashboard.vsLastWeek }}
          icon={MessageSquare}
        />
        <StatsCard
          title={t.dashboard.avgResponseTime}
          value={stats.avgResponseTime}
          icon={Clock}
        />
      </div>

      {/* Your Agents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.dashboard.yourAgents}</h2>
          <Button asChild size="sm">
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.dashboard.createAgent}
            </Link>
          </Button>
        </div>

        {agents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: Agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Bot className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium">
              {t.dashboard.noAgentsTitle}
            </h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              {t.dashboard.noAgentsDescription}
            </p>
            <Button asChild>
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
