"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, Check, ExternalLink, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EventType = {
  id: number;
  slug: string;
  title: string;
};

type Props = {
  agentId: string;
  /** true cuando Cal.com ya hizo el callback OAuth exitoso */
  calConnected?: boolean;
  calUsername?: string;
  calEventTypeId?: string;
  calBookingUrl?: string;
  /** llamado cuando se guarda el event type, o con ("","") al desconectar */
  onConfigured?: (eventTypeId: string, bookingUrl: string) => void;
};

export function CalendarStep({
  agentId,
  calConnected: initialConnected = false,
  calUsername: initialUsername = "",
  calEventTypeId: initialEventTypeId = "",
  calBookingUrl: initialBookingUrl = "",
  onConfigured,
}: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [username, setUsername] = useState(initialUsername);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState(initialEventTypeId);
  const [bookingUrl, setBookingUrl] = useState(initialBookingUrl);
  const [configured, setConfigured] = useState(!!(initialEventTypeId && initialBookingUrl));
  const [connecting, setConnecting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al conectar (vía OAuth callback), cargar event types
  useEffect(() => {
    if (connected && !configured && eventTypes.length === 0) {
      loadEventTypes();
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEventTypes() {
    setLoadingTypes(true);
    setError(null);
    try {
      const data = await apiFetch<{ eventTypes: EventType[]; username?: string }>(
        `/agents/${agentId}/calendar/event-types`
      );
      setEventTypes(data.eventTypes ?? []);
      if (data.username) setUsername(data.username);
    } catch {
      setError("No se pudieron cargar los tipos de cita");
    } finally {
      setLoadingTypes(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const data = await apiFetch<{ authUrl: string }>(`/integrations/calcom/connect`, {
        params: { agentId },
      });
      window.location.href = data.authUrl;
    } catch {
      setError("No se pudo iniciar la conexión con Cal.com");
      setConnecting(false);
    }
  }

  async function handleSave() {
    if (!selectedTypeId) return;
    setSaving(true);
    setError(null);
    try {
      const data = await apiFetch<{ calBookingUrl: string }>(
        `/agents/${agentId}/calendar/event-type`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventTypeId: selectedTypeId }),
        }
      );
      const url = data.calBookingUrl ?? "";
      setBookingUrl(url);
      setConfigured(true);
      onConfigured?.(selectedTypeId, url);
    } catch {
      setError("No se pudo guardar el tipo de cita");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setError(null);
    try {
      await apiFetch(`/agents/${agentId}/calendar/disconnect`, { method: "POST" });
    } catch {
      // ignorar error, limpiar igual
    }
    setConnected(false);
    setConfigured(false);
    setUsername("");
    setEventTypes([]);
    setSelectedTypeId("");
    setBookingUrl("");
    onConfigured?.("", "");
  }

  // ── Estado C — configurado ────────────────────────────────
  if (configured && bookingUrl) {
    const selectedType = eventTypes.find((e) => String(e.id) === selectedTypeId);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">Calendario conectado</p>
              <p className="text-[13px] text-muted-foreground">
                {selectedType?.title ?? "Tipo de cita configurado"}
              </p>
            </div>
          </div>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{bookingUrl}</span>
          </a>
        </div>

        {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

        <button
          onClick={handleDisconnect}
          className="w-full text-[14px] text-red-500 hover:text-red-400 transition-colors py-1"
        >
          Desconectar calendario
        </button>
      </div>
    );
  }

  // ── Estado B — conectado, eligiendo event type ─────────────
  if (connected) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[14px] font-semibold">
                {username ? `Conectado como ${username}` : "Conectado a Cal.com"}
              </p>
              <p className="text-[12px] text-muted-foreground">Cal.com vinculado correctamente</p>
            </div>
          </div>

          <div className="px-4 py-3 space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">Tipo de cita</p>
            {loadingTypes ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-[14px] text-muted-foreground">Cargando tipos de cita...</span>
              </div>
            ) : (
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecciona un tipo de cita" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.id} value={String(et.id)}>
                      {et.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={!selectedTypeId || saving}
          className="w-full h-12 rounded-xl"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    );
  }

  // ── Estado A — no conectado ───────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card ring-1 ring-border p-5 text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/15">
            <CalendarCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div>
          <p className="text-[17px] font-semibold">Conecta el calendario de tu negocio</p>
          <p className="text-[14px] text-muted-foreground mt-1 leading-snug">
            Vincula tu cuenta de Cal.com para gestionar citas desde WhatsApp
          </p>
        </div>
      </div>

      {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          "Conectar con Cal.com"
        )}
      </Button>
    </div>
  );
}
