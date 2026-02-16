"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useLocaleStore } from "@/stores/locale-store";

function usePageTitle(pathname: string): string {
  const { t } = useLocaleStore();

  const titles: Record<string, string> = {
    "/dashboard": t.nav.dashboard,
    "/agents": t.nav.agents,
    "/agents/new": t.agents.createTitle,
    "/billing": t.nav.billing,
    "/settings": t.nav.settings,
  };

  if (titles[pathname]) return titles[pathname];
  if (pathname.match(/^\/agents\/[^/]+\/contacts$/)) return t.contacts.title;
  if (pathname.match(/^\/agents\/[^/]+\/faqs$/)) return t.faqEditor.title;
  if (pathname.match(/^\/agents\/[^/]+\/settings$/)) return t.agentSettings.title;
  if (pathname.match(/^\/agents\/[^/]+\/whatsapp$/)) return t.whatsapp.title;
  if (pathname.match(/^\/agents\/[^/]+\/analytics$/)) return t.analytics.title;
  if (pathname.match(/^\/agents\/[^/]+$/)) return t.agents.overview;
  return "Agent Hub";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const title = usePageTitle(pathname);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="lg:pl-60">
        <Topbar
          title={title}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
