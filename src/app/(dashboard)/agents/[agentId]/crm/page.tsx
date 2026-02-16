"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";
import { CRMClientList } from "@/components/agents/crm-client-list";

export default function CRMPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { t } = useLocaleStore();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href={`/agents/${agentId}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t.common.back}
        </Link>
      </Button>

      <CRMClientList agentId={agentId} />
    </div>
  );
}
