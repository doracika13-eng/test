"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="gutter mx-auto flex min-h-[80svh] max-w-[120rem] flex-col justify-center pt-32">
      <p className="eyebrow mb-4 text-ink/50">Error</p>
      <h1 className="display text-[clamp(3rem,9vw,8rem)]">Something slipped.</h1>
      <p className="mt-6 max-w-sm text-sm text-ink/70">Please try again in a moment.</p>
      <button onClick={reset} className="btn btn-dark mt-10 self-start">
        <span className="btn-label">Try again</span>
      </button>
    </section>
  );
}
