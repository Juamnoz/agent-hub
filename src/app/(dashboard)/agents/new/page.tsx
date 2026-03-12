"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Bot,
  Check,
  ShoppingCart,
  CalendarCheck,
  MessageCircle,
  Building2,
  UtensilsCrossed,
  Home,
  Globe,
  Zap,
  Link,
  CheckCircle2,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlanStore } from "@/stores/plan-store";
import { PLAN_AGENT_LIMITS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlgorithmType } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3; // steps 0–2

type BusinessTypeConfig = {
  key: AlgorithmType;
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  circleBg: string;
  iconColor: string;
  comingSoon?: boolean;
};

const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    key: "ecommerce",
    name: "E-commerce",
    description: "Tienda en línea con catálogo y carrito",
    Icon: ShoppingCart,
    circleBg: "bg-orange-100 dark:bg-orange-500/15",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "appointments",
    name: "Citas y reservas",
    description: "Agenda médica, consultoría o servicios",
    Icon: CalendarCheck,
    circleBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "whatsapp-store",
    name: "Tienda WhatsApp",
    description: "Ventas directas con catálogo por WhatsApp",
    Icon: MessageCircle,
    circleBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "hotel",
    name: "Hotel",
    description: "Atención a huéspedes y servicios del hotel",
    Icon: Building2,
    circleBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "restaurant",
    name: "Restaurante",
    description: "Menú, reservas y pedidos a domicilio",
    Icon: UtensilsCrossed,
    circleBg: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    key: "inmobiliaria",
    name: "Inmobiliaria",
    description: "Captación de clientes y gestión de propiedades",
    Icon: Home,
    circleBg: "bg-teal-100 dark:bg-teal-500/15",
    iconColor: "text-teal-600 dark:text-teal-400",
    comingSoon: true,
  },
];

// Step hero configs (step 0 and 2 have custom layouts)
type StepHero = {
  Icon: React.ComponentType<{ className?: string }>;
  circleBg: string;
  iconColor: string;
  sectionLabel: string;
  title: string;
  subtitle: string;
};

const STEP_HEROES: (StepHero | null)[] = [
  null, // 0 — business type grid
  {
    Icon: Bot,
    circleBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-500",
    sectionLabel: "Configuración",
    title: "Tu agente",
    subtitle: "Dale un nombre y configura los datos básicos",
  },
  null, // 2 — success screen
];

const STEP_CTA = [
  "Continuar",
  "Crear agente",
  "", // success step has its own button
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function NewAgentPage() {
  const router = useRouter();
  const { addAgent, updateAgent, agents } = useAgentStore();
  const { t } = useLocaleStore();
  const { currentPlan, canAddAgent } = usePlanStore();

  // Wizard navigation
  const [step, setStep] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Step 0 — business type
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType | null>(null);

  // Step 1 — basic data + webhook
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [language, setLanguage] = useState("es");
  const [webhookUrl, setWebhookUrl] = useState("");

  // Derived
  const businessNameLabel = algorithmType
    ? t.personalityBuilder.hotelNameLabels[
        (algorithmType === "whatsapp-store"
          ? "whatsappStore"
          : algorithmType) as keyof typeof t.personalityBuilder.hotelNameLabels
      ]
    : t.agents.hotelName;

  // Progress (0 % at step 0, 100 % fully into step 2)
  const progress = step / (TOTAL_STEPS - 1);

  // ── CTA enable condition ────────────────────────────────────
  const atAgentLimit = !canAddAgent(agents.length);

  const canContinue =
    step === 0
      ? algorithmType !== null && !atAgentLimit
      : step === 1
      ? name.trim().length > 0 && hotelName.trim().length > 0 && !isCreating
      : false;

  // ── Navigation ──────────────────────────────────────────────
  function handleBack() {
    if (step === 0) router.push("/agents");
    else setStep((s) => s - 1);
  }

  async function handleContinue() {
    if (step === 0) {
      setStep(1);
      return;
    }

    // Step 1 → create agent
    if (step === 1) {
      setIsCreating(true);
      try {
        const newId = await addAgent({
          name: name.trim(),
          hotelName: hotelName.trim(),
          language,
          tone: "friendly",
          status: "setup",
          personality: "",
          whatsappConnected: false,
          algorithmType: algorithmType ?? undefined,
        });
        if (webhookUrl.trim()) {
          await updateAgent(newId, { webhookUrl: webhookUrl.trim() });
        }
        setAgentId(newId);
        setStep(2);
      } finally {
        setIsCreating(false);
      }
      return;
    }
  }

  const hero = STEP_HEROES[step];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ══ Progress header — fijo arriba ═══════════════════════ */}
      <div
        className="shrink-0 bg-[#1a1a1a] dark:bg-[#111] px-4 border-b border-white/8"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
      >
        <div className="flex items-center justify-between pb-2 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-0.5 text-[17px] font-medium text-white/70 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            {step === 0 ? "Cancelar" : "Atrás"}
          </button>
          <span className="text-[15px] font-medium text-white/40 tabular-nums">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>
        {/* Segmented progress — Apple style: white translucent on dark */}
        <div className="flex gap-1 pb-3 max-w-lg mx-auto">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${
                i <= step ? "bg-white/80" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ══ Scrollable content — ocupa todo el espacio libre ════ */}
      <div className="flex-1 overflow-y-auto">
      <div className="px-4 max-w-lg mx-auto py-3 space-y-4">

        {/* Step 0 — header */}
        {step === 0 && (
          <div className="space-y-0.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Tipo de negocio
            </p>
            <h1 className="text-[24px] font-bold tracking-tight leading-tight">
              ¿Cuál es tu tipo de negocio?
            </h1>
            <p className="text-[15px] text-muted-foreground leading-snug">
              Elige el tipo para pre-configurar tu agente inteligente
            </p>
          </div>
        )}

        {/* Plan limit banner at step 0 */}
        {step === 0 && !canAddAgent(agents.length) && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/20 px-4 py-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-amber-800 dark:text-amber-300 leading-tight">
                  Límite alcanzado — Plan {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </p>
                <p className="text-[14px] text-amber-700/80 dark:text-amber-400/70 mt-0.5 leading-snug">
                  Has alcanzado el límite de {PLAN_AGENT_LIMITS[currentPlan]} agente{PLAN_AGENT_LIMITS[currentPlan] !== 1 ? "s" : ""} de tu plan. Actualiza para crear más.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/billing")}
              className="w-full rounded-xl py-2.5 text-[15px] font-semibold text-white"
              style={{
                background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)",
              }}
            >
              Ver planes → Actualizar
            </button>
          </div>
        )}

        {/* Standard hero (step 1) */}
        {hero && (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hero.circleBg}`}
            >
              <hero.Icon className={`h-5 w-5 ${hero.iconColor}`} />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-tight">
                {hero.sectionLabel}
              </p>
              <h1 className="text-[22px] font-bold tracking-tight leading-tight">
                {hero.title}
              </h1>
              <p className="text-[14px] text-muted-foreground leading-snug">
                {hero.subtitle}
              </p>
            </div>
          </div>
        )}

        {/* ── Step 0 — Tipo de negocio ────────────────────────── */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((bt, i) => {
              const selected = !bt.comingSoon && algorithmType === bt.key;
              return (
                <button
                  key={`${bt.key}-${i}`}
                  onClick={() => !bt.comingSoon && setAlgorithmType(bt.key)}
                  disabled={bt.comingSoon}
                  className={`relative flex flex-col items-start gap-2 rounded-2xl p-3 text-left ring-1 transition-all duration-200 active:scale-[0.97] ${
                    bt.comingSoon
                      ? "ring-border bg-card opacity-50 cursor-default"
                      : selected
                      ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                      : "ring-border bg-card hover:bg-muted/60"
                  }`}
                >
                  {bt.comingSoon && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Pronto
                    </span>
                  )}
                  {selected && !bt.comingSoon && (
                    <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${bt.circleBg}`}
                  >
                    <bt.Icon className={`h-5 w-5 ${bt.iconColor}`} />
                  </div>
                  <div>
                    <p
                      className={`text-[15px] font-semibold leading-tight ${
                        selected ? "text-orange-500" : "text-foreground"
                      }`}
                    >
                      {bt.name}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {bt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 1 — Datos del agente + webhook ─────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            {/* iOS-style grouped input card */}
            <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {/* Agent name */}
              <div className="flex items-center gap-3.5 px-4 h-[58px]">
                <Bot className="h-5 w-5 text-blue-500 shrink-0" />
                <input
                  type="text"
                  placeholder={t.agents.agentNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-[17px] placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
              {/* Business name */}
              <div className="flex items-center gap-3.5 px-4 h-[58px]">
                <Building2 className="h-5 w-5 text-blue-500 shrink-0" />
                <input
                  type="text"
                  placeholder={businessNameLabel}
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-[17px] placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
              {/* Language */}
              <div className="flex items-center gap-3.5 px-4 h-[58px]">
                <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="flex-1 text-[17px] text-foreground">
                  {t.agents.language}
                </span>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 gap-1 w-auto text-[17px] text-muted-foreground ring-0 focus:ring-0 focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t.agents.languageOptions.es}</SelectItem>
                    <SelectItem value="en">{t.agents.languageOptions.en}</SelectItem>
                    <SelectItem value="pt">{t.agents.languageOptions.pt}</SelectItem>
                    <SelectItem value="fr">{t.agents.languageOptions.fr}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Webhook URL */}
              <div className="flex items-center gap-3.5 px-4 h-[58px]">
                <Link className="h-5 w-5 text-blue-500 shrink-0" />
                <input
                  type="url"
                  placeholder="https://tu-webhook.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-[17px] placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
            </div>

            <p className="text-[14px] text-muted-foreground px-1">
              URL donde tu agente envía datos a n8n o tu sistema. <span className="text-muted-foreground/60">Opcional — puedes configurarlo después.</span>
            </p>
          </div>
        )}

        {/* ── Step 2 — Éxito ───────────────────────────────────── */}
        {step === 2 && agentId && (
          <div className="flex flex-col items-center text-center pt-8">
            <style>{`
              @keyframes scaleIn {
                from { opacity:0; transform:scale(0.5); }
                to   { opacity:1; transform:scale(1); }
              }
              @keyframes fadeUp {
                from { opacity:0; transform:translateY(18px); }
                to   { opacity:1; transform:translateY(0); }
              }
            `}</style>

            {/* Success icon */}
            <div
              className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_12px_40px_rgba(16,185,129,0.4)]"
              style={{ animation: "scaleIn .4s ease-out both" }}
            >
              <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={1.5} />
            </div>

            {/* Text */}
            <div
              className="space-y-2 mt-6 px-2"
              style={{ animation: "fadeUp .5s ease-out .2s both" }}
            >
              <h1 className="text-[28px] font-bold tracking-tight leading-tight">
                Agente creado
              </h1>
              <p className="text-[16px] text-muted-foreground leading-snug max-w-[300px] mx-auto">
                Configura personalidad, FAQs y productos desde el panel de tu agente.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ══ CTA fijo en el inferior — siempre visible ═══════════ */}
      <div
        className="shrink-0 bg-[#1a1a1a] dark:bg-[#111] px-4 pt-3 border-t border-white/8 space-y-2.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        <div className="max-w-lg mx-auto space-y-2.5">
          {step === 2 ? (
            <Button
              onClick={() => router.push(`/agents/${agentId}`)}
              className="w-full h-14 lisa-btn text-white border-0 font-semibold text-[19px] rounded-2xl"
            >
              Ir a configurar
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full h-14 lisa-btn text-white border-0 font-semibold text-[19px] rounded-2xl"
            >
              {isCreating ? "Creando..." : STEP_CTA[step]}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
