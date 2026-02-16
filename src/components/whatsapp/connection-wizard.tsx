"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

interface ConnectionWizardProps {
  agentId: string;
  isConnected: boolean;
}

export function ConnectionWizard({
  agentId,
  isConnected,
}: ConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const { updateAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const steps = [
    { title: t.whatsapp.steps.createApp.title, description: t.whatsapp.steps.createApp.description },
    { title: t.whatsapp.steps.configure.title, description: t.whatsapp.steps.configure.description },
    { title: t.whatsapp.steps.webhook.title, description: t.whatsapp.steps.webhook.description },
    { title: t.whatsapp.steps.credentials.title, description: t.whatsapp.steps.credentials.description },
    { title: t.whatsapp.steps.test.title, description: t.whatsapp.steps.test.description },
  ];

  const webhookUrl = `https://your-domain.com/api/webhooks/whatsapp`;

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(t.whatsapp.webhookCopied);
  }

  function handleConnect() {
    if (!accessToken.trim() || !phoneNumberId.trim()) {
      toast.error(t.whatsapp.fillCredentials);
      return;
    }
    updateAgent(agentId, {
      whatsappConnected: true,
      whatsappPhoneNumber: "+1 (555) 123-4567",
    });
    toast.success(t.whatsapp.connectionSuccess);
    setCurrentStep(4);
  }

  function handleDisconnect() {
    updateAgent(agentId, {
      whatsappConnected: false,
      whatsappPhoneNumber: undefined,
    });
    toast.success(t.whatsapp.disconnect);
    setCurrentStep(0);
  }

  if (isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="rounded-full bg-emerald-50 p-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t.whatsapp.connectedTitle}</h3>
          <p className="text-sm text-muted-foreground mb-1">
            {t.whatsapp.connectedDescription}
          </p>
          <Badge variant="outline" className="mb-6">
            +1 (555) 123-4567
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            {t.whatsapp.disconnect}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {i < currentStep ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : i === currentStep ? (
                <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-6 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <div className="space-y-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://developers.facebook.com/apps/create/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.whatsapp.openMeta}
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t.whatsapp.webhookUrl}:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-token">{t.whatsapp.accessToken}</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-id">{t.whatsapp.phoneNumberId}</Label>
                <Input
                  id="phone-id"
                  placeholder="1234567890"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                />
              </div>
              <Button onClick={handleConnect}>{t.whatsapp.connect}</Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="font-semibold">{t.whatsapp.connectionSuccess}</h3>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.whatsapp.back}
          </Button>
          {currentStep < 3 && (
            <Button onClick={() => setCurrentStep((s) => s + 1)}>
              {t.whatsapp.next}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
