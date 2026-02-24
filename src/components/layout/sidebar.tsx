"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Check,
  Plus,
  MessageSquare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAgentStore } from "@/stores/agent-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocaleStore();
  const { collapsed, toggleSidebar } = useSidebarStore();
  const agents = useAgentStore((s) => s.agents);
  const [lisaOpen, setLisaOpen] = useState(false);

  // Main nav — mirrors mobile bottom tab bar: Panel | Agentes | Lisa
  const mainNavItems = [
    { label: "Panel", href: "/panel", icon: LayoutDashboard },
    { label: t.nav.agents, href: "/agents", icon: Bot },
  ];

  // Secondary nav — lives at the bottom of the sidebar
  const secondaryNavItems = [
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  const isLisaActive = pathname.startsWith("/lisa");

  // Extract current agent ID from pathname if on lisa/[agentId] page
  const lisaMatch = pathname.match(/^\/lisa\/([^/]+)$/);
  const currentLisaAgentId = lisaMatch?.[1] ?? null;

  function handleSelectAgent(agentId: string) {
    setLisaOpen(false);
    router.push(`/lisa/${agentId}`);
  }

  function renderLisaItem() {
    const triggerClasses = cn(
      "flex items-center rounded-lg text-sm font-medium transition-colors w-full cursor-pointer",
      collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
      isLisaActive
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

    const trigger = (
      <PopoverTrigger asChild>
        <button className={triggerClasses}>
          {/* Lisa isologo naranja transparente */}
          <img src="/lisa-isologo-orange.png" alt="" className="shrink-0 h-8 w-8 object-contain" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Lisa</span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-muted-foreground/60 transition-transform",
                  lisaOpen && "rotate-90"
                )}
              />
            </>
          )}
        </button>
      </PopoverTrigger>
    );

    return (
      <Popover open={lisaOpen} onOpenChange={setLisaOpen}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            {!lisaOpen && (
              <TooltipContent side="right">Lisa</TooltipContent>
            )}
          </Tooltip>
        ) : (
          trigger
        )}
        <PopoverContent
          side="right"
          align="start"
          sideOffset={collapsed ? 8 : 12}
          className="w-[280px] p-0 overflow-hidden"
        >
          {/* ── Nueva conversación ── */}
          <div className="p-2.5">
            <Link
              href="/lisa"
              onClick={() => setLisaOpen(false)}
              className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-[15px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 dark:text-orange-400 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shrink-0">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              Nueva conversación
            </Link>
          </div>

          {/* ── Recientes (mock) ── */}
          <div className="border-t border-border">
            <p className="px-4 pt-2.5 pb-1 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Recientes
            </p>
            {[
              { title: "¿Cómo van mis agentes?", time: "12m", href: "/lisa" },
              { title: "Mejoras para Playa Azul", time: "2h", href: "/lisa" },
              { title: "Nueva FAQ: check-in", time: "Ayer", href: "/lisa" },
              { title: "Métricas de la semana", time: "3d", href: "/lisa" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setLisaOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-accent/50 transition-colors group"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
                <span className="flex-1 text-[14px] text-foreground/80 truncate">{item.title}</span>
                <span className="text-[13px] text-muted-foreground/40 shrink-0">{item.time}</span>
              </Link>
            ))}
          </div>

          {/* ── Entrenar agente ── */}
          {agents.length > 0 && (
            <div className="border-t border-border pb-2">
              <p className="px-4 pt-2.5 pb-1 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Entrenar agente
              </p>
              {agents.map((agent) => {
                const isSelected = currentLisaAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-4 py-2 text-left transition-colors",
                      isSelected ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-popover", statusColors[agent.status] ?? "bg-gray-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate">{agent.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{agent.hotelName}</p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border py-0",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Abrir barra lateral</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link href="/panel" className="flex items-center">
                {/* Lisa wordmark — light mode */}
                <img
                  src="/lisa-logo-orange.png"
                  alt="Lisa"
                  className="h-20 object-contain dark:hidden"
                />
                {/* Lisa wordmark — dark mode (white on transparent bg) */}
                <img
                  src="/lisa-logo-white.png"
                  alt="Lisa"
                  className="h-20 object-contain hidden dark:block"
                />
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar barra lateral</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* ── Main nav (mirrors mobile tabs: Panel | Agentes | Lisa) ── */}
        <nav className="flex-1 flex flex-col gap-1 p-3">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isActive && !isLisaActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}

          {/* Lisa — prominent, like the center tab on mobile */}
          {renderLisaItem()}
        </nav>

        {/* ── By Aic studio ── */}
        {!collapsed && (
          <div className="px-4 pb-2">
            <span className="text-[11px] font-medium text-muted-foreground/50 tracking-wide">
              by Aic studio
            </span>
          </div>
        )}

        {/* ── Secondary nav + logout ── */}
        <div className="border-t border-border p-3 flex flex-col gap-1">
          {secondaryNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}

          {/* Logout */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t.common.signOut}</TooltipContent>
            </Tooltip>
          ) : (
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <LogOut className="h-4 w-4" />
              {t.common.signOut}
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
