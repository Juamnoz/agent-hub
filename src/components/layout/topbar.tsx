"use client";

import { Menu } from "lucide-react";
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

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { t } = useLocaleStore();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden flex h-8 w-8 items-center justify-center -ml-1 rounded-lg active:bg-gray-100 transition-colors"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <LocaleSwitcher />
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
    </header>
  );
}
