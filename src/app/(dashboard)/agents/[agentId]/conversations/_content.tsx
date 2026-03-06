"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";
import { ConversationList } from "@/components/agents/conversation-list";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function ConversationsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { t } = useLocaleStore();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp(0)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t.common.back}
        </Button>
      </motion.div>

      <motion.div {...fadeUp(0.08)}>
        <ConversationList agentId={agentId} />
      </motion.div>
    </div>
  );
}
