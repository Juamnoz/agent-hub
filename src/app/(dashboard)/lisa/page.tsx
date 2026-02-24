"use client";

import { Suspense } from "react";
import { motion } from "motion/react";
import { LisaChat } from "@/components/lisa/lisa-chat";
import { useSearchParams } from "next/navigation";

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

export default function LisaPage() {
  return (
    <motion.div
      /* Mobile: full-bleed. Desktop: full-width full-height */
      className="-mx-4 -mt-4 -mb-20 lg:-mx-6 lg:-mt-6 lg:-mb-6 flex flex-col h-[calc(100dvh-7.5rem)] lg:h-dvh"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
    >
      <Suspense fallback={<div className="flex h-full flex-col bg-background overflow-hidden" />}>
        <LisaChatWithParams />
      </Suspense>
    </motion.div>
  );
}
