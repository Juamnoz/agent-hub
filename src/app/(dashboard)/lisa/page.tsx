"use client";

import { Sparkles } from "lucide-react";
import { LisaChat } from "@/components/lisa/lisa-chat";

export default function LisaPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold leading-tight">Lisa</h1>
          <p className="text-[12px] text-muted-foreground">Tu copiloto de IA</p>
        </div>
      </div>

      {/* Chat */}
      <LisaChat />
    </div>
  );
}
