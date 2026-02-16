"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

export function AgentForm() {
  const router = useRouter();
  const addAgent = useAgentStore((s) => s.addAgent);
  const { t } = useLocaleStore();

  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [language, setLanguage] = useState("es");
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">("friendly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hotelName.trim()) {
      toast.error(t.agentSettings.fillRequired);
      return;
    }

    addAgent({
      name: name.trim(),
      hotelName: hotelName.trim(),
      status: "setup",
      personality: "You are a helpful hotel concierge assistant.",
      tone,
      language,
      whatsappConnected: false,
      whatsappPhoneNumber: undefined,
    });

    toast.success(t.agentSettings.agentCreated);
    router.push("/agents");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t.agents.createTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Label htmlFor="hotelName">{t.agents.hotelName} *</Label>
            <Input
              id="hotelName"
              placeholder={t.agents.hotelNamePlaceholder}
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">{t.common.create}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/agents")}
            >
              {t.common.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
