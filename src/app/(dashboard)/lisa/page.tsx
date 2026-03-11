"use client";

import { Suspense } from "react";
import { motion } from "motion/react";
import { LisaChat } from "@/components/lisa/lisa-chat";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Lock } from "lucide-react";

function LisaChatWithParams() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat") ?? undefined;

  return (
    <LisaChat
      key={chatId ?? "new"}
      conversationId={chatId}
      className="flex h-full flex-col bg-background overflow-hidden"
    />
  );
}

function ComingSoonOverlay() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-6">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
      >
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10">
          <Lock className="h-9 w-9 text-orange-500" />
        </div>
        <h2 className="text-[22px] font-bold text-foreground">Próximamente</h2>
        <p className="mt-2 max-w-xs text-[15px] text-muted-foreground leading-relaxed">
          Lisa, tu copiloto de IA, estará disponible muy pronto para ayudarte a gestionar tus agentes.
        </p>
      </motion.div>
    </div>
  );
}

export default function LisaPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <motion.div
      /* Mobile: full-bleed. Desktop: full-width full-height */
      className="-mx-4 -mt-4 -mb-20 lg:-mx-6 lg:-mt-6 lg:-mb-6 flex flex-col h-[calc(100dvh-7.5rem)] lg:h-dvh"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
    >
      {isSuperAdmin ? (
        <Suspense fallback={<div className="flex h-full flex-col bg-background overflow-hidden" />}>
          <LisaChatWithParams />
        </Suspense>
      ) : (
        <ComingSoonOverlay />
      )}
    </motion.div>
  );
}
