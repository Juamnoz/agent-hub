"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  Trash2,
  X,
  Lock,
  Pencil,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { usePlanStore } from "@/stores/plan-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/mock-data";
import { Switch } from "@/components/ui/switch";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MenuPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, menuItems, loadMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useAgentStore();
  const { hasFeature } = usePlanStore();
  const { setModalOpen } = useSidebarStore();
  const agent = agents.find((a) => a.id === agentId);
  const isUnlocked = hasFeature("menu_manager");

  useEffect(() => {
    loadMenuItems(agentId);
  }, [agentId, loadMenuItems]);

  const agentItems = menuItems.filter((m) => m.agentId === agentId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    setModalOpen(showAddDialog || editItem !== null);
    return () => setModalOpen(false);
  }, [showAddDialog, editItem, setModalOpen]);

  // Group by category
  const categories = Array.from(new Set(agentItems.map((m) => m.category)));

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
            <h2 className="text-[20px] font-bold">Gestor de Menú</h2>
            <p className="text-[15px] text-muted-foreground mt-1 max-w-xs">
              El gestor de menú está disponible a partir del plan Pro.
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
    <div className="space-y-4 pb-4 lg:max-w-[800px] lg:mx-auto">
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
          <h1 className="text-[22px] font-bold tracking-tight">Menú</h1>
          <p className="text-[14px] text-muted-foreground">{agentItems.length} platillo{agentItems.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-white"
          style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </motion.div>

      {/* Categories */}
      {categories.length === 0 ? (
        <motion.div {...fadeUp(0.08)} className="rounded-2xl bg-card ring-1 ring-border p-8 text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 mb-3 text-muted-foreground/30" />
          <p className="text-[15px] text-muted-foreground">El menú está vacío. Agrega el primer platillo.</p>
        </motion.div>
      ) : (
        categories.map((cat, ci) => {
          const items = agentItems.filter((m) => m.category === cat);
          return (
            <motion.div
              key={cat}
              {...fadeUp(0.08 + ci * 0.04)}
              className="space-y-2"
            >
              <h2 className="text-[15px] font-semibold text-muted-foreground px-0.5">{cat}</h2>
              <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] divide-y divide-border/60">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-[16px] font-semibold leading-tight ${!item.isAvailable ? "text-muted-foreground/50" : ""}`}>
                          {item.name}
                        </p>
                        {!item.isAvailable && (
                          <span className="text-[12px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                            No disponible
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                    <span className="text-[16px] font-bold shrink-0">${item.price}</span>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={(v) => {
                        updateMenuItem(item.id, { isAvailable: v });
                        toast.success(v ? "Disponible" : "No disponible");
                      }}
                    />
                    <button
                      onClick={() => setEditItem(item)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteMenuItem(item.id);
                        toast.success("Platillo eliminado");
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })
      )}

      {/* Add / Edit Dialog */}
      <AnimatePresence>
        {(showAddDialog || editItem) && (
          <MenuItemDialog
            agentId={agentId}
            item={editItem}
            existingCategories={categories}
            onClose={() => {
              setShowAddDialog(false);
              setEditItem(null);
            }}
            onSave={(data) => {
              if (editItem) {
                updateMenuItem(editItem.id, data);
                toast.success("Platillo actualizado");
              } else {
                addMenuItem({ ...data, agentId });
                toast.success("Platillo agregado");
              }
              setShowAddDialog(false);
              setEditItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Menu Item Dialog ─────────────────────────────────────────────────────────

function MenuItemDialog({
  agentId,
  item,
  existingCategories,
  onClose,
  onSave,
}: {
  agentId: string;
  item: MenuItem | null;
  existingCategories: string[];
  onClose: () => void;
  onSave: (data: Omit<MenuItem, "id" | "agentId">) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [category, setCategory] = useState(item?.category ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [newCat, setNewCat] = useState("");

  const effectiveCategory = category || newCat;
  const canSave = name.trim() && price > 0 && effectiveCategory.trim();

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="px-5 pb-8 pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold">{item ? "Editar platillo" : "Nuevo platillo"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden divide-y divide-border/60">
            <Field label="Nombre">
              <input
                type="text"
                placeholder="Tacos al Pastor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </Field>
            <Field label="Descripción">
              <input
                type="text"
                placeholder="Descripción opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </Field>
            <Field label="Precio (MXN)">
              <input
                type="number"
                placeholder="0"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
              />
            </Field>
            <Field label="Categoría">
              {existingCategories.length > 0 ? (
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setNewCat(""); }}
                  className="flex-1 bg-transparent text-[16px] outline-none text-right"
                >
                  <option value="">Nueva categoría...</option>
                  {existingCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Ej: Entradas"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
                />
              )}
            </Field>
            {existingCategories.length > 0 && category === "" && (
              <Field label="Nueva categoría">
                <input
                  type="text"
                  placeholder="Ej: Especialidades"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/50 text-right"
                />
              </Field>
            )}
            <Field label="Disponible">
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </Field>
          </div>

          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                category: effectiveCategory.trim(),
                name: name.trim(),
                description: description.trim() || undefined,
                price,
                isAvailable,
              })
            }
            className="w-full rounded-2xl py-4 text-[17px] font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(148deg, #fb923c 0%, #f97316 52%, #d64602 100%)" }}
          >
            {item ? "Guardar cambios" : "Agregar platillo"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[54px]">
      <span className="text-[15px] text-muted-foreground shrink-0 w-32">{label}</span>
      {children}
    </div>
  );
}
