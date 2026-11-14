"use client";

import Link from "next/link";
import { useId, useState } from "react";

type State = { status: "idle" | "loading" | "success" | "error" | "unavailable"; message?: string };

export function EarlyAccessForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(""); // honeypot
  const [state, setState] = useState<State>({ status: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setState({ status: "error", message: "Please enter a valid email address." });
    if (!consent) return setState({ status: "error", message: "Please confirm you agree to receive DAMI emails." });
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, company: hp }),
      });
      const data = (await res.json()) as { message?: string };
      if (res.ok) setState({ status: "success", message: data.message });
      else if (res.status === 503) setState({ status: "unavailable", message: data.message });
      else setState({ status: "error", message: data.message || "Something went wrong. Please try again." });
    } catch {
      setState({ status: "error", message: "Network error — please try again." });
    }
  };

  const light = tone === "light";
  if (state.status === "success")
    return (
      <p role="status" className="editorial text-3xl md:text-4xl">
        {state.message || "Thank you — please check your inbox to confirm."}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className={`flex flex-col gap-4 border-b pb-3 sm:flex-row sm:items-end ${light ? "border-paper/40" : "border-ink/40"}`}>
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`editorial min-w-0 flex-1 bg-transparent py-2 text-2xl outline-none md:text-3xl ${light ? "placeholder:text-paper/35" : "placeholder:text-ink/30"}`}
        />
        <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden name="company" />
        <button type="submit" className={`btn ${light ? "btn-light" : "btn-dark"} shrink-0`} disabled={state.status === "loading"}>
          <span className="btn-label">{state.status === "loading" ? "Sending…" : "Request access"}</span>
        </button>
      </div>
      <label className={`mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed ${light ? "text-paper/65" : "text-ink/60"}`}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-bordeaux" required />
        <span>
          I agree to receive emails from DAMI about launches and early access. I can unsubscribe at any time. See our{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <p role="status" aria-live="polite" className={`mt-4 min-h-5 text-xs ${state.status === "error" ? "text-bordeaux" : light ? "text-champagne" : "text-ink/70"} ${light && state.status === "error" ? "!text-champagne" : ""}`}>
        {state.status === "error" || state.status === "unavailable" ? state.message : ""}
      </p>
    </form>
  );
}
