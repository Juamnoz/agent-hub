"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus, Bot, Zap, Building2, Users, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { useAuthStore } from "@/stores/auth-store";
import { usePlanStore } from "@/stores/plan-store";
import { PLAN_AGENT_LIMITS } from "@/lib/mock-data";
import type { Agent } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

// ── Smart alerts for agent configuration ─────────────────────────────────────

interface AgentAlert {
  agentId: string;
  agentName: string;
  type: "warning" | "tip";
  text: string;
  href: string;
  action: string;
}

function buildAlerts(agents: Agent[]): AgentAlert[] {
  const alerts: AgentAlert[] = [];
  for (const agent of agents) {
    if (agent.status === "inactive") continue;
    // WhatsApp: solo alertar si NO tiene webhook configurado
    if (!agent.webhookUrl && !agent.whatsappConnected) {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "warning",
        text: "WhatsApp no conectado — el agente no puede responder",
        href: `/agents/${agent.id}/whatsapp`, action: "Conectar",
      });
    }
    // Entrenamiento pendiente
    if (!agent.trainedAt) {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "warning",
        text: "Agente sin entrenar — entrénalo para que empiece a responder",
        href: `/agents/${agent.id}/train`, action: "Entrenar",
      });
    }
    // FAQs insuficientes
    if (agent.faqCount < 10) {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "tip",
        text: agent.faqCount === 0
          ? "Sin FAQs — agrega preguntas frecuentes para mejorar las respuestas"
          : `Solo ${agent.faqCount} FAQ${agent.faqCount > 1 ? "s" : ""} — se recomiendan 20+ para buenas respuestas`,
        href: `/agents/${agent.id}/faqs`, action: "Agregar",
      });
    }
    // Productos / catálogo
    if (agent.productCount === 0) {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "tip",
        text: "Sin productos cargados — agrega tu catálogo para que el agente los recomiende",
        href: `/agents/${agent.id}/products`, action: "Agregar",
      });
    }
    // Redes sociales incompletas
    const links = agent.socialLinks;
    if (!links || !Object.values(links).some(Boolean)) {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "tip",
        text: "Sin redes sociales — agrega links para que el agente los comparta",
        href: `/agents/${agent.id}/settings`, action: "Configurar",
      });
    }
    // Agente en setup (no activo)
    if (agent.status === "setup") {
      alerts.push({
        agentId: agent.id, agentName: agent.name, type: "tip",
        text: "Agente en configuración — actívalo cuando esté listo",
        href: `/agents/${agent.id}`, action: "Ver",
      });
    }
  }
  return alerts.slice(0, 6);
}

function AlertCard({ alert }: { alert: AgentAlert }) {
  const isWarning = alert.type === "warning";
  return (
    <Link
      href={alert.href}
      className="flex items-center gap-3 rounded-2xl bg-card ring-1 ring-border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99]"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        isWarning ? "bg-amber-50 dark:bg-amber-500/15" : "bg-blue-50 dark:bg-blue-500/15"
      }`}>
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <Lightbulb className="h-4 w-4 text-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-muted-foreground truncate">{alert.agentName}</p>
        <p className="text-[15px] font-medium leading-tight">{alert.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[14px] font-medium text-muted-foreground">{alert.action}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}

/** Group agents by organization (for superadmin view) */
function groupByOrg(agents: any[]) {
  const groups: Record<string, { orgName: string; orgSlug: string; agents: any[] }> = {};
  for (const agent of agents) {
    const orgSlug = agent.organization?.slug ?? "sin-org";
    const orgName = agent.organization?.name ?? "Sin organización";
    if (!groups[orgSlug]) {
      groups[orgSlug] = { orgName, orgSlug, agents: [] };
    }
    groups[orgSlug].agents.push(agent);
  }
  return Object.values(groups);
}

export default function AgentsPage() {
  const { agents, loadAgents, loadingAgents } = useAgentStore();
  const { t } = useLocaleStore();
  const { user } = useAuthStore();
  const { currentPlan, canAddAgent } = usePlanStore();

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const isSuperAdmin = user?.role === "superadmin";
  const atLimit = !isSuperAdmin && !canAddAgent(agents.length);
  const agentLimit = PLAN_AGENT_LIMITS[currentPlan];
  const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  // Superadmin: group by organization (always show admin view)
  if (isSuperAdmin) {
    const orgGroups = groupByOrg(agents);
    const allOrgs = user?.organizations ?? [];
    // Include orgs with 0 agents
    const orgSlugsWithAgents = new Set(orgGroups.map(g => g.orgSlug));
    const emptyOrgs = allOrgs.filter(o => !orgSlugsWithAgents.has(o.slug) && o.slug !== "aicstudioai");

    return (
      <div className="space-y-6 pb-24 lg:pb-8 lg:max-w-[960px] lg:mx-auto">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Panel de administración</h2>
            <span className="text-sm text-muted-foreground">
              · {orgGroups.length + emptyOrgs.length} clientes · {agents.length} agentes
            </span>
          </div>
          <Link
            href="/agents/new"
            className="flex items-center gap-1.5 rounded-full bg-muted px-3.5 h-8 text-[15px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.agents.newAgent}
          </Link>
        </motion.div>

        {/* Org groups with agents */}
        {orgGroups.map((group, gi) => (
          <motion.div key={group.orgSlug} {...fadeUp(gi * 0.08)} className="space-y-3">
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <Building2 className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold leading-tight">{group.orgName}</h3>
                <p className="text-[13px] text-muted-foreground">
                  {group.agents.length} agente{group.agents.length !== 1 ? "s" : ""}
                  {" · "}
                  {group.agents.filter((a: any) => a.status === "active").length} activo{group.agents.filter((a: any) => a.status === "active").length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.agents.map((agent: Agent, i: number) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28, delay: i * 0.05 }}
                >
                  <AgentCard agent={agent} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Orgs without agents */}
        {emptyOrgs.map((org, i) => (
          <motion.div key={org.slug} {...fadeUp((orgGroups.length + i) * 0.08)} className="space-y-3">
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold leading-tight">{org.name}</h3>
                <p className="text-[13px] text-muted-foreground">Sin agentes configurados</p>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-4 text-center">
              <p className="text-sm text-muted-foreground">Este cliente aún no tiene agentes</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Normal user view (unchanged)
  return (
    <div className="space-y-4 pb-24 lg:pb-8 lg:max-w-[900px] lg:mx-auto">
      {agents.length > 0 ? (
        <>
          {atLimit && (
            <motion.div
              {...fadeUp(0)}
              className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[14px] text-amber-800 dark:text-amber-300">
                  Has alcanzado el límite de <span className="font-semibold">{agentLimit} agentes</span> en tu plan <span className="font-semibold">{planName}</span>.
                </p>
              </div>
              <Link
                href="/billing"
                className="shrink-0 text-[13px] font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
              >
                Ver planes →
              </Link>
            </motion.div>
          )}
          {isSuperAdmin && (
            <motion.div {...fadeUp(atLimit ? 0.06 : 0)} className="flex items-center justify-end">
              {atLimit ? (
                <Link
                  href="/billing"
                  className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-3.5 h-8 text-[15px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Límite alcanzado — Actualizar plan
                </Link>
              ) : (
                <Link
                  href="/agents/new"
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3.5 h-8 text-[15px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.agents.newAgent}
                </Link>
              )}
            </motion.div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: Agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 28, delay: i * 0.07 }}
              >
                <AgentCard agent={agent} disabled={!isSuperAdmin && agent.status === "inactive"} />
              </motion.div>
            ))}
          </div>

          {/* Lisa sugiere — solo para clientes */}
          {!isSuperAdmin && (() => {
            const activeAgents = agents.filter(a => a.status !== "inactive");
            const alerts = buildAlerts(activeAgents);
            if (alerts.length === 0) return null;
            return (
              <motion.div {...fadeUp(0.2)} className="space-y-2 mt-2">
                <p className="text-[14px] font-medium text-muted-foreground px-0.5">Lisa sugiere</p>
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <AlertCard key={i} alert={alert} />
                  ))}
                </div>
              </motion.div>
            );
          })()}
        </>
      ) : (
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bot className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">
            {t.agents.noAgentsTitle}
          </h3>
          <p className="mb-4 max-w-sm text-sm text-gray-500">
            {t.agents.noAgentsDescription}
          </p>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.dashboard.createFirstAgent}
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
