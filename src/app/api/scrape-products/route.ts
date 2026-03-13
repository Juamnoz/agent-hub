import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

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
    // Fetch the page HTML
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout?.(20000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo acceder al sitio (${res.status})` },
        { status: 400 }
      );
    }
    const html = await res.text();

    // Extract products using multiple strategies
    const products = extractProducts(html, url);

    return NextResponse.json({ products, count: products.length, source: url });
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

  // Strategy 0: Next.js RSC / self.__next_f.push() serialized data
  // This captures products from React Server Components payloads
  const rscProducts = extractFromNextRSC(html, baseUrl);
  for (const p of rscProducts) addProduct(products, seen, p);

  // Strategy 1: JSON-LD structured data
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
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
            if (el.item?.["@type"] === "Product" || el["@type"] === "Product") {
              addProduct(products, seen, parseJsonLdProduct(el.item || el, baseUrl));
            }
          }
        }
      }
    } catch {}
  }

  // Strategy 2: Open Graph / meta product tags
  const ogProducts = extractOgProducts(html, baseUrl);
  for (const p of ogProducts) addProduct(products, seen, p);

  // Strategy 3: __NEXT_DATA__ (Pages Router)
  const nextDataProducts = extractFromNextData(html, baseUrl);
  for (const p of nextDataProducts) addProduct(products, seen, p);

  // Strategy 4: Generic JSON objects in scripts (catches inline data, Shopify, etc.)
  const inlineProducts = extractFromInlineScripts(html, baseUrl);
  for (const p of inlineProducts) addProduct(products, seen, p);

  // Strategy 5: Common e-commerce HTML patterns (last resort)
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const htmlProducts = extractFromHtml(clean, baseUrl);
  for (const p of htmlProducts) addProduct(products, seen, p);

  return products;
}

// ── Strategy 0: Next.js RSC (App Router) ──────────────────────────────────
function extractFromNextRSC(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Extract all self.__next_f.push() payloads
  const pushRegex = /self\.__next_f\.push\(\[[\d,]*"([\s\S]*?)"\]\)/g;
  let match;
  const chunks: string[] = [];

  while ((match = pushRegex.exec(html)) !== null) {
    try {
      // Unescape the string
      const raw = match[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");
      chunks.push(raw);
    } catch {}
  }

  const fullPayload = chunks.join("\n");

  // Strategy 0a: Find JSON objects that look like products
  // Pattern: {"id":"...","name":"...","price":12000,...}
  const productObjRegex = /\{"(?:id|_id)":\s*"[^"]+",\s*"(?:name|title)":\s*"([^"]+)"[^}]*?"price":\s*(\d+(?:\.\d+)?)[^}]*?\}/g;
  let objMatch;
  while ((objMatch = productObjRegex.exec(fullPayload)) !== null) {
    try {
      // Try to parse the full object
      const startIdx = objMatch.index;
      const objStr = extractJsonObject(fullPayload, startIdx);
      if (objStr) {
        const obj = JSON.parse(objStr);
        const p = parseGenericProduct(obj, baseUrl);
        if (p) products.push(p);
      }
    } catch {
      // Fallback: use the regex captures
      const name = objMatch[1];
      const price = parseFloat(objMatch[2]);
      if (name && price > 0) {
        products.push({
          name,
          description: "",
          price: Math.round(price),
          category: "General",
          imageUrl: "",
        });
      }
    }
  }

  // Strategy 0b: Find product arrays in the payload
  // Look for arrays of objects with name+price patterns
  const arrayRegex = /\[(\{"(?:id|_id)":[^\]]{20,})\]/g;
  while ((match = arrayRegex.exec(fullPayload)) !== null) {
    try {
      const arrStr = "[" + match[1] + "]";
      const arr = JSON.parse(arrStr);
      if (Array.isArray(arr)) {
        for (const obj of arr) {
          if (obj && (obj.name || obj.title) && obj.price != null) {
            const p = parseGenericProduct(obj, baseUrl);
            if (p) products.push(p);
          }
        }
      }
    } catch {}
  }

  return products;
}

// ── Strategy 3: __NEXT_DATA__ (Pages Router) ─────────────────────────────
function extractFromNextData(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch) return products;

  try {
    const data = JSON.parse(nextDataMatch[1]);
    const allProducts = findProductArrays(data);
    for (const obj of allProducts) {
      const p = parseGenericProduct(obj, baseUrl);
      if (p) products.push(p);
    }
  } catch {}
  return products;
}

// ── Strategy 4: Inline script JSON data ──────────────────────────────────
function extractFromInlineScripts(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Find script tags with JSON-like content containing product arrays
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    // Skip non-data scripts
    if (content.includes("function") && !content.includes('"products"')) continue;
    if (content.length < 50 || content.length > 500000) continue;

    // Look for assigned product arrays/objects
    const assignRegex = /(?:products|items|catalog|catalogue|inventory)\s*[=:]\s*(\[[\s\S]*?\]);/gi;
    let assignMatch;
    while ((assignMatch = assignRegex.exec(content)) !== null) {
      try {
        const arr = JSON.parse(assignMatch[1]);
        if (Array.isArray(arr)) {
          for (const obj of arr) {
            const p = parseGenericProduct(obj, baseUrl);
            if (p) products.push(p);
          }
        }
      } catch {}
    }
  }
  return products;
}

// ── Strategy 5: HTML patterns ────────────────────────────────────────────
function extractFromHtml(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  const cardPatterns = [
    /<(?:div|article|li|section)[^>]*class="[^"]*(?:product|item|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi,
    /<(?:div|a)[^>]*(?:data-product|data-item)[^>]*>([\s\S]*?)<\/(?:div|a)>/gi,
  ];

  for (const pattern of cardPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1];
      const p = parseProductBlock(block, baseUrl);
      if (p) products.push(p);
    }
  }

  return products;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Parse any generic product-like object */
function parseGenericProduct(obj: any, baseUrl: string): ScrapedProduct | null {
  if (!obj || typeof obj !== "object") return null;

  const name = String(obj.name || obj.title || obj.productName || "").trim();
  if (!name || name.length < 2 || name.length > 300) return null;

  const rawPrice = obj.price ?? obj.salePrice ?? obj.regularPrice ?? obj.unit_price ?? 0;
  const price = typeof rawPrice === "number" ? Math.round(rawPrice) : parsePrice(String(rawPrice));

  // Image: could be string, array, or nested object
  let imageUrl = "";
  const imgField = obj.images ?? obj.image ?? obj.imageUrl ?? obj.img ?? obj.thumbnail ?? obj.featuredImage;
  if (typeof imgField === "string") {
    imageUrl = imgField;
  } else if (Array.isArray(imgField) && imgField.length > 0) {
    imageUrl = typeof imgField[0] === "string" ? imgField[0] : imgField[0]?.url ?? imgField[0]?.src ?? "";
  } else if (imgField && typeof imgField === "object") {
    imageUrl = imgField.url ?? imgField.src ?? "";
  }

  // Category: could be string, object, or nested
  let category = "General";
  const catField = obj.category ?? obj.categoryName ?? obj.type ?? obj.productType;
  if (typeof catField === "string" && catField.trim()) {
    category = catField.trim();
  } else if (catField && typeof catField === "object") {
    category = catField.name ?? catField.title ?? "General";
  }

  // Description
  const desc = String(obj.description ?? obj.shortDescription ?? obj.excerpt ?? obj.summary ?? "").trim().slice(0, 500);

  return {
    name,
    description: stripTags(desc),
    price,
    category,
    imageUrl: resolveUrl(imageUrl, baseUrl),
  };
}

/** Recursively find arrays of product-like objects in a data tree */
function findProductArrays(data: any, depth = 0): any[] {
  if (depth > 8 || !data) return [];
  const results: any[] = [];

  if (Array.isArray(data)) {
    // Check if this array contains product-like objects
    const hasProducts = data.some(
      (item) => item && typeof item === "object" && (item.name || item.title) && item.price != null
    );
    if (hasProducts) {
      for (const item of data) {
        if (item && typeof item === "object" && (item.name || item.title) && item.price != null) {
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

/** Extract a JSON object starting at given index, handling nesting */
function extractJsonObject(str: string, startIdx: number): string | null {
  if (str[startIdx] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < Math.min(startIdx + 5000, str.length); i++) {
    const ch = str[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return str.slice(startIdx, i + 1);
    }
  }
  return null;
}

function parseJsonLdProduct(item: any, baseUrl: string): ScrapedProduct | null {
  if (!item?.name) return null;
  const offers = item.offers
    ? Array.isArray(item.offers) ? item.offers[0] : item.offers
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

function extractOgProducts(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  const getName = (h: string) =>
    h.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "";
  const getDesc = (h: string) =>
    h.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "";
  const getImg = (h: string) =>
    h.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "";
  const getPrice = (h: string) =>
    h.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "0";

  const name = getName(html);
  const price = parsePrice(getPrice(html));
  if (name && price > 0) {
    products.push({
      name,
      description: getDesc(html),
      price,
      category: "General",
      imageUrl: resolveUrl(getImg(html), baseUrl),
    });
  }
  return products;
}

function parseProductBlock(block: string, baseUrl: string): ScrapedProduct | null {
  const nameMatch =
    block.match(/<(?:h[2-4]|strong)[^>]*>(.*?)<\/(?:h[2-4]|strong)>/i) ??
    block.match(/class="[^"]*(?:name|title)[^"]*"[^>]*>(.*?)</i);
  if (!nameMatch) return null;
  const name = stripTags(nameMatch[1]).trim();
  if (!name || name.length < 2 || name.length > 200) return null;

  const priceMatch = block.match(
    /\$\s*([\d.,]+)|(?:precio|price)[^<]*?([\d.,]+)|<[^>]*class="[^"]*price[^"]*"[^>]*>[^$<]*\$?\s*([\d.,]+)/i
  );
  const priceStr = priceMatch?.[1] ?? priceMatch?.[2] ?? priceMatch?.[3] ?? "0";
  const price = parsePrice(priceStr);

  const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  const imageUrl = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : "";

  const descMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
  const description = descMatch ? stripTags(descMatch[1]).trim().slice(0, 500) : "";

  const catMatch = block.match(
    /(?:category|categoria|cat)[^"]*["']([^"']+)["']|class="[^"]*category[^"]*"[^>]*>([^<]+)/i
  );
  const category = catMatch ? (catMatch[1] ?? catMatch[2] ?? "General").trim() : "General";

  return { name, description, price, category, imageUrl };
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
