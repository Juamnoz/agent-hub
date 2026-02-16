"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  Settings,
  Smartphone,
  BarChart3,
  Pencil,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  setup: "bg-yellow-100 text-yellow-800",
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const router = useRouter();
  const { agents } = useAgentStore();
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
    {
      label: t.whatsapp.title,
      href: `/agents/${agentId}/whatsapp`,
      icon: Smartphone,
    },
    {
      label: t.analytics.title,
      href: `/agents/${agentId}/analytics`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <Badge className={statusColors[agent.status]}>{statusLabels[agent.status]}</Badge>
            </div>
            <p className="text-sm text-gray-500">{agent.hotelName}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/agents/${agentId}/settings`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t.agents.editSettings}
            </Link>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview">
        <TabsList>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = index === 0;
            return (
              <TabsTrigger
                key={tab.label}
                value={tab.label.toLowerCase()}
                asChild={!isActive}
                className="gap-2"
              >
                {isActive ? (
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                ) : (
                  <Link href={tab.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <Separator />

      {/* Overview Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Agent Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t.agents.agentInfo}</CardTitle>
            <CardDescription>{t.agentSettings.basicInfoDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t.agents.hotel}</span>
              <span className="text-sm font-medium">{agent.hotelName}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t.agents.language}</span>
              <span className="text-sm font-medium">
                {t.agents.languageOptions[agent.language as keyof typeof t.agents.languageOptions] || agent.language}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t.agents.tone}</span>
              <span className="text-sm font-medium capitalize">
                {t.agents.toneOptions[agent.tone as keyof typeof t.agents.toneOptions] || agent.tone}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{t.whatsapp.title}</span>
              <Badge variant={agent.whatsappConnected ? "default" : "secondary"}>
                {agent.whatsappConnected ? t.agents.connected : t.agents.notConnected}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personality */}
        <Card>
          <CardHeader>
            <CardTitle>{t.agents.personality}</CardTitle>
            <CardDescription>{t.agentSettings.personalityToneDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {agent.personality ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {agent.personality}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">
                {t.agents.personalityPlaceholder}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agent.messageCount}</p>
              <p className="text-sm text-gray-500">{t.agents.messages}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <HelpCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agent.faqCount}</p>
              <p className="text-sm text-gray-500">{t.agents.faqs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {agent.whatsappConnected ? t.agents.connected : t.agents.notConnected}
              </p>
              <p className="text-sm text-gray-500">{t.agents.whatsappConnected}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
