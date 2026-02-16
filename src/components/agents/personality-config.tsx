"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Agent } from "@/lib/mock-data";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PersonalityConfigProps {
  agent: Agent;
}

export function PersonalityConfig({ agent }: PersonalityConfigProps) {
  const router = useRouter();
  const { updateAgent, deleteAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [name, setName] = useState(agent.name);
  const [hotelName, setHotelName] = useState(agent.hotelName);
  const [personality, setPersonality] = useState(agent.personality);
  const [tone, setTone] = useState(agent.tone);
  const [language, setLanguage] = useState(agent.language);

  function handleSave() {
    updateAgent(agent.id, {
      name: name.trim(),
      hotelName: hotelName.trim(),
      personality: personality.trim(),
      tone,
      language,
    });
    toast.success(t.agentSettings.settingsSaved);
  }

  function handleDelete() {
    deleteAgent(agent.id);
    toast.success(t.agentSettings.agentDeleted);
    router.push("/agents");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.agentSettings.basicInfo}</CardTitle>
          <CardDescription>{t.agentSettings.basicInfoDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">{t.agents.agentName}</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-name">{t.agents.hotelName}</Label>
            <Input
              id="hotel-name"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.agentSettings.personalityTone}</CardTitle>
          <CardDescription>{t.agentSettings.personalityToneDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality">{t.agents.systemPrompt}</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={4}
              placeholder={t.agents.personalityPlaceholder}
            />
            <p className="text-xs text-muted-foreground">
              {t.agents.systemPromptDescription}
            </p>
          </div>

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

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t.agentSettings.dangerZone}</CardTitle>
          <CardDescription>{t.agentSettings.dangerZoneDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>
            {t.agentSettings.deleteAgent}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
