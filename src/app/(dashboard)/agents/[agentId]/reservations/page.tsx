"use client";

import { use, useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
  Lock,
  Phone,
  StickyNote,
  Plug,
  Globe,
  Building,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { usePlanStore } from "@/stores/plan-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Reservation, ReservationStatus } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.round((b - a) / 86400000);
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const STATUS_DOT: Record<ReservationStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

type Tab = "calendar" | "table";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReservationsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, reservations, loadReservations, updateReservation, addReservation } = useAgentStore();
  const { hasFeature } = usePlanStore();
  const agent = agents.find((a) => a.id === agentId);

  const isUnlocked = hasFeature("reservations_engine");

  useEffect(() => {
    loadReservations(agentId);
  }, [agentId, loadReservations]);

  const agentReservations = reservations.filter((r) => r.agentId === agentId);

  const hasChannelManager = hasFeature("channel_manager");
  const hasPMS = hasFeature("pms_integration");
  const isHotel = agent?.algorithmType === "hotel";

  const [tab, setTab] = useState<Tab>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [channelManagerConnected, setChannelManagerConnected] = useState(false);
  const [pmsConnected, setPmsConnected] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const filtered = agentReservations.filter((r) => {
    const matchSearch = !search || r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      (r.roomNumber?.includes(search) ?? false);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = agentReservations.length;
  const pending = agentReservations.filter((r) => r.status === "pending").length;
  const confirmed = agentReservations.filter((r) => r.status === "confirmed").length;
  const cancelled = agentReservations.filter((r) => r.status === "cancelled").length;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
  });

  if (!isUnlocked) {
    return (
      <div className="space-y-4 pb-4 lg:max-w-[800px] lg:mx-auto">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al agente
          </Link>
        </Button>
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15">
            <Lock className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold">Motor de Reservas</h2>
            <p className="text-[15px] text-muted-foreground mt-1 max-w-xs">
              El motor de reservas está disponible a partir del plan Pro. Actualiza para gestionar reservaciones con calendario.
            </p>
          </div>
          <Button asChild className="lisa-btn text-white border-0">
            <Link href="/billing">Ver planes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 lg:max-w-[900px] lg:mx-auto">
      {/* Back */}
      <motion.div {...fadeUp(0)}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {agent?.name ?? "Agente"}
          </Link>
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div {...fadeUp(0.04)} className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Reservas</h1>
          <p className="text-[14px] text-muted-foreground">{total} reservación{total !== 1 ? "es" : ""} en total</p>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white"
          style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: total, color: "text-foreground" },
          { label: "Pendientes", value: pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "Confirmadas", value: confirmed, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Canceladas", value: cancelled, color: "text-red-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-card ring-1 ring-border px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <p className={`text-[22px] font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.12)} className="flex gap-1 p-1 rounded-xl bg-muted/50 ring-1 ring-border">
        {(["table", "calendar"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-[15px] font-medium transition-all ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "table" ? "Tabla" : "Calendario"}
          </button>
        ))}
      </motion.div>

      {/* ── TABLE VIEW ── */}
      {tab === "table" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="space-y-3"
        >
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[160px] rounded-xl bg-card ring-1 ring-border px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Buscar huésped o habitación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-xl px-3 py-2 text-[14px] font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-foreground text-background"
                      : "bg-card ring-1 ring-border text-muted-foreground"
                  }`}
                >
                  {s === "all" ? "Todas" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Reservations list */}
          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border/60">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CalendarDays className="mx-auto h-8 w-8 mb-3 opacity-30" />
                <p className="text-[15px]">No hay reservaciones</p>
              </div>
            ) : (
              filtered.map((res) => (
                <div
                  key={res.id}
                  className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedRes(res)}
                >
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[res.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[16px] font-semibold">{res.guestName}</p>
                      {res.roomNumber && (
                        <span className="text-[13px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                          Hab. {res.roomNumber}
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[12px] font-semibold ${STATUS_COLORS[res.status]}`}>
                        {STATUS_LABELS[res.status]}
                      </span>
                    </div>
                    <p className="text-[14px] text-muted-foreground mt-0.5">{res.roomType}</p>
                    <p className="text-[13px] text-muted-foreground/70">
                      {formatDate(res.checkIn)} → {formatDate(res.checkOut)} · {nightsBetween(res.checkIn, res.checkOut)} noche{nightsBetween(res.checkIn, res.checkOut) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[16px] font-bold">${res.totalPrice.toLocaleString()}</p>
                    <p className="text-[13px] text-muted-foreground">{res.guests} huésp.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {tab === "calendar" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
                else setCalMonth((m) => m - 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[16px] font-semibold">
              {MONTH_NAMES[calMonth]} {calYear}
            </p>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
                else setCalMonth((m) => m + 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/60">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-[12px] font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <CalendarGrid
            year={calYear}
            month={calMonth}
            reservations={agentReservations}
            onSelectReservation={setSelectedRes}
          />
        </motion.div>
      )}

      {/* ── Hotel Integrations ── */}
      {isHotel && (
        <motion.div {...fadeUp(0.2)} className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Plug className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-[16px] font-semibold">Sistemas hoteleros</h2>
            {!hasChannelManager && !hasPMS && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 px-2.5 py-1 text-[12px] font-semibold">
                <Lock className="h-3 w-3" />
                Business+
              </span>
            )}
          </div>
          <p className="text-[14px] text-muted-foreground">
            Conecta tu agente con tu Channel Manager o PMS para sincronizar disponibilidad en tiempo real.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IntegrationCard
              icon={Globe}
              title="Channel Manager"
              description="Sincroniza disponibilidad y tarifas con Booking.com, Airbnb y Expedia automáticamente."
              platforms={["Booking.com", "Airbnb", "Expedia"]}
              isLocked={!hasChannelManager}
              isConnected={channelManagerConnected}
              onToggle={() => {
                const next = !channelManagerConnected;
                setChannelManagerConnected(next);
                toast[next ? "success" : "info"](next ? "Channel Manager conectado" : "Channel Manager desconectado");
              }}
            />
            <IntegrationCard
              icon={Building}
              title="PMS"
              description="Integra Opera, Cloudbeds o Little Hotelier para gestión centralizada de propiedades."
              platforms={["Opera", "Cloudbeds", "Little Hotelier"]}
              isLocked={!hasPMS}
              isConnected={pmsConnected}
              onToggle={() => {
                const next = !pmsConnected;
                setPmsConnected(next);
                toast[next ? "success" : "info"](next ? "PMS conectado" : "PMS desconectado");
              }}
            />
          </div>
        </motion.div>
      )}

      {/* ── Reservation Detail Slide-over ── */}
      {selectedRes && (
        <ReservationDetail
          reservation={selectedRes}
          onClose={() => setSelectedRes(null)}
          onConfirm={(id) => {
            updateReservation(id, { status: "confirmed" });
            setSelectedRes((r) => r ? { ...r, status: "confirmed" } : null);
            toast.success("Reserva confirmada");
          }}
          onCancel={(id) => {
            updateReservation(id, { status: "cancelled" });
            setSelectedRes((r) => r ? { ...r, status: "cancelled" } : null);
            toast.info("Reserva cancelada");
          }}
        />
      )}

      {/* ── New Reservation Dialog ── */}
      {showNewDialog && (
        <NewReservationDialog
          agentId={agentId}
          onClose={() => setShowNewDialog(false)}
          onSave={(data) => {
            addReservation(data);
            setShowNewDialog(false);
            toast.success("Reserva creada correctamente");
          }}
        />
      )}
    </div>
  );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  year,
  month,
  reservations,
  onSelectReservation,
}: {
  year: number;
  month: number;
  reservations: Reservation[];
  onSelectReservation: (r: Reservation) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function getResForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reservations.filter((r) => {
      return r.checkIn <= dateStr && r.checkOut > dateStr;
    });
  }

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="grid grid-cols-7">
      {cells.map((day, i) => {
        if (!day) return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border/30 last:border-r-0" />;
        const dayRes = getResForDay(day);
        return (
          <div
            key={day}
            className={`min-h-[80px] p-1.5 border-b border-r border-border/30 last:border-r-0 ${
              i % 7 === 6 ? "border-r-0" : ""
            }`}
          >
            <span className={`text-[13px] font-medium flex h-6 w-6 items-center justify-center rounded-full mb-1 ${
              isToday(day)
                ? "bg-orange-500 text-white"
                : "text-muted-foreground"
            }`}>
              {day}
            </span>
            <div className="space-y-0.5">
              {dayRes.slice(0, 2).map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectReservation(r)}
                  className={`w-full text-left rounded px-1 py-0.5 text-[11px] font-medium truncate transition-opacity hover:opacity-80 ${
                    r.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : r.status === "pending"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
                  }`}
                >
                  {r.guestName.split(" ")[0]}
                </button>
              ))}
              {dayRes.length > 2 && (
                <p className="text-[11px] text-muted-foreground px-1">+{dayRes.length - 2}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reservation Detail ────────────────────────────────────────────────────────

function ReservationDetail({
  reservation,
  onClose,
  onConfirm,
  onCancel,
}: {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold">{reservation.guestName}</h2>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${STATUS_COLORS[reservation.status]}`}>
                {STATUS_LABELS[reservation.status]}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Details */}
          <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
            <Row label="Habitación" value={`${reservation.roomType}${reservation.roomNumber ? ` · Hab. ${reservation.roomNumber}` : ""}`} />
            <Row label="Check-in" value={formatDate(reservation.checkIn)} />
            <Row label="Check-out" value={formatDate(reservation.checkOut)} />
            <Row label="Noches" value={`${nights} noche${nights !== 1 ? "s" : ""}`} />
            <Row label="Huéspedes" value={`${reservation.guests} persona${reservation.guests !== 1 ? "s" : ""}`} />
            <Row label="Total" value={`$${reservation.totalPrice.toLocaleString()} MXN`} bold />
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            {reservation.guestPhone}
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div className="flex gap-2 text-[15px] text-muted-foreground">
              <StickyNote className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{reservation.notes}</p>
            </div>
          )}

          {/* Actions */}
          {reservation.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onConfirm(reservation.id)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[16px] font-semibold text-white bg-emerald-500"
              >
                <Check className="h-4 w-4" />
                Confirmar
              </button>
              <button
                onClick={() => onCancel(reservation.id)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[16px] font-semibold text-red-600 bg-red-50 dark:bg-red-500/10"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
          {reservation.status === "confirmed" && (
            <button
              onClick={() => onCancel(reservation.id)}
              className="w-full rounded-xl py-3 text-[16px] font-medium text-red-600 bg-red-50 dark:bg-red-500/10"
            >
              Cancelar reserva
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <span className={`text-[15px] ${bold ? "font-bold text-foreground" : "font-medium"}`}>{value}</span>
    </div>
  );
}

// ─── New Reservation Dialog ────────────────────────────────────────────────────

function NewReservationDialog({
  agentId,
  onClose,
  onSave,
}: {
  agentId: string;
  onClose: () => void;
  onSave: (data: Omit<Reservation, "id" | "createdAt">) => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notes, setNotes] = useState("");

  const canSave = guestName.trim() && checkIn && checkOut && roomType.trim();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="px-5 pb-8 pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold">Nueva reserva</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60">
            <FormRow label="Nombre del huésped">
              <input
                type="text"
                placeholder="Carlos Martinez"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
            <FormRow label="Teléfono">
              <input
                type="tel"
                placeholder="+52 55 1234 5678"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
            <FormRow label="Check-in">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none text-right"
              />
            </FormRow>
            <FormRow label="Check-out">
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none text-right"
              />
            </FormRow>
            <FormRow label="Tipo de habitación">
              <input
                type="text"
                placeholder="Suite Junior"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
            <FormRow label="Número de habitación">
              <input
                type="text"
                placeholder="305"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
            <FormRow label="Huéspedes">
              <div className="flex items-center gap-3">
                <button onClick={() => setGuests((g) => Math.max(1, g - 1))} className="h-7 w-7 rounded-full bg-muted text-[18px] leading-none">−</button>
                <span className="text-[16px] font-medium w-4 text-center">{guests}</span>
                <button onClick={() => setGuests((g) => g + 1)} className="h-7 w-7 rounded-full bg-muted text-[18px] leading-none">+</button>
              </div>
            </FormRow>
            <FormRow label="Total (MXN)">
              <input
                type="number"
                placeholder="0"
                value={totalPrice || ""}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
            <FormRow label="Notas">
              <input
                type="text"
                placeholder="Observaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </FormRow>
          </div>

          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                agentId,
                guestName: guestName.trim(),
                guestPhone,
                checkIn,
                checkOut,
                roomType: roomType.trim(),
                roomNumber: roomNumber || undefined,
                guests,
                totalPrice,
                status: "pending",
                notes: notes.trim() || undefined,
              })
            }
            className="w-full rounded-2xl py-4 text-[17px] font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
          >
            Crear reserva
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Integration Card ──────────────────────────────────────────────────────────

function IntegrationCard({
  icon: Icon,
  title,
  description,
  platforms,
  isLocked,
  isConnected,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  platforms: string[];
  isLocked: boolean;
  isConnected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative rounded-2xl bg-card ring-1 ring-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3 overflow-hidden">
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-card/85 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10">
            <Lock className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-[14px] font-semibold text-center">Requiere plan Business</p>
          <p className="text-[13px] text-muted-foreground text-center">Disponible desde $80/mes</p>
          <Link
            href="/billing"
            className="mt-1 rounded-xl px-4 py-2 text-[14px] font-semibold text-white"
            style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
          >
            Ver planes
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-[16px] font-bold">{title}</p>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 text-[12px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Activo
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>

      {/* Platform chips */}
      <div className="flex flex-wrap gap-1.5">
        {platforms.map((p) => (
          <span key={p} className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
            {p}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={onToggle}
        className={`w-full rounded-xl py-2.5 text-[15px] font-semibold transition-colors ${
          isConnected
            ? "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            : "text-white"
        }`}
        style={!isConnected ? { background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" } : undefined}
      >
        {isConnected ? "Desconectar" : "Conectar"}
      </button>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[54px]">
      <span className="text-[15px] text-muted-foreground shrink-0 w-36">{label}</span>
      {children}
    </div>
  );
}
