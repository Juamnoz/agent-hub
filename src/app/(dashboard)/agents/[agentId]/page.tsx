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
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

  const tabs = [
    { label: t.agents.overview, href: `/agents/${agentId}`, icon: BarChart3 },
    { label: t.faqEditor.title, href: `/agents/${agentId}/faqs`, icon: HelpCircle },
    { label: t.agentSettings.title, href: `/agents/${agentId}/settings`, icon: Settings },
    { label: t.socialLinks.title, href: `/agents/${agentId}/social`, icon: Globe },
    { label: t.whatsapp.title, href: `/agents/${agentId}/whatsapp`, icon: Smartphone },
    { label: t.analytics.title, href: `/agents/${agentId}/analytics`, icon: BarChart3 },
  ];

  // Determine setup status for each card
  const agentFaqs = faqs.filter((f) => f.agentId === agentId);
  const hasFaqs = agent.faqCount > 0 || agentFaqs.length > 0;
  const hasPersonality = !!agent.personality?.trim();
  const hasWhatsapp = agent.whatsappConnected;
  const hasSocial =
    agent.socialLinks &&
    Object.values(agent.socialLinks).some((v) => v && v.trim());

  const completedSteps = [hasFaqs, hasPersonality, hasWhatsapp, hasSocial].filter(Boolean).length;
  const totalSteps = 4;

  const setupCards = [
    {
      title: t.agents.setupCards.faqsTitle,
      description: t.agents.setupCards.faqsDescription,
      icon: HelpCircle,
      href: `/agents/${agentId}/faqs`,
      configured: hasFaqs,
      stat: hasFaqs ? `${agent.faqCount} FAQs` : undefined,
      accentColor: "blue",
    },
    {
      title: t.agents.setupCards.personalityTitle,
      description: t.agents.setupCards.personalityDescription,
      icon: Sparkles,
      href: `/agents/${agentId}/settings`,
      configured: hasPersonality,
      stat: hasPersonality
        ? t.agents.toneOptions[agent.tone as keyof typeof t.agents.toneOptions]
        : undefined,
      accentColor: "violet",
    },
    {
      title: t.agents.setupCards.whatsappTitle,
      description: t.agents.setupCards.whatsappDescription,
      icon: Smartphone,
      href: `/agents/${agentId}/whatsapp`,
      configured: hasWhatsapp,
      stat: hasWhatsapp ? agent.whatsappPhoneNumber : undefined,
      accentColor: "emerald",
    },
    {
      title: t.agents.setupCards.socialTitle,
      description: t.agents.setupCards.socialDescription,
      icon: Globe,
      href: `/agents/${agentId}/social`,
      configured: !!hasSocial,
      stat: hasSocial
        ? `${Object.values(agent.socialLinks!).filter((v) => v && v.trim()).length} URLs`
        : undefined,
      accentColor: "orange",
    },
  ];

  const accentMap: Record<string, { bg: string; icon: string; border: string; ring: string }> = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-blue-100",
      ring: "ring-blue-600/10",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "text-violet-600",
      border: "border-violet-100",
      ring: "ring-violet-600/10",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: "border-emerald-100",
      ring: "ring-emerald-600/10",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      border: "border-orange-100",
      ring: "ring-orange-600/10",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/agents">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
                <Badge
                  variant="outline"
                  className={`${statusColors[agent.status]} gap-1.5 font-medium`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[agent.status]}`} />
                  {statusLabels[agent.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{agent.hotelName}</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/agents/${agentId}/settings`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t.agents.editSettings}
            </Link>
          </Button>
        </div>
      </div>

      {/* Tab Navigation - scrollable on mobile */}
      <div className="-mx-4 sm:mx-0">
        <nav className="flex overflow-x-auto scrollbar-hide border-b px-4 sm:px-0">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = index === 0;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors shrink-0 ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.agents.messages}
          </p>
          <p className="text-2xl font-bold tracking-tight mt-1">{agent.messageCount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.agents.faqs}
          </p>
          <p className="text-2xl font-bold tracking-tight mt-1">{agent.faqCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            WhatsApp
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`h-2 w-2 rounded-full ${
                agent.whatsappConnected ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-semibold">
              {agent.whatsappConnected ? t.agents.connected : t.agents.notConnected}
            </span>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Setup
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight">
              {completedSteps}/{totalSteps}
            </span>
            <div className="flex gap-0.5">
              {[hasFaqs, hasPersonality, hasWhatsapp, hasSocial].map((done, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-full ${done ? "bg-blue-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Setup Configuration Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {setupCards.map((card) => {
          const Icon = card.icon;
          const colors = accentMap[card.accentColor];

          return (
            <Link
              key={card.title}
              href={card.href}
              className="group block"
            >
              <Card className="relative overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-gray-300 group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-focus-visible:ring-offset-2">
                {/* Top accent line */}
                <div
                  className={`absolute inset-x-0 top-0 h-0.5 ${colors.bg.replace("50", "400")}`}
                  style={{
                    backgroundColor:
                      card.accentColor === "blue"
                        ? "#3b82f6"
                        : card.accentColor === "violet"
                        ? "#8b5cf6"
                        : card.accentColor === "emerald"
                        ? "#10b981"
                        : "#f97316",
                  }}
                />

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg} ring-1 ${colors.ring}`}
                      >
                        <Icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] leading-tight">
                            {card.title}
                          </h3>
                          {card.configured ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                          )}
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                          {card.description}
                        </p>
                        {card.stat && (
                          <Badge
                            variant="secondary"
                            className="mt-2.5 text-xs font-medium"
                          >
                            {card.stat}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 mt-1 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Analytics Preview */}
      <Link href={`/agents/${agentId}/analytics`} className="group block">
        <Card className="overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-gray-600/5">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px]">
                    {t.agents.setupCards.analyticsTitle}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {t.agents.setupCards.analyticsDescription}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-4 text-right">
                  <div>
                    <p className="text-lg font-bold">{agent.messageCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.agents.messages}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
