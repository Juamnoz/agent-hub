"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";
import { useAgentStore } from "@/stores/agent-store";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
};

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocaleStore();
  const agents = useAgentStore((s) => s.agents);
  const [trainingExpanded, setTrainingExpanded] = useState(false);

  const isTrainingActive = pathname.endsWith("/train");
  const trainMatch = pathname.match(/^\/agents\/([^/]+)\/train$/);
  const currentTrainAgentId = trainMatch?.[1] ?? null;

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.agents, href: "/agents", icon: Bot },
  ];

  const bottomNavItems = [
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  function handleSelectAgent(agentId: string) {
    setTrainingExpanded(false);
    onOpenChange(false);
    router.push(`/agents/${agentId}/train`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-6">
          <img src="/logo.png" alt="Lisa" className="h-7 w-7 shrink-0" />
          <div className="flex flex-col leading-none">
            <SheetTitle className="text-lg font-semibold tracking-tight leading-tight">
              Lisa
            </SheetTitle>
            <span className="text-[9px] font-medium text-muted-foreground tracking-wide">
              by Aic studio
            </span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive && !isTrainingActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Training item with expandable agent selector */}
          <div>
            <button
              onClick={() => setTrainingExpanded((prev) => !prev)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full",
                isTrainingActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              <span className="flex-1 text-left">{t.nav.training}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200",
                  trainingExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Agent list */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                trainingExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {agents.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {t.agents.noAgentsDescription}
                  </p>
                  <Link
                    href="/agents/new"
                    onClick={() => onOpenChange(false)}
                    className="inline-block mt-2 text-xs font-medium text-orange-600 hover:underline"
                  >
                    {t.dashboard.createAgent}
                  </Link>
                </div>
              ) : (
                <div className="py-1 max-h-52 overflow-y-auto">
                  {agents.map((agent) => {
                    const isSelected = currentTrainAgentId === agent.id;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className={cn(
                          "flex items-center gap-2.5 w-full pl-10 pr-3 py-2 text-left transition-colors rounded-md mx-1",
                          isSelected
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                        style={{ width: "calc(100% - 0.5rem)" }}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 shrink-0">
                          <Bot className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium truncate">
                              {agent.name}
                            </span>
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                statusColors[agent.status] ?? "bg-gray-400"
                              )}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {agent.hotelName}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 mt-auto">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            {t.common.signOut}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
