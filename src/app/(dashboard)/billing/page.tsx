"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Building2,
  Crown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlanStore } from "@/stores/plan-store";
import { useAgentStore } from "@/stores/agent-store";
import { toast } from "sonner";
import type { PlanTier } from "@/lib/mock-data";
import {
  PLAN_AGENT_LIMITS,
  PLAN_INTEGRATION_LIMITS,
  PLAN_MESSAGE_LIMITS,
  PLAN_WHATSAPP_LIMITS,
} from "@/lib/mock-data";

const PLANS = [
  { key: "starter" as const, price: 30, icon: Zap, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/15" },
  { key: "pro" as const, price: 80, icon: Star, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/15" },
  { key: "business" as const, price: 200, icon: Building2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/15" },
  { key: "enterprise" as const, price: null, icon: Crown, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/15" },
] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

function planLabel(limit: number) {
  return limit === Infinity ? "∞" : limit.toLocaleString();
}

export default function BillingPage() {
  const { t } = useLocaleStore();
  const { currentPlan, selectPlan } = usePlanStore();
  const { agents, integrations } = useAgentStore();

  const [pendingPlan, setPendingPlan] = useState<PlanTier | null>(null);

  const agentCount = agents.length;
  const activeIntegrations = integrations.filter((i) => i.enabled).length;
  const messageCount = 124; // mock

  const whatsappCount = agents.filter((a) => a.whatsappConnected).length;

  const agentLimit = PLAN_AGENT_LIMITS[currentPlan];
  const integrationLimit = PLAN_INTEGRATION_LIMITS[currentPlan];
  const messageLimit = PLAN_MESSAGE_LIMITS[currentPlan];
  const whatsappLimit = PLAN_WHATSAPP_LIMITS[currentPlan];

  const agentPct = agentLimit === Infinity ? 5 : Math.round((agentCount / agentLimit) * 100);
  const msgPct = messageLimit === Infinity ? 4 : Math.round((messageCount / messageLimit) * 100);
  const waPct = whatsappLimit === Infinity ? 33 : Math.round((whatsappCount / whatsappLimit) * 100);

  function confirmPlanChange() {
    if (!pendingPlan) return;
    selectPlan(pendingPlan);
    toast.success(`Plan cambiado a ${pendingPlan.charAt(0).toUpperCase() + pendingPlan.slice(1)}`);
    setPendingPlan(null);
  }

  const pendingPlanData = PLANS.find((p) => p.key === pendingPlan);
  const currentPlanData = PLANS.find((p) => p.key === currentPlan);

  // Determine upgrade vs downgrade
  const tierOrder: Record<PlanTier, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };
  const isUpgrade = pendingPlan ? tierOrder[pendingPlan] > tierOrder[currentPlan] : false;

  return (
    <div className="space-y-5 pb-4 lg:max-w-[720px] lg:mx-auto">

      {/* Current plan banner */}
      <motion.div {...fadeUp(0)} className="rounded-2xl bg-[#1a1a1a] dark:bg-[#111] ring-1 ring-orange-500/20 shadow-[0_2px_16px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <p className="text-[14px] font-medium text-white/40">{t.billing.currentPlanBadge}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              {currentPlanData && (
                <>
                  <h2 className="text-[24px] font-bold text-white">
                    {t.billing.plans[currentPlan].name}
                  </h2>
                  <span className="text-[15px] text-white/40">
                    {currentPlanData.price !== null ? `$${currentPlanData.price} ${t.billing.perMonth}` : "Enterprise"}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/20">
            {currentPlanData && <currentPlanData.icon className="h-6 w-6 text-orange-400" />}
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2.5 border-t border-white/8 pt-3 bg-white/3">
          <UsageBar
            label={`${agentCount} / ${planLabel(agentLimit)} agentes`}
            pct={agentPct}
          />
          <UsageBar
            label={`${messageCount.toLocaleString()} / ${planLabel(messageLimit)} mensajes`}
            pct={msgPct}
          />
          <UsageBar
            label={`${whatsappCount} / ${planLabel(whatsappLimit)} WhatsApp`}
            pct={waPct}
          />
        </div>
      </motion.div>

      {/* Plans */}
      <div className="space-y-2">
        <motion.h2 {...fadeUp(0.08)} className="text-[15px] font-medium text-muted-foreground px-0.5">
          Planes disponibles
        </motion.h2>
        <div className="space-y-2">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.key === currentPlan;
            const planT = t.billing.plans[plan.key];
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.12 + i * 0.06 }}
                className={`rounded-2xl bg-card ring-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden transition-all ${
                  isCurrent ? "ring-orange-400 dark:ring-orange-500" : "ring-border"
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${plan.bg}`}>
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold leading-tight">{planT.name}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[12px] font-semibold text-white">
                          {t.billing.currentPlanBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] text-muted-foreground">
                      {plan.price !== null ? (
                        <><span className="text-[20px] font-bold text-foreground">${plan.price}</span> {t.billing.perMonth}</>
                      ) : (
                        "A convenir"
                      )}
                    </p>
                  </div>
                </div>

                {/* Limits row */}
                <div className="px-4 pb-3 flex gap-4 flex-wrap">
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{planLabel(PLAN_AGENT_LIMITS[plan.key])}</span> agentes
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{planLabel(PLAN_MESSAGE_LIMITS[plan.key])}</span> mensajes
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{planLabel(PLAN_WHATSAPP_LIMITS[plan.key])}</span> WhatsApp
                  </span>
                </div>

                {/* Features */}
                <div className="px-4 pb-3 grid grid-cols-1 gap-1.5">
                  {planT.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-[15px] text-muted-foreground">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? "text-orange-500" : "text-emerald-500"}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div className="border-t border-border/60 bg-muted/30 px-4 py-3">
                  {plan.key === "enterprise" ? (
                    <button
                      onClick={() => toast.info(t.billing.contactSales)}
                      className="flex w-full items-center justify-between text-[15px] font-medium text-foreground"
                    >
                      {t.billing.contactSales}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : isCurrent ? (
                    <p className="text-[15px] text-muted-foreground text-center">Tu plan actual</p>
                  ) : (
                    <button
                      onClick={() => setPendingPlan(plan.key)}
                      className="flex w-full items-center justify-between text-[15px] font-semibold text-orange-600 dark:text-orange-400"
                    >
                      {t.billing.changePlan}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <motion.div {...fadeUp(0.38)} className="space-y-2">
        <h2 className="text-[15px] font-medium text-muted-foreground px-0.5">{t.billing.paymentMethod}</h2>
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold">{t.billing.visaEnding} 4242</p>
              <p className="text-[14px] text-muted-foreground">{t.billing.expires} 12/2027</p>
            </div>
            <button
              onClick={() => toast.info(t.billing.updatePayment)}
              className="text-[15px] font-medium text-orange-600 dark:text-orange-400"
            >
              Editar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cancel plan */}
      <motion.button
        {...fadeUp(0.44)}
        onClick={() => toast.error(t.billing.cancelPlan)}
        className="w-full rounded-2xl bg-card px-4 py-3.5 text-[17px] font-medium text-red-500 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98]"
      >
        {t.billing.cancelPlan}
      </motion.button>

      {/* ── Plan Change Confirmation Modal ── */}
      <AnimatePresence>
        {pendingPlan && pendingPlanData && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingPlan(null)}
            />
            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>

              <div className="px-5 pb-6 pt-3 space-y-4">
                {/* Title */}
                <div className="text-center space-y-1">
                  <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${pendingPlanData.bg}`}>
                    <pendingPlanData.icon className={`h-7 w-7 ${pendingPlanData.color}`} />
                  </div>
                  <h2 className="text-[22px] font-bold">
                    Cambiar a {t.billing.plans[pendingPlan].name}
                  </h2>
                  <p className="text-[15px] text-muted-foreground">
                    {isUpgrade ? "Obtendrás acceso inmediato a nuevas funciones" : "Tu plan se ajustará al bajar de categoría"}
                  </p>
                </div>

                {/* Summary of changes */}
                <div className="rounded-2xl bg-muted/50 p-4 space-y-2.5">
                  <SummaryRow
                    label="Agentes"
                    from={planLabel(PLAN_AGENT_LIMITS[currentPlan])}
                    to={planLabel(PLAN_AGENT_LIMITS[pendingPlan])}
                    isUpgrade={PLAN_AGENT_LIMITS[pendingPlan] >= PLAN_AGENT_LIMITS[currentPlan]}
                  />
                  <SummaryRow
                    label="Mensajes"
                    from={planLabel(PLAN_MESSAGE_LIMITS[currentPlan])}
                    to={planLabel(PLAN_MESSAGE_LIMITS[pendingPlan])}
                    isUpgrade={PLAN_MESSAGE_LIMITS[pendingPlan] >= PLAN_MESSAGE_LIMITS[currentPlan]}
                  />
                  <SummaryRow
                    label="WhatsApp"
                    from={planLabel(PLAN_WHATSAPP_LIMITS[currentPlan])}
                    to={planLabel(PLAN_WHATSAPP_LIMITS[pendingPlan])}
                    isUpgrade={PLAN_WHATSAPP_LIMITS[pendingPlan] >= PLAN_WHATSAPP_LIMITS[currentPlan]}
                  />
                  <SummaryRow
                    label="Integraciones"
                    from={planLabel(PLAN_INTEGRATION_LIMITS[currentPlan])}
                    to={planLabel(PLAN_INTEGRATION_LIMITS[pendingPlan])}
                    isUpgrade={PLAN_INTEGRATION_LIMITS[pendingPlan] >= PLAN_INTEGRATION_LIMITS[currentPlan]}
                  />
                </div>

                {/* Price */}
                {pendingPlanData.price !== null && (
                  <p className="text-center text-[15px] text-muted-foreground">
                    Nuevo precio:{" "}
                    <span className="font-bold text-foreground text-[18px]">${pendingPlanData.price}</span>
                    {" "}{t.billing.perMonth}
                  </p>
                )}

                {/* CTA */}
                <button
                  onClick={confirmPlanChange}
                  className="w-full rounded-2xl py-4 text-[17px] font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)",
                  }}
                >
                  Cambiar a {t.billing.plans[pendingPlan].name}
                </button>
                <button
                  onClick={() => setPendingPlan(null)}
                  className="w-full py-3 text-[17px] font-medium text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsageBar({ label, pct }: { label: string; pct: number }) {
  const isHigh = pct >= 90;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[14px] text-white/60 shrink-0 w-[170px] truncate">{label}</span>
      <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-white/90" : "bg-white/55"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className={`text-[13px] font-medium shrink-0 ${isHigh ? "text-white/90" : "text-white/50"}`}>
        {pct}%
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  from,
  to,
  isUpgrade,
}: {
  label: string;
  from: string;
  to: string;
  isUpgrade: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[15px]">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground/60 line-through text-[14px]">{from}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className={`font-semibold ${isUpgrade ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {to}
        </span>
      </div>
    </div>
  );
}
