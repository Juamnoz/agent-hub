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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useLocaleStore();

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.agents, href: "/agents", icon: Bot },
    { label: t.nav.billing, href: "/billing", icon: CreditCard },
    { label: t.nav.settings, href: "/settings", icon: Settings },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-6 h-14 flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold tracking-tight">Agent Hub</span>
          </SheetTitle>
        </SheetHeader>

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
