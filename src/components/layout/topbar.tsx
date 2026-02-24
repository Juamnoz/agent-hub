"use client";

import { Sun, Moon, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useLocaleStore } from "@/stores/locale-store";
import { useState, useEffect } from "react";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { t } = useLocaleStore();
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const dark = localStorage.getItem("lisa-theme") === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);
  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("lisa-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <header className="sticky top-0 z-40 flex lg:hidden h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <h1 className="text-[19px] font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile-only controls (desktop has them in sidebar) */}
        <div className="flex lg:hidden items-center gap-1.5">
          <LocaleSwitcher />
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Configuración"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Modo claro" : "Modo oscuro"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium bg-orange-500 text-white">
                    JD
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@hotel.com</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">{t.nav.settings}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">{t.nav.billing}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t.common.signOut}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
