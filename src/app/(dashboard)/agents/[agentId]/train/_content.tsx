"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Plus,
  Trash2,
  MessageCircle,
  User,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type {
  AlgorithmType,
  CommunicationRegion,
  CommunicationRegister,
  CommunicationStyle,
} from "@/lib/mock-data";
import {
  ALGORITHM_ICONS,
  ALGORITHM_KEYS,
  REGION_KEYS,
  REGISTER_KEYS,
  REGION_FLAGS,
} from "@/lib/agent-training";
import { toast } from "sonner";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 380,
    damping: 30,
    delay,
  },
});

interface ConversationExample {
  id: string;
  userMessage: string;
  agentResponse: string;
}

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
  const [regionTemp, setRegionTemp] = useState<number>(
    agent?.communicationStyle?.regionTemperature ?? 2
  );

  // Conversation examples
  const saved = agent?.conversationExamples as
    | ConversationExample[]
    | undefined;
  const [examples, setExamples] = useState<ConversationExample[]>(
    saved && saved.length > 0
      ? saved
      : [
          {
            id: crypto.randomUUID(),
            userMessage: "",
            agentResponse: "",
          },
        ]
  );

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold">
          {t.agents.agentNotFound}
        </h2>
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

  const algorithmTranslationKeys: Record<
    AlgorithmType,
    keyof typeof t.personalityBuilder.algorithms
  > = {
    ecommerce: "ecommerce",
    appointments: "appointments",
    "whatsapp-store": "whatsappStore",
    hotel: "hotel",
    restaurant: "restaurant",
    inmobiliaria: "inmobiliaria",
  };

  function addExample() {
    setExamples((prev) => [
      ...prev,
      { id: crypto.randomUUID(), userMessage: "", agentResponse: "" },
    ]);
  }

  function removeExample(id: string) {
    setExamples((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExample(
    id: string,
    field: "userMessage" | "agentResponse",
    value: string
  ) {
    setExamples((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function handleSave() {
    const validExamples = examples.filter(
      (e) => e.userMessage.trim() && e.agentResponse.trim()
    );
    updateAgent(agent!.id, {
      algorithmType,
      communicationStyle: { region, register, regionTemperature: regionTemp },
      conversationExamples: validExamples,
    });
    toast.success(t.agentSettings.settingsSaved);
  }

  return (
    <div className="space-y-6 pb-10 lg:max-w-[800px] lg:mx-auto">
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
          Personalidad del agente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define cómo se comporta y habla tu agente con los clientes
        </p>
      </motion.div>

      {/* Section 1: Algorithm type */}
      <motion.div
        {...fadeUp(0.08)}
        className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-3"
      >
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
                animate={{
                  opacity: isLocked && !selected ? 0.4 : 1,
                  scale: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 28,
                  delay: 0.12 + i * 0.05,
                }}
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
                    selected
                      ? "bg-orange-100 dark:bg-orange-500/20"
                      : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      selected
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    }`}
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
            El tipo de negocio define el núcleo del algoritmo y no puede
            modificarse.
          </p>
        )}
      </motion.div>

      {/* Section 2: Communication style */}
      <motion.div
        {...fadeUp(0.16)}
        className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-5"
      >
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
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 28,
                    delay: 0.2 + i * 0.05,
                  }}
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
                    &ldquo;{t.personalityBuilder.regionDescriptions[key]}
                    &rdquo;
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Region temperature */}
        {region !== "neutral" && (
          <div className="space-y-3">
            <Label className="text-[16px] font-semibold">
              Intensidad regional
            </Label>
            <p className="text-[13px] text-muted-foreground -mt-1">
              Qué tan marcado será el acento y las expresiones regionales
            </p>
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((level) => {
                const selected = regionTemp === level;
                const labels = ["Suave", "Medio", "Intenso"];
                const descriptions = [
                  "Pocas expresiones regionales, más neutro",
                  "Balance entre neutro y regional",
                  "Muy marcado, usa muchas expresiones locales",
                ];
                return (
                  <motion.button
                    key={level}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 + level * 0.04 }}
                    onClick={() => setRegionTemp(level)}
                    className={`flex-1 flex flex-col items-center gap-1 rounded-2xl p-3 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                      selected
                        ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                        : "ring-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-lg">
                      {"🔥".repeat(level)}
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        selected ? "text-orange-500" : "text-foreground"
                      }`}
                    >
                      {labels[level - 1]}
                    </span>
                    <span className="text-[12px] text-muted-foreground leading-tight">
                      {descriptions[level - 1]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

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
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 28,
                    delay: 0.24 + i * 0.05,
                  }}
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

      {/* Section 3: Conversation examples */}
      <motion.div
        {...fadeUp(0.24)}
        className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold">
              Ejemplos de conversación
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Agrega ejemplos de cómo quieres que el agente responda a tus
              clientes. Esto le enseña el tono y estilo.
            </p>
          </div>
          <Button
            onClick={addExample}
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {examples.map((example, idx) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl bg-muted/30 ring-1 ring-border p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-muted-foreground">
                      Ejemplo {idx + 1}
                    </span>
                  </div>
                  {examples.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeExample(example.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* User message */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <Label className="text-[13px] font-medium text-blue-600 dark:text-blue-400">
                      Cliente dice:
                    </Label>
                  </div>
                  <Textarea
                    value={example.userMessage}
                    onChange={(e) =>
                      updateExample(
                        example.id,
                        "userMessage",
                        e.target.value
                      )
                    }
                    rows={2}
                    placeholder="Ej: Hola, ¿tienen habitaciones disponibles para este fin de semana?"
                    className="text-[14px] resize-none"
                  />
                </div>

                {/* Agent response */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-orange-500" />
                    <Label className="text-[13px] font-medium text-orange-600 dark:text-orange-400">
                      Agente responde:
                    </Label>
                  </div>
                  <Textarea
                    value={example.agentResponse}
                    onChange={(e) =>
                      updateExample(
                        example.id,
                        "agentResponse",
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Ej: ¡Hola! 😊 Claro que sí, tenemos disponibilidad. ¿Para cuántas personas sería y qué tipo de habitación prefieres?"
                    className="text-[14px] resize-none"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {examples.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[14px] text-muted-foreground">
              Agrega ejemplos de conversación para entrenar el tono de tu
              agente
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={addExample}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar ejemplo
            </Button>
          </div>
        )}
      </motion.div>

      {/* Save button */}
      <motion.div {...fadeUp(0.32)}>
        {(() => {
          const hasValidExample = examples.some(
            (e) => e.userMessage.trim() && e.agentResponse.trim()
          );
          return (
            <Button
              onClick={handleSave}
              disabled={!hasValidExample}
              className="w-full"
              title={!hasValidExample ? "Agrega al menos un ejemplo de conversación completo" : undefined}
            >
              {!hasValidExample ? "Completa al menos un ejemplo para guardar" : "Guardar personalidad"}
            </Button>
          );
        })()}
      </motion.div>
    </div>
  );
}
