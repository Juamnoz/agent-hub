"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  User,
  Bell,
  CreditCard,
  ChevronRight,
  Globe,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

const CURRENCIES = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "BRL", label: "BRL — Real brasileiro" },
  { value: "PEN", label: "PEN — Sol peruano" },
  { value: "CLP", label: "CLP — Peso chileno" },
];

export default function SettingsPage() {
  const { t } = useLocaleStore();
  const [name, setName] = useState("Juan Garcia");
  const [email, setEmail] = useState("juan@hotelplayaazul.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [agentAlerts, setAgentAlerts] = useState(false);
  const [currency, setCurrency] = useState("COP");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);

  const handleSave = () => toast.success(t.settingsPage.saved);

  return (
    <div className="space-y-5 pb-4 lg:max-w-[640px] lg:mx-auto">

      {/* Perfil */}
      <Section label={t.settingsPage.profile}>
        <FieldRow label={t.settingsPage.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            className="bg-transparent text-[14px] text-right text-muted-foreground outline-none w-full max-w-[180px] text-ellipsis"
          />
        </FieldRow>
        <Divider />
        <FieldRow label={t.settingsPage.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleSave}
            className="bg-transparent text-[14px] text-right text-muted-foreground outline-none w-full max-w-[200px] text-ellipsis"
          />
        </FieldRow>
      </Section>

      {/* Moneda */}
      <Section label="Preferencias">
        <button
          onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
          className="flex w-full items-center gap-3 px-4 py-3.5"
        >
          <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-[14px] font-medium text-left">{t.settingsPage.currency}</span>
          <span className="text-[13px] text-muted-foreground mr-1">{currency}</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showCurrencyPicker ? "rotate-90" : ""}`} />
        </button>
        {showCurrencyPicker && (
          <div className="border-t border-border/60 bg-muted/20">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCurrency(c.value); setShowCurrencyPicker(false); handleSave(); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-[13px]"
              >
                <span className="flex-1 text-left">{c.label}</span>
                {currency === c.value && <Check className="h-4 w-4 text-orange-500" />}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Planes y facturación — link a /billing */}
      <Section label="Suscripción">
        <Link href="/billing" className="flex items-center gap-3 px-4 py-3.5">
          <CreditCard className="h-5 w-5 shrink-0 text-orange-500" />
          <div className="flex-1">
            <p className="text-[14px] font-medium">Planes y facturación</p>
            <p className="text-[12px] text-muted-foreground">Plan Pro · $80/mes</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Section>

      {/* Notificaciones */}
      <Section label={t.settingsPage.notifications}>
        <FieldRow label={t.settingsPage.emailNotifications}>
          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </FieldRow>
        <Divider />
        <FieldRow label={t.settingsPage.weeklyReports}>
          <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
        </FieldRow>
        <Divider />
        <FieldRow label={t.settingsPage.agentAlerts}>
          <Switch checked={agentAlerts} onCheckedChange={setAgentAlerts} />
        </FieldRow>
      </Section>

      {/* Eliminar cuenta */}
      {deleteStep === 0 && (
        <button
          onClick={() => setDeleteStep(1)}
          className="w-full rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-red-500 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98]"
        >
          {t.settingsPage.deleteAccount}
        </button>
      )}

      {deleteStep === 1 && (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-5 py-4 text-center border-b border-border">
            <Trash2 className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-[15px] font-semibold">{t.settingsPage.deleteAccount}</p>
            <p className="text-[13px] text-muted-foreground mt-1">{t.settingsPage.deleteAccountConfirm}</p>
          </div>
          <button
            onClick={() => { toast.error(t.settingsPage.deleteAccountWarning); setDeleteStep(0); }}
            className="w-full px-4 py-3 text-[15px] font-medium text-red-500 border-b border-border transition-colors active:bg-red-50"
          >
            {t.settingsPage.deleteAccount}
          </button>
          <button
            onClick={() => setDeleteStep(0)}
            className="w-full px-4 py-3 text-[15px] font-medium text-orange-600 transition-colors active:bg-orange-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <p className="text-[13px] font-medium text-muted-foreground px-0.5 mb-1.5">{label}</p>
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex-1 text-[14px] font-medium">{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border/60 mx-4" />;
}
