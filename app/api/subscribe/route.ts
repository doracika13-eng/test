import { NextResponse } from "next/server";

/**
 * Early-access sign-up. Forwards to the configured email provider.
 * Without a provider, responds 503 — no address is stored and no success is faked.
 */
export async function POST(req: Request) {
  let body: { email?: string; consent?: boolean; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (body.company) return NextResponse.json({ message: "Thank you." }); // honeypot: silently drop bots
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return NextResponse.json({ message: "Please enter a valid email address." }, { status: 422 });
  if (body.consent !== true) return NextResponse.json({ message: "Consent is required." }, { status: 422 });

  const provider = process.env.NEWSLETTER_PROVIDER;
  try {
    if (provider === "klaviyo" && process.env.KLAVIYO_PRIVATE_API_KEY && process.env.KLAVIYO_LIST_ID) {
      const res = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs", {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
          revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              profiles: { data: [{ type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] },
              custom_source: "dami.website.early-access",
            },
            relationships: { list: { data: { type: "list", id: process.env.KLAVIYO_LIST_ID } } },
          },
        }),
      });
      if (!res.ok) throw new Error(`Klaviyo ${res.status}`);
      return NextResponse.json({ message: "Thank you — please check your inbox to confirm your subscription." });
    }

    if (provider === "mailchimp" && process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX && process.env.MAILCHIMP_AUDIENCE_ID) {
      const res = await fetch(`https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members`, {
        method: "POST",
        headers: { Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: email, status: "pending", tags: ["early-access"] }), // double opt-in
      });
      if (!res.ok && res.status !== 400) throw new Error(`Mailchimp ${res.status}`);
      return NextResponse.json({ message: "Thank you — please check your inbox to confirm your subscription." });
    }

    if (provider === "shopify" && process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      // Storefront API cannot create marketing-only customers without a password; use a Shopify Form/Klaviyo instead.
      return NextResponse.json({ message: "Sign-up via Shopify requires a Shopify Forms embed — see README." }, { status: 503 });
    }
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ message: "We could not register your address right now. Please try again later." }, { status: 502 });
  }

  return NextResponse.json({ message: "Early-access sign-up opens soon — our mailing list is not connected yet. Follow us on Instagram for news." }, { status: 503 });
}
