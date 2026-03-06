"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Bot, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { TrainingChat } from "@/components/agents/training-chat";
import type { AlgorithmType, CommunicationRegion, CommunicationRegister } from "@/lib/mock-data";
import {
  ALGORITHM_ICONS,
  ALGORITHM_KEYS,
  REGION_KEYS,
  REGISTER_KEYS,
  REGION_FLAGS,
  generateEnhancedPrompt,
  getPreview,
} from "@/lib/agent-training";
import { toast } from "sonner";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
});

export default function TrainPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, updateAgent } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>(
    agent?.algorithmType ?? "hotel"
  );
  const [region, setRegion] = useState<CommunicationRegion>(
    agent?.communicationStyle?.region ?? "neutral"
  );
  const [register, setRegister] = useState<CommunicationRegister>(
    agent?.communicationStyle?.register ?? "professional"
  );
  const [personality, setPersonality] = useState(agent?.personality ?? "");
  const [displayedPersonality, setDisplayedPersonality] = useState(
    agent?.personality ?? ""
  );
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, []);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold">{t.agents.agentNotFound}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
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

  const hasSocial = agent.socialLinks
    ? Object.values(agent.socialLinks).some((v) => v && v.trim())
    : false;

  const algorithmTranslationKeys: Record<
    AlgorithmType,
    keyof typeof t.personalityBuilder.algorithms
  > = {
    ecommerce: "ecommerce",
    appointments: "appointments",
    "whatsapp-store": "whatsappStore",
    hotel: "hotel",
    restaurant: "restaurant",
    inmobiliaria: "hotel",
  };

  async function handleGenerate() {
    setIsGenerating(true);
    setDisplayedPersonality("");

    await new Promise((r) => setTimeout(r, 1500));

    const generated = generateEnhancedPrompt(
      agent!,
      agent!.faqCount,
      agent!.productCount,
      hasSocial,
      algorithmType,
      region,
      register
    );
    setPersonality(generated);
    setIsGenerating(false);

    let i = 0;
    const typewrite = () => {
      if (i <= generated.length) {
        setDisplayedPersonality(generated.slice(0, i));
        i++;
        typewriterRef.current = setTimeout(typewrite, 12);
      }
    };
    typewrite();
  }

  function handleSave() {
    updateAgent(agent!.id, {
      personality: personality.trim(),
      algorithmType,
      communicationStyle: { region, register },
    });
    toast.success(t.agentSettings.settingsSaved);
  }

  const preview = getPreview(agent.hotelName, algorithmType, region);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <Link
          href={`/agents/${agentId}`}
          className="inline-flex items-center gap-1.5 mb-4 -ml-2 px-2 py-1 text-sm font-medium text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {agent.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Campo de entrenamiento
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define cómo piensa y habla tu agente
        </p>
      </motion.div>

      {/* Section 1: Algorithm type */}
      <motion.div {...fadeUp(0.08)} className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-semibold">
              {t.personalityBuilder.algorithmTitle}
            </h2>
            <p className="text-[15px] text-muted-foreground">
              {agent.algorithmType
                ? "Tipo de negocio configurado — no se puede cambiar"
                : t.personalityBuilder.algorithmSubtitle}
            </p>
          </div>
          {agent.algorithmType && (
            <span className="flex items-center gap-1 shrink-0 text-[13px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Fijo
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ALGORITHM_KEYS.map((key, i) => {
            const Icon = ALGORITHM_ICONS[key];
            const tKey = algorithmTranslationKeys[key];
            const selected = algorithmType === key;
            const isLocked = !!agent.algorithmType;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: isLocked && !selected ? 0.4 : 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.12 + i * 0.05 }}
                onClick={() => !isLocked && setAlgorithmType(key)}
                disabled={isLocked && !selected}
                className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-200 ring-1 ${
                  isLocked && !selected
                    ? "ring-border bg-muted/30 cursor-not-allowed"
                    : selected
                    ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                    : "ring-border bg-card hover:bg-muted/60 active:scale-[0.97]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    selected ? "bg-orange-100 dark:bg-orange-500/20" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${selected ? "text-orange-500" : "text-muted-foreground"}`}
                  />
                </div>
                <span
                  className={`text-[15px] font-semibold leading-tight ${
                    selected ? "text-orange-500" : "text-foreground"
                  }`}
                >
                  {t.personalityBuilder.algorithms[tKey].name}
                </span>
                <span className="text-[13px] text-muted-foreground leading-tight line-clamp-2">
                  {t.personalityBuilder.algorithms[tKey].description}
                </span>
                {selected && isLocked && (
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                )}
              </motion.button>
            );
          })}
        </div>
        {agent.algorithmType && (
          <p className="text-[13px] text-muted-foreground/60 text-center pt-1">
            El tipo de negocio define el núcleo del algoritmo y no puede modificarse, igual que el objetivo de una campaña publicitaria.
          </p>
        )}
      </motion.div>

      {/* Section 2: Communication style */}
      <motion.div {...fadeUp(0.16)} className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-5">
        <div>
          <h2 className="text-[17px] font-semibold">
            {t.personalityBuilder.title}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            {t.personalityBuilder.subtitle}
          </p>
        </div>

        {/* Region */}
        <div className="space-y-3">
          <Label className="text-[16px] font-semibold">
            {t.personalityBuilder.regionTitle}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {REGION_KEYS.map((key, i) => {
              const selected = region === key;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.2 + i * 0.05 }}
                  onClick={() => setRegion(key)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                    selected
                      ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                      : "ring-border bg-card hover:bg-muted/60"
                  }`}
                >
                  <span className="text-2xl">{REGION_FLAGS[key]}</span>
                  <span
                    className={`text-[15px] font-semibold ${
                      selected ? "text-orange-500" : "text-foreground"
                    }`}
                  >
                    {t.personalityBuilder.regions[key]}
                  </span>
                  <span className="text-[13px] text-muted-foreground leading-tight italic">
                    &ldquo;{t.personalityBuilder.regionDescriptions[key]}&rdquo;
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Register */}
        <div className="space-y-3">
          <Label className="text-[16px] font-semibold">
            {t.personalityBuilder.registerTitle}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {REGISTER_KEYS.map((key, i) => {
              const selected = register === key;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.24 + i * 0.05 }}
                  onClick={() => setRegister(key)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                    selected
                      ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                      : "ring-border bg-card hover:bg-muted/60"
                  }`}
                >
                  <span
                    className={`text-[15px] font-semibold ${
                      selected ? "text-orange-500" : "text-foreground"
                    }`}
                  >
                    {t.personalityBuilder.registers[key]}
                  </span>
                  <span className="text-[13px] text-muted-foreground leading-tight">
                    {t.personalityBuilder.registerDescriptions[key]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Section 3: System prompt */}
      <motion.div {...fadeUp(0.24)} className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold">
              {t.agents.systemPrompt}
            </h2>
            <p className="text-[15px] text-muted-foreground">
              {t.agents.systemPromptDescription}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.personalityBuilder.generating}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {personality
                  ? t.personalityBuilder.regenerate
                  : t.personalityBuilder.generateButton}
              </>
            )}
          </Button>
        </div>

        {/* WhatsApp-style preview bubble */}
        <div className="rounded-2xl bg-[#e8f5e9] dark:bg-emerald-950/30 p-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-orange-600 mb-1">
                {agent.name}
              </p>
              <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-card px-3 py-2 shadow-sm ring-1 ring-black/5">
                <p className="text-[15px] text-foreground leading-relaxed">
                  {preview}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Textarea
          value={
            advancedMode ? personality : displayedPersonality || personality
          }
          onChange={(e) => {
            if (advancedMode) {
              setPersonality(e.target.value);
              setDisplayedPersonality(e.target.value);
            }
          }}
          readOnly={!advancedMode}
          rows={5}
          placeholder={t.agents.personalityPlaceholder}
          className={`transition-colors ${
            !advancedMode ? "bg-gray-50/50 cursor-default dark:bg-muted/30" : ""
          }`}
        />

        <div className="flex items-center gap-2">
          <Switch
            id="advanced-mode-train"
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
          />
          <Label
            htmlFor="advanced-mode-train"
            className="text-[15px] text-muted-foreground cursor-pointer"
          >
            {t.personalityBuilder.advancedMode}
          </Label>
        </div>
      </motion.div>

      {/* Section 4: Test before saving */}
      <motion.div {...fadeUp(0.32)} className="space-y-3">
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[14px] font-semibold text-foreground whitespace-nowrap">
            Probar y corregir antes de guardar
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-[14px] text-muted-foreground text-center -mt-1 px-2">
          Último paso obligatorio — prueba el algoritmo con mensajes reales y ajusta el prompt si algo no responde como esperas.
        </p>
        <TrainingChat agentId={agentId} />
      </motion.div>

      {/* Save button */}
      <motion.div {...fadeUp(0.4)}>
        <Button onClick={handleSave} className="w-full">
          {t.common.save}
        </Button>
      </motion.div>
    </div>
  );
}
