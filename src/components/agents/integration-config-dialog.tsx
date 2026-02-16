"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Integration } from "@/lib/mock-data";
import { toast } from "sonner";

interface IntegrationConfigDialogProps {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WOMPI_FIELDS = ["publicKey", "privateKey", "eventsKey"] as const;
const BOLD_FIELDS = ["apiKey", "secretKey"] as const;
const GOOGLE_SHEETS_FIELDS = ["apiKey", "spreadsheetId", "sheetName"] as const;
const GOOGLE_CALENDAR_FIELDS = ["apiKey", "calendarId"] as const;
const GMAIL_FIELDS = ["apiKey", "senderEmail", "staffEmail"] as const;
const WOOCOMMERCE_FIELDS = ["siteUrl", "consumerKey", "consumerSecret"] as const;
const SHOPIFY_FIELDS = ["storeUrl", "accessToken"] as const;

function getFieldsForIntegration(name: string) {
  if (name === "wompi") return WOMPI_FIELDS;
  if (name === "bold") return BOLD_FIELDS;
  if (name === "google-sheets") return GOOGLE_SHEETS_FIELDS;
  if (name === "google-calendar") return GOOGLE_CALENDAR_FIELDS;
  if (name === "gmail") return GMAIL_FIELDS;
  if (name === "woocommerce") return WOOCOMMERCE_FIELDS;
  if (name === "shopify") return SHOPIFY_FIELDS;
  return [];
}

function getFieldType(field: string): string {
  if (["publicKey", "spreadsheetId", "sheetName", "calendarId", "senderEmail", "staffEmail", "siteUrl", "storeUrl"].includes(field)) return "text";
  return "password";
}

export function IntegrationConfigDialog({
  integration,
  open,
  onOpenChange,
}: IntegrationConfigDialogProps) {
  const { updateIntegrationConfig } = useAgentStore();
  const { t } = useLocaleStore();

  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (integration) {
      setEnvironment(integration.environment ?? "sandbox");
      setCredentials(integration.credentials ?? {});
      setCopied(false);
    }
  }, [integration]);

  if (!integration) return null;

  const fields = getFieldsForIntegration(integration.name);
  const webhookUrl = `https://api.agenthub.co/webhooks/${integration.name}/${integration.agentId}`;

  const isPayment = integration.category === "payments";

  const fieldLabels: Record<string, string> = {
    publicKey: t.integrations.publicKey,
    privateKey: t.integrations.privateKey,
    eventsKey: t.integrations.eventsKey,
    apiKey: t.integrations.apiKey,
    secretKey: t.integrations.secretKey,
    spreadsheetId: t.integrations.spreadsheetId,
    sheetName: t.integrations.sheetName,
    calendarId: t.integrations.calendarId,
    senderEmail: t.integrations.senderEmail,
    staffEmail: t.integrations.staffEmail,
    siteUrl: t.integrations.siteUrl,
    consumerKey: t.integrations.consumerKey,
    consumerSecret: t.integrations.consumerSecret,
    storeUrl: t.integrations.storeUrl,
    accessToken: t.integrations.accessToken,
  };

  const handleSave = () => {
    const allFilled = fields.every((f) => credentials[f]?.trim());
    if (!allFilled) {
      toast.error(t.integrations.fillCredentials);
      return;
    }
    updateIntegrationConfig(integration.id, { ...(isPayment ? { environment } : {}), credentials });
    toast.success(t.integrations.configSaved);
    onOpenChange(false);
  };

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success(t.integrations.webhookCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const itemT = t.integrations.items[integration.name as keyof typeof t.integrations.items];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{itemT?.name ?? integration.name}</DialogTitle>
            {isPayment && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  environment === "production"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {environment === "production" ? t.integrations.production : t.integrations.sandbox}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Environment toggle - only for payment integrations */}
          {isPayment && (
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-muted-foreground">
              {t.integrations.environment}
            </Label>
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setEnvironment("sandbox")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                  environment === "sandbox"
                    ? "bg-white shadow-sm text-amber-700"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                {t.integrations.sandbox}
              </button>
              <button
                onClick={() => setEnvironment("production")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                  environment === "production"
                    ? "bg-white shadow-sm text-red-700"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                {t.integrations.production}
              </button>
            </div>
            <p className="text-[12px] text-muted-foreground">
              {environment === "sandbox"
                ? t.integrations.sandboxDescription
                : t.integrations.productionDescription}
            </p>
          </div>
          )}

          {/* Credential fields */}
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="text-[13px]">
                  {fieldLabels[field] ?? field}
                </Label>
                <Input
                  id={field}
                  type={getFieldType(field)}
                  value={credentials[field] ?? ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  placeholder={`${fieldLabels[field] ?? field}...`}
                />
              </div>
            ))}
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">{t.integrations.webhookUrl}</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="text-[12px] text-muted-foreground bg-gray-50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={handleCopyWebhook}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave}>
            {t.integrations.saveConfig}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
