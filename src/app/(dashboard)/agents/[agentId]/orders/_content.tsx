"use client";

import { use, useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  X,
  Lock,
  Package,
  ChevronRight,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { usePlanStore } from "@/stores/plan-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nuevo",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  processing: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  shipped: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  new: "bg-blue-500",
  processing: "bg-amber-500",
  shipped: "bg-violet-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const ORDER_STATUS_PIPELINE: OrderStatus[] = ["new", "processing", "shipped", "delivered"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, orders, loadOrders, updateOrder } = useAgentStore();
  const { hasFeature } = usePlanStore();
  const { setModalOpen } = useSidebarStore();
  const agent = agents.find((a) => a.id === agentId);
  const isUnlocked = hasFeature("orders_engine");

  useEffect(() => {
    loadOrders(agentId);
  }, [agentId, loadOrders]);

  const agentOrders = orders.filter((o) => o.agentId === agentId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setModalOpen(selectedOrder !== null);
    return () => setModalOpen(false);
  }, [selectedOrder, setModalOpen]);

  const filtered = agentOrders.filter((o) => {
    const matchSearch = !search || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const newCount = agentOrders.filter((o) => o.status === "new").length;
  const processingCount = agentOrders.filter((o) => o.status === "processing").length;
  const deliveredCount = agentOrders.filter((o) => o.status === "delivered").length;
  const monthTotal = agentOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

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
            <h2 className="text-[20px] font-bold">Gestor de Pedidos</h2>
            <p className="text-[15px] text-muted-foreground mt-1 max-w-xs">
              El gestor de pedidos está disponible a partir del plan Pro.
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
          <h1 className="text-[22px] font-bold tracking-tight">Pedidos</h1>
          <p className="text-[14px] text-muted-foreground">{agentOrders.length} pedido{agentOrders.length !== 1 ? "s" : ""} en total</p>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-4 gap-2">
        {[
          { label: "Nuevos", value: newCount, color: "text-blue-600 dark:text-blue-400" },
          { label: "En proceso", value: processingCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "Entregados", value: deliveredCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total mes", value: `$${monthTotal.toLocaleString()}`, color: "text-foreground" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-card ring-1 ring-border px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <p className={`text-[20px] font-bold ${stat.color} truncate`}>{stat.value}</p>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Status pipeline visual */}
      <motion.div {...fadeUp(0.12)} className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex">
          {ORDER_STATUS_PIPELINE.map((s, i) => {
            const count = agentOrders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? "all" : s)}
                className={`flex-1 py-3 text-center border-r last:border-r-0 border-border/60 transition-colors ${
                  statusFilter === s ? "bg-muted/60" : "hover:bg-muted/30"
                }`}
              >
                <p className="text-[18px] font-bold">{count}</p>
                <p className="text-[12px] text-muted-foreground">{STATUS_LABELS[s]}</p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.16)} className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 rounded-xl bg-card ring-1 ring-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-foreground text-background text-[14px] font-medium"
          >
            {STATUS_LABELS[statusFilter]}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>

      {/* Orders list */}
      <motion.div
        {...fadeUp(0.2)}
        className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border/60"
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="mx-auto h-8 w-8 mb-3 opacity-30" />
            <p className="text-[15px]">No hay pedidos</p>
          </div>
        ) : (
          filtered.map((order) => (
            <button
              key={order.id}
              className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setSelectedOrder(order)}
            >
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[order.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[16px] font-semibold">{order.customerName}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[12px] font-semibold ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-[14px] text-muted-foreground mt-0.5 truncate">
                  {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                </p>
                <p className="text-[13px] text-muted-foreground/60">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[16px] font-bold">${order.total.toLocaleString()}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto mt-0.5" />
              </div>
            </button>
          ))
        )}
      </motion.div>

      {/* ── Order Detail ── */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(id, status) => {
            updateOrder(id, { status });
            setSelectedOrder((o) => o ? { ...o, status } : null);
            toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────

function OrderDetail({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const currentIdx = ORDER_STATUS_PIPELINE.indexOf(order.status);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold">{order.customerName}</h2>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Pipeline */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-1">
              {ORDER_STATUS_PIPELINE.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? "bg-orange-500" : "bg-muted"}`} />
                  {i < ORDER_STATUS_PIPELINE.length - 1 && (
                    <div className={`h-1.5 flex-1 rounded-full ${i < currentIdx ? "bg-orange-500" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="rounded-2xl bg-muted/40 p-4 space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[15px]">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="text-[15px] font-medium">${(item.unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-border/60 pt-2 flex items-center justify-between">
              <span className="text-[16px] font-bold">Total</span>
              <span className="text-[16px] font-bold">${order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Contact & address */}
          <div className="text-[15px] text-muted-foreground space-y-1">
            <p>{order.customerPhone}</p>
            {order.address && <p>{order.address}</p>}
          </div>

          {/* Status actions */}
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <div className="flex gap-2">
              {currentIdx < ORDER_STATUS_PIPELINE.length - 1 && (
                <button
                  onClick={() => onStatusChange(order.id, ORDER_STATUS_PIPELINE[currentIdx + 1])}
                  className="flex-1 rounded-xl py-3 text-[16px] font-semibold text-white"
                  style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
                >
                  Avanzar a {STATUS_LABELS[ORDER_STATUS_PIPELINE[currentIdx + 1]]}
                </button>
              )}
              <button
                onClick={() => onStatusChange(order.id, "cancelled")}
                className="rounded-xl px-4 py-3 text-[16px] font-medium text-red-600 bg-red-50 dark:bg-red-500/10"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
