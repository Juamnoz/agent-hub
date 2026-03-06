"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";
import { CRMClientList } from "@/components/agents/crm-client-list";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function CRMPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { t } = useLocaleStore();

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp(0)}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t.common.back}
          </Link>
        </Button>
      </motion.div>

      <motion.div {...fadeUp(0.08)}>
        <CRMClientList agentId={agentId} />
      </motion.div>
    </div>
  );
}
