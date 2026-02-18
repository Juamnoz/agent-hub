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
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Check,
  Plus,
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

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.agents, href: "/agents", icon: Bot },
    { label: t.nav.products, href: "/products", icon: ShoppingBag },
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
          <Sparkles className="h-4 w-4 shrink-0" />
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
          className="w-72 p-0 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Lisa</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.lisa.subtitle}
            </p>
          </div>
          {/* New agent button */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/lisa"
              onClick={() => setLisaOpen(false)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {t.lisa.newAgent}
            </Link>
          </div>
          {agents.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                {t.agents.noAgentsDescription}
              </p>
            </div>
          ) : (
            <>
              <div className="mx-4 my-2 border-t border-border" />
              <div className="py-1 pb-2 max-h-64 overflow-y-auto">
                {agents.map((agent) => {
                  const isSelected = currentLisaAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 shrink-0">
                        <Bot className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {agent.name}
                          </span>
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              statusColors[agent.status] ?? "bg-gray-400"
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {agent.hotelName}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-orange-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-white transition-all duration-200",
          collapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border",
            collapsed ? "justify-center px-0" : "justify-between px-6"
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
              <Link href="/dashboard" className="flex items-center gap-2">
                <img src="/logo.png" alt="Lisa" className="h-6 w-6 shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-semibold tracking-tight leading-tight">
                    Lisa
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground tracking-wide">
                    by Aic studio
                  </span>
                </div>
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

        <nav className="flex-1 flex flex-col gap-1 p-3">
          {navItems.slice(0, 3).map((item) => {
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

          {/* Lisa item with agent selector popover */}
          {renderLisaItem()}

          {navItems.slice(3).map((item) => {
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
        </nav>

        <div className="border-t border-border p-3">
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
