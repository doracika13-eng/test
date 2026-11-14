import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter mx-auto flex min-h-[80svh] max-w-[120rem] flex-col justify-center pt-32">
      <p className="eyebrow mb-4 text-ink/50">404</p>
      <h1 className="display text-[clamp(3.6rem,11vw,10rem)]">
        Page not <em className="editorial italic text-bordeaux">found.</em>
      </h1>
      <Link href="/" className="btn btn-dark mt-10 self-start">
        <span className="btn-label">Home</span>
      </Link>
    </section>
  );
}
