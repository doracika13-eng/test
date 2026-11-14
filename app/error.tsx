"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="gutter mx-auto flex min-h-[80svh] max-w-[120rem] flex-col justify-center pt-32">
      <p className="eyebrow mb-4 text-ink/50">Error</p>
      <h1 className="display text-[clamp(3rem,9vw,8rem)]">Something went wrong.</h1>
      <button onClick={reset} className="btn btn-dark mt-10 self-start">
        <span className="btn-label">Try again</span>
      </button>
    </section>
  );
}
