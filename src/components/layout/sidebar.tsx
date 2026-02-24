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
  Check,
  Plus,
  MessageSquare,
  Sun,
  Moon,
  Trash2,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAgentStore } from "@/stores/agent-store";
import { useChatHistoryStore, type ChatSession } from "@/stores/chat-history-store";
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocaleStore();
  const { collapsed, toggleSidebar } = useSidebarStore();
  const agents = useAgentStore((s) => s.agents);
  const { sessions, deleteSession } = useChatHistoryStore();
  const currentChatId = searchParams.get("chat");

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("lisa-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  const isLisaActive = pathname.startsWith("/lisa");
  const isPanelActive = pathname === "/panel" || pathname.startsWith("/panel/");
  const isAgentsActive = pathname === "/agents" || pathname.startsWith("/agents/");

  const secondaryNavItems = [
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        {/* ── Header: logo + collapse button ── */}
        <div
          className={cn(
            "flex h-20 shrink-0 items-center border-b border-border",
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
                <img src="/lisa-logo-orange.png" alt="Lisa" className="h-20 object-contain dark:hidden" />
                <img src="/lisa-logo-white.png" alt="Lisa" className="h-20 object-contain hidden dark:block" />
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

        {/* ── Scrollable body ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* ── Nueva conversación ── */}
          <div className={cn("shrink-0 p-3", collapsed && "flex justify-center")}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/lisa"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
                    aria-label="Nueva conversación"
                  >
                    <Plus className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Nueva conversación</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/lisa"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 dark:text-orange-400 transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shrink-0">
                  <Plus className="h-3 w-3 text-white" />
                </div>
                Nueva conversación
              </Link>
            )}
          </div>

          {/* ── Main nav: Panel + Agentes + Chats ── */}
          <div className={cn("shrink-0 flex flex-col gap-0.5 px-3")}>
            {[
              { label: "Panel", href: "/panel", icon: LayoutDashboard, active: isPanelActive },
              { label: t.nav.agents, href: "/agents", icon: Bot, active: isAgentsActive },
              { label: "Chats", href: "/chats", icon: MessagesSquare, active: pathname === "/chats" || pathname.startsWith("/chats/") },
            ].map((item) => {
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                    item.active
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
          </div>

          {/* ── Chat history (scrollable, fills remaining space) ── */}
          {!collapsed && (
            <div className="flex-1 overflow-y-auto mt-2 min-h-0">
              {sessions.length === 0 ? (
                /* Empty state — subtle hint */
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
          )}

          {/* Collapsed: spacer */}
          {collapsed && <div className="flex-1" />}

          {/* ── By Aic studio ── */}
          {!collapsed && (
            <div className="px-4 pb-2 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground/50 tracking-wide">
                by Aic studio
              </span>
            </div>
          )}

          {/* ── Secondary nav (Billing, Settings) ── */}
          <div className="shrink-0 border-t border-border p-3 flex flex-col gap-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
          </div>

          {/* ── Profile + utilities (Claude-style) ── */}
          <div className="shrink-0 border-t border-border p-3">
            {collapsed ? (
              /* Collapsed: stacked icons */
              <div className="flex flex-col items-center gap-2">
                <LocaleSwitcher />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleTheme}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{isDark ? "Modo claro" : "Modo oscuro"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t.common.signOut}</TooltipContent>
                </Tooltip>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[11px] font-semibold bg-orange-500 text-white">JD</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              /* Expanded: Claude-style profile row */
              <div className="flex flex-col gap-1">
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
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
