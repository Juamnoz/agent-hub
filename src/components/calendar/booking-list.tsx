"use client";

import { useState } from "react";
import { ExternalLink, CalendarDays, ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import { motion } from "motion/react";
import type { CalBooking, BookingStatus } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const STATUS_DOT: Record<BookingStatus, string> = {
  confirmed: "bg-emerald-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 10;

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingList({ bookings }: { bookings: CalBooking[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = bookings.filter((b) => {
    const matchSearch =
      !search ||
      b.clientName.toLowerCase().includes(search.toLowerCase()) ||
      b.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.eventType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Sort: upcoming first, then past
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(s: BookingStatus | "all") {
    setStatusFilter(s);
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* ── Filters ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 rounded-xl bg-card ring-1 ring-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar cliente, email, tipo…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", "confirmed", "pending", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid grid-cols-[1fr_1.4fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border/60 bg-muted/20">
          {["Cliente", "Fecha", "Tipo", "Estado", ""].map((h) => (
            <span key={h} className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {h}
            </span>
          ))}
        </div>

        {paginated.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center gap-2 text-muted-foreground">
            <CalendarDays className="h-8 w-8 opacity-25 mb-1" />
            <p className="text-[15px]">No hay citas</p>
            {(search || statusFilter !== "all") && (
              <button
                onClick={() => { handleSearch(""); handleFilterChange("all"); }}
                className="text-[13px] text-orange-500 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {paginated.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[1fr_1.4fr_1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  {/* Cliente */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[booking.status]}`} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{booking.clientName}</p>
                      <p className="text-[13px] text-muted-foreground truncate">{booking.clientEmail}</p>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div>
                    <p className="text-[14px] font-medium capitalize">{formatDate(booking.startTime)}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                    </p>
                  </div>

                  {/* Tipo */}
                  <p className="text-[14px] text-muted-foreground truncate">{booking.eventType}</p>

                  {/* Status */}
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${STATUS_BADGE[booking.status]}`}>
                    {STATUS_LABEL[booking.status]}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {booking.calBookingUrl && (
                      <a
                        href={booking.calBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Ver en Cal.com"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[booking.status]}`} />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold">{booking.clientName}</p>
                        <p className="text-[13px] text-muted-foreground">{booking.eventType}</p>
                        <p className="text-[13px] text-muted-foreground capitalize mt-0.5">
                          {formatDate(booking.startTime)} · {formatTime(booking.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[booking.status]}`}>
                        {STATUS_LABEL[booking.status]}
                      </span>
                      {booking.calBookingUrl && (
                        <a
                          href={booking.calBookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-[14px] font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
