"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Copy,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Zap,
  RefreshCw,
  QrCode,
  Phone,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";
import type { WhatsAppProvider } from "@/lib/mock-data";

interface ConnectionWizardProps {
  agentId: string;
  isConnected: boolean;
}

// Fake QR code SVG pattern
function QRCodePlaceholder() {
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-44" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white" />
      {/* Top-left finder */}
      <rect x="10" y="10" width="56" height="56" rx="4" fill="#111" />
      <rect x="18" y="18" width="40" height="40" rx="2" fill="white" />
      <rect x="26" y="26" width="24" height="24" rx="1" fill="#111" />
      {/* Top-right finder */}
      <rect x="134" y="10" width="56" height="56" rx="4" fill="#111" />
      <rect x="142" y="18" width="40" height="40" rx="2" fill="white" />
      <rect x="150" y="26" width="24" height="24" rx="1" fill="#111" />
      {/* Bottom-left finder */}
      <rect x="10" y="134" width="56" height="56" rx="4" fill="#111" />
      <rect x="18" y="142" width="40" height="40" rx="2" fill="white" />
      <rect x="26" y="150" width="24" height="24" rx="1" fill="#111" />
      {/* Data modules (random pattern) */}
      {[80,90,100,110,120,130].map((x) =>
        [10,20,30,40,50,60,70,80].map((y) =>
          (x + y) % 20 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="#111" /> : null
        )
      )}
      {[80,100,120,140,160,180].map((x) =>
        [90,100,110,120,130,140,150,160,170,180].map((y) =>
          (x * y) % 30 < 8 ? <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="#111" /> : null
        )
      )}
      {[10,20,30,40,50,60].map((x) =>
        [80,90,100,110,120].map((y) =>
          (x + y) % 18 < 8 ? <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="#111" /> : null
        )
      )}
    </svg>
  );
}

export function ConnectionWizard({ agentId, isConnected }: ConnectionWizardProps) {
  const [provider, setProvider] = useState<WhatsAppProvider | null>(null);
  const [coexMethod, setCoexMethod] = useState<"qr" | "phone" | null>(null);
  const [phoneStep, setPhoneStep] = useState<"enter" | "code">("enter");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [qrSeconds, setQrSeconds] = useState(30);
  const [qrExpired, setQrExpired] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Meta / WATI credentials
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [watiEndpoint, setWatiEndpoint] = useState("");
  const [watiBearerToken, setWatiBearerToken] = useState("");

  const { agents, updateAgent } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);
  const webhookUrl = `https://your-domain.com/api/webhooks/whatsapp`;

  // QR countdown
  useEffect(() => {
    if (provider !== "coexistence" || coexMethod !== "qr" || qrExpired) return;
    if (qrSeconds <= 0) { setQrExpired(true); return; }
    const timer = setTimeout(() => setQrSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [provider, coexMethod, qrSeconds, qrExpired]);

  function refreshQr() {
    setQrSeconds(30);
    setQrExpired(false);
  }

  function handleCoexConnect() {
    updateAgent(agentId, {
      whatsappConnected: true,
      whatsappPhoneNumber: phoneNumber || "+57 300 123 4567",
      whatsappProvider: "coexistence",
    });
    toast.success(t.whatsapp.connectionSuccess);
  }

  function handleQrSimulateConnect() {
    updateAgent(agentId, {
      whatsappConnected: true,
      whatsappPhoneNumber: "+57 300 123 4567",
      whatsappProvider: "coexistence",
    });
    toast.success(t.whatsapp.connectionSuccess);
  }

  function handleMetaConnect() {
    if (!accessToken.trim() || !phoneNumberId.trim()) { toast.error(t.whatsapp.fillCredentials); return; }
    updateAgent(agentId, { whatsappConnected: true, whatsappPhoneNumber: "+1 (555) 123-4567", whatsappProvider: "meta" });
    toast.success(t.whatsapp.connectionSuccess);
    setCurrentStep(4);
  }

  function handleWatiConnect() {
    if (!watiEndpoint.trim() || !watiBearerToken.trim()) { toast.error(t.whatsapp.fillCredentials); return; }
    updateAgent(agentId, { whatsappConnected: true, whatsappPhoneNumber: "+1 (555) 123-4567", whatsappProvider: "wati" });
    toast.success(t.whatsapp.connectionSuccess);
    setCurrentStep(2);
  }

  function handleDisconnect() {
    updateAgent(agentId, { whatsappConnected: false, whatsappPhoneNumber: undefined, whatsappProvider: undefined });
    toast.success(t.whatsapp.disconnect);
    setProvider(null); setCoexMethod(null); setCurrentStep(0);
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(t.whatsapp.webhookCopied);
  }

  // ── Connected state ──────────────────────────────────────────────────────
  if (isConnected) {
    const prov = agent?.whatsappProvider;
    const provLabel = prov === "coexistence" ? "Coexistencia" : prov === "wati" ? "WATI" : "Meta API";
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 p-3.5 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t.whatsapp.connectedTitle}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t.whatsapp.connectedDescription}</p>
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="text-[13px]">{agent?.whatsappPhoneNumber ?? "+57 300 123 4567"}</Badge>
            <Badge variant="outline" className="text-[11px] bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
              {t.whatsapp.connectedVia} {provLabel}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>{t.whatsapp.disconnect}</Button>
        </div>
      </div>
    );
  }

  // ── Provider selection ───────────────────────────────────────────────────
  if (!provider) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-[17px] font-semibold">{t.whatsapp.chooseProvider}</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">{t.whatsapp.chooseProviderDescription}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Coexistencia — Recommended */}
          <button
            onClick={() => { setProvider("coexistence"); setCoexMethod(null); }}
            className="group relative flex flex-col items-start rounded-2xl bg-card px-4 py-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-md hover:ring-orange-300 active:scale-[0.97] text-left"
          >
            <Badge className="absolute -top-1.5 right-2 bg-orange-500 text-white text-[9px] px-1.5 py-0 leading-4">
              Recomendado
            </Badge>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/15 mb-3">
              <Link2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-[14px] font-semibold leading-tight">Coexistencia</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
              Conecta tu número existente con QR o código. Sin cambiar tu WhatsApp actual.
            </p>
          </button>

          {/* WATI */}
          <button
            onClick={() => { setProvider("wati"); setCurrentStep(0); }}
            className="group flex flex-col items-start rounded-2xl bg-card px-4 py-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-md hover:ring-orange-300 active:scale-[0.97] text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 mb-3">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-[14px] font-semibold leading-tight">{t.whatsapp.wati}</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{t.whatsapp.watiDescription}</p>
          </button>

          {/* Meta API */}
          <button
            onClick={() => { setProvider("meta"); setCurrentStep(0); }}
            className="group flex flex-col items-start rounded-2xl bg-card px-4 py-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-md hover:ring-orange-300 active:scale-[0.97] text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/15 mb-3">
              <Smartphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-[14px] font-semibold leading-tight">{t.whatsapp.directMeta}</h3>
            <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{t.whatsapp.directMetaDescription}</p>
          </button>
        </div>
      </div>
    );
  }

  // ── COEXISTENCIA FLOW ────────────────────────────────────────────────────
  if (provider === "coexistence") {
    // Method selection
    if (!coexMethod) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[11px]">Coexistencia</Badge>
            <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground h-7"
              onClick={() => setProvider(null)}>
              {t.whatsapp.changeProvider}
            </Button>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-[16px] font-semibold">Elige cómo conectar</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Ambos métodos permiten coexistir con tu WhatsApp normal.
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <button
                onClick={() => { setCoexMethod("qr"); setQrSeconds(30); setQrExpired(false); }}
                className="flex flex-col items-center gap-3 p-6 hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15">
                  <QrCode className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold">Código QR</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Escanea con WhatsApp</p>
                </div>
              </button>
              <button
                onClick={() => { setCoexMethod("phone"); setPhoneStep("enter"); }}
                className="flex flex-col items-center gap-3 p-6 hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15">
                  <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold">Número de teléfono</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Vincula con un código</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // QR method
    if (coexMethod === "qr") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px]">Coexistencia</Badge>
              <Badge variant="outline" className="text-[11px]">QR</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground h-7"
              onClick={() => setCoexMethod(null)}>
              ← Volver
            </Button>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            <div className="flex flex-col items-center p-6 gap-4">
              <div className="relative">
                <div className={`rounded-2xl overflow-hidden ring-1 ring-border p-2 bg-white transition-all ${qrExpired ? "opacity-30 blur-sm" : ""}`}>
                  <QRCodePlaceholder />
                </div>
                {qrExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium">QR expirado</p>
                    <Button size="sm" variant="outline" onClick={refreshQr} className="rounded-full gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Actualizar
                    </Button>
                  </div>
                )}
                {!qrExpired && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <span className="bg-card ring-1 ring-border text-[11px] font-medium px-2.5 py-0.5 rounded-full text-muted-foreground">
                      Expira en {qrSeconds}s
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-2 text-center max-w-xs">
                <p className="text-[14px] font-semibold">Escanea con tu WhatsApp</p>
                <ol className="text-[12px] text-muted-foreground text-left space-y-1 list-decimal list-inside">
                  <li>Abre WhatsApp en tu teléfono</li>
                  <li>Toca <strong>⋮</strong> → <strong>Dispositivos vinculados</strong></li>
                  <li>Toca <strong>Vincular un dispositivo</strong></li>
                  <li>Apunta la cámara al código QR</li>
                </ol>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full rounded-full lisa-btn text-white border-0" onClick={handleQrSimulateConnect}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar vinculación
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Phone number method
    if (coexMethod === "phone") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px]">Coexistencia</Badge>
              <Badge variant="outline" className="text-[11px]">Teléfono</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground h-7"
              onClick={() => setCoexMethod(null)}>
              ← Volver
            </Button>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            {phoneStep === "enter" ? (
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-[16px] font-semibold">Ingresa tu número</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Recibirás un código de 8 dígitos en WhatsApp.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-coex">Número de WhatsApp</Label>
                  <Input
                    id="phone-coex"
                    placeholder="+57 300 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-[15px]"
                  />
                  <p className="text-[12px] text-muted-foreground">Incluye el código de país (ej. +57 para Colombia)</p>
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={!phoneNumber.trim()}
                  onClick={() => setPhoneStep("code")}
                >
                  Enviar código
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-[16px] font-semibold">Ingresa el código</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Abre WhatsApp y ve a <strong>Dispositivos vinculados → Vincular con número</strong>. Ingresa el código que aparece.
                  </p>
                </div>
                {/* Mock code display */}
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Ingresa este código en WhatsApp</p>
                  <p className="text-[32px] font-bold tracking-[0.3em] text-orange-500">48291736</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Válido por 5 minutos</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Confirma el código</Label>
                  <Input
                    id="verify-code"
                    placeholder="48291736"
                    maxLength={8}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-[20px] tracking-widest font-bold"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-full flex-1" onClick={() => setPhoneStep("enter")}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Atrás
                  </Button>
                  <Button
                    className="rounded-full flex-1 lisa-btn text-white border-0"
                    disabled={verifyCode.length !== 8}
                    onClick={handleCoexConnect}
                  >
                    Conectar
                    <CheckCircle2 className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ── META / WATI FLOW (original) ──────────────────────────────────────────
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
  const isCredentialStep = provider === "meta" ? currentStep === 3 : currentStep === 0;
  const isWebhookStep = provider === "meta" ? currentStep === 2 : currentStep === 1;
  const isTestStep = provider === "meta" ? currentStep === 4 : currentStep === 2;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[11px]">{provider === "wati" ? "WATI" : "Meta API"}</Badge>
        <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground h-7"
          onClick={() => { setProvider(null); setCurrentStep(0); }}>
          {t.whatsapp.changeProvider}
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {i < currentStep ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : i === currentStep ? (
                <div className="h-5 w-5 rounded-full bg-orange-600 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">{i + 1}</span>
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full ring-1 ring-border flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">{i + 1}</span>
                </div>
              )}
              <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">{step.title}</span>
            </div>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-[16px] font-semibold">{steps[currentStep].title}</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">{steps[currentStep].description}</p>
        </div>
        <div className="px-5 pb-5 space-y-4">
          {provider === "meta" && currentStep === 0 && (
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener noreferrer">
                {t.whatsapp.openMeta}<ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          )}
          {provider === "meta" && isWebhookStep && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.whatsapp.webhookUrl}:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm break-all">{webhookUrl}</code>
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {provider === "meta" && isCredentialStep && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-token">{t.whatsapp.accessToken}</Label>
                <Input id="access-token" type="password" placeholder="EAAxxxxxxx..." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-id">{t.whatsapp.phoneNumberId}</Label>
                <Input id="phone-id" placeholder="1234567890" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
              </div>
              <Button onClick={handleMetaConnect}>{t.whatsapp.connect}</Button>
            </div>
          )}
          {provider === "wati" && isCredentialStep && (
            <div className="space-y-4">
              <Button variant="outline" size="sm" asChild className="mb-2">
                <a href="https://app.wati.io" target="_blank" rel="noopener noreferrer">
                  {t.whatsapp.openWatiDashboard}<ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </Button>
              <div className="space-y-2">
                <Label htmlFor="wati-endpoint">{t.whatsapp.watiApiEndpoint}</Label>
                <Input id="wati-endpoint" placeholder={t.whatsapp.watiApiEndpointPlaceholder} value={watiEndpoint} onChange={(e) => setWatiEndpoint(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wati-token">{t.whatsapp.watiBearerToken}</Label>
                <Input id="wati-token" type="password" placeholder={t.whatsapp.watiBearerTokenPlaceholder} value={watiBearerToken} onChange={(e) => setWatiBearerToken(e.target.value)} />
              </div>
              <Button onClick={handleWatiConnect}>{t.whatsapp.connect}</Button>
            </div>
          )}
          {provider === "wati" && isWebhookStep && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.whatsapp.webhookUrl}:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm break-all">{webhookUrl}</code>
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-[12px] text-muted-foreground">WATI Dashboard → Settings → Webhooks → Add Webhook URL</p>
            </div>
          )}
          {isTestStep && (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="font-semibold">{t.whatsapp.connectionSuccess}</h3>
            </div>
          )}
        </div>
      </div>

      {!isTestStep && (
        <div className="flex justify-between">
          <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />{t.whatsapp.back}
          </Button>
          {!isCredentialStep && (
            <Button onClick={() => setCurrentStep((s) => s + 1)}>
              {t.whatsapp.next}<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
