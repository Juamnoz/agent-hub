"use client";

import { use } from "react";
import { LisaChat } from "@/components/lisa/lisa-chat";

export default function LisaAgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  return <LisaChat agentId={agentId} />;
}
