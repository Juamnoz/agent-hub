"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { motion, AnimatePresence } from "motion/react";

function isTabActive(href: string, pathname: string): boolean {
  if (href === "/agents") return pathname.startsWith("/agents");
  if (href === "/lisa") return pathname === "/lisa" || pathname.startsWith("/lisa/");
  if (href === "/panel") return pathname === "/panel" || pathname === "/dashboard";
  return false;
}

export function BottomTabBar() {
  const pathname = usePathname();
  const conversations = useAgentStore((s) => s.conversations);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const modalOpen = useSidebarStore((s) => s.modalOpen);
  const pendingHuman = conversations.filter((c) => c.status === "human_handling").length;

  if (pathname === "/agents/new" || pathname.startsWith("/agents/new/")) return null;

  const isLisa = pathname === "/lisa" || pathname.startsWith("/lisa/");
  const agentsActive = isTabActive("/agents", pathname);
  const panelActive = isTabActive("/panel", pathname);

  return (
    <AnimatePresence>
      {!mobileOpen && !modalOpen && (
    <motion.div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center px-3"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 36, mass: 0.8 }}
    >
      {/* ── Single floating glass dock pill ──────────────────── */}
      <div
        className="relative flex items-center justify-between flex-1 bg-neutral-400/20 dark:bg-neutral-950/55 border border-white/25 dark:border-white/15"
        style={{
          maxWidth: 480,
          height: 56,
          borderRadius: 28,
          backdropFilter: "blur(48px) saturate(200%) brightness(1.05)",
          WebkitBackdropFilter: "blur(48px) saturate(200%) brightness(1.05)",
          boxShadow: [
            "0 8px 40px rgba(0,0,0,0.15)",
            "0 2px 10px rgba(0,0,0,0.10)",
            "inset 0 1px 0 rgba(255,255,255,0.30)",
            "inset 0 -1px 0 rgba(0,0,0,0.08)",
          ].join(", "),
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Top glass sheen */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "50%",
            borderRadius: "28px 28px 0 0",
            background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)",
          }}
        />

        {/* ── Agentes ────────────────────────────────────────── */}
        <Link
          href="/agents"
          className="relative flex items-center justify-center px-5"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: agentsActive ? 1.1 : 1 }}
              whileTap={{ scale: 0.84 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Bot
                className={`h-[27px] w-[27px] transition-colors duration-200 ${
                  agentsActive ? "text-orange-500" : "text-foreground/40"
                }`}
                strokeWidth={1.4}
              />
            </motion.div>
            {/* Active dot */}
            <AnimatePresence>
              {agentsActive && (
                <motion.span
                  key="dot-agents"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-orange-500"
                />
              )}
            </AnimatePresence>
          </div>
        </Link>

        {/* ── Lisa — elevated floating pill ───────────────────────────── */}
        <Link href="/lisa" className="flex items-center justify-center px-1">
          <motion.div
            className="relative"
            animate={{ y: isLisa ? -8 : 0 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
          >
            {/* ── Top-arc glow (active only) — starts from top, extends to sides ── */}
            <AnimatePresence>
              {isLisa && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="absolute pointer-events-none"
                  style={{
                    inset: -5,
                    borderRadius: 24,
                    background: [
                      "radial-gradient(ellipse 110% 55% at 50% 0%, rgba(251,146,60,0.80) 0%, rgba(249,115,22,0.25) 55%, transparent 75%)",
                      "radial-gradient(ellipse 35% 90% at 0% 40%, rgba(249,115,22,0.30) 0%, transparent 65%)",
                      "radial-gradient(ellipse 35% 90% at 100% 40%, rgba(249,115,22,0.30) 0%, transparent 65%)",
                    ].join(", "),
                    filter: "blur(4px)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* ── Pill ── */}
            <div
              className="relative z-10 flex items-center justify-center overflow-hidden"
              style={{
                height: 42,
                width: 62,
                borderRadius: 21,
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
              }}
            >
              {/* Glass + orange tint (inactive) */}
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isLisa ? 0 : 1 }}
                transition={{ duration: 0.22 }}
                style={{
                  borderRadius: 21,
                  background: "rgba(249,115,22,0.12)",
                  border: "1.5px solid rgba(249,115,22,0.40)",
                  boxShadow: [
                    "0 2px 16px rgba(249,115,22,0.12)",
                    "inset 0 1px 0 rgba(255,255,255,0.40)",
                  ].join(", "),
                }}
              />

              {/* Orange gradient (active) */}
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isLisa ? 1 : 0 }}
                transition={{ duration: 0.22 }}
                style={{
                  borderRadius: 21,
                  background: "linear-gradient(148deg, #fb923c 0%, #f97316 50%, #d64602 100%)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: [
                    "0 4px 20px rgba(249,115,22,0.40)",
                    "inset 0 1px 0 rgba(255,255,255,0.45)",
                  ].join(", "),
                }}
              />

              {/* Specular top sheen */}
              <div
                className="absolute inset-x-0 top-0 pointer-events-none z-10"
                style={{
                  height: "48%",
                  borderRadius: "21px 21px 0 0",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
                }}
              />

              {/* Isologo blanco — siempre blanco, tamaño 50% del pill */}
              <img
                src="/lisa-isologo-white.png"
                alt="Lisa"
                className="relative z-20 object-contain"
                style={{ height: 50, width: 50 }}
              />
            </div>
          </motion.div>
        </Link>

        {/* ── Panel ──────────────────────────────────────────── */}
        <Link
          href="/panel"
          className="relative flex items-center justify-center px-5"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: panelActive ? 1.1 : 1 }}
              whileTap={{ scale: 0.84 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <LayoutDashboard
                className={`h-[27px] w-[27px] transition-colors duration-200 ${
                  panelActive ? "text-orange-500" : "text-foreground/40"
                }`}
                strokeWidth={1.4}
              />
            </motion.div>
            {/* Active dot */}
            <AnimatePresence>
              {panelActive && (
                <motion.span
                  key="dot-panel"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-orange-500"
                />
              )}
            </AnimatePresence>
            {/* Notification badge */}
            <AnimatePresence>
              {pendingHuman > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[11px] font-bold text-white"
                >
                  {pendingHuman}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
