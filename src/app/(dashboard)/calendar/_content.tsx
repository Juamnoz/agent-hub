"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CalendarDays, List, Settings, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { mockBookings, type CalBooking, type BookingStatus } from "@/lib/mock-data";
import BookingList from "@/components/calendar/booking-list";

const BookingsCalendar = dynamic(
  () => import("@/components/calendar/bookings-calendar"),
  { ssr: false, loading: () => <div className="h-[600px] rounded-2xl bg-muted/30 animate-pulse" /> }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchBookings(agentId: string): CalBooking[] {
  // TODO: replace with API call — GET /v1/agents/:id/calendar/bookings
  return mockBookings.filter((b) => b.agentId === agentId);
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmadas",
  pending: "Pendientes",
  cancelled: "Canceladas",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: "text-emerald-600 dark:text-emerald-400",
  pending: "text-amber-600 dark:text-amber-400",
  cancelled: "text-red-600 dark:text-red-400",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CalendarContent() {
  const { agents } = useAgentStore();
  const appointmentsAgents = agents.filter(
    (a) => a.algorithmType === "appointments" && !!a.calAccessToken
  );

  const [selectedAgentId, setSelectedAgentId] = useState<string>(() =>
    appointmentsAgents[0]?.id ?? ""
  );
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);

  // When agents load, set the first one as default
  useEffect(() => {
    if (!selectedAgentId && appointmentsAgents[0]) {
      setSelectedAgentId(appointmentsAgents[0].id);
    }
  }, [appointmentsAgents, selectedAgentId]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const bookings = selectedAgentId ? fetchBookings(selectedAgentId) : [];

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
  });

  // ── Empty state — no appointments agents connected ────────────────────────
  if (appointmentsAgents.length === 0) {
    return (
      <div className="max-w-lg mx-auto pt-16 pb-24 flex flex-col items-center text-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 dark:bg-orange-500/15">
          <CalendarDays className="h-10 w-10 text-orange-500" />
        </div>
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Calendario de citas</h2>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xs leading-relaxed">
            Conecta un agente de tipo <strong>Citas</strong> con Cal.com para ver y gestionar tus reservas aquí.
          </p>
        </div>
        <Link
          href="/agents/new"
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-white"
          style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
        >
          <Settings className="h-4 w-4" />
          Configurar agente de citas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-8 lg:max-w-[1100px] lg:mx-auto">

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Calendario</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            {bookings.length} cita{bookings.length !== 1 ? "s" : ""} este mes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Agent selector */}
          {appointmentsAgents.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setAgentDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-3 py-2 text-[14px] font-medium hover:bg-muted/40 transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-3 w-3 text-orange-500" />
                </div>
                {selectedAgent?.name ?? "Agente"}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {agentDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAgentDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl bg-card border border-border shadow-lg overflow-hidden">
                    {appointmentsAgents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedAgentId(a.id); setAgentDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-[14px] text-left hover:bg-muted/40 transition-colors ${
                          a.id === selectedAgentId ? "font-semibold text-orange-500" : ""
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-card ring-1 ring-border p-1 gap-0.5">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                view === "calendar"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendario
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                view === "list"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-3 gap-2">
        {(["confirmed", "pending", "cancelled"] as BookingStatus[]).map((s) => {
          const count = s === "confirmed" ? confirmed : s === "pending" ? pending : cancelled;
          return (
            <div
              key={s}
              className="rounded-2xl bg-card ring-1 ring-border px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <p className={`text-[22px] font-bold ${STATUS_COLORS[s]}`}>{count}</p>
              <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">{STATUS_LABELS[s]}</p>
            </div>
          );
        })}
      </motion.div>

      {/* ── Agent info bar ── */}
      {selectedAgent?.calBookingUrl && (
        <motion.div {...fadeUp(0.08)} className="flex items-center gap-3 rounded-xl bg-card ring-1 ring-border px-4 py-2.5">
          <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[14px] text-muted-foreground">
              Conectado como <strong className="text-foreground">{selectedAgent.calUsername}</strong>
              {" · "}
              <a
                href={selectedAgent.calBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline truncate"
              >
                {selectedAgent.calBookingUrl}
              </a>
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Main view ── */}
      <motion.div {...fadeUp(0.12)}>
        {view === "calendar" ? (
          <BookingsCalendar bookings={bookings} />
        ) : (
          <BookingList bookings={bookings} />
        )}
      </motion.div>
    </div>
  );
}
