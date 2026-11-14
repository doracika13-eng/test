/**
 * Shopify Storefront API adapter (Phase 2).
 *
 * Activated automatically when SHOPIFY_STORE_DOMAIN and
 * SHOPIFY_STOREFRONT_ACCESS_TOKEN are set. Products, prices, inventory,
 * variants and checkout are then managed in Shopify admin — no code changes.
 *
 * Conventions expected in Shopify admin:
 *  - Product options named "Colour" (or "Color") and "Size".
 *  - Each colour's images attached to its variants (variant image), the rest
 *    of the product media are shown for every colour.
 *  - Optional metafields (namespace "dami"):
 *      dami.code         single line text  e.g. "CFM-K01"
 *      dami.subtitle     single line text
 *      dami.highlights   list.single_line_text_field
 *      dami.size_chart   json  { unit, note, columns, rows:[{label, values}] }
 *      dami.status       single line text  in-development | coming-soon | available
 *      dami.color_hex    (on variants) single line text  e.g. "#581422"
 *  - The product's first collection handle becomes its DAMI collection.
 */
import type { Collection, Colorway, Product, SizeChart, Variant } from "./types";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || "2025-10";

export const shopifyEnabled = Boolean(domain && token);

async function storefront<T>(query: string, variables: Record<string, unknown> = {}, revalidate = 60): Promise<T> {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token as string,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Shopify Storefront API ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data as T;
}

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment P on Product {
    handle title description availableForSale
    collections(first: 1) { nodes { handle } }
    priceRange { minVariantPrice { amount currencyCode } }
    images(first: 20) { nodes { url altText width height } }
    options { name values }
    code: metafield(namespace: "dami", key: "code") { value }
    subtitle: metafield(namespace: "dami", key: "subtitle") { value }
    highlights: metafield(namespace: "dami", key: "highlights") { value }
    sizeChart: metafield(namespace: "dami", key: "size_chart") { value }
    status: metafield(namespace: "dami", key: "status") { value }
    variants(first: 100) {
      nodes {
        id availableForSale
        price { amount currencyCode }
        image { url altText width height }
        selectedOptions { name value }
        hex: metafield(namespace: "dami", key: "color_hex") { value }
      }
    }
  }
`;

type SImage = { url: string; altText: string | null; width: number; height: number };
type SProduct = {
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  collections: { nodes: { handle: string }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { nodes: SImage[] };
  options: { name: string; values: string[] }[];
  code: { value: string } | null;
  subtitle: { value: string } | null;
  highlights: { value: string } | null;
  sizeChart: { value: string } | null;
  status: { value: string } | null;
  variants: {
    nodes: {
      id: string;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      image: SImage | null;
      selectedOptions: { name: string; value: string }[];
      hex: { value: string } | null;
    }[];
  };
};

const isColour = (n: string) => /^colou?r$/i.test(n);
const isSize = (n: string) => /^size$/i.test(n);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

function safeJson<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function mapProduct(p: SProduct): Product {
  const colourOpt = p.options.find((o) => isColour(o.name));
  const sizeOpt = p.options.find((o) => isSize(o.name));
  const colourNames = colourOpt?.values ?? ["Default"];
  const shared = p.images.nodes.map((i, n) => ({ src: i.url, alt: i.altText || p.title, view: `View ${n + 1}`, width: i.width, height: i.height }));

  const colorways: Colorway[] = colourNames.map((name) => {
    const vs = p.variants.nodes.filter((v) => !colourOpt || v.selectedOptions.some((o) => isColour(o.name) && o.value === name));
    const own = vs.find((v) => v.image)?.image;
    const images = own
      ? [{ src: own.url, alt: own.altText || `${p.title} — ${name}`, view: "Front", width: own.width, height: own.height }, ...shared.filter((s) => s.src !== own.url)]
      : shared;
    return {
      id: slug(name),
      name,
      hex: vs.find((v) => v.hex)?.hex?.value || "#393838",
      status: "approved",
      images,
    };
  });

  const variants: Variant[] = p.variants.nodes.map((v) => {
    const c = v.selectedOptions.find((o) => isColour(o.name))?.value ?? "Default";
    const s = v.selectedOptions.find((o) => isSize(o.name))?.value ?? "One size";
    return { id: v.id, colorwayId: slug(c), size: s, availableForSale: v.availableForSale, price: v.price };
  });

  const status = (p.status?.value as Product["status"]) || (p.availableForSale ? "available" : "sold-out");

  return {
    handle: p.handle,
    code: p.code?.value ?? "",
    title: p.title,
    subtitle: p.subtitle?.value ?? "",
    collection: p.collections.nodes[0]?.handle ?? "",
    description: p.description,
    status,
    price: p.priceRange.minVariantPrice,
    sizes: sizeOpt?.values ?? ["One size"],
    colorways,
    variants,
    highlights: safeJson<string[]>(p.highlights?.value, []),
    sizeChart: safeJson<SizeChart | null>(p.sizeChart?.value, null),
    conceptImagery: false,
  };
}

export async function shopifyProducts(): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: SProduct[] } }>(
    `${PRODUCT_FIELDS} query { products(first: 100, sortKey: CREATED_AT) { nodes { ...P } } }`,
  );
  return data.products.nodes.map(mapProduct);
}

export async function shopifyCollections(): Promise<Collection[]> {
  const data = await storefront<{
    collections: { nodes: { handle: string; title: string; description: string; image: SImage | null; kicker: { value: string } | null; tagline: { value: string } | null }[] };
  }>(`query { collections(first: 20) { nodes {
      handle title description image { url altText width height }
      kicker: metafield(namespace: "dami", key: "kicker") { value }
      tagline: metafield(namespace: "dami", key: "tagline") { value }
  } } }`);
  return data.collections.nodes
    .filter((c) => c.handle !== "frontpage" && c.handle !== "all")
    .map((c, i) => ({
      slug: c.handle,
      name: c.title,
      kicker: c.kicker?.value ?? `Collection ${String(i + 1).padStart(2, "0")}`,
      tagline: c.tagline?.value ?? "",
      description: c.description,
      image: c.image?.url ?? "/images/products/cfm-k01-board.jpg",
      imageAlt: c.image?.altText ?? c.title,
      tone: (["bone", "bordeaux", "charcoal", "black"] as const)[i % 4],
    }));
}

/** Creates a Shopify cart and returns its hosted, secure checkout URL. */
export async function shopifyCheckout(lines: { variantId: string; quantity: number }[]): Promise<string> {
  const data = await storefront<{
    cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(
    `mutation($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } } }`,
    { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    0,
  );
  if (!data.cartCreate.cart) throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; ") || "Cart could not be created");
  return data.cartCreate.cart.checkoutUrl;
}
