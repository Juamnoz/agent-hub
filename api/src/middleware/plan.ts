export const PLAN_LIMITS = {
  starter: { agents: 1, messages: 1000, whatsapp: 1, integrations: 2 },
  pro: { agents: 3, messages: 3000, whatsapp: 3, integrations: 5 },
  business: { agents: 10, messages: 15000, whatsapp: 5, integrations: Infinity },
  enterprise: {
    agents: Infinity,
    messages: Infinity,
    whatsapp: Infinity,
    integrations: Infinity,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export function checkLimit(
  planTier: string,
  resource: keyof (typeof PLAN_LIMITS)["starter"],
  currentCount: number
): boolean {
  const limits = PLAN_LIMITS[planTier as PlanTier];
  if (!limits) return false;
  return currentCount < limits[resource];
}
