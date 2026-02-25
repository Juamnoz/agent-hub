import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type PlanTier,
  type PlanFeature,
  PLAN_AGENT_LIMITS,
  PLAN_INTEGRATION_LIMITS,
  PLAN_MESSAGE_LIMITS,
  PLAN_WHATSAPP_LIMITS,
  PLAN_FEATURES,
} from "@/lib/mock-data";

interface PlanStore {
  currentPlan: PlanTier;
  selectPlan: (plan: PlanTier) => void;
  canAddAgent: (currentCount: number) => boolean;
  canAddIntegration: (currentCount: number) => boolean;
  getAgentLimit: () => number;
  getIntegrationLimit: () => number;
  getMessageLimit: () => number;
  getWhatsAppLimit: () => number;
  hasFeature: (feature: PlanFeature) => boolean;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      currentPlan: "business",

      selectPlan: (plan) => set({ currentPlan: plan }),

      canAddAgent: (currentCount) => {
        const limit = PLAN_AGENT_LIMITS[get().currentPlan];
        return currentCount < limit;
      },

      canAddIntegration: (currentCount) => {
        const limit = PLAN_INTEGRATION_LIMITS[get().currentPlan];
        return currentCount < limit;
      },

      getAgentLimit: () => PLAN_AGENT_LIMITS[get().currentPlan],

      getIntegrationLimit: () => PLAN_INTEGRATION_LIMITS[get().currentPlan],

      getMessageLimit: () => PLAN_MESSAGE_LIMITS[get().currentPlan],

      getWhatsAppLimit: () => PLAN_WHATSAPP_LIMITS[get().currentPlan],

      hasFeature: (feature) => {
        const features = PLAN_FEATURES[get().currentPlan];
        return features.includes(feature);
      },
    }),
    {
      name: "lisa-plan",
    }
  )
);
