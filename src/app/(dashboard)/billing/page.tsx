"use client";

import {
  CreditCard,
  Check,
  Bot,
  MessageSquare,
  Smartphone,
  Star,
  Zap,
  Building2,
  Crown,
} from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

const PLANS = [
  { key: "starter" as const, price: 30, agents: 1, conversations: 1000, integrations: 2, icon: Zap },
  { key: "pro" as const, price: 80, agents: 3, conversations: 3000, integrations: 5, icon: Star },
  { key: "business" as const, price: 200, agents: 5, conversations: 15000, integrations: -1, icon: Building2 },
  { key: "enterprise" as const, price: 500, agents: -1, conversations: -1, integrations: -1, icon: Crown },
] as const;

const CURRENT_PLAN = "pro";

export default function BillingPage() {
  const { t } = useLocaleStore();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.billing.title}</h1>
        <p className="text-sm text-gray-500">{t.billing.manageSubscription}</p>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === CURRENT_PLAN;
          const planT = t.billing.plans[plan.key];
          const Icon = plan.icon;

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 transition-shadow hover:shadow-md ${
                isCurrent ? "border-orange-500 shadow-orange-100 shadow-md" : "border-gray-100"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-semibold text-white">
                  {t.billing.currentPlanBadge}
                </span>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isCurrent ? "bg-orange-100" : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isCurrent ? "text-orange-600" : "text-gray-600"}`}
                    />
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900">{planT.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500">{t.billing.perMonth}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 mb-5">
                {planT.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {plan.key === "enterprise" ? (
                <button
                  onClick={() => toast.info(t.billing.contactSales)}
                  className="w-full rounded-xl border-2 border-gray-200 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.billing.contactSales}
                </button>
              ) : isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl bg-orange-500 py-2.5 text-[13px] font-semibold text-white opacity-70 cursor-default"
                >
                  {t.billing.currentPlanBadge}
                </button>
              ) : (
                <button
                  onClick={() => toast.info(t.billing.changePlan)}
                  className="w-full rounded-xl bg-gray-900 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  {t.billing.changePlan}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage section */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">{t.billing.usage}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Agents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-orange-500" />
                <span className="text-[13px] font-medium text-gray-700">{t.billing.agentsUsage}</span>
              </div>
              <span className="text-[13px] font-semibold text-gray-900">3 / 3</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-orange-500" style={{ width: "100%" }} />
            </div>
          </div>
          {/* Conversations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                <span className="text-[13px] font-medium text-gray-700">{t.billing.messagesUsage}</span>
              </div>
              <span className="text-[13px] font-semibold text-gray-900">124 / 3,000</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${Math.round((124 / 3000) * 100)}%` }}
              />
            </div>
          </div>
          {/* WhatsApp lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span className="text-[13px] font-medium text-gray-700">{t.billing.whatsappLines}</span>
              </div>
              <span className="text-[13px] font-semibold text-gray-900">2 / 5</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-green-500" style={{ width: "40%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-4">{t.billing.paymentMethod}</h2>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-gray-900">
                {t.billing.visaEnding} 4242
              </p>
              <p className="text-[12px] text-gray-500">{t.billing.expires} 12/2027</p>
            </div>
          </div>
          <button
            onClick={() => toast.info(t.billing.updatePayment)}
            className="rounded-xl border px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t.billing.updatePayment}
          </button>
        </div>
      </div>
    </div>
  );
}
