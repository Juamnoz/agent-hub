"use client";

import Link from "next/link";
import { Plus, Bot } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Agent } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";

export default function AgentsPage() {
  const { agents } = useAgentStore();
  const { t } = useLocaleStore();

  return (
    <div className="space-y-4">
      {agents.length > 0 ? (
        <>
          <div className="flex items-center justify-end">
            <Link
              href="/agents/new"
              className="flex items-center gap-1.5 rounded-full bg-muted px-3.5 h-8 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.agents.newAgent}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: Agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bot className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">
            {t.agents.noAgentsTitle}
          </h3>
          <p className="mb-4 max-w-sm text-sm text-gray-500">
            {t.agents.noAgentsDescription}
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
  );
}
