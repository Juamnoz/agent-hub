"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
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
import { toast } from "sonner";

export default function AgentSettingsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, updateAgent } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  const [name, setName] = useState(agent?.name ?? "");
  const [hotelName, setHotelName] = useState(agent?.hotelName ?? "");
  const [avatar, setAvatar] = useState(agent?.avatar ?? "");
  const [tone, setTone] = useState(agent?.tone ?? "friendly");
  const [language, setLanguage] = useState(agent?.language ?? "es");

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

  function handleSave() {
    updateAgent(agent!.id, {
      name: name.trim(),
      hotelName: hotelName.trim(),
      avatar: avatar.trim() || undefined,
      tone: tone as "formal" | "friendly" | "casual",
      language,
    });
    toast.success(t.agentSettings.settingsSaved);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="inline-flex items-center gap-1.5 mb-4 -ml-2 px-2 py-1 text-sm font-medium text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {agent.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.agentSettings.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.agentSettings.configure} {agent.name}
        </p>
      </div>

      {/* Identity */}
      <div className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold">{t.agentSettings.basicInfo}</h2>
          <p className="text-[13px] text-muted-foreground">
            {t.agentSettings.basicInfoDescription}
          </p>
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById("settings-avatar-file")?.click()}
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
            <Input
              placeholder="https://... URL de la imagen"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="flex-1"
            />
          </div>
          <input
            id="settings-avatar-file"
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
          <Label htmlFor="settings-agent-name">{t.agents.agentName}</Label>
          <Input
            id="settings-agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-hotel-name">{t.agents.hotelName}</Label>
          <Input
            id="settings-hotel-name"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
          />
        </div>
      </div>

      {/* Language & tone */}
      <div className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold">
            {t.agentSettings.personalityTone}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {t.agentSettings.personalityToneDescription}
          </p>
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
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as typeof tone)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">{t.agents.toneOptions.formal}</SelectItem>
                <SelectItem value="friendly">
                  {t.agents.toneOptions.friendly}
                </SelectItem>
                <SelectItem value="casual">{t.agents.toneOptions.casual}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        {t.common.save}
      </Button>
    </div>
  );
}
