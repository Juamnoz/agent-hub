"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { useLocaleStore } from "@/stores/locale-store";
import { useSidebarStore } from "@/stores/sidebar-store";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = usePageTitle(pathname);
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <Topbar title={title} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      <BottomTabBar />
    </div>
  );
}
