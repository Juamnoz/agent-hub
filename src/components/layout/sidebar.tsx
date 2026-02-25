"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Plus,
  MessageSquare,
  Sun,
  Moon,
  Trash2,
  MessagesSquare,
  X,
  CalendarDays,
  UtensilsCrossed,
  ShoppingCart,
  Building2,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useChatHistoryStore, type ChatSession } from "@/stores/chat-history-store";
import { useAgentStore } from "@/stores/agent-store";
import { usePlanStore } from "@/stores/plan-store";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ALGORITHM_MODULES, MODULE_FEATURE_MAP, type PlanFeature } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("es", { month: "short", day: "numeric" });
}

function groupSessionsByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Hoy", items: [] },
    { label: "Ayer", items: [] },
    { label: "Última semana", items: [] },
    { label: "Más antiguas", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dayStart >= today) groups[0].items.push(s);
    else if (dayStart >= yesterday) groups[1].items.push(s);
    else if (dayStart >= weekAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

// Module → nav item config
const MODULE_NAV: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  segment: string;
}> = {
  reservations: { label: "Reservas", icon: CalendarDays, segment: "reservations" },
  menu: { label: "Menú", icon: UtensilsCrossed, segment: "menu" },
  orders: { label: "Pedidos", icon: ShoppingCart, segment: "orders" },
  properties: { label: "Propiedades", icon: Building2, segment: "properties" },
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocaleStore();
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebarStore();
  const { sessions, deleteSession } = useChatHistoryStore();
  const { agents } = useAgentStore();
  const { hasFeature } = usePlanStore();
  const currentChatId = searchParams.get("chat");

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams, setMobileOpen]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("lisa-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  // ── Detect agent context ─────────────────────────────────────────────────
  const agentRouteMatch = pathname.match(/^\/agents\/([^/]+)/);
  const currentAgentId = agentRouteMatch ? agentRouteMatch[1] : null;
  const currentAgent = currentAgentId ? agents.find((a) => a.id === currentAgentId) : null;

  // Agent-specific module nav items
  const agentModuleItems = (() => {
    if (!currentAgent?.algorithmType) return [];
    const modules = ALGORITHM_MODULES[currentAgent.algorithmType] ?? [];
    return modules.map((mod) => {
      const navCfg = MODULE_NAV[mod];
      if (!navCfg) return null;
      const featureKey = MODULE_FEATURE_MAP[mod] as PlanFeature;
      const unlocked = hasFeature(featureKey);
      return {
        module: mod,
        label: navCfg.label,
        icon: navCfg.icon,
        href: `/agents/${currentAgentId}/${navCfg.segment}`,
        unlocked,
      };
    }).filter(Boolean);
  })() as Array<{
    module: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    unlocked: boolean;
  }>;

  const isPanelActive = pathname === "/panel" || pathname.startsWith("/panel/");
  const isAgentsActive = pathname === "/agents" || pathname.startsWith("/agents/");
  const isChatsActive = pathname === "/chats" || pathname.startsWith("/chats/");

  const secondaryNavItems = [
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  const navItems = [
    { label: "Panel", href: "/panel", icon: LayoutDashboard, active: isPanelActive },
    { label: t.nav.agents, href: "/agents", icon: Bot, active: isAgentsActive },
    { label: "Chats", href: "/chats", icon: MessagesSquare, active: isChatsActive },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-border",
          // Mobile: slide in/out as drawer
          "transition-transform duration-300 ease-in-out",
          "w-[280px]",
          // Mobile: hidden by default, shown when mobileOpen
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, width based on collapsed
          "lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-60",
        )}
      >
        {/* ── Header: logo + collapse/close button ── */}
        <div
          className={cn(
            "flex h-20 shrink-0 items-center border-b border-border",
            collapsed ? "lg:justify-center lg:px-0 justify-between px-4" : "justify-between px-4"
          )}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Logo — hidden on desktop when collapsed */}
          <Link href="/panel" className={cn("flex items-center", collapsed && "lg:hidden")}>
            <img src="/lisa-logo-orange.png" alt="Lisa" className="h-20 object-contain dark:hidden" />
            <img src="/lisa-logo-white.png" alt="Lisa" className="h-20 object-contain hidden dark:block" />
          </Link>

          {/* Desktop: collapse toggle */}
          {!collapsed ? (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* ── Nueva conversación ── */}
          <div className={cn("shrink-0 p-3", collapsed && "lg:flex lg:justify-center")}>
            {collapsed ? (
              <div className="hidden lg:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/lisa"
                      aria-label="Nueva conversación"
                      className="relative overflow-hidden flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all active:scale-[0.93]"
                      style={{
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        boxShadow: [
                          "0 4px 18px rgba(249,115,22,0.28)",
                          "0 1px 4px rgba(249,115,22,0.15)",
                          "inset 0 1px 0 rgba(255,255,255,0.18)",
                          "inset 0 -1px 0 rgba(0,0,0,0.10)",
                        ].join(", "),
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0"
                        style={{
                          height: "52%",
                          borderRadius: "0.75rem 0.75rem 0 0",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
                        }}
                      />
                      <Plus className="relative z-10 h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Nueva conversación</TooltipContent>
                </Tooltip>
              </div>
            ) : null}
            <Link
              href="/lisa"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative overflow-hidden flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-[15px] font-semibold text-white transition-all active:scale-[0.97]",
                collapsed && "lg:hidden"
              )}
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow: [
                  "0 4px 18px rgba(249,115,22,0.28)",
                  "0 1px 4px rgba(249,115,22,0.15)",
                  "inset 0 1px 0 rgba(255,255,255,0.18)",
                  "inset 0 -1px 0 rgba(0,0,0,0.10)",
                ].join(", "),
              }}
            >
              {/* Top specular sheen */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0"
                style={{
                  height: "52%",
                  borderRadius: "1rem 1rem 0 0",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
                }}
              />
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 shrink-0 backdrop-blur-sm">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="relative z-10">Nueva conversación</span>
            </Link>
          </div>

          {/* ── Main nav ── */}
          <div className="shrink-0 flex flex-col gap-0.5 px-3">
            {navItems.map((item) => {
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "lg:justify-center lg:px-2 px-3 py-2 gap-3" : "gap-3 px-3 py-2",
                    item.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
              return link;
            })}
          </div>

          {/* ── Agent module nav (dynamic, when inside /agents/[id]/) ── */}
          <AnimatePresence>
            {agentModuleItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 mt-1 overflow-hidden"
              >
                {/* Separator */}
                <div className={cn("mx-3 mb-1 h-px bg-border/60", collapsed && "lg:mx-2")} />

                {/* Agent name header — hidden when collapsed */}
                {currentAgent && (
                  <div className={cn("px-3 pb-1", collapsed && "lg:hidden")}>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 truncate px-3 block">
                      {currentAgent.name}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-0.5 px-3">
                  {agentModuleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    if (!item.unlocked) {
                      return (
                        <Tooltip key={item.module}>
                          <TooltipTrigger asChild>
                            <Link
                              href="/billing"
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center rounded-lg text-sm font-medium text-muted-foreground/50 transition-colors hover:bg-accent/50",
                                collapsed ? "lg:justify-center lg:px-2 px-3 py-2 gap-3" : "gap-3 px-3 py-2"
                              )}
                            >
                              <div className="relative shrink-0">
                                <Icon className="h-4 w-4" />
                                <Lock className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-muted-foreground/50 bg-sidebar rounded-full" />
                              </div>
                              <span className={cn("flex-1", collapsed && "lg:hidden")}>{item.label}</span>
                              {!collapsed && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/30" />}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label} — Requiere plan Pro
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Tooltip key={item.module}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center rounded-lg text-sm font-medium transition-colors",
                              collapsed ? "lg:justify-center lg:px-2 px-3 py-2 gap-3" : "gap-3 px-3 py-2",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Chat history (scrollable) ── */}
          <div className={cn("flex-1 overflow-y-auto mt-2 min-h-0", collapsed && "lg:hidden")}>
            {sessions.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/25 mb-2" />
                <p className="text-[13px] text-muted-foreground/40 leading-snug">
                  Tus conversaciones<br />aparecerán aquí
                </p>
              </div>
            ) : (
              groupSessionsByDate(sessions).map((group) => (
                <div key={group.label}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                    {group.label}
                  </p>
                  {group.items.map((session) => {
                    const isActive = currentChatId === session.id;
                    return (
                      <div key={session.id} className="group relative flex items-center mx-1.5">
                        <Link
                          href={`/lisa?chat=${session.id}`}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 pr-8 transition-colors min-w-0",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          <span className="flex-1 text-[14px] truncate">{session.title}</span>
                          <span className="text-[12px] opacity-40 shrink-0 tabular-nums">
                            {formatRelativeTime(session.updatedAt)}
                          </span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSession(session.id);
                            if (isActive) router.push("/lisa");
                          }}
                          className="absolute right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label="Eliminar conversación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Collapsed spacer */}
          {collapsed && <div className="flex-1 hidden lg:block" />}

          {/* ── By Aic studio ── */}
          <div className={cn("px-4 pb-2 shrink-0", collapsed && "lg:hidden")}>
            <span className="text-[11px] font-medium text-muted-foreground/50 tracking-wide">
              by Aic studio
            </span>
          </div>

          {/* ── Secondary nav ── */}
          <div className="shrink-0 border-t border-border p-3 flex flex-col gap-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "lg:justify-center lg:px-2 px-3 py-2 gap-3" : "gap-3 px-3 py-2",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Profile + utilities ── */}
          <div className="shrink-0 border-t border-border p-3">
            {collapsed ? (
              /* Desktop collapsed: stacked icons */
              <div className="hidden lg:flex flex-col items-center gap-2">
                <LocaleSwitcher />
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[11px] font-semibold bg-orange-500 text-white">JD</AvatarFallback>
                </Avatar>
              </div>
            ) : null}

            {/* Expanded (mobile always shows this, desktop only when not collapsed) */}
            <div className={cn("flex flex-col gap-1", collapsed && "lg:hidden")}>
              {/* Utilities row */}
              <div className="flex items-center gap-1 px-1">
                <LocaleSwitcher />
                <button
                  onClick={toggleTheme}
                  aria-label={isDark ? "Modo claro" : "Modo oscuro"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-accent transition-colors text-left">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[13px] font-semibold bg-orange-500 text-white">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate leading-tight">John Doe</p>
                      <p className="text-[13px] text-muted-foreground truncate leading-tight">john@hotel.com</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52 rounded-xl mb-1">
                  <div className="px-2 py-1.5">
                    <p className="text-[15px] font-semibold">John Doe</p>
                    <p className="text-[13px] text-muted-foreground">john@hotel.com</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t.nav.settings}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing">{t.nav.billing}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.common.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
