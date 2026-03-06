"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Analytics from "../analytics/_content";
import Contacts from "../contacts/_content";
import Conversations from "../conversations/_content";
import Crm from "../crm/_content";
import Faqs from "../faqs/_content";
import Menu from "../menu/_content";
import Orders from "../orders/_content";
import Products from "../products/_content";
import Properties from "../properties/_content";
import Reservations from "../reservations/_content";
import Settings from "../settings/_content";
import Social from "../social/_content";
import Train from "../train/_content";
import Whatsapp from "../whatsapp/_content";

const TAB_MAP: Record<string, React.ComponentType<{ params: Promise<{ agentId: string }> }>> = {
  analytics: Analytics,
  contacts: Contacts,
  conversations: Conversations,
  crm: Crm,
  faqs: Faqs,
  menu: Menu,
  orders: Orders,
  products: Products,
  properties: Properties,
  reservations: Reservations,
  settings: Settings,
  social: Social,
  train: Train,
  whatsapp: Whatsapp,
};

export default function AgentTabRouter({
  params,
}: {
  params: Promise<{ agentId: string; tab: string[] }>;
}) {
  const { agentId, tab } = use(params);
  const tabKey = tab?.[0] ?? "";
  const Component = TAB_MAP[tabKey];
  if (!Component) return notFound();

  // Reconstruct params as a resolved Promise for child components
  const agentParams = Promise.resolve({ agentId }) as Promise<{ agentId: string }>;
  return <Component params={agentParams} />;
}
