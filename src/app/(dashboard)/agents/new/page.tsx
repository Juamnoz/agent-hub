"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  CalendarCheck,
  MessageCircle,
  Building2,
  UtensilsCrossed,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AlgorithmType } from "@/lib/mock-data";
import { ALGORITHM_RECOMMENDED_INTEGRATIONS } from "@/lib/mock-data";

const ALGORITHM_ICONS: Record<AlgorithmType, React.ComponentType<{ className?: string }>> = {
  ecommerce: ShoppingCart,
  appointments: CalendarCheck,
  "whatsapp-store": MessageCircle,
  hotel: Building2,
  restaurant: UtensilsCrossed,
};

const ALGORITHM_KEYS: AlgorithmType[] = ["ecommerce", "appointments", "whatsapp-store", "hotel", "restaurant"];

const INTEGRATION_LABELS: Record<string, string> = {
  woocommerce: "WooCommerce",
  shopify: "Shopify",
  "google-sheets": "Google Sheets",
  "google-calendar": "Google Calendar",
  gmail: "Gmail",
};

export default function NewAgentPage() {
  const router = useRouter();
  const { addAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [algorithmType, setAlgorithmType] = useState<AlgorithmType | null>(null);
  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [language, setLanguage] = useState("es");
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">("friendly");

  const algorithmTranslationKeys: Record<AlgorithmType, keyof typeof t.personalityBuilder.algorithms> = {
    ecommerce: "ecommerce",
    appointments: "appointments",
    "whatsapp-store": "whatsappStore",
    hotel: "hotel",
    restaurant: "restaurant",
  };

  const hotelNameLabel = algorithmType
    ? t.personalityBuilder.hotelNameLabels[algorithmTranslationKeys[algorithmType]]
    : t.agents.hotelName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !hotelName.trim()) {
      toast.error(t.agentSettings.fillRequired);
      return;
    }

    addAgent({
      name: name.trim(),
      hotelName: hotelName.trim(),
      language,
      tone,
      status: "setup",
      personality: "",
      whatsappConnected: false,
      algorithmType: algorithmType ?? undefined,
    });

    toast.success(t.agentSettings.agentCreated);
    router.push("/agents");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
      </div>

      {/* Algorithm Type Selection */}
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
              const recommended = ALGORITHM_RECOMMENDED_INTEGRATIONS[key];
              return (
                <button
                  key={key}
                  type="button"
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
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {recommended.map((intName) => (
                      <Badge key={intName} variant="outline" className="text-[9px] px-1.5 py-0 text-gray-500 border-gray-200">
                        {INTEGRATION_LABELS[intName] ?? intName}
                      </Badge>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t.agents.createTitle}</CardTitle>
          <CardDescription>{t.agentSettings.basicInfoDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t.agents.agentName} *</Label>
              <Input
                id="name"
                placeholder={t.agents.agentNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelName">{hotelNameLabel} *</Label>
              <Input
                id="hotelName"
                placeholder={t.agents.hotelNamePlaceholder}
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t.agents.language}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder={t.agents.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{t.agents.languageOptions.es}</SelectItem>
                  <SelectItem value="en">{t.agents.languageOptions.en}</SelectItem>
                  <SelectItem value="pt">{t.agents.languageOptions.pt}</SelectItem>
                  <SelectItem value="fr">{t.agents.languageOptions.fr}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">{t.agents.tone}</Label>
              <Select
                value={tone}
                onValueChange={(v) => setTone(v as "formal" | "friendly" | "casual")}
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder={t.agents.tone} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">{t.agents.toneOptions.formal}</SelectItem>
                  <SelectItem value="friendly">{t.agents.toneOptions.friendly}</SelectItem>
                  <SelectItem value="casual">{t.agents.toneOptions.casual}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/agents">{t.common.cancel}</Link>
              </Button>
              <Button type="submit">{t.common.create}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
