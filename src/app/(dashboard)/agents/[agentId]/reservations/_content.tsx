"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentStore } from "@/stores/agent-store";

export default function ReservationsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents } = useAgentStore();
  const agent = agents.find((a) => a.id === agentId);

  return (
    <div className="space-y-4 pb-4 lg:max-w-[800px] lg:mx-auto">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href={`/agents/${agentId}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {agent?.name ?? "Agente"}
        </Link>
      </Button>

      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15">
          <CalendarDays className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h2 className="text-[20px] font-bold">Motor de Reservas</h2>
          <div className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 px-3 py-1 text-[13px] font-semibold">
            <Lock className="h-3.5 w-3.5" />
            Proximamente
          </div>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-sm">
            Pronto podras gestionar reservaciones directamente desde Lisa con calendario,
            integraciones con Channel Managers y sincronizacion en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
