"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Bot,
  Sparkles,
  HelpCircle,
  Globe,
  Smartphone,
  CheckCircle2,
  Circle,
  ShoppingCart,
  CalendarCheck,
  MessageCircle,
  Building2,
  UtensilsCrossed,
  Plus,
  X,
  Check,
  Briefcase,
  Zap,
  Home,
} from "lucide-react";
import {
  IconInstagram,
  IconFacebook,
  IconTikTok,
  IconTripAdvisor,
  IconGoogleMaps,
} from "@/components/icons/brand-icons";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectionWizard } from "@/components/whatsapp/connection-wizard";
import { toast } from "sonner";
import type { AlgorithmType, SocialLinks } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7; // steps 0–6

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

type ToneConfig = {
  key: "formal" | "friendly" | "casual";
  label: string;
  description: string;
  bubble: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

const TONE_OPTIONS: ToneConfig[] = [
  {
    key: "formal",
    label: "Formal",
    description: "Lenguaje profesional y respetuoso",
    bubble: "Estimado cliente, con mucho gusto le atiendo. ¿En qué le puedo asistir hoy?",
    Icon: Briefcase,
    iconBg: "bg-slate-100 dark:bg-slate-500/15",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  {
    key: "friendly",
    label: "Amigable",
    description: "Cercano y servicial, como un buen amigo",
    bubble: "Hola, que bueno saludarte. Estoy aqui para ayudarte con lo que necesites.",
    Icon: MessageCircle,
    iconBg: "bg-orange-100 dark:bg-orange-500/15",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "casual",
    label: "Casual",
    description: "Relajado y directo, sin formalidades",
    bubble: "Hey, que tal. Aqui estoy para ayudarte, dime que necesitas.",
    Icon: Zap,
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

type SocialField = {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

const SOCIAL_FIELDS: SocialField[] = [
  {
    key: "website",
    label: "Sitio web",
    placeholder: "https://tuempresa.com",
    Icon: Globe,
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/tuempresa",
    Icon: IconInstagram,
    iconBg: "bg-pink-100 dark:bg-pink-500/15",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/tuempresa",
    Icon: IconFacebook,
    iconBg: "bg-[#1877F2]/10 dark:bg-[#1877F2]/15",
    iconColor: "text-[#1877F2]",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@tuempresa",
    Icon: IconTikTok,
    iconBg: "bg-gray-100 dark:bg-gray-500/15",
    iconColor: "text-gray-900 dark:text-gray-100",
  },
  {
    key: "tripadvisor",
    label: "TripAdvisor",
    placeholder: "https://tripadvisor.com/...",
    Icon: IconTripAdvisor,
    iconBg: "bg-green-100 dark:bg-green-500/15",
    iconColor: "text-[#34E0A1] dark:text-[#34E0A1]",
  },
  {
    key: "googleMaps",
    label: "Google Maps",
    placeholder: "https://maps.google.com/?cid=...",
    Icon: IconGoogleMaps,
    iconBg: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-500 dark:text-red-400",
  },
];

// Step hero configs (steps 1–5; steps 0 and 6 have custom layouts)
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
    subtitle: "Dale un nombre y cuéntame sobre tu negocio",
  },
  {
    Icon: Sparkles,
    circleBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-500",
    sectionLabel: "Personalidad",
    title: "¿Cómo habla tu agente?",
    subtitle: "Elige el estilo de comunicación con tus clientes",
  },
  {
    Icon: HelpCircle,
    circleBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-500",
    sectionLabel: "Conocimiento",
    title: "Preguntas frecuentes",
    subtitle: "Enséñale las respuestas que más necesitan tus clientes",
  },
  {
    Icon: Globe,
    circleBg: "bg-indigo-100 dark:bg-indigo-500/15",
    iconColor: "text-indigo-500",
    sectionLabel: "Presencia digital",
    title: "Tus redes sociales",
    subtitle: "El agente aprende de tu contenido publicado",
  },
  {
    Icon: Smartphone,
    circleBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-500",
    sectionLabel: "Integración",
    title: "Conecta WhatsApp",
    subtitle: "Tu agente empieza a responder en tiempo real",
  },
  null, // 6 — launch screen
];

const STEP_CTA = [
  "Continuar",
  "Crear agente",
  "Continuar",
  "Continuar",
  "Continuar",
  "Continuar",
  "", // launch step has its own buttons
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function NewAgentPage() {
  const router = useRouter();
  const { addAgent, updateAgent, addFaq, deleteFaq, loadFaqs, faqs, agents } =
    useAgentStore();
  const { t } = useLocaleStore();

  // Wizard navigation
  const [step, setStep] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Step 0 — business type
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType | null>(null);

  // Step 1 — basic data
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [language, setLanguage] = useState("es");

  // Step 2 — personality
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">("friendly");
  const [personality, setPersonality] = useState("");
  const [showPersonality, setShowPersonality] = useState(false);

  // Step 3 — FAQs
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Step 4 — social links
  const [socialLinks, setSocialLinks] = useState<Record<keyof SocialLinks, string>>({
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    tripadvisor: "",
    googleMaps: "",
  });

  // Derived
  const agentFaqs = faqs.filter((f) => f.agentId === agentId);
  const agent = agents.find((a) => a.id === agentId);
  const hasSocialLinks = Object.values(socialLinks).some((v) => v.trim());

  const businessNameLabel = algorithmType
    ? t.personalityBuilder.hotelNameLabels[
        (algorithmType === "whatsapp-store"
          ? "whatsappStore"
          : algorithmType) as keyof typeof t.personalityBuilder.hotelNameLabels
      ]
    : t.agents.hotelName;

  // Progress (0 % at step 0, 100 % fully into step 6)
  const progress = step / (TOTAL_STEPS - 1);

  // ── CTA enable condition ────────────────────────────────────
  const canContinue =
    step === 0
      ? algorithmType !== null
      : step === 1
      ? name.trim().length > 0 && hotelName.trim().length > 0
      : step === 2
      ? true
      : step === 3
      ? agentFaqs.length >= 1
      : step === 4
      ? true // social links are optional
      : step === 5
      ? (agent?.whatsappConnected ?? false)
      : false;

  // ── Navigation ──────────────────────────────────────────────
  function handleBack() {
    if (step === 0) router.push("/agents");
    else setStep((s) => s - 1);
  }

  function handleContinue() {
    // Step 1 → create agent, capture ID
    if (step === 1) {
      const newId = addAgent({
        name: name.trim(),
        hotelName: hotelName.trim(),
        language,
        tone: "friendly",
        status: "setup",
        personality: "",
        whatsappConnected: false,
        algorithmType: algorithmType ?? undefined,
      });
      setAgentId(newId);
      loadFaqs(newId);
      setStep(2);
      return;
    }
    // Step 2 → save personality
    if (step === 2 && agentId) {
      updateAgent(agentId, { tone, personality: personality.trim() });
    }
    // Step 4 → save social links (non-empty only)
    if (step === 4 && agentId && hasSocialLinks) {
      const cleaned: Partial<SocialLinks> = {};
      for (const [k, v] of Object.entries(socialLinks)) {
        if (v.trim()) cleaned[k as keyof SocialLinks] = v.trim();
      }
      updateAgent(agentId, { socialLinks: cleaned as SocialLinks });
    }
    setStep((s) => s + 1);
  }

  function handleSkipWhatsapp() {
    setStep(6);
  }

  function handleDeploy() {
    if (!agentId) return;
    updateAgent(agentId, { status: "active" });
    toast.success("Agente activado correctamente");
    router.push(`/agents/${agentId}`);
  }

  function handleAddFaq() {
    if (!faqQuestion.trim() || !faqAnswer.trim() || !agentId) return;
    addFaq({
      agentId,
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      category: "",
      isActive: true,
    });
    setFaqQuestion("");
    setFaqAnswer("");
  }

  const hero = STEP_HEROES[step];

  // Launch step summary items
  const summaryItems = [
    {
      label: "Tipo de negocio",
      done: !!algorithmType,
      Icon: ShoppingCart,
    },
    {
      label: "Datos del agente",
      done: !!(name && hotelName),
      Icon: Bot,
    },
    {
      label: "Personalidad",
      done: true,
      Icon: Sparkles,
    },
    {
      label: "Preguntas frecuentes",
      done: agentFaqs.length >= 1,
      Icon: HelpCircle,
    },
    {
      label: "Redes sociales",
      done: hasSocialLinks,
      Icon: Globe,
    },
    {
      label: "WhatsApp",
      done: agent?.whatsappConnected ?? false,
      Icon: Smartphone,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">

      {/* ══ Progress header — fijo arriba ═══════════════════════ */}
      <div
        className="shrink-0 bg-background/95 backdrop-blur-sm px-4 border-b border-border/40"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
      >
        <div className="flex items-center justify-between pb-2 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-0.5 text-[15px] font-medium text-orange-500 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            {step === 0 ? "Cancelar" : "Atrás"}
          </button>
          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>
        {/* Segmented progress — Apple style */}
        <div className="flex gap-1 pb-3 max-w-lg mx-auto">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${
                i <= step ? "bg-orange-500" : "bg-muted"
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Tipo de negocio
            </p>
            <h1 className="text-[22px] font-bold tracking-tight leading-tight">
              ¿Cuál es tu tipo de negocio?
            </h1>
            <p className="text-[13px] text-muted-foreground leading-snug">
              Elige el tipo para pre-configurar tu agente inteligente
            </p>
          </div>
        )}

        {/* Standard hero (steps 1–5) */}
        {hero && (
          <div className="pt-2 space-y-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${hero.circleBg}`}
            >
              <hero.Icon className={`h-7 w-7 ${hero.iconColor}`} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {hero.sectionLabel}
              </p>
              <h1 className="text-[28px] font-bold tracking-tight leading-[1.15]">
                {hero.title}
              </h1>
              <p className="text-[15px] text-muted-foreground leading-snug">
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
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
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
                      className={`text-[13px] font-semibold leading-tight ${
                        selected ? "text-orange-500" : "text-foreground"
                      }`}
                    >
                      {bt.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {bt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 1 — Datos del agente (iOS grouped list) ─────── */}
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
                  className="flex-1 min-w-0 bg-transparent text-[15px] placeholder:text-muted-foreground/50 outline-none"
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
                  className="flex-1 min-w-0 bg-transparent text-[15px] placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
              {/* Language */}
              <div className="flex items-center gap-3.5 px-4 h-[58px]">
                <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="flex-1 text-[15px] text-foreground">
                  {t.agents.language}
                </span>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 gap-1 w-auto text-[15px] text-muted-foreground ring-0 focus:ring-0 focus-visible:ring-0">
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
            </div>

            <p className="text-[13px] text-muted-foreground px-1">
              Puedes cambiar estos datos en cualquier momento desde la configuración del agente.
            </p>
          </div>
        )}

        {/* ── Step 2 — Personalidad ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            {/* Tone radio cards */}
            {TONE_OPTIONS.map((opt) => {
              const selected = tone === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTone(opt.key)}
                  className={`w-full text-left rounded-2xl p-4 ring-1 transition-all duration-200 active:scale-[0.99] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
                    selected
                      ? "ring-2 ring-orange-500 bg-orange-50/60 dark:bg-orange-500/10"
                      : "ring-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${opt.iconBg}`}
                      >
                        <opt.Icon className={`h-[18px] w-[18px] ${opt.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold leading-tight">
                          {opt.label}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                    {/* Radio indicator */}
                    <div
                      className={`h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selected
                          ? "border-orange-500 bg-orange-500"
                          : "border-border"
                      }`}
                    >
                      {selected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  {/* Chat bubble example */}
                  <div className="bg-muted/70 rounded-xl px-3 py-2.5 ml-12">
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {opt.bubble}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Collapsible advanced personalization */}
            <button
              onClick={() => setShowPersonality((v) => !v)}
              className="flex items-center gap-2 text-[14px] font-medium text-orange-500 active:opacity-60 transition-opacity py-1"
            >
              <span>{showPersonality ? "Ocultar personalización" : "Personalizar más"}</span>
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-200 ${
                  showPersonality ? "rotate-90" : "-rotate-90"
                }`}
              />
            </button>

            {showPersonality && (
              <div className="space-y-1.5">
                <Label className="text-[13px] text-muted-foreground px-1">
                  Instrucciones adicionales (opcional)
                </Label>
                <Textarea
                  placeholder="Ej: Eres un asistente especializado en ventas que siempre sugiere el producto que mejor se adapta a las necesidades del cliente..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={4}
                  className="resize-none text-[14px] rounded-2xl"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 — FAQs ───────────────────────────────────── */}
        {step === 3 && agentId && (
          <div className="space-y-4">
            {/* Existing FAQ list */}
            {agentFaqs.length > 0 && (
              <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {agentFaqs.map((faq) => (
                  <div key={faq.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold leading-tight">
                        {faq.question}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="shrink-0 text-muted-foreground hover:text-red-500 active:opacity-60 transition-all mt-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add FAQ form */}
            <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="px-4 pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-muted-foreground">
                    {t.setupWizard.question}
                  </Label>
                  <input
                    type="text"
                    placeholder="¿Cuál es el horario de atención?"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    className="w-full bg-transparent text-[15px] placeholder:text-muted-foreground/50 outline-none"
                  />
                </div>
                <div className="h-px bg-border/60" />
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-muted-foreground">
                    {t.setupWizard.answer}
                  </Label>
                  <textarea
                    placeholder="Atendemos de lunes a viernes de 9am a 6pm."
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-[14px] placeholder:text-muted-foreground/50 outline-none resize-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddFaq}
                disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 mt-3 border-t border-border/60 text-[14px] font-semibold text-orange-500 disabled:text-muted-foreground disabled:opacity-50 active:bg-muted/50 transition-colors"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {t.setupWizard.addFaq}
              </button>
            </div>

            {/* Empty state hint */}
            {agentFaqs.length === 0 && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/20 px-4 py-3">
                <p className="text-[13px] text-amber-700 dark:text-amber-400 font-medium">
                  Agrega al menos una pregunta para continuar
                </p>
                <p className="text-[12px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                  Cuantas más preguntas agregues, mejor responde tu agente
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4 — Redes sociales (iOS grouped list) ──────── */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {SOCIAL_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3.5 px-4 h-[58px]">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${field.iconBg}`}
                  >
                    <field.Icon className={`h-4 w-4 ${field.iconColor}`} />
                  </div>
                  <input
                    type="url"
                    placeholder={field.placeholder}
                    value={socialLinks[field.key]}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="flex-1 min-w-0 bg-transparent text-[14px] placeholder:text-muted-foreground/40 outline-none"
                  />
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground px-1">
              Todos los campos son opcionales. El agente usará esta información para responder mejor.
            </p>
          </div>
        )}

        {/* ── Step 5 — WhatsApp ───────────────────────────────── */}
        {step === 5 && agentId && (
          <div className="space-y-4">
            <div className="rounded-2xl ring-1 ring-border overflow-hidden">
              <ConnectionWizard
                agentId={agentId}
                isConnected={agent?.whatsappConnected ?? false}
              />
            </div>
          </div>
        )}

        {/* ── Step 6 — Launch ─────────────────────────────────── */}
        {step === 6 && agentId && (
          <div className="space-y-5 pt-2">
            {/* Success state */}
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15">
                  <CheckCircle2 className="h-10 w-10 text-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Listo para activar
                </p>
                <h1 className="text-[26px] font-bold tracking-tight leading-tight">
                  {agent?.name ?? "Tu agente"} está configurado
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  Revisa la configuración y activa tu agente
                </p>
              </div>
            </div>

            {/* Configuration summary */}
            <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3.5 px-4 h-[52px]"
                >
                  <item.Icon className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
                  <span className="flex-1 text-[15px]">{item.label}</span>
                  {item.done ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-[18px] w-[18px] text-border shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ══ CTA fijo en el inferior — siempre visible ═══════════ */}
      <div
        className="shrink-0 bg-background/95 backdrop-blur-sm px-4 pt-3 border-t border-border/40 space-y-2.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        <div className="max-w-lg mx-auto space-y-2.5">
          {step === 6 ? (
            <>
              <Button
                onClick={handleDeploy}
                className="w-full h-14 lisa-btn text-white border-0 font-semibold text-[17px] rounded-2xl"
              >
                Activar agente
              </Button>
              <button
                onClick={handleDeploy}
                className="w-full py-2.5 text-[15px] font-medium text-orange-500 active:opacity-60 transition-opacity"
              >
                Configurar más tarde
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full h-14 lisa-btn text-white border-0 font-semibold text-[17px] rounded-2xl"
              >
                {STEP_CTA[step]}
              </Button>
              {step === 5 && (
                <button
                  onClick={handleSkipWhatsapp}
                  className="w-full py-2.5 text-[15px] font-medium text-muted-foreground active:opacity-60 transition-opacity"
                >
                  Conectar WhatsApp después
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
