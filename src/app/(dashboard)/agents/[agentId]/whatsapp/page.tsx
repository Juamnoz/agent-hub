"use client";
export const dynamic = "force-static";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlanStore } from "@/stores/plan-store";
import { Button } from "@/components/ui/button";
import { ConnectionWizard } from "@/components/whatsapp/connection-wizard";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function AgentWhatsAppPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents } = useAgentStore();
  const { t } = useLocaleStore();
  const { currentPlan, canAddWhatsApp, getWhatsAppLimit } = usePlanStore();
  const agent = agents.find((a) => a.id === agentId);

  // Count how many OTHER agents already have WhatsApp connected (excluding this one)
  const whatsappConnectedCount = agents.filter(
    (a) => a.whatsappConnected && a.id !== agentId
  ).length;
  // If this agent is already connected, we don't need to enforce (they can manage existing connection)
  const isAlreadyConnected = agent?.whatsappConnected ?? false;
  const whatsappLimitReached = !isAlreadyConnected && !canAddWhatsApp(whatsappConnectedCount);
  const whatsappLimit = getWhatsAppLimit();
  const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

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
    <div className="space-y-6">
      <motion.div {...fadeUp(0)}>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back} {agent.name}
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-foreground">
          {t.whatsapp.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.whatsapp.description}
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        {whatsappLimitReached ? (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold">Límite de conexiones WhatsApp</h2>
              <p className="text-[15px] text-muted-foreground max-w-xs">
                Tu plan <span className="font-semibold">{planName}</span> incluye{" "}
                <span className="font-semibold">{whatsappLimit}</span> línea{whatsappLimit !== 1 ? "s" : ""} WhatsApp.
                Actualiza para conectar más números.
              </p>
            </div>
            <Button asChild>
              <Link href="/billing">Ver planes</Link>
            </Button>
          </div>
        ) : (
          <ConnectionWizard agentId={agentId} isConnected={agent.whatsappConnected} />
        )}
      </motion.div>
    </div>
  );
}
