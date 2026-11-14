"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Wordmark } from "@/components/ui/Wordmark";
import { SearchOverlay, type SearchItem } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";

export function Header({ searchIndex }: { searchIndex: SearchItem[] }) {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  // Pages whose first section is dark → header starts in light ink.
  const [inStory, setInStory] = useState(false);
  const overDark = pathname === "/" || pathname === "/about";
  // On the home page the header stays transparent while the pinned story is on screen.
  const solid = (scrolled && !inStory) || !overDark;

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const dark = Array.from(document.querySelectorAll<HTMLElement>("#story, [data-header-dark]")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 60 && r.bottom > 60;
      });
      setInStory(dark);
      setHidden(y > 400 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  const isActive = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);

  const tone = solid ? "text-ink" : "text-paper";

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,height] duration-700 ease-[var(--ease-couture)] ${
          hidden && !menu ? "-translate-y-full" : "translate-y-0"
        } ${solid ? "bg-paper/92 backdrop-blur-md" : "bg-transparent"} ${tone}`}
      >
        <div className={`gutter grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-700 ${scrolled ? "h-14" : "h-[var(--header-h)]"}`}>
          {/* Left */}
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            <Link href="/shop" className="caps link-u" aria-current={isActive("/shop")}>
              Shop
            </Link>
            <Link href="/collections" className="caps link-u" aria-current={isActive("/collections")}>
              Collections
            </Link>
          </nav>
          <button
            className="caps flex items-center gap-3 md:hidden"
            onClick={() => setMenu(true)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
          >
            <span className="flex w-6 flex-col gap-[5px]" aria-hidden>
              <span className="h-px w-full bg-current" />
              <span className="h-px w-2/3 bg-current" />
            </span>
            Menu
          </button>

          {/* Centre */}
          <Link href="/" aria-label="DAMI — home" className="justify-self-center">
            <Wordmark className={`transition-[font-size] duration-700 ${scrolled ? "text-[1.35rem]" : "text-[1.6rem] md:text-[1.9rem]"}`} />
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-5 md:gap-8">
            <Link href="/about" className="caps link-u hidden md:inline" aria-current={isActive("/about")}>
              About
            </Link>
            <button className="caps link-u hidden sm:inline" onClick={() => setSearch(true)} aria-haspopup="dialog">
              Search
            </button>
            <button className="sm:hidden" onClick={() => setSearch(true)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" />
                <path d="M12 12l5 5" stroke="currentColor" />
              </svg>
            </button>
            <button className="caps link-u" onClick={() => setOpen(true)} aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}>
              Bag<span className="tabular-nums">&nbsp;({count})</span>
            </button>
          </div>
        </div>
        <div className={`hairline transition-opacity duration-700 ${solid ? "opacity-15" : "opacity-0"}`} />
      </header>

      <SearchOverlay open={search} onClose={() => setSearch(false)} items={searchIndex} />
      <MobileMenu open={menu} onClose={() => setMenu(false)} onSearch={() => { setMenu(false); setSearch(true); }} />
    </>
  );
}
