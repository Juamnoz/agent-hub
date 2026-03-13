import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export async function GET() {
  return NextResponse.json({ status: "ok", method: "POST required" });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    // Try the main URL first, then common product pages
    const urlsToTry = [url];
    const base = url.replace(/\/$/, "");
    // Add common product/shop pages
    for (const path of ["/tienda", "/productos", "/shop", "/products", "/catalogo"]) {
      urlsToTry.push(base + path);
    }

    let allProducts: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const targetUrl of urlsToTry) {
      try {
        const res = await fetch(targetUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout?.(20000),
        });
        if (!res.ok) continue;
        const html = await res.text();

        const products = extractProducts(html, targetUrl);
        for (const p of products) {
          const key = p.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            allProducts.push(p);
          }
        }

        // If we found a good amount, no need to try more URLs
        if (allProducts.length >= 20) break;
      } catch {
        continue;
      }
    }

    return NextResponse.json({
      products: allProducts,
      count: allProducts.length,
      source: url,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al scrapear el sitio" },
      { status: 500 }
    );
  }
}

function extractProducts(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  // Strategy 1: Next.js RSC product objects (\"product\":{\"id\":\"...\",...})
  const rscProducts = extractFromNextRSC(html, baseUrl);
  for (const p of rscProducts) addProduct(products, seen, p);

  // Strategy 2: JSON-LD structured data
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Product") {
          addProduct(products, seen, parseJsonLdProduct(item, baseUrl));
        }
        if (item["@type"] === "ItemList" && item.itemListElement) {
          for (const el of item.itemListElement) {
            if (
              el.item?.["@type"] === "Product" ||
              el["@type"] === "Product"
            ) {
              addProduct(
                products,
                seen,
                parseJsonLdProduct(el.item || el, baseUrl)
              );
            }
          }
        }
      }
    } catch {}
  }

  // Strategy 3: __NEXT_DATA__ (Pages Router)
  const nextDataMatch = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const found = findProductArrays(data);
      for (const obj of found) {
        addProduct(products, seen, parseGenericProduct(obj, baseUrl));
      }
    } catch {}
  }

  // Strategy 4: Inline script JSON arrays
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const content = scriptMatch[1];
    if (content.length < 50 || content.length > 500000) continue;
    if (content.includes("function") && !content.includes('"products"'))
      continue;
    const assignRegex =
      /(?:products|items|catalog|catalogue|inventory)\s*[=:]\s*(\[[\s\S]*?\]);/gi;
    let assignMatch;
    while ((assignMatch = assignRegex.exec(content)) !== null) {
      try {
        const arr = JSON.parse(assignMatch[1]);
        if (Array.isArray(arr)) {
          for (const obj of arr) {
            addProduct(products, seen, parseGenericProduct(obj, baseUrl));
          }
        }
      } catch {}
    }
  }

  // Strategy 5: HTML product card patterns (fallback)
  if (products.length === 0) {
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");
    const htmlProducts = extractFromHtmlCards(clean, baseUrl);
    for (const p of htmlProducts) addProduct(products, seen, p);
  }

  return products;
}

// ── Strategy 1: Next.js RSC (App Router) ──────────────────────────────────
function extractFromNextRSC(
  html: string,
  baseUrl: string
): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Find all product wrapper objects: \"product\":{\"id\":\"UUID\",...}
  // This pattern only matches real product objects, not categories or nav items
  const productIdRegex = /\\"product\\":\{\\"id\\":\\"([^"\\]+)\\"/g;
  const productIds: string[] = [];
  const idSet = new Set<string>();
  let m;

  while ((m = productIdRegex.exec(html)) !== null) {
    if (!idSet.has(m[1])) {
      idSet.add(m[1]);
      productIds.push(m[1]);
    }
  }

  if (productIds.length === 0) return products;

  const seen = new Set<string>();

  for (const id of productIds) {
    const marker = `\\"product\\":\{\\"id\\":\\"${id}\\"`;
    const blockStart = html.indexOf(marker);
    if (blockStart < 0) continue;

    // Extract a window of text after this product marker
    const block = html.slice(blockStart, blockStart + 2000);

    const name = extractEscapedField(block, "name");
    if (!name || name.length < 2 || name.length > 200) continue;

    const key = name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    const price = parseInt(
      block.match(/\\"price\\":(\d+)/)?.[1] || "0",
      10
    );
    const description = (
      extractEscapedField(block, "description") || ""
    ).slice(0, 500);
    const slug = extractEscapedField(block, "slug") || "";

    // Image: look for /uploads/ paths or full URLs
    const imgPath =
      block.match(/\/uploads\/[^"\\]+/)?.[0] ||
      block.match(
        /\\"images\\":\[?\\"(https?:\/\/[^"\\]+)\\"/
      )?.[1] ||
      "";
    const imageUrl = imgPath ? resolveUrl(imgPath, baseUrl) : "";

    // Category: find \"category\":{...\"name\":\"VALUE\"}
    const catMatch = block.match(
      /\\"category\\":\{[^}]*?\\"name\\":\\"((?:[^\\]|\\[^"])*?)\\"/
    );
    const category = catMatch?.[1] || "General";

    products.push({ name, description, price, category, imageUrl });
  }

  return products;
}

/** Extract a string field value from escaped JSON: \"field\":\"value\" */
function extractEscapedField(
  block: string,
  field: string
): string | null {
  const regex = new RegExp(
    `\\\\"${field}\\\\":\\\\"((?:[^\\\\]|\\\\[^"])*?)\\\\"`,
    ""
  );
  const match = block.match(regex);
  return match ? match[1] : null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function parseGenericProduct(
  obj: any,
  baseUrl: string
): ScrapedProduct | null {
  if (!obj || typeof obj !== "object") return null;
  const name = String(obj.name || obj.title || obj.productName || "").trim();
  if (!name || name.length < 2 || name.length > 300) return null;

  const rawPrice =
    obj.price ?? obj.salePrice ?? obj.regularPrice ?? obj.unit_price ?? 0;
  const price =
    typeof rawPrice === "number"
      ? Math.round(rawPrice)
      : parsePrice(String(rawPrice));

  let imageUrl = "";
  const imgField =
    obj.images ?? obj.image ?? obj.imageUrl ?? obj.thumbnail ?? "";
  if (typeof imgField === "string") {
    imageUrl = imgField;
  } else if (Array.isArray(imgField) && imgField.length > 0) {
    imageUrl =
      typeof imgField[0] === "string"
        ? imgField[0]
        : imgField[0]?.url ?? imgField[0]?.src ?? "";
  }

  let category = "General";
  const catField = obj.category ?? obj.categoryName ?? obj.type ?? "";
  if (typeof catField === "string" && catField.trim()) {
    category = catField.trim();
  } else if (catField && typeof catField === "object") {
    category = catField.name ?? catField.title ?? "General";
  }

  const desc = String(
    obj.description ?? obj.shortDescription ?? obj.excerpt ?? ""
  )
    .trim()
    .slice(0, 500);

  return {
    name,
    description: stripTags(desc),
    price,
    category,
    imageUrl: resolveUrl(imageUrl, baseUrl),
  };
}

function findProductArrays(data: any, depth = 0): any[] {
  if (depth > 8 || !data) return [];
  const results: any[] = [];

  if (Array.isArray(data)) {
    const hasProducts = data.some(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.name || item.title) &&
        item.price != null
    );
    if (hasProducts) {
      for (const item of data) {
        if (
          item &&
          typeof item === "object" &&
          (item.name || item.title) &&
          item.price != null
        ) {
          results.push(item);
        }
      }
    } else {
      for (const item of data) {
        results.push(...findProductArrays(item, depth + 1));
      }
    }
  } else if (typeof data === "object") {
    for (const value of Object.values(data)) {
      results.push(...findProductArrays(value, depth + 1));
    }
  }

  return results;
}

function parseJsonLdProduct(
  item: any,
  baseUrl: string
): ScrapedProduct | null {
  if (!item?.name) return null;
  const offers = item.offers
    ? Array.isArray(item.offers)
      ? item.offers[0]
      : item.offers
    : null;
  const price = parsePrice(offers?.price ?? offers?.lowPrice ?? "0");
  const image = Array.isArray(item.image)
    ? item.image[0]
    : typeof item.image === "string"
      ? item.image
      : item.image?.url ?? "";

  return {
    name: String(item.name).trim(),
    description: String(item.description ?? "").trim().slice(0, 500),
    price,
    category: String(item.category ?? "General").trim(),
    imageUrl: resolveUrl(image, baseUrl),
  };
}

function extractFromHtmlCards(
  html: string,
  baseUrl: string
): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const cardPatterns = [
    /<(?:div|article|li|section)[^>]*class="[^"]*(?:product|item|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi,
    /<(?:div|a)[^>]*(?:data-product|data-item)[^>]*>([\s\S]*?)<\/(?:div|a)>/gi,
  ];

  for (const pattern of cardPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1];
      const nameMatch =
        block.match(/<(?:h[2-4]|strong)[^>]*>(.*?)<\/(?:h[2-4]|strong)>/i) ??
        block.match(/class="[^"]*(?:name|title)[^"]*"[^>]*>(.*?)</i);
      if (!nameMatch) continue;
      const name = stripTags(nameMatch[1]).trim();
      if (!name || name.length < 2 || name.length > 200) continue;

      const priceMatch = block.match(
        /\$\s*([\d.,]+)|(?:precio|price)[^<]*?([\d.,]+)|class="[^"]*price[^"]*"[^>]*>[^$<]*\$?\s*([\d.,]+)/i
      );
      const price = parsePrice(
        priceMatch?.[1] ?? priceMatch?.[2] ?? priceMatch?.[3] ?? "0"
      );

      const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
      const imageUrl = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : "";

      const descMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
      const description = descMatch
        ? stripTags(descMatch[1]).trim().slice(0, 500)
        : "";

      products.push({ name, description, price, category: "General", imageUrl });
    }
  }
  return products;
}

function parsePrice(raw: string | number): number {
  if (typeof raw === "number") return Math.round(raw);
  const cleaned = String(raw).replace(/[^\d.,]/g, "");
  if (cleaned.match(/^\d{1,3}([.,]\d{3})+$/)) {
    return parseInt(cleaned.replace(/[.,]/g, ""), 10);
  }
  const num = parseFloat(cleaned.replace(",", "."));
  return isNaN(num) ? 0 : Math.round(num);
}

function resolveUrl(url: string, base: string): string {
  if (!url) return "";
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .trim();
}

function addProduct(
  products: ScrapedProduct[],
  seen: Set<string>,
  p: ScrapedProduct | null
) {
  if (!p || !p.name) return;
  const key = p.name.toLowerCase().trim();
  if (seen.has(key)) return;
  seen.add(key);
  products.push(p);
}
