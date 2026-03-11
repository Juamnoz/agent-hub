"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  ImageIcon,
  X,
  Tent,
  Home,
  Pencil,
  Upload,
  Loader2,
  Images,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ProductsEditor } from "@/components/agents/products-editor";
import { toast } from "sonner";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 380,
    damping: 30,
    delay,
  },
});

const ROOM_TYPES = [
  { id: "habitacion", label: "Habitación", icon: Building2 },
  { id: "cabana", label: "Cabaña", icon: Home },
  { id: "domo", label: "Domo", icon: Tent },
] as const;

type RoomType = (typeof ROOM_TYPES)[number]["id"] | string;

interface GalleryImage {
  url: string;
  title: string;
}

// ── Upload drop zone (reusable) ──────────────────────────────────────────────

function UploadZone({
  onFile,
  uploading,
  dragging,
  setDragging,
  compact,
}: {
  onFile: (f: File) => void;
  uploading: boolean;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  if (uploading) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-muted/30 border border-dashed border-border rounded-xl ${
          compact ? "h-28" : "h-44"
        }`}
      >
        <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
        <p className="text-[12px] text-muted-foreground/50 mt-2">
          Subiendo...
        </p>
      </div>
    );
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <div
        className={`flex flex-col items-center justify-center border border-dashed rounded-xl cursor-pointer transition-all ${
          compact ? "h-28" : "h-44"
        } ${
          dragging
            ? "bg-orange-500/10 border-orange-500/40"
            : "bg-muted/20 border-muted-foreground/15 hover:bg-muted/40 hover:border-muted-foreground/25"
        }`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div
          className={`flex items-center justify-center rounded-full transition-colors ${
            compact ? "h-10 w-10" : "h-12 w-12"
          } ${dragging ? "bg-orange-500/20" : "bg-muted/60"}`}
        >
          {dragging ? (
            <Upload
              className={`text-orange-500 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
            />
          ) : (
            <ImageIcon
              className={`text-muted-foreground/40 ${compact ? "h-4 w-4" : "h-5 w-5"}`}
            />
          )}
        </div>
        <p className="text-[12px] text-muted-foreground/50 mt-1.5">
          {dragging ? "Suelta aquí" : compact ? "Agregar foto" : "Toca o arrastra una foto"}
        </p>
      </div>
    </>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────

function RoomsEditor({ agentId }: { agentId: string }) {
  const { products, loadProducts, addProduct, updateProduct, deleteProduct } =
    useAgentStore();
  const { token } = useAuthStore();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "COP" as string,
    imageUrl: "",
    roomType: "habitacion" as RoomType,
    customType: "",
    gallery: [] as GalleryImage[],
  });

  useEffect(() => {
    loadProducts(agentId);
  }, [agentId, loadProducts]);

  const rooms = products.filter((p) => p.agentId === agentId);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
        roomType: "habitacion",
      currency: "COP",
      customType: "",
      gallery: [],
    });
  }

  function startAdd() {
    resetForm();
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(room: (typeof rooms)[0]) {
    const isCustom = !ROOM_TYPES.some((t) => t.id === room.category);
    const gallery = (room.variants as unknown as GalleryImage[] | null) ?? [];
    setForm({
      name: room.name,
      description: room.description ?? "",
      price: room.price ? String(room.price) : "",
      imageUrl: room.imageUrl ?? "",
      currency: (room.sku as string) || "COP",
      roomType: isCustom ? "__custom__" : (room.category as RoomType),
      customType: isCustom ? room.category : "",
      gallery,
    });
    setEditingId(room.id);
    setAdding(true);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    resetForm();
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WebP)");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return null;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("agentId", agentId);
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      return data.url as string;
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
      return null;
    }
  }

  async function handleMainUpload(file: File) {
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setForm((prev) => ({ ...prev, imageUrl: url }));
    setUploading(false);
  }

  async function handleGalleryUpload(file: File) {
    setGalleryUploading(true);
    const url = await uploadFile(file);
    if (url)
      setForm((prev) => ({
        ...prev,
        gallery: [...prev.gallery, { url, title: "" }],
      }));
    setGalleryUploading(false);
  }

  function updateGalleryTitle(idx: number, title: string) {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.map((g, i) => (i === idx ? { ...g, title } : g)),
    }));
  }

  function removeGalleryImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (!form.price.trim()) {
      toast.error("El precio es obligatorio");
      return;
    }
    const missingGalleryTitle = form.gallery.some((g) => !g.title.trim());
    if (missingGalleryTitle) {
      toast.error("Todas las imágenes de la galería necesitan título");
      return;
    }
    const category =
      form.roomType === "__custom__" ? form.customType.trim() : form.roomType;
    if (form.roomType === "__custom__" && !category) {
      toast.error("Escribe el nombre del tipo");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? parseFloat(form.price) : 0,
      imageUrl: form.imageUrl || undefined,
      sku: form.currency,
      category,
      variants: form.gallery.length > 0 ? (form.gallery as any) : undefined,
    };

    if (editingId) {
      await updateProduct(editingId, payload);
      toast.success("Habitación actualizada");
    } else {
      await addProduct({ agentId, ...payload, isActive: true });
      toast.success("Habitación agregada");
    }
    cancelForm();
  }

  const selectedPreset = ROOM_TYPES.find((t) => t.id === form.roomType);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Habitaciones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rooms.length} habitación{rooms.length !== 1 ? "es" : ""}{" "}
            configurada{rooms.length !== 1 ? "s" : ""}
          </p>
        </div>
        {rooms.length > 0 && !adding && (
          <button
            onClick={startAdd}
            className="flex items-center gap-2 rounded-full pl-3 pr-4 py-2 text-[14px] font-medium bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97] transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        )}
      </div>

      {/* ── Form — add or edit ────────────────────────────────────────── */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="rounded-2xl bg-card ring-1 ring-border shadow-sm overflow-hidden"
          >
            <div className="p-4 space-y-5">
              {/* ── Main photo ───────────────────────────────────── */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Foto principal
                </p>
                {form.imageUrl ? (
                  <div className="max-w-[50%]">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={form.imageUrl}
                        alt="Principal"
                        className="w-full"
                      />
                      <button
                        onClick={() => setForm({ ...form, imageUrl: "" })}
                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <UploadZone
                    onFile={handleMainUpload}
                    uploading={uploading}
                    dragging={dragging}
                    setDragging={setDragging}
                  />
                )}
              </div>
              {/* ── Room type selector ─────────────────────────────── */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Tipo de alojamiento
                </p>
                <div className="flex gap-2">
                  {ROOM_TYPES.map((type) => {
                    const selected = form.roomType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() =>
                          setForm({ ...form, roomType: type.id, customType: "" })
                        }
                        className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-2 text-center transition-all ring-1 active:scale-[0.97] ${
                          selected
                            ? "ring-2 ring-orange-500 bg-orange-500/10"
                            : "ring-border bg-card hover:bg-muted/40"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            selected
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-[12px] font-medium leading-tight ${
                            selected
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {type.label}
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom type button */}
                  <button
                    onClick={() =>
                      setForm({ ...form, roomType: "__custom__" })
                    }
                    className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-2 text-center transition-all ring-1 active:scale-[0.97] ${
                      form.roomType === "__custom__"
                        ? "ring-2 ring-orange-500 bg-orange-500/10"
                        : "ring-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <Plus
                      className={`h-4 w-4 ${
                        form.roomType === "__custom__"
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-[12px] font-medium leading-tight ${
                        form.roomType === "__custom__"
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      Agregar tipo
                    </span>
                  </button>
                </div>

                {/* Custom type name input */}
                <AnimatePresence>
                  {form.roomType === "__custom__" && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      placeholder="Ej: Glamping, Suite, Penthouse..."
                      value={form.customType}
                      onChange={(e) =>
                        setForm({ ...form, customType: e.target.value })
                      }
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* ── Name ──────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Nombre
                </p>
                <input
                  placeholder={`Ej: Suite Deluxe, ${selectedPreset?.label ?? (form.customType || "Habitación")} Familiar...`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* ── Description ────────────────────────────────────── */}
              <div className="space-y-1.5">
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Descripción corta
                </p>
                <textarea
                  placeholder="Vista al mar, cama king, baño privado, minibar..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* ── Price ──────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Precio por noche
                </p>
                <div className="flex gap-2">
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none cursor-pointer"
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MXN">MXN</option>
                    <option value="ARS">ARS</option>
                    <option value="BRL">BRL</option>
                    <option value="PEN">PEN</option>
                    <option value="CLP">CLP</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="250000"
                    value={form.price}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm({ ...form, price: val });
                    }}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield]"
                  />
                </div>
              </div>

              {/* ── Gallery ────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Images className="h-4 w-4 text-muted-foreground/60" />
                    <p className="text-[13px] font-semibold text-muted-foreground">
                      Galería de imágenes
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/40">
                    {form.gallery.length}/20 — título obligatorio
                  </span>
                </div>

                {/* Gallery items */}
                <div className="grid grid-cols-2 gap-2.5">
                  {form.gallery.map((img, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="relative rounded-2xl overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.title || "Galería"}
                          className="w-full object-cover aspect-[4/3]"
                        />
                        <button
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-red-600/80 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <input
                        placeholder="Título de la imagen..."
                        value={img.title}
                        onChange={(e) =>
                          updateGalleryTitle(idx, e.target.value)
                        }
                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12px] placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {!img.title && (
                        <p className="text-[10px] text-orange-500">
                          Título obligatorio
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Add gallery image */}
                  {form.gallery.length < 20 && (
                    <UploadZone
                      onFile={handleGalleryUpload}
                      uploading={galleryUploading}
                      dragging={galleryDragging}
                      setDragging={setGalleryDragging}
                      compact
                    />
                  )}
                </div>

                {form.gallery.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/35 text-center">
                    Agrega fotos del baño, jacuzzi, vista, amenidades...
                  </p>
                )}
              </div>

              {/* ── Actions ────────────────────────────────────────── */}
              <div className="flex gap-2 pt-1">
                {(() => {
                  const isCustomValid = form.roomType !== "__custom__" || form.customType.trim().length > 0;
                  const galleryValid = form.gallery.every((g) => g.title.trim().length > 0);
                  const canSave =
                    form.imageUrl.length > 0 &&
                    form.name.trim().length > 0 &&
                    form.description.trim().length > 0 &&
                    form.price.trim().length > 0 &&
                    isCustomValid &&
                    galleryValid;
                  return (
                    <button
                      onClick={handleSave}
                      disabled={!canSave}
                      className={`flex-1 rounded-xl py-3 text-[15px] font-semibold transition-all ${
                        canSave
                          ? "bg-orange-500 text-white active:bg-orange-600"
                          : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                      }`}
                    >
                      {editingId ? "Actualizar" : "Guardar"}
                    </button>
                  );
                })()}
                <button
                  onClick={cancelForm}
                  className="rounded-xl py-3 px-5 text-[15px] font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {rooms.length === 0 && !adding && (
        <motion.button
          onClick={startAdd}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl border-2 border-dashed border-muted-foreground/15 bg-card/40 p-12 text-center hover:border-muted-foreground/25 hover:bg-card/60 active:scale-[0.99] transition-all group"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 mx-auto group-hover:bg-muted transition-colors">
            <Plus className="h-7 w-7 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
          </div>
          <p className="text-[16px] font-medium text-muted-foreground/60 mt-4 group-hover:text-muted-foreground/80 transition-colors">
            Agregar primera habitación
          </p>
          <p className="text-[13px] text-muted-foreground/35 mt-1">
            Las habitaciones se envían como imágenes con descripción a los
            clientes
          </p>
        </motion.button>
      )}

      {/* ── Rooms grid ────────────────────────────────────────────── */}
      {rooms.length > 0 && !adding && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room, i) => {
            const presetType = ROOM_TYPES.find((t) => t.id === room.category);
            const typeLabel = presetType?.label ?? room.category;
            const RoomIcon = presetType?.icon ?? Building2;
            const gallery =
              (room.variants as unknown as GalleryImage[] | null) ?? [];
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-2xl bg-card ring-1 ring-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-36 bg-muted/30">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <RoomIcon className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Type badge */}
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white">
                    <RoomIcon className="h-3 w-3" />
                    {typeLabel}
                  </span>
                  {/* Gallery count badge */}
                  {gallery.length > 0 && (
                    <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white/80">
                      <Images className="h-3 w-3" />
                      +{gallery.length}
                    </span>
                  )}
                  {/* Actions overlay */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(room)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        deleteProduct(room.id);
                        toast.success("Habitación eliminada");
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-red-300 hover:bg-red-600/80 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="px-3.5 py-3">
                  <p className="text-[15px] font-semibold truncate">
                    {room.name}
                  </p>
                  {room.description && (
                    <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                      {room.description}
                    </p>
                  )}
                  {room.price ? (
                    <p className="text-[14px] font-bold text-orange-500 mt-1.5">
                      ${room.price.toLocaleString()}{" "}
                      <span className="text-[12px] font-normal text-muted-foreground">
                        / noche
                      </span>
                    </p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}

          {/* Add more card */}
          <motion.button
            onClick={startAdd}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rooms.length * 0.04 }}
            className="rounded-2xl border-2 border-dashed border-muted-foreground/15 bg-card/30 flex flex-col items-center justify-center min-h-[200px] hover:border-muted-foreground/25 hover:bg-card/50 active:scale-[0.98] transition-all group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
            </div>
            <p className="text-[13px] text-muted-foreground/40 mt-2 group-hover:text-muted-foreground/60 transition-colors">
              Agregar
            </p>
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentProductsPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents } = useAgentStore();
  const { t } = useLocaleStore();
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t.agents.agentNotFound}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {t.agents.agentNotFoundDescription}
        </p>
        <Button asChild variant="outline">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
      </div>
    );
  }

  const isHotel = agent.algorithmType === "hotel";

  return (
    <div className="space-y-4 lg:max-w-[800px] lg:mx-auto">
      <motion.div {...fadeUp(0)}>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 text-muted-foreground"
        >
          <Link href={`/agents/${agentId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {agent.name}
          </Link>
        </Button>
      </motion.div>

      <motion.div {...fadeUp(0.08)}>
        {isHotel ? (
          <RoomsEditor agentId={agentId} />
        ) : (
          <ProductsEditor agentId={agentId} />
        )}
      </motion.div>
    </div>
  );
}
