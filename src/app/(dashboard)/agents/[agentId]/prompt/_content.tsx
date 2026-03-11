"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Bot,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { generateEnhancedPrompt, getPreview } from "@/lib/agent-training";
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

export default function PromptPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, updateAgent } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  const [personality, setPersonality] = useState(agent?.personality ?? "");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const hasSocial = agent.socialLinks
    ? Object.values(agent.socialLinks).some((v) => v && v.trim())
    : false;

  const preview = getPreview(
    agent.hotelName,
    agent.algorithmType ?? "hotel",
    agent.communicationStyle?.region ?? "neutral"
  );

  async function handleGenerate() {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    const generated = generateEnhancedPrompt(
      agent!,
      agent!.faqCount,
      agent!.productCount,
      hasSocial,
      agent!.algorithmType ?? "hotel",
      agent!.communicationStyle?.region ?? "neutral",
      agent!.communicationStyle?.register ?? "professional"
    );
    setPersonality(generated);
    setIsGenerating(false);
  }

  function handleSave() {
    updateAgent(agent!.id, {
      personality: personality.trim(),
      systemPrompt: personality.trim(),
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
          Prompt del agente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Instrucciones avanzadas que definen el comportamiento del agente
        </p>
      </motion.div>

      {/* Prompt editor */}
      <motion.div
        {...fadeUp(0.08)}
        className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-4"
      >
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
          value={personality}
          onChange={(e) => {
            if (advancedMode) setPersonality(e.target.value);
          }}
          readOnly={!advancedMode}
          rows={8}
          placeholder={t.agents.personalityPlaceholder}
          className={`transition-colors ${
            !advancedMode
              ? "bg-gray-50/50 cursor-default dark:bg-muted/30"
              : ""
          }`}
        />

        <div className="flex items-center gap-2">
          <Switch
            id="advanced-mode-prompt"
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
          />
          <Label
            htmlFor="advanced-mode-prompt"
            className="text-[15px] text-muted-foreground cursor-pointer"
          >
            Modo avanzado — editar manualmente
          </Label>
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div {...fadeUp(0.16)}>
        <Button onClick={handleSave} className="w-full">
          {t.common.save}
        </Button>
      </motion.div>
    </div>
  );
}
