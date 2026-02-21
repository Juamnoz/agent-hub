"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Package, X, Upload, ImageIcon, ShoppingCart, Table2, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setSku("");
    setStock("");
    setImageUrl("");
    setVariants([]);
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
      addProduct({
        agentId,
        ...productData,
        isActive: true,
      });
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

  const agent = agents.find((a) => a.id === agentId);
  const ecommerceIntegration = integrations.find(
    (i) => i.agentId === agentId && (i.name === "woocommerce" || i.name === "shopify") && i.enabled && i.configured
  );
  const sheetsIntegration = integrations.find(
    (i) => i.agentId === agentId && i.name === "google-sheets" && i.enabled && i.configured
  );
  const hasWebsite = !!agent?.socialLinks?.website;

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
    updated[index] = {
      ...updated[index],
      options: value.split(",").map((o) => o.trim()).filter(Boolean),
    };
    setVariants(updated);
  }

  const categories = [...new Set(agentProducts.map((p) => p.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {agentProducts.length} {agentProducts.length === 1 ? "producto" : "productos"}
        </span>
        <Button size="sm" onClick={openNew} className="rounded-full">
          <Plus className="h-4 w-4 mr-1" />
          {t.products.addProduct}
        </Button>
      </div>

      {/* Import panel */}
      <div>
        <h3 className="text-sm font-medium mb-2">{t.products.importTitle}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* E-commerce card */}
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">WooCommerce / Shopify</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{t.products.importFromEcommerce}</p>
              <div className="flex items-center justify-between">
                <Badge variant={ecommerceIntegration ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                  {ecommerceIntegration ? (
                    <><CheckCircle2 className="h-3 w-3 mr-0.5" />{t.integrations.configured}</>
                  ) : t.integrations.disabled}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={importingSource !== null}
                  onClick={() => handleImport("ecommerce")}
                >
                  {importingSource === "ecommerce" ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t.products.importing}</>
                  ) : "Importar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Sheets card */}
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Table2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Google Sheets</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{t.products.importFromSheets}</p>
              <div className="flex items-center justify-between">
                <Badge variant={sheetsIntegration ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                  {sheetsIntegration ? (
                    <><CheckCircle2 className="h-3 w-3 mr-0.5" />{t.integrations.configured}</>
                  ) : t.integrations.disabled}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={importingSource !== null}
                  onClick={() => handleImport("sheets")}
                >
                  {importingSource === "sheets" ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t.products.importing}</>
                  ) : "Importar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Web scraping card */}
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Web Scraping</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{t.products.importFromWeb}</p>
              <div className="flex items-center justify-between">
                <Badge variant={hasWebsite ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                  {hasWebsite ? (
                    <><CheckCircle2 className="h-3 w-3 mr-0.5" />{t.integrations.configured}</>
                  ) : t.integrations.disabled}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={importingSource !== null}
                  onClick={() => handleImport("scraping")}
                >
                  {importingSource === "scraping" ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t.products.importing}</>
                  ) : "Importar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {agentProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-orange-50 p-3 mb-4">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-1">{t.products.noProductsTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {t.products.noProductsDescription}
            </p>
            <Button size="sm" onClick={openNew}>
              {t.products.addFirstProduct}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                {cat}
              </h3>
              {agentProducts
                .filter((p) => p.category === cat)
                .map((product) => (
                  <Card key={product.id} className="mb-2">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{product.name}</p>
                            <span className="text-sm font-semibold text-orange-600">
                              ${product.price}
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {product.stock != null && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Stock: {product.stock}
                              </Badge>
                            )}
                            {product.sku && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {product.sku}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggle(product)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}

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

            {/* Image upload */}
            <div className="space-y-2">
              <Label>{t.products.imageUrl}</Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
              />
            </div>

            {/* Variants section */}
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

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocaleStore();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value}
          alt="Product"
          className="h-24 w-24 rounded-xl object-cover ring-1 ring-black/[0.06]"
        />
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
      className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-sm text-muted-foreground hover:border-orange-300 hover:bg-orange-50/50 transition-colors cursor-pointer"
    >
      <Upload className="h-6 w-6 text-gray-400" />
      <span className="text-[13px] font-medium">
        {t.products.imageUrl}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
}
