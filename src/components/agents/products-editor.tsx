"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, Package, X, Upload,
  ShoppingCart, Table2, Globe, Loader2,
  ChevronDown, ChevronRight, FileText,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAgentStore } from "@/stores/agent-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Product, ProductVariant } from "@/lib/mock-data";
import { toast } from "sonner";
import { trainApi } from "@/lib/api";

const MAX_CATALOGS = 10;

interface CatalogItem {
  title: string;
  url: string;
  fileName: string;
}

interface ProductsEditorProps {
  agentId: string;
}

export function ProductsEditor({ agentId }: ProductsEditorProps) {
  const { products, loadProducts, addProduct, importProducts, updateProduct, deleteProduct, integrations, agents, updateAgent } = useAgentStore();
  const { token } = useAuthStore();
  const { t } = useLocaleStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importingSource, setImportingSource] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [catalogsOpen, setCatalogsOpen] = useState(false);
  const [catalogUploading, setCatalogUploading] = useState(false);
  const catalogFileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    loadProducts(agentId);
  }, [agentId, loadProducts]);

  const agentProducts = products.filter((p) => p.agentId === agentId);
  const categories = [...new Set(agentProducts.map((p) => p.category))];

  const agent = agents.find((a) => a.id === agentId);
  const ecommerceIntegration = integrations.find(
    (i) => i.agentId === agentId && (i.name === "woocommerce" || i.name === "shopify") && i.enabled && i.configured
  );
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);

  function resetForm() {
    setName(""); setDescription(""); setPrice("");
    setCategory(""); setSku(""); setStock("");
    setImageUrl(""); setVariants([]);
  }

  function openNew() {
    setEditingProduct(null);
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setCategory(product.category);
    setSku(product.sku ?? "");
    setStock(product.stock != null ? String(product.stock) : "");
    setImageUrl(product.imageUrl ?? "");
    setVariants((product.variants ?? []).map((v) => ({ ...v, options: [...v.options] })));
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim() || !price.trim() || isNaN(Number(price))) {
      toast.error(t.products.required);
      return;
    }
    const productData = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      category: category.trim() || "General",
      sku: sku.trim() || undefined,
      stock: stock.trim() ? Number(stock) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      variants: variants.filter((v) => v.name.trim()),
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success(t.products.productUpdated);
    } else {
      addProduct({ agentId, ...productData, isActive: true });
      toast.success(t.products.productAdded);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteProduct(id);
    toast.success(t.products.productDeleted);
  }

  function handleToggle(product: Product) {
    updateProduct(product.id, { isActive: !product.isActive });
  }

  async function handleFileImport(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".tsv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Formato no soportado. Usa CSV, TSV o Excel.");
      return;
    }
    setCsvImporting(true);
    try {
      let rows: string[][];
      if (name.endsWith(".csv") || name.endsWith(".tsv")) {
        const text = await file.text();
        const sep = name.endsWith(".tsv") ? "\t" : ",";
        rows = text.split(/\r?\n/).filter(Boolean).map((line) => {
          // Simple CSV parse respecting quotes
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === sep && !inQuotes) { result.push(current.trim()); current = ""; continue; }
            current += ch;
          }
          result.push(current.trim());
          return result;
        });
      } else {
        // Excel files - read as CSV via basic parsing
        toast.error("Para archivos Excel, expórtalos primero como CSV");
        setCsvImporting(false);
        return;
      }

      if (rows.length < 2) {
        toast.error("El archivo está vacío o solo tiene encabezados");
        setCsvImporting(false);
        return;
      }

      // Detect columns by header names
      const headers = rows[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      const nameIdx = headers.findIndex((h) => ["nombre", "name", "producto", "product", "titulo", "title"].includes(h));
      const priceIdx = headers.findIndex((h) => ["precio", "price", "valor", "value"].includes(h));
      const descIdx = headers.findIndex((h) => ["descripcion", "description", "detalle", "detail"].includes(h));
      const catIdx = headers.findIndex((h) => ["categoria", "category", "cat", "tipo", "type"].includes(h));
      const imgIdx = headers.findIndex((h) => ["imagen", "image", "img", "image_url", "imageurl", "foto", "photo", "url_imagen"].includes(h));
      const skuIdx = headers.findIndex((h) => ["sku", "codigo", "code", "ref", "referencia"].includes(h));

      if (nameIdx === -1) {
        toast.error("No se encontró columna de nombre (nombre, name, producto, title)");
        setCsvImporting(false);
        return;
      }

      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const pName = row[nameIdx]?.trim();
        if (!pName) continue;
        const rawPrice = priceIdx >= 0 ? row[priceIdx]?.trim() ?? "0" : "0";
        // Parse price: handle 280.000 or 280,000 (Colombian) and normal decimals
        let price = 0;
        const cleaned = rawPrice.replace(/[^0-9.,]/g, "");
        if (cleaned.match(/^\d{1,3}([.,]\d{3})+$/)) {
          price = parseInt(cleaned.replace(/[.,]/g, ""), 10);
        } else {
          price = parseFloat(cleaned.replace(",", ".")) || 0;
        }

        addProduct({
          agentId,
          name: pName,
          description: descIdx >= 0 ? row[descIdx]?.trim() || undefined : undefined,
          price: Math.round(price),
          category: catIdx >= 0 ? row[catIdx]?.trim() || "General" : "General",
          imageUrl: imgIdx >= 0 ? row[imgIdx]?.trim() || undefined : undefined,
          sku: skuIdx >= 0 ? row[skuIdx]?.trim() || undefined : undefined,
          isActive: true,
        });
        count++;
      }

      if (count === 0) {
        toast.error("No se encontraron productos válidos en el archivo");
      } else {
        toast.success(`${count} ${t.products.productsImported}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el archivo");
    } finally {
      setCsvImporting(false);
      if (csvFileRef.current) csvFileRef.current.value = "";
    }
  }

  function addVariantRow() {
    setVariants([...variants, { name: "", options: [] }]);
  }
  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }
  function updateVariantName(index: number, value: string) {
    const updated = [...variants];
    updated[index] = { ...updated[index], name: value };
    setVariants(updated);
  }
  function updateVariantOptions(index: number, value: string) {
    const updated = [...variants];
    updated[index] = { ...updated[index], options: value.split(",").map((o) => o.trim()).filter(Boolean) };
    setVariants(updated);
  }

  // ── Catalogs ──────────────────────────────────────────────────
  const catalogs: CatalogItem[] = (agent?.catalogs as CatalogItem[] | null) ?? [];

  async function handleCatalogUpload(files: File[]) {
    const pdfs = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) { toast.error("Solo se permiten archivos PDF"); return; }
    const slots = MAX_CATALOGS - catalogs.length;
    const toUpload = pdfs.slice(0, slots);
    if (!toUpload.length) { toast.error("Límite de catálogos alcanzado"); return; }

    setCatalogUploading(true);
    const newCatalogs = [...catalogs];

    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("agentId", agentId);
        const res = await fetch("/api/upload-catalog", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir");
        newCatalogs.push({
          title: file.name.replace(/\.pdf$/i, ""),
          url: data.url,
          fileName: file.name,
        });
      } catch (err: any) {
        toast.error(err.message || `Error al subir ${file.name}`);
      }
    }

    await updateAgent(agentId, { catalogs: newCatalogs } as any);
    setCatalogUploading(false);
    toast.success(`${newCatalogs.length - catalogs.length} catálogo(s) subido(s)`);
    if (agent?.trainedAt) {
      trainApi.update(agentId, "catalogs").catch(console.error);
      toast.info("Actualizando catálogos del agente...");
    }
  }

  function removeCatalog(idx: number) {
    const updated = catalogs.filter((_, i) => i !== idx);
    updateAgent(agentId, { catalogs: updated.length > 0 ? updated : null } as any);
    toast.success("Catálogo eliminado");
    if (agent?.trainedAt) {
      trainApi.update(agentId, "catalogs").catch(console.error);
    }
  }

  function updateCatalogTitle(idx: number, title: string) {
    const updated = catalogs.map((c, i) => i === idx ? { ...c, title } : c);
    updateAgent(agentId, { catalogs: updated } as any);
  }

  const [scrapeUrl, setScrapeUrl] = useState(agent?.socialLinks?.website ?? "");

  const importSources = [
    {
      id: "ecommerce" as const,
      icon: ShoppingCart,
      iconColor: "text-orange-600",
      label: "WooCommerce / Shopify",
      sublabel: t.products.importFromEcommerce,
      ready: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header: count + add button */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] text-muted-foreground">
          {agentProducts.length} {agentProducts.length === 1 ? "producto" : "productos"}
        </span>
        <Button
          size="sm"
          onClick={openNew}
          className="h-8 rounded-full px-3.5 text-[15px] font-medium lisa-btn text-white border-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t.products.addProduct}
        </Button>
      </div>

      {/* Product list */}
      {agentProducts.length === 0 ? (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15 mb-3">
            <Package className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-[17px] font-semibold mb-1">{t.products.noProductsTitle}</h3>
          <p className="text-[15px] text-muted-foreground mb-4 max-w-[260px] leading-relaxed">
            {t.products.noProductsDescription}
          </p>
          <Button
            size="sm"
            onClick={openNew}
            className="h-8 rounded-full px-4 text-[15px] font-medium lisa-btn text-white border-0"
          >
            {t.products.addFirstProduct}
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider px-0.5 mb-1.5 mt-3 first:mt-0">
                {cat}
              </p>
              {agentProducts
                .filter((p) => p.category === cat)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    {/* Thumbnail */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/15 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-orange-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[16px] font-semibold leading-tight truncate">{product.name}</p>
                        <span className="text-[15px] font-bold text-orange-600 shrink-0">${product.price}</span>
                      </div>
                      {product.description && (
                        <p className="text-[14px] text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
                      )}
                      {(product.stock != null || product.sku) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {product.stock != null && (
                            <span className="text-[12px] text-muted-foreground">
                              Stock: <span className="font-medium text-foreground">{product.stock}</span>
                            </span>
                          )}
                          {product.sku && (
                            <span className="text-[12px] text-muted-foreground">{product.sku}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggle(product)}
                        className="scale-75 origin-right"
                      />
                      <button
                        onClick={() => openEdit(product)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Import — collapsible, always at the bottom */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <button
          onClick={() => setImportOpen(!importOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-[16px] font-medium">{t.products.importTitle}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${importOpen ? "rotate-180" : ""}`}
          />
        </button>

        {importOpen && (
          <div className="border-t border-border">
            {/* CSV / file drop zone */}
            <div className="px-4 py-3">
              <input
                ref={csvFileRef}
                type="file"
                accept=".csv,.tsv"
                className="hidden"
                onChange={(e) => e.target.files && handleFileImport(e.target.files)}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setCsvDragging(true); }}
                onDragLeave={() => setCsvDragging(false)}
                onDrop={(e) => { e.preventDefault(); setCsvDragging(false); handleFileImport(e.dataTransfer.files); }}
                onClick={() => csvFileRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors ${
                  csvDragging
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-500/10"
                    : "border-border hover:border-muted-foreground/40 hover:bg-accent/30"
                }`}
              >
                {csvImporting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 mb-2" />
                ) : (
                  <Table2 className="h-6 w-6 text-muted-foreground mb-2" />
                )}
                <p className="text-[14px] font-medium text-center">
                  {csvImporting ? "Importando productos..." : "Arrastra un archivo CSV o haz clic para subir"}
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Columnas: nombre, precio, descripción, categoría, imagen, sku
                </p>
              </div>
            </div>

            {/* Web Scraping — inline URL + button */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-[15px] font-medium">Web Scraping</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://tu-sitio.com"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  className="h-9 text-[14px] flex-1"
                />
                <Button
                  size="sm"
                  className="h-9 rounded-full px-4 text-[14px] font-medium lisa-btn text-white border-0 shrink-0"
                  disabled={importingSource === "scraping" || !scrapeUrl.trim()}
                  onClick={async () => {
                    const url = scrapeUrl.trim();
                    if (!url) return;
                    setImportingSource("scraping");
                    try {
                      const tk = useAuthStore.getState().token;
                      const res = await fetch("/api/scrape-products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
                        body: JSON.stringify({ url }),
                      });
                      const text = await res.text();
                      let data: any;
                      try { data = JSON.parse(text); } catch { toast.error("Error del servidor al extraer productos"); return; }
                      if (!res.ok) { toast.error(data.error || "Error al extraer"); return; }
                      const scraped = data.products ?? [];
                      if (scraped.length === 0) { toast.error("No se encontraron productos"); return; }
                      for (const p of scraped) {
                        addProduct({
                          agentId,
                          name: p.name,
                          description: p.description || undefined,
                          price: p.price,
                          category: p.category || "General",
                          imageUrl: p.imageUrl || undefined,
                          isActive: true,
                        });
                      }
                      toast.success(`${scraped.length} ${t.products.productsImported}`);
                    } catch (err: any) {
                      toast.error(err.message || "Error al extraer");
                    } finally {
                      setImportingSource(null);
                    }
                  }}
                >
                  {importingSource === "scraping" ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Extrayendo...</>
                  ) : (
                    <><Globe className="h-3.5 w-3.5 mr-1" />Extraer</>
                  )}
                </Button>
              </div>
            </div>

            {/* Other import sources */}
            <div className="divide-y divide-border border-t border-border">
              {importSources.map((src) => {
                const Icon = src.icon;
                return (
                  <div key={src.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className={`h-4 w-4 ${src.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium leading-tight">{src.label}</p>
                      <p className="text-[13px] text-muted-foreground">{src.sublabel}</p>
                    </div>
                    <Badge variant="secondary" className="text-[12px] shrink-0">Próximamente</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Catalogs PDF section ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <button
          onClick={() => setCatalogsOpen(!catalogsOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-500" />
            <span className="text-[16px] font-medium">Catálogos PDF</span>
            {catalogs.length > 0 && (
              <span className="text-[13px] text-muted-foreground">({catalogs.length})</span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${catalogsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {catalogsOpen && (
          <div className="border-t border-border">
            {/* Upload button */}
            <div className="px-4 pt-3 pb-2">
              <input
                ref={catalogFileRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => { handleCatalogUpload(Array.from(e.target.files ?? [])); e.target.value = ""; }}
              />
              <button
                onClick={() => catalogFileRef.current?.click()}
                disabled={catalogUploading || catalogs.length >= MAX_CATALOGS}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold bg-teal-500/10 ring-1 ring-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/15 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {catalogUploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Subir PDF</>
                )}
              </button>
              <p className="text-[12px] text-muted-foreground text-center mt-1.5">
                Sube menús, fichas técnicas o catálogos para que tu agente los use como conocimiento. Máx. 10MB por archivo.
              </p>
            </div>

            {/* Catalog list */}
            {catalogs.length > 0 && (
              <div className="divide-y divide-border">
                {catalogs.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                      <FileText className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        type="text"
                        value={cat.title}
                        onChange={(e) => updateCatalogTitle(idx, e.target.value)}
                        placeholder="Título del catálogo..."
                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-[13px] placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <p className="text-[11px] text-muted-foreground/50 px-0.5 truncate">{cat.fileName}</p>
                    </div>
                    <button
                      onClick={() => removeCatalog(idx)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {catalogs.length === 0 && !catalogUploading && (
              <div className="px-4 pb-4 text-center">
                <p className="text-[13px] text-muted-foreground/50">
                  Sin catálogos — sube un PDF para empezar
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t.products.editProduct : t.products.addProduct}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">{t.products.name} *</Label>
                <Input
                  id="product-name"
                  placeholder={t.products.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">{t.products.price} *</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder={t.products.pricePlaceholder}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">{t.products.description}</Label>
              <Textarea
                id="product-description"
                placeholder={t.products.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-category">{t.products.category}</Label>
                <Input
                  id="product-category"
                  placeholder={t.products.categoryPlaceholder}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-sku">{t.products.sku}</Label>
                <Input
                  id="product-sku"
                  placeholder={t.products.skuPlaceholder}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-stock">{t.products.stock}</Label>
              <Input
                id="product-stock"
                type="number"
                placeholder={t.products.stockPlaceholder}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.products.imageUrl}</Label>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t.products.variants}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t.products.addVariant}
                </Button>
              </div>
              {variants.map((variant, index) => (
                <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={t.products.variantNamePlaceholder}
                      value={variant.name}
                      onChange={(e) => updateVariantName(index, e.target.value)}
                    />
                    <Input
                      placeholder={t.products.variantOptionsPlaceholder}
                      value={variant.options.join(", ")}
                      onChange={(e) => updateVariantOptions(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => removeVariant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? t.products.saveChanges : t.products.addProduct}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocaleStore();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="relative inline-block">
        <img src={value} alt="Product" className="h-24 w-24 rounded-xl object-cover ring-1 ring-black/[0.06]" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors cursor-pointer"
    >
      <Upload className="h-6 w-6 text-muted-foreground/60" />
      <span className="text-[15px] font-medium">{t.products.imageUrl}</span>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </button>
  );
}
