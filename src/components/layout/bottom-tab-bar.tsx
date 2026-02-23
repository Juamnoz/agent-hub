"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Sparkles } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { motion, AnimatePresence } from "motion/react";

type TabItem = { label: string; icon: typeof Bot; href: string; isCenter?: boolean };

const tabs: TabItem[] = [
  { label: "Agentes", icon: Bot, href: "/agents" },
  { label: "Lisa", icon: Sparkles, href: "/lisa", isCenter: true },
  { label: "Panel", icon: LayoutDashboard, href: "/panel" },
];

function isTabActive(href: string, pathname: string): boolean {
  if (href === "/agents") return pathname.startsWith("/agents");
  if (href === "/lisa") return pathname === "/lisa" || pathname.startsWith("/lisa/");
  if (href === "/panel") return pathname === "/panel" || pathname === "/dashboard";
  return false;
}

export function BottomTabBar() {
  const pathname = usePathname();
  const conversations = useAgentStore((s) => s.conversations);
  const pendingHuman = conversations.filter((c) => c.status === "human_handling").length;

  if (pathname === "/agents/new" || pathname.startsWith("/agents/new/")) return null;

  const isLisa = pathname === "/lisa" || pathname.startsWith("/lisa/");

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glow line estilo Gemini — solo en /lisa */}
      <AnimatePresence>
        {isLisa && (
          <motion.div
            key="glow"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent pointer-events-none"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.4 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full items-center justify-around px-8">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, pathname);

          if (tab.isCenter) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-col items-center justify-center">
                <motion.div
                  animate={
                    isLisa
                      ? { y: 0, width: 40, height: 40 }
                      : { y: -18, width: 56, height: 56 }
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                  className="flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg"
                >
                  <Sparkles className={isLisa ? "h-5 w-5 text-white" : "h-6 w-6 text-white"} />
                </motion.div>
                <motion.span
                  animate={{ opacity: 1, y: isLisa ? 4 : -14 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className={`text-[10px] font-medium ${isLisa ? "text-orange-500" : "text-muted-foreground"}`}
                >
                  {tab.label}
                </motion.span>
              </Link>
            );
          }

          const Icon = tab.icon;
          const isPanelTab = tab.href === "/panel";
          const showBadge = isPanelTab && pendingHuman > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center min-w-[64px]"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: active ? 1.08 : 0.95, opacity: active ? 1 : 0.55 }}
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon
                    className={`h-[24px] w-[24px] ${active ? "text-orange-500" : "text-muted-foreground"}`}
                  />
                </motion.div>
                <AnimatePresence>
                  {showBadge && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white"
                    >
                      {pendingHuman}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
