"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { ProductsEditor } from "@/components/agents/products-editor";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function AgentProductsPage({
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

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp(0)}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {agent.name}
          </Link>
        </Button>
      </motion.div>

      <motion.div {...fadeUp(0.08)}>
        <ProductsEditor agentId={agentId} />
      </motion.div>
    </div>
  );
}
