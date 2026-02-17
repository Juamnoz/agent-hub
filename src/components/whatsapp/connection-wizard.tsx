"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Zap,
  Shield,
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
import type { WhatsAppProvider } from "@/lib/mock-data";

interface ConnectionWizardProps {
  agentId: string;
  isConnected: boolean;
}

export function ConnectionWizard({
  agentId,
  isConnected,
}: ConnectionWizardProps) {
  const [provider, setProvider] = useState<WhatsAppProvider | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Meta credentials
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");

  // WATI credentials
  const [watiEndpoint, setWatiEndpoint] = useState("");
  const [watiBearerToken, setWatiBearerToken] = useState("");

  const { agents, updateAgent } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  const metaSteps = [
    { title: t.whatsapp.steps.createApp.title, description: t.whatsapp.steps.createApp.description },
    { title: t.whatsapp.steps.configure.title, description: t.whatsapp.steps.configure.description },
    { title: t.whatsapp.steps.webhook.title, description: t.whatsapp.steps.webhook.description },
    { title: t.whatsapp.steps.credentials.title, description: t.whatsapp.steps.credentials.description },
    { title: t.whatsapp.steps.test.title, description: t.whatsapp.steps.test.description },
  ];

  const watiSteps = [
    { title: t.whatsapp.watiSteps.credentials.title, description: t.whatsapp.watiSteps.credentials.description },
    { title: t.whatsapp.watiSteps.webhook.title, description: t.whatsapp.watiSteps.webhook.description },
    { title: t.whatsapp.watiSteps.test.title, description: t.whatsapp.watiSteps.test.description },
  ];

  const steps = provider === "wati" ? watiSteps : metaSteps;
  const webhookUrl = `https://your-domain.com/api/webhooks/whatsapp`;

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(t.whatsapp.webhookCopied);
  }

  function handleMetaConnect() {
    if (!accessToken.trim() || !phoneNumberId.trim()) {
      toast.error(t.whatsapp.fillCredentials);
      return;
    }
    updateAgent(agentId, {
      whatsappConnected: true,
      whatsappPhoneNumber: "+1 (555) 123-4567",
      whatsappProvider: "meta",
    });
    toast.success(t.whatsapp.connectionSuccess);
    setCurrentStep(4);
  }

  function handleWatiConnect() {
    if (!watiEndpoint.trim() || !watiBearerToken.trim()) {
      toast.error(t.whatsapp.fillCredentials);
      return;
    }
    updateAgent(agentId, {
      whatsappConnected: true,
      whatsappPhoneNumber: "+1 (555) 123-4567",
      whatsappProvider: "wati",
    });
    toast.success(t.whatsapp.connectionSuccess);
    setCurrentStep(2);
  }

  function handleDisconnect() {
    updateAgent(agentId, {
      whatsappConnected: false,
      whatsappPhoneNumber: undefined,
      whatsappProvider: undefined,
    });
    toast.success(t.whatsapp.disconnect);
    setProvider(null);
    setCurrentStep(0);
  }

  // Connected state
  if (isConnected) {
    const connectedProvider = agent?.whatsappProvider;
    return (
      <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <div className="rounded-2xl bg-emerald-50 p-3.5 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t.whatsapp.connectedTitle}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {t.whatsapp.connectedDescription}
          </p>
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="text-[13px]">
              +1 (555) 123-4567
            </Badge>
            {connectedProvider && (
              <Badge variant="outline" className="text-[11px] bg-orange-50 text-orange-700 border-orange-200">
                {t.whatsapp.connectedVia} {connectedProvider === "wati" ? "WATI" : "Meta API"}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            {t.whatsapp.disconnect}
          </Button>
        </div>
      </div>
    );
  }

  // Provider selection
  if (!provider) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-[17px] font-semibold">{t.whatsapp.chooseProvider}</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {t.whatsapp.chooseProviderDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* WATI - Recommended */}
          <button
            onClick={() => { setProvider("wati"); setCurrentStep(0); }}
            className="group relative flex flex-col items-center rounded-2xl bg-white px-3 py-4 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-md hover:ring-orange-200 active:scale-[0.96] text-center"
          >
            <Badge className="absolute -top-1.5 right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0 leading-4">
              {t.whatsapp.recommended}
            </Badge>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 mb-2">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-[13px] font-semibold leading-tight">{t.whatsapp.wati}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {t.whatsapp.watiDescription}
            </p>
          </button>

          {/* Direct Meta API */}
          <button
            onClick={() => { setProvider("meta"); setCurrentStep(0); }}
            className="group flex flex-col items-center rounded-2xl bg-white px-3 py-4 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-md hover:ring-orange-200 active:scale-[0.96] text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 mb-2">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-[13px] font-semibold leading-tight">{t.whatsapp.directMeta}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {t.whatsapp.directMetaDescription}
            </p>
          </button>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === steps.length - 1;
  const isCredentialStep = provider === "meta" ? currentStep === 3 : currentStep === 0;
  const isWebhookStep = provider === "meta" ? currentStep === 2 : currentStep === 1;
  const isTestStep = provider === "meta" ? currentStep === 4 : currentStep === 2;

  return (
    <div className="space-y-5">
      {/* Provider indicator + change */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-medium">
            {provider === "wati" ? "WATI" : "Meta API"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[12px] text-muted-foreground h-7"
          onClick={() => { setProvider(null); setCurrentStep(0); }}
        >
          {t.whatsapp.changeProvider}
        </Button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {i < currentStep ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : i === currentStep ? (
                <Circle className="h-5 w-5 text-orange-600 fill-orange-600" />
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
      <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-[16px] font-semibold">{steps[currentStep].title}</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">{steps[currentStep].description}</p>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* ---- META FLOW ---- */}
          {provider === "meta" && currentStep === 0 && (
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
          )}

          {provider === "meta" && isWebhookStep && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t.whatsapp.webhookUrl}:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm break-all">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {provider === "meta" && isCredentialStep && (
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
              <Button onClick={handleMetaConnect}>{t.whatsapp.connect}</Button>
            </div>
          )}

          {/* ---- WATI FLOW ---- */}
          {provider === "wati" && isCredentialStep && (
            <div className="space-y-4">
              <Button variant="outline" size="sm" asChild className="mb-2">
                <a
                  href="https://app.wati.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.whatsapp.openWatiDashboard}
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
              <div className="space-y-2">
                <Label htmlFor="wati-endpoint">{t.whatsapp.watiApiEndpoint}</Label>
                <Input
                  id="wati-endpoint"
                  placeholder={t.whatsapp.watiApiEndpointPlaceholder}
                  value={watiEndpoint}
                  onChange={(e) => setWatiEndpoint(e.target.value)}
                />
                <p className="text-[12px] text-muted-foreground">
                  {t.whatsapp.watiApiEndpointHelp}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wati-token">{t.whatsapp.watiBearerToken}</Label>
                <Input
                  id="wati-token"
                  type="password"
                  placeholder={t.whatsapp.watiBearerTokenPlaceholder}
                  value={watiBearerToken}
                  onChange={(e) => setWatiBearerToken(e.target.value)}
                />
                <p className="text-[12px] text-muted-foreground">
                  {t.whatsapp.watiBearerTokenHelp}
                </p>
              </div>
              <Button onClick={handleWatiConnect}>{t.whatsapp.connect}</Button>
            </div>
          )}

          {provider === "wati" && isWebhookStep && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t.whatsapp.webhookUrl}:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm break-all">
                  {webhookUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[12px] text-muted-foreground">
                WATI Dashboard → Settings → Webhooks → Add Webhook URL
              </p>
            </div>
          )}

          {/* ---- SHARED: Test/success step ---- */}
          {isTestStep && (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="font-semibold">{t.whatsapp.connectionSuccess}</h3>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {!isTestStep && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.whatsapp.back}
          </Button>
          {!isCredentialStep && (
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
