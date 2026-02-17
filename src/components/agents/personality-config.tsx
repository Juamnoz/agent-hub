"use client";

import { useState, useEffect, useRef } from "react";
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
  ShoppingCart,
  CalendarCheck,
  MessageCircle,
  Building2,
  UtensilsCrossed,
  Sparkles,
  Loader2,
  Bot,
} from "lucide-react";

const ALGORITHM_ICONS: Record<AlgorithmType, React.ComponentType<{ className?: string }>> = {
  ecommerce: ShoppingCart,
  appointments: CalendarCheck,
  "whatsapp-store": MessageCircle,
  hotel: Building2,
  restaurant: UtensilsCrossed,
};

const ALGORITHM_KEYS: AlgorithmType[] = ["ecommerce", "appointments", "whatsapp-store", "hotel", "restaurant"];
const REGION_KEYS: CommunicationRegion[] = ["neutral", "colombian", "mexican", "argentinian"];
const REGISTER_KEYS: CommunicationRegister[] = ["corporate", "professional", "relaxed", "genz"];

const REGION_FLAGS: Record<CommunicationRegion, string> = {
  neutral: "🌐",
  colombian: "🇨🇴",
  mexican: "🇲🇽",
  argentinian: "🇦🇷",
};

// Personality templates by layers
const BASE_TEMPLATES: Record<AlgorithmType, string> = {
  ecommerce: "Eres {agentName}, el asistente virtual de {hotelName}. Tu rol es ayudar a los clientes a encontrar productos, resolver dudas sobre pedidos y guiarlos en su compra.",
  appointments: "Eres {agentName}, el asistente virtual de {hotelName}. Tu rol es gestionar citas y reservas, confirmar horarios disponibles y asegurar que cada cliente tenga una experiencia fluida al agendar.",
  "whatsapp-store": "Eres {agentName}, el asistente virtual de {hotelName}. Tu rol es atender pedidos por WhatsApp, mostrar el catalogo disponible y guiar al cliente desde la consulta hasta la confirmacion del pedido.",
  hotel: "Eres {agentName}, el asistente virtual de {hotelName}. Tu rol es atender huespedes como un conserje local autentico, ayudar con reservaciones, informar sobre servicios del hotel y recomendar experiencias locales.",
  restaurant: "Eres {agentName}, el asistente virtual de {hotelName}. Tu rol es atender comensales, compartir el menu, gestionar reservaciones de mesa y tomar pedidos a domicilio con calidez y eficiencia.",
};

const REGION_OVERLAYS: Record<CommunicationRegion, string> = {
  neutral: "Hablas en espanol neutro, sin regionalismos marcados, de forma clara y accesible para cualquier hispanohablante.",
  colombian: "Hablas con la calidez y naturalidad del parlache colombiano — usas expresiones como \"parce\", \"bacano\", \"que mas pues\", \"con todo el gusto\".",
  mexican: "Hablas con el estilo mexicano — usas expresiones como \"que onda\", \"sale\", \"chido\", \"con mucho gusto\", \"mande\".",
  argentinian: "Hablas con el estilo argentino — usas expresiones como \"che\", \"dale\", \"barbaro\", \"genial\", con voseo natural.",
};

const REGISTER_OVERLAYS: Record<CommunicationRegister, string> = {
  corporate: "Tu tono es formal y corporativo. Usas \"usted\", evitas coloquialismos y mantienes un lenguaje profesional en todo momento.",
  professional: "Tu tono es profesional pero cercano. Tuteas con respeto, eres amable y transmites confianza sin ser rigido.",
  relaxed: "Tu tono es relajado y cercano, como hablar con un amigo que conoce todos los secretos del lugar. Haces sentir a cada persona como en casa.",
  genz: "Tu tono es juvenil y fresco. Usas expresiones modernas, emojis ocasionales y un estilo directo que conecta con gente joven.",
};

const PREVIEW_TEMPLATES: Record<AlgorithmType, Record<CommunicationRegion, string>> = {
  hotel: {
    neutral: "Hola! Bienvenido a {hotelName}. Con gusto le ayudo con su reservacion. Tenemos habitaciones disponibles desde $2,500 MXN la noche con vista al mar. Le comparto los detalles?",
    colombian: "Quiubo! Bienvenido a {hotelName}, parce. Con todo el gusto te ayudo con tu reserva. Tenemos unas habitaciones bacanas desde $2,500 MXN la noche con vista al mar. Te cuento mas?",
    mexican: "Que onda! Bienvenido a {hotelName}. Con mucho gusto te ayudo con tu reservacion. Tenemos habitaciones bien chidas desde $2,500 MXN la noche con vista al mar. Te paso los detalles?",
    argentinian: "Che, bienvenido a {hotelName}! Dale, te ayudo con la reserva. Tenemos unas habitaciones barbaras desde $2,500 MXN la noche con vista al mar. Te cuento?",
  },
  restaurant: {
    neutral: "Hola! Bienvenido a {hotelName}. Nuestro menu del dia incluye opciones deliciosas. Le gustaria hacer una reservacion o ver la carta?",
    colombian: "Quiubo parce! Bienvenido a {hotelName}. El menu de hoy esta brutal. Te hago una reserva o te cuento que hay de bueno?",
    mexican: "Que onda! Bienvenido a {hotelName}. El menu de hoy esta bien chido. Quieres una mesa o te platico que tenemos?",
    argentinian: "Che, bienvenido a {hotelName}! El menu de hoy esta barbaro. Dale, te hago una reserva o te cuento que hay?",
  },
  ecommerce: {
    neutral: "Hola! Bienvenido a {hotelName}. Puedo ayudarte a encontrar lo que buscas en nuestro catalogo. Que estas buscando hoy?",
    colombian: "Quiubo parce! Bienvenido a {hotelName}. Con gusto te ayudo a encontrar lo que necesitas. Que andas buscando?",
    mexican: "Que onda! Bienvenido a {hotelName}. Con mucho gusto te ayudo a encontrar lo que buscas. Que andas necesitando?",
    argentinian: "Che, bienvenido a {hotelName}! Dale, te ayudo a encontrar lo que buscas. Que necesitas?",
  },
  appointments: {
    neutral: "Hola! Con gusto le ayudo a agendar su cita en {hotelName}. Que dia y horario le conviene?",
    colombian: "Quiubo parce! Te ayudo a cuadrar tu cita en {hotelName}. Que dia te sirve?",
    mexican: "Que onda! Te ayudo a agendar tu cita en {hotelName}. Que dia te late?",
    argentinian: "Che, dale! Te ayudo a sacar turno en {hotelName}. Que dia te viene bien?",
  },
  "whatsapp-store": {
    neutral: "Hola! Bienvenido a {hotelName}. Aqui puedes ver nuestro catalogo y hacer tu pedido. En que puedo ayudarte?",
    colombian: "Quiubo parce! Bienvenido a {hotelName}. Mira el catalogo y pide lo que quieras. En que te ayudo?",
    mexican: "Que onda! Bienvenido a {hotelName}. Checate el catalogo y pidelo que se te antoje. En que te echo la mano?",
    argentinian: "Che, bienvenido a {hotelName}! Fijate el catalogo y pedí lo que quieras. En que te ayudo?",
  },
};

function generatePersonality(agentName: string, hotelName: string, algorithm: AlgorithmType, region: CommunicationRegion, register: CommunicationRegister): string {
  const base = BASE_TEMPLATES[algorithm].replace("{agentName}", agentName).replace("{hotelName}", hotelName);
  const regionOverlay = REGION_OVERLAYS[region];
  const registerOverlay = REGISTER_OVERLAYS[register];
  return `${base} ${regionOverlay} ${registerOverlay} Siempre ofreces ayuda sin sonar robotico y haces sentir a cada persona bienvenida.`;
}

function getPreview(hotelName: string, algorithm: AlgorithmType, region: CommunicationRegion): string {
  return PREVIEW_TEMPLATES[algorithm][region].replace(/\{hotelName\}/g, hotelName);
}

interface PersonalityConfigProps {
  agent: Agent;
}

export function PersonalityConfig({ agent }: PersonalityConfigProps) {
  const { updateAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [name, setName] = useState(agent.name);
  const [hotelName, setHotelName] = useState(agent.hotelName);
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
                      ? "ring-2 ring-orange-500 bg-orange-50/50 shadow-md"
                      : "ring-black/[0.06] bg-white hover:shadow-md hover:ring-black/[0.1]"
                  }`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? "bg-orange-100" : "bg-gray-100"}`}>
                    <Icon className={`h-5 w-5 ${selected ? "text-orange-600" : "text-gray-500"}`} />
                  </div>
                  <span className={`text-[13px] font-semibold leading-tight ${selected ? "text-orange-700" : "text-gray-700"}`}>
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
                        ? "ring-2 ring-orange-500 bg-orange-50/50 shadow-md"
                        : "ring-black/[0.06] bg-white hover:shadow-md"
                    }`}
                  >
                    <span className="text-2xl">{REGION_FLAGS[key]}</span>
                    <span className={`text-[13px] font-semibold ${selected ? "text-orange-700" : "text-gray-700"}`}>
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
                        ? "ring-2 ring-orange-500 bg-orange-50/50 shadow-md"
                        : "ring-black/[0.06] bg-white hover:shadow-md"
                    }`}
                  >
                    <span className={`text-[13px] font-semibold ${selected ? "text-orange-700" : "text-gray-700"}`}>
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
              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 ring-1 ring-orange-100">
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
