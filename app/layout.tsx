import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Cursor } from "@/components/layout/Cursor";
import { Motion } from "@/components/layout/Motion";
import { commerceLive, getProducts } from "@/lib/commerce";
import { site } from "@/lib/site";

const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", display: "swap", weight: ["400", "500"], style: ["normal", "italic"] });
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument", display: "swap", weight: "400", style: ["normal", "italic"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "DAMI — Aix-en-Provence", template: "%s — DAMI" },
  description: site.description,
  applicationName: "DAMI",
  openGraph: {
    type: "website",
    siteName: "DAMI",
    title: "DAMI — Beyond the ordinary",
    description: site.description,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();
  const searchIndex = products.map((p) => ({
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle,
    code: p.code,
    collection: p.collection,
    image: p.colorways.find((c) => c.images.length)?.images[0]?.src ?? "/images/products/cfm-k01-front.jpg",
    colours: p.colorways.map((c) => c.name),
  }));

  return (
    <html lang="en" className={`${bodoni.variable} ${instrument.variable} ${hanken.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available so reveal states apply; content stays visible without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <CartProvider>
          <Header searchIndex={searchIndex} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer live={commerceLive} />
        </CartProvider>
        <Cursor />
        <Motion />
      </body>
    </html>
  );
}
