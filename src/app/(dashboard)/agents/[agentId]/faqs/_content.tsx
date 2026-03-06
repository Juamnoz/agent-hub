"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaqEditor } from "@/components/agents/faq-editor";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function AgentFaqsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, faqs } = useAgentStore();
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

  const agentFaqCount = faqs.filter((f) => f.agentId === agentId).length;

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back} {agent.name}
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t.faqEditor.title}</h1>
          <Badge variant="secondary">{agentFaqCount}</Badge>
        </div>
        <p className="text-sm text-gray-500">
          {t.faqEditor.noFaqsDescription}
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <FaqEditor agentId={agentId} />
      </motion.div>
    </div>
  );
}
