"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Sparkles } from "lucide-react";

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

  // Ocultar durante flujos de creación/wizard para no interferir
  if (pathname === "/agents/new" || pathname.startsWith("/agents/new/")) return null;
  // En desktop el sidebar lo reemplaza


  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full items-center justify-around px-8">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, pathname);

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg ring-4 ring-background ${active ? "shadow-orange-300" : ""}`}>
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                  {tab.label}
                </span>
              </Link>
            );
          }

          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[64px]"
            >
              <Icon
                className={`h-[22px] w-[22px] transition-colors ${
                  active ? "text-orange-500" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-orange-500" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
