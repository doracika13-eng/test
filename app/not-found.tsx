import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter mx-auto flex min-h-[80svh] max-w-[120rem] flex-col justify-center pt-32">
      <p className="eyebrow mb-4 text-ink/50">404</p>
      <h1 className="display text-[clamp(3.6rem,11vw,10rem)]">
        Not <em className="editorial italic text-bordeaux">here.</em>
      </h1>
      <p className="mt-6 max-w-sm text-sm text-ink/70">The page you are looking for has moved, or never existed.</p>
      <Link href="/" className="btn btn-dark mt-10 self-start">
        <span className="btn-label">Return home</span>
      </Link>
    </section>
  );
}
