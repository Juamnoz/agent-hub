"use client";

import Link from "next/link";
import { Bot, MessageSquare, HelpCircle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  setup: "bg-amber-100 text-amber-700 border-amber-200",
};

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { t } = useLocaleStore();
  const statusLabel = t.agents.status[agent.status] ?? agent.status;

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{agent.hotelName}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-xs", statusStyles[agent.status])}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{agent.messageCount} {t.agents.msgs}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{agent.faqCount} {t.agents.faqs}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              {agent.whatsappConnected ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
