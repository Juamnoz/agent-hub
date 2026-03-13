"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PanelLeft, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { useLocaleStore } from "@/stores/locale-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useAgentStore } from "@/stores/agent-store";

function usePageTitle(pathname: string): string {
  const { t } = useLocaleStore();

  const titles: Record<string, string> = {
    "/dashboard": t.nav.dashboard,
    "/panel": "Panel",
    "/agents": t.nav.agents,
    "/agents/new": t.agents.createTitle,
    "/products": t.products.title,
    "/billing": t.nav.billing,
    "/settings": t.nav.settings,
    "/chats": "Chats",
    "/calendar": "Calendario",
  };

  if (titles[pathname]) return titles[pathname];
  if (pathname.match(/^\/agents\/[^/]+\/products$/)) return t.products.title;
  if (pathname.match(/^\/agents\/[^/]+\/contacts$/)) return t.contacts.title;
  if (pathname.match(/^\/agents\/[^/]+\/faqs$/)) return t.faqEditor.title;
  if (pathname.match(/^\/agents\/[^/]+\/settings$/)) return t.agentSettings.title;
  if (pathname.match(/^\/agents\/[^/]+\/whatsapp$/)) return t.whatsapp.title;
  if (pathname.match(/^\/agents\/[^/]+\/analytics$/)) return t.analytics.title;
  if (pathname.match(/^\/agents\/[^/]+\/conversations$/)) return t.conversations.title;
  if (pathname.match(/^\/agents\/[^/]+\/crm$/)) return t.crm.title;
  if (pathname.match(/^\/agents\/[^/]+\/train$/)) return t.trainingChat.title;
  if (pathname === "/lisa") return "Lisa";
  if (pathname.match(/^\/lisa\/[^/]+$/)) return "Lisa";
  if (pathname.match(/^\/agents\/[^/]+$/)) return t.agents.overview;
  return "Lisa";
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <Image
            src="/lisa-isologo-naranja.png"
            alt="Lisa"
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = usePageTitle(pathname);
  const { collapsed, setMobileOpen } = useSidebarStore();
  const isLisa = pathname === "/lisa" || pathname.startsWith("/lisa/");
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { loadAgents, loadingAgents, agents } = useAgentStore();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/sign-in");
      return;
    }
    loadAgents().finally(() => setInitialLoad(false));
  }, [isAuthenticated, router, loadAgents]);

  // Show splash while initial data loads
  if (initialLoad && agents.length === 0) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        {/* ── Mobile header (hamburger only — replaces topbar + bottom tab bar) ── */}
        <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-3 bg-background/80 backdrop-blur-xl px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          <h1 className="flex-1 text-[17px] font-semibold tracking-tight">{title}</h1>

          {/* New chat button — only on Lisa page */}
          {isLisa && (
            <Link
              href="/lisa"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Nueva conversación"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </header>

        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      <BottomTabBar />
    </div>
  );
}
