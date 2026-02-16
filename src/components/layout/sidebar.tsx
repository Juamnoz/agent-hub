"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/locale-store";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocaleStore();

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.agents, href: "/agents", icon: Bot },
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-white">
      <div className="flex h-14 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold tracking-tight">Agent Hub</span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
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

      <div className="border-t border-border p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <LogOut className="h-4 w-4" />
          {t.common.signOut}
        </button>
      </div>
    </aside>
  );
}
