"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Globe,
  CheckCircle2,
  Bot,
  Sparkles,
  Users,
  Trash2,
  CreditCard,
  FileText,
  Package,
  Lock,
  Table2,
  Calendar,
  Mail,
  ShoppingBag,
  MessageSquare,
  Settings,
} from "lucide-react";
import { IconWhatsApp } from "@/components/icons/brand-icons";
import { useAgentStore } from "@/stores/agent-store";
import { type Integration, type Agent, PLAN_INTEGRATION_LIMITS, CURRENT_PLAN, ALGORITHM_RECOMMENDED_INTEGRATIONS } from "@/lib/mock-data";
import type { Translations } from "@/lib/i18n/types";
import { useLocaleStore } from "@/stores/locale-store";
import { SetupWizard } from "@/components/agents/setup-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IntegrationConfigDialog } from "@/components/agents/integration-config-dialog";

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
  const { agents, faqs, products, integrations, deleteAgent, updateAgent, loadIntegrations, loadProducts, toggleIntegration } = useAgentStore();
  const { t } = useLocaleStore();
  const router = useRouter();
  const agent = agents.find((a) => a.id === agentId);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    loadIntegrations(agentId);
    loadProducts(agentId);
  }, [agentId, loadIntegrations, loadProducts]);

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

  // Show setup wizard for new agents
  if (agent.status === "setup") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/agents">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
        <SetupWizard agentId={agentId} />
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
  const hasWhatsapp = agent.whatsappConnected;
  const hasSocial =
    agent.socialLinks &&
    Object.values(agent.socialLinks).some((v) => v && v.trim());


  // Deployment steps — pasos para desplegar el algoritmo
  const deploySteps = [
    {
      id: "personality",
      title: "Algoritmo y personalidad",
      description: agent.algorithmType ? "Tipo de agente configurado" : "Define el tipo y tono del agente",
      done: !!agent.algorithmType,
      href: `/agents/${agentId}/settings`,
    },
    {
      id: "faqs",
      title: "Preguntas frecuentes",
      description: agent.faqCount >= 10
        ? `${agent.faqCount} FAQs cargadas`
        : `${agent.faqCount} FAQs — se recomiendan 10+`,
      done: agent.faqCount >= 10,
      href: `/agents/${agentId}/faqs`,
    },
    {
      id: "whatsapp",
      title: "WhatsApp Business",
      description: hasWhatsapp ? "Canal conectado" : "Conecta tu número de WhatsApp",
      done: hasWhatsapp,
      href: `/agents/${agentId}/whatsapp`,
    },
    {
      id: "social",
      title: "Web y redes sociales",
      description: hasSocial ? "Contexto de negocio añadido" : "Agrega tu sitio o perfiles",
      done: !!hasSocial,
      href: `/agents/${agentId}/social`,
    },
  ];
  const completedDeployCount = deploySteps.filter((s) => s.done).length;
  const allDeployed = completedDeployCount === deploySteps.length;

  // Stories bar — 7 secciones del agente
  const storyItems = [
    {
      id: "faqs",
      label: t.agents.setupCards.faqsTitle,
      icon: HelpCircle,
      href: `/agents/${agentId}/faqs`,
      configured: hasFaqs,
      stat: `${agent.faqCount}`,
      color: "amber",
    },
    {
      id: "chat",
      label: t.agents.setupCards.conversationsTitle,
      icon: MessageSquare,
      href: `/agents/${agentId}/conversations`,
      configured: true,
      stat: "",
      color: "blue",
    },
    {
      id: "train",
      label: t.trainingChat.quickActionTitle,
      icon: Sparkles,
      href: `/agents/${agentId}/train`,
      configured: true,
      stat: "",
      color: "lisa",
    },
    {
      id: "clientes",
      label: t.agents.setupCards.crmTitle,
      icon: Users,
      href: `/agents/${agentId}/crm`,
      configured: true,
      stat: "",
      color: "rose",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: null,
      href: `/agents/${agentId}/whatsapp`,
      configured: hasWhatsapp,
      stat: hasWhatsapp ? t.agents.connected : t.agents.notConnected,
      color: "emerald",
    },
    {
      id: "social",
      label: t.agents.setupCards.socialTitle,
      icon: Globe,
      href: `/agents/${agentId}/social`,
      configured: !!hasSocial,
      stat: hasSocial
        ? `${Object.values(agent.socialLinks!).filter((v) => v && v.trim()).length}`
        : "",
      color: "orange",
    },
    {
      id: "stats",
      label: t.agents.setupCards.analyticsTitle,
      icon: BarChart3,
      href: `/agents/${agentId}/analytics`,
      configured: true,
      stat: "",
      color: "gray",
    },
    {
      id: "settings",
      label: "Configuración",
      icon: Settings,
      href: `/agents/${agentId}/settings`,
      configured: true,
      stat: "",
      color: "slate",
    },
  ];

  const storyColorMap: Record<string, { circle: string; icon: string }> = {
    amber: { circle: "bg-amber-100 dark:bg-amber-500/20", icon: "text-amber-600 dark:text-amber-400" },
    blue: { circle: "bg-blue-100 dark:bg-blue-500/20", icon: "text-blue-600 dark:text-blue-400" },
    lisa: { circle: "bg-gradient-to-br from-orange-400 to-orange-600", icon: "text-white" },
    rose: { circle: "bg-rose-100 dark:bg-rose-500/20", icon: "text-rose-600 dark:text-rose-400" },
    emerald: { circle: "bg-emerald-100 dark:bg-emerald-500/20", icon: "text-emerald-600 dark:text-emerald-400" },
    orange: { circle: "bg-orange-100 dark:bg-orange-500/20", icon: "text-orange-600 dark:text-orange-400" },
    gray: { circle: "bg-gray-100 dark:bg-white/10", icon: "text-gray-600 dark:text-gray-400" },
    slate: { circle: "bg-slate-100 dark:bg-slate-500/20", icon: "text-slate-600 dark:text-slate-400" },
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

      {/* Agent Hero Card — 2 filas */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Fila 1: identidad */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[17px] font-bold tracking-tight truncate">{agent.name}</h1>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]}`} />
            </div>
            <p className="text-[13px] text-muted-foreground truncate">{agent.hotelName}</p>
          </div>
        </div>
        {/* Fila 2: toggle activo/inactivo */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/30">
          <div>
            <p className="text-[13px] font-medium leading-tight">
              {agent.status === "active" ? "Activo — respondiendo mensajes" : "Pausado — no responde"}
            </p>
          </div>
          <button
            onClick={() => {
              const next = agent.status === "active" ? "inactive" : "active";
              updateAgent(agentId, { status: next });
              toast.success(next === "active" ? "Agente activado" : "Agente pausado");
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
              agent.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/25"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                agent.status === "active" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Deployment steps — pasos pendientes para desplegar el algoritmo */}
      {!allDeployed && (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
            <div>
              <p className="text-[13px] font-semibold leading-tight">Para desplegar el algoritmo</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedDeployCount} de {deploySteps.length} pasos completados
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/15">
              <span className="text-[13px] font-bold text-orange-500">
                {Math.round((completedDeployCount / deploySteps.length) * 100)}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mx-4 mb-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(completedDeployCount / deploySteps.length) * 100}%` }}
            />
          </div>
          {/* Steps */}
          <div className="border-t border-border/60 divide-y divide-border/60">
            {deploySteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-center gap-3 px-4 py-3 active:bg-muted/40 transition-colors"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full ring-1 ring-border bg-muted/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium leading-tight ${step.done ? "text-muted-foreground" : "text-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {step.done ? (
                  <span className="text-[10px] font-semibold text-emerald-500 shrink-0">Listo</span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stories bar — 2 filas, 4 columnas */}
      <div className="grid grid-cols-4 gap-x-1 gap-y-4">
        {storyItems.map((item) => {
          const storyColors = storyColorMap[item.color];
          const circleStyle = item.configured ? storyColors.circle : "bg-muted";
          const iconStyle = item.configured ? storyColors.icon : "text-muted-foreground";
          const StoryIcon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center ${circleStyle}`}
              >
                {item.id === "whatsapp" ? (
                  <IconWhatsApp className={`h-7 w-7 ${iconStyle}`} />
                ) : StoryIcon ? (
                  <StoryIcon className={`h-6 w-6 ${iconStyle}`} />
                ) : null}
              </div>
              <div className="flex flex-col items-center max-w-[64px]">
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {item.label}
                </span>
                {item.stat && (
                  <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                    {item.stat}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Integrations Section */}
      <IntegrationsSection
        integrations={integrations}
        onToggle={toggleIntegration}
        onConfigure={setConfigIntegration}
        t={t}
        agent={agent}
      />

      {/* Integration Config Dialog */}
      <IntegrationConfigDialog
        integration={configIntegration}
        open={!!configIntegration}
        onOpenChange={(open) => { if (!open) setConfigIntegration(null); }}
      />

      {/* Delete Agent - iOS action sheet style */}
      <div className="pt-4">
        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            className="w-full rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-red-500 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] active:bg-red-50"
          >
            {t.agentSettings.deleteAgent}
          </button>
        )}

        {deleteStep === 1 && (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-5 py-4 text-center border-b border-border">
              <p className="text-[15px] font-semibold">{t.agentSettings.deleteConfirmTitle}</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                {t.agentSettings.deleteConfirmDescription}
              </p>
            </div>
            <button
              onClick={() => setDeleteStep(2)}
              className="w-full px-4 py-3 text-[15px] font-medium text-red-500 border-b border-border transition-colors active:bg-red-50"
            >
              {t.agentSettings.deletePermanently}
            </button>
            <button
              onClick={() => setDeleteStep(0)}
              className="w-full px-4 py-3 text-[15px] font-medium text-orange-600 transition-colors active:bg-orange-50"
            >
              {t.common.cancel}
            </button>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="rounded-2xl bg-white ring-1 ring-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-5 py-4 text-center border-b border-red-100 bg-red-50/50">
              <Trash2 className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-[14px] font-semibold text-red-600">
                {t.agentSettings.deleteConfirmTitle}
              </p>
              <p className="text-[12px] text-red-500/80 mt-0.5">
                {t.agentSettings.deleteConfirmDescription}
              </p>
            </div>
            <button
              onClick={() => {
                deleteAgent(agentId);
                toast.success(t.agentSettings.agentDeleted);
                router.push("/agents");
              }}
              className="w-full px-4 py-3 text-[15px] font-semibold text-red-600 border-b border-red-100 transition-colors active:bg-red-50"
            >
              {t.agentSettings.deletePermanently}
            </button>
            <button
              onClick={() => setDeleteStep(0)}
              className="w-full px-4 py-3 text-[15px] font-medium text-orange-600 transition-colors active:bg-orange-50"
            >
              {t.common.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const INTEGRATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  FileText,
  Package,
  Table2,
  Calendar,
  Mail,
  Globe,
  ShoppingBag,
};

const PLAN_TIER_ORDER: Record<string, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };

function IntegrationsSection({
  integrations,
  onToggle,
  onConfigure,
  t,
  agent,
}: {
  integrations: Integration[];
  onToggle: (id: string) => void;
  onConfigure: (integration: Integration) => void;
  t: Translations;
  agent: Agent;
}) {
  const router = useRouter();
  const activeCount = integrations.filter((i) => i.enabled).length;
  const limit = PLAN_INTEGRATION_LIMITS[CURRENT_PLAN];
  const limitLabel = limit === Infinity ? "∞" : limit;

  const categories = [
    { key: "payments" as const, label: t.integrations.categories.payments },
    { key: "operations" as const, label: t.integrations.categories.operations },
    { key: "productivity" as const, label: t.integrations.categories.productivity },
    { key: "ecommerce" as const, label: t.integrations.categories.ecommerce },
  ];

  const recommendedIntegrations = agent.algorithmType
    ? ALGORITHM_RECOMMENDED_INTEGRATIONS[agent.algorithmType]
    : [];

  const isRecommended = (integration: Integration) =>
    recommendedIntegrations.includes(integration.name);

  const isLocked = (integration: Integration) =>
    PLAN_TIER_ORDER[integration.requiredPlan] > PLAN_TIER_ORDER[CURRENT_PLAN];

  const requiredPlanLabel = (integration: Integration) => {
    const labels: Record<string, string> = {
      starter: "Starter",
      pro: "Pro",
      business: "Business",
      enterprise: "Enterprise",
    };
    return labels[integration.requiredPlan];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[15px] font-semibold text-muted-foreground">
          {t.integrations.title} ({activeCount}/{limitLabel} {t.integrations.activeCount})
        </h2>
      </div>

      {categories.map((cat) => {
        const items = integrations.filter((i) => i.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="space-y-2">
            <h3 className="text-[13px] font-medium text-muted-foreground px-0.5">
              {cat.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((integration) => {
                const locked = isLocked(integration);
                const Icon = INTEGRATION_ICONS[integration.icon] ?? CreditCard;
                const itemT = t.integrations.items[integration.name as keyof typeof t.integrations.items];
                return (
                  <div
                    key={integration.id}
                    className={`flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all ${
                      locked ? "opacity-60 cursor-pointer" : ""
                    }`}
                    onClick={locked ? () => router.push("/billing") : undefined}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        locked ? "bg-muted" : "bg-orange-50 dark:bg-orange-500/15"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${locked ? "text-gray-400" : "text-orange-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold leading-tight">
                          {itemT?.name ?? integration.name}
                        </span>
                        {locked && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-amber-700 border-amber-200 bg-amber-50">
                            <Lock className="h-2.5 w-2.5" />
                            {requiredPlanLabel(integration)}
                          </Badge>
                        )}
                        {!locked && integration.configured && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {t.integrations.configured}
                          </Badge>
                        )}
                        {!locked && isRecommended(integration) && (
                          <Badge className="text-[10px] bg-orange-50 text-orange-700 border-orange-200" variant="outline">
                            {t.personalityBuilder.recommended}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                        {itemT?.description ?? integration.description}
                      </p>
                    </div>
                    {!locked && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Gear — solo si está activa */}
                        {integration.enabled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onConfigure(integration);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            title="Configurar"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!integration.enabled && activeCount >= limit) {
                              toast(t.integrations.limitReached);
                              return;
                            }
                            onToggle(integration.id);
                          }}
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                            integration.enabled ? "bg-emerald-500" : "bg-muted-foreground/20"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              integration.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                    {locked && (
                      <Lock className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
    blue: { bg: "bg-orange-50 dark:bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400" },
    violet: { bg: "bg-orange-50 dark:bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400" },
    orange: { bg: "bg-orange-50 dark:bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400" },
  };
  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.99] hover:shadow-md">
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
