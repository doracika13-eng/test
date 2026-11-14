import { NextResponse } from "next/server";
import { shopifyCheckout, shopifyEnabled } from "@/lib/commerce/shopify";

/** Creates a Shopify cart and returns its hosted checkout URL. Payment never touches this server. */
export async function POST(req: Request) {
  if (!shopifyEnabled) {
    return NextResponse.json(
      { message: "Orders are not open yet." },
      { status: 503 },
    );
  }
  let lines: { variantId: string; quantity: number }[] = [];
  try {
    const body = await req.json();
    lines = (Array.isArray(body.lines) ? body.lines : [])
      .filter((l: { variantId?: unknown; quantity?: unknown }) => typeof l.variantId === "string" && l.variantId.startsWith("gid://shopify/ProductVariant/"))
      .map((l: { variantId: string; quantity: number }) => ({ variantId: l.variantId, quantity: Math.max(1, Math.min(10, Math.floor(Number(l.quantity) || 1))) }));
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (!lines.length) return NextResponse.json({ message: "Your bag has no purchasable items. Please re-add pieces from the shop." }, { status: 422 });
  try {
    const checkoutUrl = await shopifyCheckout(lines);
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ message: "Checkout is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
