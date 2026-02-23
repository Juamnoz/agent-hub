"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";
import { ConversationList } from "@/components/agents/conversation-list";

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        {t.common.back}
      </Button>

      <ConversationList agentId={agentId} />
    </div>
  );
}
