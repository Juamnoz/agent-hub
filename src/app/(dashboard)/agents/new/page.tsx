"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function NewAgentPage() {
  const router = useRouter();
  const { addAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [name, setName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [language, setLanguage] = useState("es");
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">(
    "friendly"
  );

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

      <Card>
        <CardHeader>
          <CardTitle>{t.agents.createTitle}</CardTitle>
          <CardDescription>
            {t.agentSettings.basicInfoDescription}
          </CardDescription>
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
              <Label htmlFor="hotelName">{t.agents.hotelName} *</Label>
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
                onValueChange={(v) =>
                  setTone(v as "formal" | "friendly" | "casual")
                }
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
