"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { X, ExternalLink, Mail, Phone, Clock } from "lucide-react";
import { motion } from "motion/react";
import type { CalBooking, BookingStatus } from "@/lib/mock-data";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  bookings: CalBooking[];
}

// ── Status colors ─────────────────────────────────────────────────────────────

const STATUS_BG: Record<BookingStatus, string> = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────

function BookingDetail({ booking, onClose }: { booking: CalBooking; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:w-full lg:max-w-md"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="px-5 pb-8 pt-3 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-bold leading-tight">{booking.clientName}</h2>
              <span className={`inline-flex mt-1 items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${STATUS_BADGE[booking.status]}`}>
                {STATUS_LABEL[booking.status]}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted shrink-0 mt-0.5">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Event type */}
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-[13px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Tipo de cita</p>
            <p className="text-[16px] font-semibold">{booking.eventType}</p>
          </div>

          {/* Date / time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[15px] font-medium capitalize">{formatDateTime(booking.startTime)}</p>
              <p className="text-[14px] text-muted-foreground">
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${booking.clientEmail}`} className="text-[15px] hover:underline text-orange-500">
                {booking.clientEmail}
              </a>
            </div>
            {booking.clientPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${booking.clientPhone}`} className="text-[15px] hover:underline">
                  {booking.clientPhone}
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="rounded-xl bg-muted/40 px-4 py-3">
              <p className="text-[13px] text-muted-foreground font-medium mb-1">Notas</p>
              <p className="text-[15px]">{booking.notes}</p>
            </div>
          )}

          {/* Cal.com link */}
          {booking.calBookingUrl && (
            <a
              href={booking.calBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-[15px] font-semibold border border-border hover:bg-muted/40 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver en Cal.com
            </a>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────

export default function BookingsCalendar({ bookings }: Props) {
  const [selectedBooking, setSelectedBooking] = useState<CalBooking | null>(null);

  const events = bookings.map((b) => ({
    id: b.id,
    title: b.clientName,
    start: b.startTime,
    end: b.endTime,
    backgroundColor: STATUS_BG[b.status],
    borderColor: STATUS_BG[b.status],
    extendedProps: { booking: b },
  }));

  return (
    <>
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden p-4 calendar-wrapper">
        <style>{`
          .calendar-wrapper .fc {
            font-family: inherit;
            font-size: 14px;
          }
          .calendar-wrapper .fc-toolbar-title {
            font-size: 17px;
            font-weight: 700;
          }
          .calendar-wrapper .fc-button {
            background: hsl(var(--muted)) !important;
            border: 1px solid hsl(var(--border)) !important;
            color: hsl(var(--foreground)) !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            padding: 4px 10px !important;
            box-shadow: none !important;
          }
          .calendar-wrapper .fc-button:hover {
            background: hsl(var(--accent)) !important;
          }
          .calendar-wrapper .fc-button-active {
            background: hsl(var(--foreground)) !important;
            color: hsl(var(--background)) !important;
          }
          .calendar-wrapper .fc-daygrid-day-number,
          .calendar-wrapper .fc-col-header-cell-cushion {
            color: hsl(var(--foreground));
            font-weight: 500;
          }
          .calendar-wrapper .fc-day-today {
            background: hsl(var(--accent) / 0.4) !important;
          }
          .calendar-wrapper .fc-event {
            cursor: pointer;
            border-radius: 6px !important;
            padding: 1px 4px !important;
            font-size: 13px !important;
          }
          .calendar-wrapper .fc-event-title {
            font-weight: 600;
          }
          .calendar-wrapper th {
            border-color: hsl(var(--border)) !important;
          }
          .calendar-wrapper td {
            border-color: hsl(var(--border)) !important;
          }
          .calendar-wrapper .fc-scrollgrid {
            border-color: hsl(var(--border)) !important;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
          }}
          locale="es"
          firstDay={1}
          events={events}
          eventClick={(info) => {
            const booking = info.event.extendedProps.booking as CalBooking;
            setSelectedBooking(booking);
          }}
          height="auto"
          dayMaxEvents={3}
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-1">
        {(["confirmed", "pending", "cancelled"] as BookingStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: STATUS_BG[s] }}
            />
            <span className="text-[13px] text-muted-foreground">{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </>
  );
}
