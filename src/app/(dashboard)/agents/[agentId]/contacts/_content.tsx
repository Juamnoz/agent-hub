"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { ContactsEditor } from "@/components/agents/contacts-editor";

export default function ContactsPage({
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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {agent.name}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t.contacts.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.contacts.description}
        </p>
      </div>

      <ContactsEditor agentId={agentId} />
    </div>
  );
}
