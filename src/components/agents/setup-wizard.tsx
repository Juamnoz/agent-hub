"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, X, Plus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { ConnectionWizard } from "@/components/whatsapp/connection-wizard";
import { toast } from "sonner";

interface SetupWizardProps {
  agentId: string;
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({
  current,
  total,
  labels,
  completed,
}: {
  current: number;
  total: number;
  labels: string[];
  completed: boolean[];
}) {
  return (
    <div className="flex items-center gap-0 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = completed[i];
        const isActive = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isActive ? "text-orange-600" : isDone ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {/* Connector line */}
            {i < total - 1 && (
              <div className="flex-1 mx-1 mt-[-14px]">
                <div
                  className={`h-0.5 w-full transition-colors ${
                    completed[i] ? "bg-emerald-400" : i < current ? "bg-orange-300" : "bg-border"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: FAQs ─────────────────────────────────────────────────────────────

function StepFaqs({ agentId }: { agentId: string }) {
  const { faqs, addFaq, deleteFaq } = useAgentStore();
  const { t } = useLocaleStore();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const agentFaqs = faqs.filter((f) => f.agentId === agentId);

  function handleAdd() {
    if (!question.trim() || !answer.trim()) return;
    addFaq({ agentId, question: question.trim(), answer: answer.trim(), category: "", isActive: true });
    setQuestion("");
    setAnswer("");
  }

  return (
    <div className="space-y-4">
      {/* Existing FAQs */}
      {agentFaqs.length > 0 && (
        <div className="space-y-2">
          {agentFaqs.map((faq) => (
            <div
              key={faq.id}
              className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 ring-1 ring-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-tight">{faq.question}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
              </div>
              <button
                onClick={() => deleteFaq(faq.id)}
                className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mini form */}
      <div className="rounded-xl ring-1 ring-border p-4 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[13px]">{t.setupWizard.question}</Label>
          <Input
            placeholder="¿Cuál es el horario de atención?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="text-[14px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[13px]">{t.setupWizard.answer}</Label>
          <Textarea
            placeholder="Atendemos de lunes a viernes de 9am a 6pm."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="text-[14px] resize-none"
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={!question.trim() || !answer.trim()}
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {t.setupWizard.addFaq}
        </Button>
      </div>

      {agentFaqs.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center">
          {t.setupWizard.minOneFaq}
        </p>
      )}
    </div>
  );
}

// ── Step 2: Personality ───────────────────────────────────────────────────────

function StepPersonality({
  tone,
  personality,
  onToneChange,
  onPersonalityChange,
}: {
  tone: string;
  personality: string;
  onToneChange: (t: "formal" | "friendly" | "casual") => void;
  onPersonalityChange: (p: string) => void;
}) {
  const { t } = useLocaleStore();
  const toneOptions = [
    { key: "formal", label: t.agents.toneOptions.formal },
    { key: "friendly", label: t.agents.toneOptions.friendly },
    { key: "casual", label: t.agents.toneOptions.casual },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[13px]">{t.agents.tone}</Label>
        <div className="flex gap-2">
          {toneOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onToneChange(opt.key as "formal" | "friendly" | "casual")}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium border transition-all ${
                tone === opt.key
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400"
                  : "border-border bg-card text-muted-foreground hover:border-orange-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[13px]">{t.agents.personality}</Label>
        <Textarea
          placeholder={t.setupWizard.personalityPlaceholder}
          value={personality}
          onChange={(e) => onPersonalityChange(e.target.value)}
          rows={4}
          className="text-[14px] resize-none"
        />
      </div>
    </div>
  );
}

// ── Step 3: WhatsApp ──────────────────────────────────────────────────────────

function StepWhatsapp({ agentId, isConnected }: { agentId: string; isConnected: boolean }) {
  const { t } = useLocaleStore();
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">
        {t.setupWizard.step3Subtitle}
      </p>
      <ConnectionWizard agentId={agentId} isConnected={isConnected} />
    </div>
  );
}

// ── Step 4: Launch ────────────────────────────────────────────────────────────

function StepLaunch({
  agentName,
  phoneNumber,
  onActivate,
}: {
  agentName: string;
  phoneNumber?: string;
  onActivate: () => void;
}) {
  const { t } = useLocaleStore();

  function handleTestWhatsApp() {
    const phone = phoneNumber?.replace(/\D/g, "") ?? "";
    const url = phone
      ? `https://wa.me/${phone}?text=Hola`
      : "https://wa.me";
    window.open(url, "_blank");
    onActivate();
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 p-6 flex flex-col items-center text-center space-y-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 dark:bg-orange-500/20">
        <Rocket className="h-10 w-10 text-orange-500 animate-bounce" />
      </div>
      <div className="space-y-1">
        <h2 className="text-[20px] font-bold tracking-tight">
          ¡{agentName} está listo para despegar!
        </h2>
        <p className="text-[14px] text-muted-foreground max-w-xs mx-auto">
          {t.setupWizard.step4Subtitle}
        </p>
      </div>
      <div className="w-full space-y-2.5 pt-2">
        <Button
          onClick={handleTestWhatsApp}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold text-[15px] h-11"
        >
          {t.setupWizard.testOnWhatsapp}
        </Button>
        <Button
          variant="outline"
          onClick={onActivate}
          className="w-full font-medium text-[14px] h-10"
        >
          {t.setupWizard.viewAgent}
        </Button>
      </div>
    </div>
  );
}

// ── Main SetupWizard ──────────────────────────────────────────────────────────

export function SetupWizard({ agentId }: SetupWizardProps) {
  const { agents, faqs, updateAgent, loadFaqs } = useAgentStore();
  const { t } = useLocaleStore();

  const agent = agents.find((a) => a.id === agentId);

  // Local state for personality step
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">(agent?.tone ?? "friendly");
  const [personality, setPersonality] = useState(agent?.personality ?? "");
  const [step, setStep] = useState(0);

  // Load FAQs on mount
  useEffect(() => {
    loadFaqs(agentId);
  }, [agentId, loadFaqs]);

  const agentFaqs = faqs.filter((f) => f.agentId === agentId);

  if (!agent) return null;

  const stepLabels = [
    t.setupWizard.step1Title,
    t.setupWizard.step2Title,
    t.setupWizard.step3Title,
    "🚀",
  ];

  const stepCompleted = [
    agentFaqs.length >= 1, // Step 1
    true,                   // Step 2 — always ok (has defaults)
    agent.whatsappConnected ?? false, // Step 3
    false,                  // Step 4 — never "completed" in indicator
  ];

  function handleContinue() {
    if (step === 1) {
      // Save personality on continue
      updateAgent(agentId, { tone, personality });
    }
    setStep((s) => s + 1);
  }

  function handleActivate() {
    updateAgent(agentId, { status: "active" });
    toast.success("¡Agente activado correctamente!");
  }

  const canContinue =
    step === 0 ? agentFaqs.length >= 1 :
    step === 1 ? true :
    step === 2 ? (agent.whatsappConnected ?? false) :
    false;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Step Indicator */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            {t.common.create}
          </p>
          <span className="text-[12px] text-muted-foreground">
            {step + 1} {t.setupWizard.of} 4
          </span>
        </div>
        <StepIndicator
          current={step}
          total={4}
          labels={stepLabels}
          completed={stepCompleted}
        />
      </div>

      {/* Step Content */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-5">
        {/* Header */}
        {step < 3 && (
          <div>
            <h2 className="text-[18px] font-bold leading-tight">
              {step === 0 && t.setupWizard.step1Title}
              {step === 1 && t.setupWizard.step2Title}
              {step === 2 && t.setupWizard.step3Title}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {step === 0 && t.setupWizard.step1Subtitle}
              {step === 1 && t.setupWizard.step2Subtitle}
              {step === 2 && t.setupWizard.step3Subtitle}
            </p>
          </div>
        )}

        {/* Step bodies */}
        {step === 0 && <StepFaqs agentId={agentId} />}
        {step === 1 && (
          <StepPersonality
            tone={tone}
            personality={personality}
            onToneChange={setTone}
            onPersonalityChange={setPersonality}
          />
        )}
        {step === 2 && (
          <StepWhatsapp agentId={agentId} isConnected={agent.whatsappConnected ?? false} />
        )}
        {step === 3 && (
          <StepLaunch
            agentName={agent.name}
            phoneNumber={agent.whatsappPhoneNumber}
            onActivate={handleActivate}
          />
        )}

        {/* Continue button (steps 0–2) */}
        {step < 3 && (
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full lisa-btn text-white border-0 font-semibold text-[15px] h-11"
          >
            {t.setupWizard.continue}
          </Button>
        )}
      </div>
    </div>
  );
}
