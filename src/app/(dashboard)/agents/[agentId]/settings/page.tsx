"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { PersonalityConfig } from "@/components/agents/personality-config";

export default function AgentSettingsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold">{t.agents.agentNotFound}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back} {agent.name}
          </Link>
        </Button>

        <h1 className="text-2xl font-bold">{t.agentSettings.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.agentSettings.configure} {agent.name}
        </p>
      </div>

      <PersonalityConfig agent={agent} />
    </div>
  );
}
