# DAMI — Website

Brand experience + commerce front-end for DAMI (Aix-en-Provence).
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Three.js · GSAP.

## Run
```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
npm run build && npm start
```

## Structure
- `app/` — pages: home, `/shop`, `/shop/[handle]`, `/collections`, `/collections/[slug]`, `/about`, `/contact`, `/legal/*`, API routes, sitemap, robots, OG image.
- `components/hero/hoodieScene.ts` — procedural 3D hoodie study (placeholder form, **not** a DAMI product model). Falls back to an image on low-end devices / no WebGL. Replace with a GLB via GLTFLoader when a real model exists.
- `content/catalog.json` — local catalogue (preview mode). Edit text, colourways and images here without touching components.
- `lib/commerce/` — data layer. Uses Shopify Storefront API automatically when `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are set; otherwise the local catalogue.
- `public/images/products/` — crops of the AI concept boards from the Sample Order Brief / Tech Pack (`npm run images` regenerates them from `references/`).

## What needs configuration
| Feature | Status without config | To enable |
|---|---|---|
| Products / prices / inventory | Local catalogue, prices "to be announced" | Shopify Storefront token (see `lib/commerce/shopify.ts` for metafield conventions) |
| Checkout | Returns "checkout opens at launch" | Shopify — redirects to Shopify hosted checkout |
| Early access | Reports sign-up not open yet (nothing stored or faked) | `NEWSLETTER_PROVIDER` = klaviyo or mailchimp + keys |
| Instagram feed | Link only | `INSTAGRAM_ACCESS_TOKEN` |
| Logo | Typographic placeholder (`components/ui/Wordmark.tsx`) | Supply the official logo file |
| Legal pages | Drafts | Review by a qualified adviser |

## Content rules followed
- All imagery is labelled as AI concept reference — replace with approved photography.
- Fabric/construction figures are shown as **development targets**, not product claims.
- Factory measurement targets are **not** published as customer size charts; the size guide supports per-product charts (`sizeChart`) once approved.
- No prices, stock, orders or subscriptions are invented.
