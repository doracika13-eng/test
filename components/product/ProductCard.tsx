import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/commerce/types";
import { formatPrice, statusLabel } from "@/lib/format";

export function ProductCard({ product, priority = false, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", aspect = "aspect-[4/5]" }: { product: Product; priority?: boolean; sizes?: string; aspect?: string }) {
  const lead = product.colorways.find((c) => c.images.length) ?? product.colorways[0];
  const [a, b] = lead?.images ?? [];
  return (
    <Link href={`/shop/${product.handle}`} className="group block" data-cursor="View">
      <div className={`zoom-img relative ${aspect} overflow-hidden bg-bone`}>
        {a && <Image src={a.src} alt={a.alt} fill sizes={sizes} priority={priority} className="object-cover transition-opacity duration-700 group-hover:opacity-0" />}
        {b && <Image src={b.src} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />}
        <span className="eyebrow absolute left-3 top-3 bg-paper/85 px-2 py-1.5 !text-[0.55rem] text-ink backdrop-blur-sm">{statusLabel[product.status]}</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink/45">{product.code}</p>
          <h3 className="editorial mt-2 text-2xl leading-tight md:text-[1.7rem]">{product.title}</h3>
          <p className="mt-1 text-xs text-ink/55">{product.subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          <p className="text-xs text-ink/70">{formatPrice(product.price)}</p>
          <ul className="flex gap-1.5" aria-label={`${product.colorways.length} colourway${product.colorways.length > 1 ? "s" : ""}`}>
            {product.colorways.map((c) => (
              <li key={c.id} title={`${c.name}${c.status === "under-review" ? " (under review)" : ""}`} className={`h-2.5 w-2.5 rounded-full border border-ink/20 ${c.status === "under-review" ? "opacity-40" : ""}`} style={{ background: c.hex }}>
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}
