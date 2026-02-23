"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Agent, AlgorithmType, CommunicationRegion, CommunicationRegister } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Bot,
} from "lucide-react";
import {
  ALGORITHM_ICONS,
  ALGORITHM_KEYS,
  REGION_KEYS,
  REGISTER_KEYS,
  REGION_FLAGS,
  BASE_TEMPLATES,
  REGION_OVERLAYS,
  REGISTER_OVERLAYS,
  getPreview,
} from "@/lib/agent-training";

function generatePersonality(agentName: string, hotelName: string, algorithm: AlgorithmType, region: CommunicationRegion, register: CommunicationRegister): string {
  const base = BASE_TEMPLATES[algorithm].replace("{agentName}", agentName).replace("{hotelName}", hotelName);
  const regionOverlay = REGION_OVERLAYS[region];
  const registerOverlay = REGISTER_OVERLAYS[register];
  return `${base} ${regionOverlay} ${registerOverlay} Siempre ofreces ayuda sin sonar robotico y haces sentir a cada persona bienvenida.`;
}

interface PersonalityConfigProps {
  agent: Agent;
}

export function PersonalityConfig({ agent }: PersonalityConfigProps) {
  const { updateAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [name, setName] = useState(agent.name);
  const [hotelName, setHotelName] = useState(agent.hotelName);
  const [avatar, setAvatar] = useState(agent.avatar ?? "");
  const [personality, setPersonality] = useState(agent.personality);
  const [tone, setTone] = useState(agent.tone);
  const [language, setLanguage] = useState(agent.language);
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>(agent.algorithmType ?? "hotel");
  const [region, setRegion] = useState<CommunicationRegion>(agent.communicationStyle?.region ?? "neutral");
  const [register, setRegister] = useState<CommunicationRegister>(agent.communicationStyle?.register ?? "professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [displayedPersonality, setDisplayedPersonality] = useState(agent.personality);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, []);

  const algorithmTranslationKeys: Record<AlgorithmType, keyof typeof t.personalityBuilder.algorithms> = {
    ecommerce: "ecommerce",
    appointments: "appointments",
    "whatsapp-store": "whatsappStore",
    hotel: "hotel",
    restaurant: "restaurant",
    inmobiliaria: "hotel", // fallback hasta que se agregue traducción propia
  };

  async function handleGenerate() {
    setIsGenerating(true);
    setDisplayedPersonality("");

    // Simulate AI delay
    await new Promise((r) => setTimeout(r, 1500));

    const generated = generatePersonality(name || agent.name, hotelName || agent.hotelName, algorithmType, region, register);
    setPersonality(generated);
    setIsGenerating(false);

    // Typewriter effect
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
    updateAgent(agent.id, {
      name: name.trim(),
      hotelName: hotelName.trim(),
      avatar: avatar.trim() || undefined,
      personality: personality.trim(),
      tone,
      language,
      algorithmType,
      communicationStyle: { region, register },
    });
    toast.success(t.agentSettings.settingsSaved);
  }

  const preview = getPreview(hotelName || agent.hotelName, algorithmType, region);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t.agentSettings.basicInfo}</CardTitle>
          <CardDescription>{t.agentSettings.basicInfoDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>Foto de perfil</Label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <button
                type="button"
                onClick={() => document.getElementById("avatar-file-input")?.click()}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-neutral-700 dark:bg-neutral-600 group"
                title="Subir foto"
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <Bot className="h-6 w-6 text-neutral-400" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-semibold">Subir</span>
                </div>
              </button>
              {/* URL input */}
              <Input
                id="agent-avatar"
                placeholder="https://... URL de la imagen"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="flex-1"
              />
            </div>
            {/* File input oculto — abre galería en móvil */}
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setAvatar(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              Toca el avatar para subir desde tu dispositivo, o pega una URL.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-name">{t.agents.agentName}</Label>
            <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-name">
              {t.personalityBuilder.hotelNameLabels[algorithmTranslationKeys[algorithmType]] ?? t.agents.hotelName}
            </Label>
            <Input id="hotel-name" value={hotelName} onChange={(e) => setHotelName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Type */}
      <Card>
        <CardHeader>
          <CardTitle>{t.personalityBuilder.algorithmTitle}</CardTitle>
          <CardDescription>{t.personalityBuilder.algorithmSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ALGORITHM_KEYS.map((key) => {
              const Icon = ALGORITHM_ICONS[key];
              const tKey = algorithmTranslationKeys[key];
              const selected = algorithmType === key;
              return (
                <button
                  key={key}
                  onClick={() => setAlgorithmType(key)}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                    selected
                      ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                      : "ring-border bg-card hover:bg-muted/60"
                  }`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? "bg-orange-100 dark:bg-orange-500/20" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${selected ? "text-orange-500" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[13px] font-semibold leading-tight ${selected ? "text-orange-500" : "text-foreground"}`}>
                    {t.personalityBuilder.algorithms[tKey].name}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {t.personalityBuilder.algorithms[tKey].description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Communication Style */}
      <Card>
        <CardHeader>
          <CardTitle>{t.personalityBuilder.title}</CardTitle>
          <CardDescription>{t.personalityBuilder.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Region */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">{t.personalityBuilder.regionTitle}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGION_KEYS.map((key) => {
                const selected = region === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRegion(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                      selected
                        ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                        : "ring-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-2xl">{REGION_FLAGS[key]}</span>
                    <span className={`text-[13px] font-semibold ${selected ? "text-orange-500" : "text-foreground"}`}>
                      {t.personalityBuilder.regions[key]}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight italic">
                      &ldquo;{t.personalityBuilder.regionDescriptions[key]}&rdquo;
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Register */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">{t.personalityBuilder.registerTitle}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGISTER_KEYS.map((key) => {
                const selected = register === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRegister(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all duration-200 ring-1 active:scale-[0.97] ${
                      selected
                        ? "ring-2 ring-orange-500 bg-orange-500/10 dark:bg-orange-500/15"
                        : "ring-border bg-card hover:bg-muted/60"
                    }`}
                  >
                    <span className={`text-[13px] font-semibold ${selected ? "text-orange-500" : "text-foreground"}`}>
                      {t.personalityBuilder.registers[key]}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {t.personalityBuilder.registerDescriptions[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Personality */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.agents.systemPrompt}</CardTitle>
              <CardDescription>{t.agents.systemPromptDescription}</CardDescription>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="sm"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.personalityBuilder.generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {personality ? t.personalityBuilder.regenerate : t.personalityBuilder.generateButton}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="personality"
              value={advancedMode ? personality : displayedPersonality || personality}
              onChange={(e) => {
                if (advancedMode) {
                  setPersonality(e.target.value);
                  setDisplayedPersonality(e.target.value);
                }
              }}
              readOnly={!advancedMode}
              rows={5}
              placeholder={t.agents.personalityPlaceholder}
              className={`transition-colors ${!advancedMode ? "bg-gray-50/50 cursor-default" : ""}`}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="advanced-mode"
                checked={advancedMode}
                onCheckedChange={setAdvancedMode}
              />
              <Label htmlFor="advanced-mode" className="text-[13px] text-muted-foreground cursor-pointer">
                {t.personalityBuilder.advancedMode}
              </Label>
            </div>
          </div>

          {/* Preview */}
          {(personality || displayedPersonality) && (
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">{t.personalityBuilder.previewTitle}</Label>
              <p className="text-[12px] text-muted-foreground">{t.personalityBuilder.previewSubtitle}</p>
              <div className="rounded-2xl bg-orange-50 dark:bg-orange-500/10 p-4 ring-1 ring-orange-200 dark:ring-orange-500/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-orange-700 mb-1">{name || agent.name}</p>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{preview}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tone & Language */}
      <Card>
        <CardHeader>
          <CardTitle>{t.agentSettings.personalityTone}</CardTitle>
          <CardDescription>{t.agentSettings.personalityToneDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.agents.tone}</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">{t.agents.toneOptions.formal}</SelectItem>
                  <SelectItem value="friendly">{t.agents.toneOptions.friendly}</SelectItem>
                  <SelectItem value="casual">{t.agents.toneOptions.casual}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.agents.language}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>{t.common.save}</Button>
      </div>
    </div>
  );
}
