"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Users, Zap, Clock } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { mockConversations } from "@/lib/mock-data";
import type { Conversation } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/analytics/stats-card";
import { MessageChart } from "@/components/analytics/message-chart";

export default function AgentAnalyticsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, weeklyMessages } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t.agents.agentNotFound}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {t.agents.agentNotFoundDescription}
        </p>
        <Button asChild variant="outline">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
      </div>
    );
  }

  const agentConversations = mockConversations.filter(
    (c: Conversation) => c.agentId === agentId
  );

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back} {agent.name}
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-gray-900">{t.analytics.title}</h1>
        <p className="text-sm text-gray-500">
          {t.analytics.performanceMetrics} - {agent.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t.analytics.totalMessages}
          value={agent.messageCount}
          icon={MessageSquare}
        />
        <StatsCard
          title={t.analytics.conversations}
          value={agentConversations.length}
          icon={Users}
        />
        <StatsCard
          title={t.analytics.avgConfidence}
          value="91%"
          icon={Zap}
        />
        <StatsCard
          title={t.analytics.responseTime}
          value="4.2s"
          icon={Clock}
        />
      </div>

      {/* Message Chart */}
      <MessageChart data={weeklyMessages} />

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.recentConversations}</CardTitle>
          <CardDescription>
            {t.analytics.latestInteractions} - {agent.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentConversations.length > 0 ? (
            <div className="space-y-4">
              {agentConversations.map((conv: Conversation) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {conv.contactName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {conv.contactName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conv.contactPhone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {conv.messageCount} {t.analytics.messagesCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              {t.analytics.noConversations}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
