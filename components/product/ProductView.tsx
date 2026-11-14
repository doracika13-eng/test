"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductDetails } from "@/lib/commerce/types";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice, statusLabel } from "@/lib/format";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { SizeGuide } from "./SizeGuide";

/* ───────────── Gallery ───────────── */
function ZoomImage({ src, alt, priority, sizes }: { src: string; alt: string; priority?: boolean; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current!.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden bg-bone"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={move}
      data-cursor={zoom ? "" : "Zoom"}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-[var(--ease-silk)] [transform-origin:var(--zx,50%)_var(--zy,50%)]"
        style={{ transform: zoom ? "scale(1.9)" : "scale(1)" }}
      />
    </div>
  );
}

function Gallery({ images, title }: { images: Product["colorways"][number]["images"]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
    track.current?.scrollTo({ left: 0 });
  }, [images]);
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div>
      {/* Mobile / tablet: swipe */}
      <div className="relative lg:hidden">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label={`${title} gallery`} role="region" tabIndex={0}>
          {images.map((im, i) => (
            <figure key={im.src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-bone">
              <Image src={im.src} alt={im.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </figure>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-between px-4">
          <span className="eyebrow bg-paper/85 px-2 py-1.5 !text-[0.55rem]">{images[index]?.view}</span>
          <span className="eyebrow bg-paper/85 px-2 py-1.5 !text-[0.55rem] tabular-nums">
            {index + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Desktop: editorial stack with hover zoom */}
      <div className="hidden grid-cols-2 gap-3 lg:grid">
        {images.map((im, i) => (
          <figure key={im.src} className={i === 0 || i % 3 === 0 ? "col-span-2" : ""}>
            <div className={`relative ${i === 0 || i % 3 === 0 ? "aspect-[4/5]" : "aspect-square"}`}>
              <ZoomImage src={im.src} alt={im.alt} priority={i === 0} sizes={i === 0 || i % 3 === 0 ? "55vw" : "28vw"} />
            </div>
            <figcaption className="eyebrow mt-2 !text-[0.55rem] text-ink/45">{im.view}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Accordion ───────────── */
function Accordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t border-ink/15">
      {items.map(([title, body], i) => {
        const id = `acc-${i}`;
        const isOpen = open === i;
        return (
          <div key={title} className="border-b border-ink/15">
            <h3>
              <button className="caps flex w-full items-center justify-between py-5 text-left" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? null : i)}>
                {title}
                <span className={`relative h-3 w-3 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`} aria-hidden>
                  <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                  <span className="absolute left-1/2 top-0 h-full w-px bg-current" />
                </span>
              </button>
            </h3>
            <div id={id} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-silk)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="pb-6 pr-6 text-sm leading-relaxed text-ink/70">{body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Main view ───────────── */
export function ProductView({ product, details, live }: { product: Product; details: ProductDetails; live: boolean }) {
  const params = useSearchParams();
  const initial = product.colorways.find((c) => c.id === params.get("colour"))?.id ?? product.colorways[0]?.id;
  const [colourId, setColourId] = useState(initial);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  const colour = product.colorways.find((c) => c.id === colourId) ?? product.colorways[0];
  const fallbackColour = product.colorways.find((c) => c.images.length) ?? product.colorways[0];
  const images = colour.images.length ? colour.images : fallbackColour.images;
  const showingOther = !colour.images.length;

  const variant = useMemo(() => product.variants.find((v) => v.colorwayId === colour.id && v.size === size) ?? null, [product.variants, colour.id, size]);
  const sizeAvailable = (s: string) => {
    const v = product.variants.find((x) => x.colorwayId === colour.id && x.size === s);
    return live ? !!v?.availableForSale : true;
  };
  const price = variant?.price ?? product.price;
  const canBuy = live ? !!variant?.availableForSale : true;

  const onAdd = () => {
    if (!size) return setError("Please select a size.");
    if (!variant) return setError("This combination is not available.");
    if (!canBuy) return setError("This size is currently unavailable.");
    setError(null);
    add(
      {
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        colorway: colour.name,
        size: variant.size,
        image: images[0]?.src ?? "",
        price: variant.price,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const accordion: [string, string][] = [
    ["Materials", details.materials],
    ["Fit", details.fit],
    ["Construction", details.construction],
    ["Care", details.care],
    ["Shipping", details.shipping],
    ["Returns", details.returns],
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="-mx-[var(--gutter)] lg:col-span-7 lg:mx-0">
        <Gallery images={images} title={product.title} />
        {product.conceptImagery && (
          <div className="gutter mt-3 lg:px-0">
            <ConceptNote />
          </div>
        )}
      </div>

      <div className="lg:col-span-5 lg:col-start-8">
        <div className="lg:sticky lg:top-24">
          <p className="eyebrow flex items-center gap-3 text-ink/50">
            <span>{product.code}</span>
            <span className="h-px w-6 bg-current opacity-40" />
            <span>{statusLabel[product.status]}</span>
          </p>
          <h1 className="display mt-5 text-[clamp(2.8rem,5vw,4.8rem)]">{product.title}</h1>
          <p className="editorial mt-3 text-xl italic text-ink/60">{product.subtitle}</p>
          <p className="mt-6 text-base">{formatPrice(price)}</p>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/75">{product.description}</p>

          {/* Colour */}
          <fieldset className="mt-10">
            <legend className="caps mb-4 flex w-full justify-between">
              <span>Colour</span>
              <span className="normal-case tracking-normal text-ink/60">{colour.name}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.colorways.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColourId(c.id)}
                  aria-pressed={c.id === colour.id}
                  aria-label={`${c.name}${c.status === "under-review" ? " — colourway under review" : ""}`}
                  className={`flex h-11 items-center gap-2 border px-3 text-xs transition-colors ${c.id === colour.id ? "border-ink" : "border-ink/15 hover:border-ink/40"}`}
                >
                  <span className="h-4 w-4 rounded-full border border-ink/20" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
            {colour.status === "under-review" && (
              <p className="mt-3 text-xs text-ink/55">
                This colourway is under review and not yet approved.{showingOther ? ` Imagery shown in ${fallbackColour.name}.` : ""}
              </p>
            )}
          </fieldset>

          {/* Size */}
          <fieldset className="mt-8">
            <legend className="caps mb-4 flex w-full justify-between">
              <span>Size</span>
              <button type="button" className="link-u normal-case tracking-normal text-ink/60" onClick={() => setGuide(true)}>
                Size guide
              </button>
            </legend>
            <div className="grid grid-cols-6 gap-1.5">
              {product.sizes.map((s) => {
                const ok = sizeAvailable(s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setError(null);
                    }}
                    disabled={!ok}
                    aria-pressed={size === s}
                    className={`h-12 border text-xs transition-colors disabled:line-through disabled:opacity-35 ${size === s ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink/50"}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Quantity + add */}
          <div className="mt-8 flex gap-3">
            <div className="flex items-center border border-ink/20" role="group" aria-label="Quantity">
              <button className="grid h-14 w-11 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                −
              </button>
              <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button className="grid h-14 w-11 place-items-center" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">
                +
              </button>
            </div>
            <button className="btn btn-solid h-14 flex-1" onClick={onAdd} data-cursor="Add">
              <span className="btn-label">{added ? "Added to bag" : "Add to bag"}</span>
            </button>
          </div>
          <p role="alert" className="mt-3 min-h-5 text-xs text-bordeaux">
            {error}
          </p>
          {!live && <p className="text-xs leading-relaxed text-ink/55">Preview — DAMI is not taking orders yet. Pieces added to your bag are saved on this device until checkout opens at launch.</p>}

          {product.highlights.length > 0 && (
            <ul className="mt-10 space-y-2 border-t border-ink/15 pt-6">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-ink/75">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bordeaux" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <Accordion items={accordion} />
          </div>
        </div>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} product={product} fit={details.fit} />
    </div>
  );
}
