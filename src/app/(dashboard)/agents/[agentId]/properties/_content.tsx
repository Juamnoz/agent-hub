"use client";

import { use, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Plus,
  Lock,
  MapPin,
  BedDouble,
  Bath,
  SquareCode,
} from "lucide-react";
import { usePlanStore } from "@/stores/plan-store";
import { useAgentStore } from "@/stores/agent-store";
import { Button } from "@/components/ui/button";
import type { Property, PropertyStatus } from "@/lib/mock-data";

// ─── Mock properties (local, no store needed yet) ──────────────────────────────

const MOCK_PROPERTIES: Property[] = [
  {
    id: "prop-001",
    agentId: "agent-placeholder",
    title: "Departamento Roma Norte",
    address: "Álvaro Obregón 45, Col. Roma Norte, CDMX",
    price: 3800000,
    priceType: "sale",
    status: "available",
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
  },
  {
    id: "prop-002",
    agentId: "agent-placeholder",
    title: "Casa Coyoacán",
    address: "Jardín Centenario 12, Coyoacán, CDMX",
    price: 28000,
    priceType: "rent",
    status: "rented",
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
  },
  {
    id: "prop-003",
    agentId: "agent-placeholder",
    title: "Penthouse Polanco",
    address: "Presidente Masaryk 456, Polanco, CDMX",
    price: 12500000,
    priceType: "sale",
    status: "sold",
    bedrooms: 4,
    bathrooms: 3,
    area: 260,
  },
  {
    id: "prop-004",
    agentId: "agent-placeholder",
    title: "Local Comercial Condesa",
    address: "Tamaulipas 200, Col. Condesa, CDMX",
    price: 45000,
    priceType: "rent",
    status: "available",
    area: 120,
  },
];

const STATUS_LABELS: Record<PropertyStatus, string> = {
  available: "Disponible",
  sold: "Vendida",
  rented: "Rentada",
};

const STATUS_COLORS: Record<PropertyStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  sold: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10",
  rented: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PropertiesPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents } = useAgentStore();
  const { hasFeature } = usePlanStore();
  const agent = agents.find((a) => a.id === agentId);
  const isUnlocked = hasFeature("properties_manager");

  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "all">("all");

  const properties = MOCK_PROPERTIES.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  const availableCount = MOCK_PROPERTIES.filter((p) => p.status === "available").length;
  const soldCount = MOCK_PROPERTIES.filter((p) => p.status === "sold").length;
  const rentedCount = MOCK_PROPERTIES.filter((p) => p.status === "rented").length;

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
            <h2 className="text-[20px] font-bold">Gestor de Propiedades</h2>
            <p className="text-[15px] text-muted-foreground mt-1 max-w-xs">
              El gestor de propiedades está disponible a partir del plan Pro.
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
          <h1 className="text-[22px] font-bold tracking-tight">Propiedades</h1>
          <p className="text-[14px] text-muted-foreground">{MOCK_PROPERTIES.length} propiedades</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white"
          style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp(0.08)} className="grid grid-cols-3 gap-2">
        {[
          { label: "Disponibles", value: availableCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Vendidas", value: soldCount, color: "text-muted-foreground" },
          { label: "Rentadas", value: rentedCount, color: "text-blue-600 dark:text-blue-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-card ring-1 ring-border px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <p className={`text-[24px] font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Status filter */}
      <motion.div {...fadeUp(0.12)} className="flex gap-1.5 flex-wrap">
        {(["all", "available", "sold", "rented"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors ${
              statusFilter === s
                ? "bg-foreground text-background"
                : "bg-card ring-1 ring-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todas" : STATUS_LABELS[s]}
          </button>
        ))}
      </motion.div>

      {/* Properties grid */}
      <motion.div
        {...fadeUp(0.16)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {properties.map((property, i) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, delay: i * 0.05 }}
            className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow"
          >
            {/* Image placeholder */}
            <div className="h-36 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 flex items-center justify-center relative">
              <Building2 className="h-12 w-12 text-teal-300 dark:text-teal-700" />
              {/* Status badge */}
              <span className={`absolute top-2.5 right-2.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${STATUS_COLORS[property.status]}`}>
                {STATUS_LABELS[property.status]}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="text-[17px] font-bold leading-tight">{property.title}</h3>

              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{property.address}</span>
              </div>

              {/* Specs */}
              <div className="flex items-center gap-3 text-[13px] text-muted-foreground flex-wrap">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" />
                    {property.bedrooms} rec.
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {property.bathrooms} baños
                  </span>
                )}
                {property.area && (
                  <span className="flex items-center gap-1">
                    <SquareCode className="h-3.5 w-3.5" />
                    {property.area} m²
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-[20px] font-bold">
                  ${property.price.toLocaleString()}
                </span>
                <span className="text-[14px] text-muted-foreground">
                  {property.priceType === "rent" ? "/ mes" : "MXN"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
