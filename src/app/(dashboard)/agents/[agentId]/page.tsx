"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Settings,
  Smartphone,
  BarChart3,
  Pencil,
  Globe,
  CheckCircle2,
  Circle,
  Bot,
  Sparkles,
  Phone,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  setup: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, faqs } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t.agents.agentNotFound}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {t.agents.agentNotFoundDescription}
        </p>
        <Button asChild variant="outline">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    active: t.agents.status.active,
    inactive: t.agents.status.inactive,
    setup: t.agents.status.setup,
  };

  // Setup status
  const agentFaqs = faqs.filter((f) => f.agentId === agentId);
  const hasFaqs = agent.faqCount > 0 || agentFaqs.length > 0;
  const hasPersonality = !!agent.personality?.trim();
  const hasWhatsapp = agent.whatsappConnected;
  const hasSocial =
    agent.socialLinks &&
    Object.values(agent.socialLinks).some((v) => v && v.trim());
  const completedSteps = [hasFaqs, hasPersonality, hasWhatsapp, hasSocial].filter(Boolean).length;

  // Quick action cards (the main sections to configure)
  const quickActions = [
    {
      title: t.agents.setupCards.faqsTitle,
      icon: HelpCircle,
      href: `/agents/${agentId}/faqs`,
      configured: hasFaqs,
      stat: hasFaqs ? `${agent.faqCount}` : "0",
      color: "blue" as const,
    },
    {
      title: t.agents.setupCards.personalityTitle,
      icon: Sparkles,
      href: `/agents/${agentId}/settings`,
      configured: hasPersonality,
      stat: hasPersonality
        ? t.agents.toneOptions[agent.tone as keyof typeof t.agents.toneOptions]
        : "—",
      color: "violet" as const,
    },
    {
      title: t.contacts.title,
      icon: Phone,
      href: `/agents/${agentId}/contacts`,
      configured: true,
      stat: "",
      color: "amber" as const,
    },
    {
      title: t.agents.setupCards.whatsappTitle,
      icon: Smartphone,
      href: `/agents/${agentId}/whatsapp`,
      configured: hasWhatsapp,
      stat: hasWhatsapp ? t.agents.connected : "—",
      color: "emerald" as const,
    },
    {
      title: t.agents.setupCards.socialTitle,
      icon: Globe,
      href: `/agents/${agentId}/social`,
      configured: !!hasSocial,
      stat: hasSocial
        ? `${Object.values(agent.socialLinks!).filter((v) => v && v.trim()).length}`
        : "0",
      color: "orange" as const,
    },
    {
      title: t.agents.setupCards.analyticsTitle,
      icon: BarChart3,
      href: `/agents/${agentId}/analytics`,
      configured: true,
      stat: "",
      color: "gray" as const,
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
    gray: { bg: "bg-gray-100", icon: "text-gray-600" },
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/agents">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t.agents.backToAgents}
        </Link>
      </Button>

      {/* Agent Hero Card - contains identity + metrics */}
      <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Agent Identity */}
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[19px] font-bold tracking-tight">{agent.name}</h1>
                  <Badge
                    variant="outline"
                    className={`${statusColors[agent.status]} gap-1 text-[11px] font-medium px-1.5 py-0`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[agent.status]}`} />
                    {statusLabels[agent.status]}
                  </Badge>
                </div>
                <p className="text-[13px] text-muted-foreground">{agent.hotelName}</p>
              </div>
            </div>
            <Button asChild size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0">
              <Link href={`/agents/${agentId}/settings`}>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Inline Metrics - horizontal scroll on mobile like Apple Health */}
        <div className="mt-4 -mx-px">
          <div className="flex overflow-x-auto scrollbar-hide">
            <Link
              href={`/agents/${agentId}/analytics`}
              className="flex-1 min-w-[100px] shrink-0 px-4 sm:px-5 py-3.5 border-t border-r border-black/[0.06] last:border-r-0 hover:bg-gray-50/50 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3 w-3 text-blue-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t.agents.messages}
                </span>
              </div>
              <p className="text-[22px] font-bold tracking-tight leading-none">
                {agent.messageCount.toLocaleString()}
              </p>
            </Link>

            <Link
              href={`/agents/${agentId}/faqs`}
              className="flex-1 min-w-[80px] shrink-0 px-4 sm:px-5 py-3.5 border-t border-r border-black/[0.06] last:border-r-0 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <HelpCircle className="h-3 w-3 text-violet-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  FAQs
                </span>
              </div>
              <p className="text-[22px] font-bold tracking-tight leading-none">
                {agent.faqCount}
              </p>
            </Link>

            <Link
              href={`/agents/${agentId}/whatsapp`}
              className="flex-1 min-w-[100px] shrink-0 px-4 sm:px-5 py-3.5 border-t border-r border-black/[0.06] last:border-r-0 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Smartphone className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  WhatsApp
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    agent.whatsappConnected ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-[13px] font-semibold">
                  {agent.whatsappConnected ? t.agents.connected : t.agents.notConnected}
                </span>
              </div>
            </Link>

            <div className="flex-1 min-w-[100px] shrink-0 px-4 sm:px-5 py-3.5 border-t border-black/[0.06]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Setup
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold tracking-tight leading-none">
                  {completedSteps}/4
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {[hasFaqs, hasPersonality, hasWhatsapp, hasSocial].map((done, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-3 rounded-full ${done ? "bg-blue-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid - iOS-style rounded icon grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colors = colorMap[action.color];
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group block"
            >
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.96] hover:shadow-md">
                <div className="relative">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  {action.configured && action.color !== "gray" ? (
                    <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-white rounded-full" />
                  ) : !action.configured ? (
                    <Circle className="absolute -top-1 -right-1 h-4 w-4 text-gray-300 bg-white rounded-full" />
                  ) : null}
                </div>
                <span className="text-[12px] font-medium text-center leading-tight line-clamp-2">
                  {action.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Detailed Setup Cards - only unconfigured items shown prominently */}
      {completedSteps < 4 && (
        <div className="space-y-2.5">
          <h2 className="text-[15px] font-semibold text-muted-foreground px-0.5">
            {t.agents.setupCards.pending}
          </h2>
          {!hasFaqs && (
            <SetupCard
              title={t.agents.setupCards.faqsTitle}
              description={t.agents.setupCards.faqsDescription}
              icon={HelpCircle}
              href={`/agents/${agentId}/faqs`}
              color="blue"
            />
          )}
          {!hasPersonality && (
            <SetupCard
              title={t.agents.setupCards.personalityTitle}
              description={t.agents.setupCards.personalityDescription}
              icon={Sparkles}
              href={`/agents/${agentId}/settings`}
              color="violet"
            />
          )}
          {!hasWhatsapp && (
            <SetupCard
              title={t.agents.setupCards.whatsappTitle}
              description={t.agents.setupCards.whatsappDescription}
              icon={Smartphone}
              href={`/agents/${agentId}/whatsapp`}
              color="emerald"
            />
          )}
          {!hasSocial && (
            <SetupCard
              title={t.agents.setupCards.socialTitle}
              description={t.agents.setupCards.socialDescription}
              icon={Globe}
              href={`/agents/${agentId}/social`}
              color="orange"
            />
          )}
        </div>
      )}
    </div>
  );
}

function SetupCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
  };
  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.99] hover:shadow-md">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
        >
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
      </div>
    </Link>
  );
}
