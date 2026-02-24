"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, Package, X, Upload,
  ShoppingCart, Table2, Globe, Loader2, CheckCircle2,
  ChevronDown, ChevronRight, ArrowRight,
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
import Link from "next/link";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { Product, ProductVariant } from "@/lib/mock-data";
import { mockImportProducts } from "@/lib/mock-data";
import { toast } from "sonner";

interface ProductsEditorProps {
  agentId: string;
}

export function ProductsEditor({ agentId }: ProductsEditorProps) {
  const { products, loadProducts, addProduct, importProducts, updateProduct, deleteProduct, integrations, agents } = useAgentStore();
  const { t } = useLocaleStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importingSource, setImportingSource] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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
  const sheetsIntegration = integrations.find(
    (i) => i.agentId === agentId && i.name === "google-sheets" && i.enabled && i.configured
  );
  const hasWebsite = !!agent?.socialLinks?.website;

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
    setVariants(product.variants.map((v) => ({ ...v, options: [...v.options] })));
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

  function handleImport(source: "ecommerce" | "sheets" | "scraping") {
    if (source === "ecommerce" && !ecommerceIntegration) {
      toast.error(t.products.requiresIntegration);
      return;
    }
    if (source === "sheets" && !sheetsIntegration) {
      toast.error(t.products.requiresIntegration);
      return;
    }
    if (source === "scraping" && !hasWebsite) {
      toast.error(t.products.requiresWebsite);
      return;
    }
    setImportingSource(source);
    setTimeout(() => {
      const items = mockImportProducts[source].map((p) => ({ ...p, agentId }));
      importProducts(agentId, source, items);
      setImportingSource(null);
      toast.success(`${mockImportProducts[source].length} ${t.products.productsImported}`);
    }, 2500);
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

  const importSources = [
    {
      id: "ecommerce" as const,
      icon: ShoppingCart,
      iconColor: "text-orange-600",
      label: "WooCommerce / Shopify",
      sublabel: t.products.importFromEcommerce,
      ready: !!ecommerceIntegration,
    },
    {
      id: "sheets" as const,
      icon: Table2,
      iconColor: "text-green-600",
      label: "Google Sheets",
      sublabel: t.products.importFromSheets,
      ready: !!sheetsIntegration,
    },
    {
      id: "scraping" as const,
      icon: Globe,
      iconColor: "text-blue-600",
      label: "Web Scraping",
      sublabel: t.products.importFromWeb,
      ready: hasWebsite,
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
          <div className="border-t border-border divide-y divide-border">
            {importSources.map((src) => {
              const Icon = src.icon;
              const isImporting = importingSource === src.id;
              return (
                <div key={src.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-4 w-4 ${src.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium leading-tight">{src.label}</p>
                    <p className="text-[13px] text-muted-foreground">{src.sublabel}</p>
                  </div>
                  {src.ready ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[14px] rounded-full px-3 shrink-0"
                      disabled={importingSource !== null}
                      onClick={() => handleImport(src.id)}
                    >
                      {isImporting ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t.products.importing}</>
                      ) : (
                        <><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />Sincronizar</>
                      )}
                    </Button>
                  ) : (
                    <Link
                      href={`/agents/${agentId}/settings`}
                      className="flex items-center gap-1 text-[14px] font-medium text-orange-600 hover:text-orange-700 shrink-0"
                    >
                      Conectar
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
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
