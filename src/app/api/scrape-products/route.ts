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
          "Mozilla/5.0 (compatible; LISABot/1.0; +https://lisa-setup.vercel.app)",
      },
      signal: AbortSignal.timeout?.(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo acceder al sitio (${res.status})` },
        { status: 400 }
      );
    }
    const html = await res.text();

    // Extract products from HTML using regex patterns
    const products = extractProducts(html, url);

    return NextResponse.json({ products, source: url });
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

  // Remove scripts and styles
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Strategy 1: JSON-LD structured data (best quality)
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        // Direct Product type
        if (item["@type"] === "Product") {
          addProduct(products, seen, parseJsonLdProduct(item, baseUrl));
        }
        // ItemList containing products
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

  // Strategy 3: Common e-commerce HTML patterns
  const htmlProducts = extractFromHtml(clean, baseUrl);
  for (const p of htmlProducts) addProduct(products, seen, p);

  return products;
}

function parseJsonLdProduct(item: any, baseUrl: string): ScrapedProduct | null {
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

function extractFromHtml(html: string, baseUrl: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Match common product card patterns
  // Pattern: elements with product-like classes containing name + price
  const cardPatterns = [
    // Generic product cards
    /<(?:div|article|li|section)[^>]*class="[^"]*(?:product|item|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi,
    // Next.js / React rendered product blocks (data attributes)
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

  // Fallback: find price patterns and nearby text
  if (products.length === 0) {
    const priceBlocks =
      html.match(
        /(?:<[^>]+>[\s]*)?(?:\$\s*[\d.,]+|[\d.,]+\s*(?:COP|USD|MXN))(?:[\s]*<[^>]+>)?/gi
      ) ?? [];
    // This is very noisy, limit to reasonable amount
    // Only use if we truly found nothing else
  }

  return products;
}

function parseProductBlock(block: string, baseUrl: string): ScrapedProduct | null {
  // Extract name: h2, h3, h4, or strong/b tags, or .product-name/.product-title
  const nameMatch =
    block.match(/<(?:h[2-4]|strong)[^>]*>(.*?)<\/(?:h[2-4]|strong)>/i) ??
    block.match(/class="[^"]*(?:name|title)[^"]*"[^>]*>(.*?)</i);
  if (!nameMatch) return null;
  const name = stripTags(nameMatch[1]).trim();
  if (!name || name.length < 2 || name.length > 200) return null;

  // Extract price
  const priceMatch = block.match(
    /\$\s*([\d.,]+)|(?:precio|price)[^<]*?([\d.,]+)|<[^>]*class="[^"]*price[^"]*"[^>]*>[^$<]*\$?\s*([\d.,]+)/i
  );
  const priceStr = priceMatch?.[1] ?? priceMatch?.[2] ?? priceMatch?.[3] ?? "0";
  const price = parsePrice(priceStr);

  // Extract image
  const imgMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
  const imageUrl = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : "";

  // Extract description
  const descMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
  const description = descMatch ? stripTags(descMatch[1]).trim().slice(0, 500) : "";

  // Extract category from breadcrumb or data attribute
  const catMatch = block.match(
    /(?:category|categoria|cat)[^"]*["']([^"']+)["']|class="[^"]*category[^"]*"[^>]*>([^<]+)/i
  );
  const category = catMatch
    ? (catMatch[1] ?? catMatch[2] ?? "General").trim()
    : "General";

  return { name, description, price, category, imageUrl };
}

function parsePrice(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^\d.,]/g, "");
  // Handle Colombian format: 280.000 or 280,000
  if (cleaned.match(/^\d{1,3}([.,]\d{3})+$/)) {
    return parseInt(cleaned.replace(/[.,]/g, ""), 10);
  }
  // Handle decimal format: 280.00 or 280,50
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
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#?\w+;/g, " ").trim();
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
