"use client";

import { motion } from "motion/react";
import { LisaChat } from "@/components/lisa/lisa-chat";

export default function LisaPage() {
  return (
    <motion.div
      /* Mobile: full-bleed. Desktop: centered max-width like Claude */
      className="-mx-4 -mt-4 -mb-20 lg:mx-auto lg:-mt-6 lg:-mb-6 lg:max-w-[720px] flex flex-col h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-3.5rem)]"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
    >
      <LisaChat className="flex h-full flex-col bg-background overflow-hidden" />
    </motion.div>
  );
}
