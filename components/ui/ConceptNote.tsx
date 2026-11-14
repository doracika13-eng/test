type Props = { className?: string; tone?: "light" | "dark"; children?: React.ReactNode };

/** Small, honest label shown wherever AI concept references are used. */
export function ConceptNote({ className = "", tone = "dark", children }: Props) {
  return (
    <span
      className={`eyebrow inline-flex items-center gap-2 !text-[0.58rem] !tracking-[0.24em] ${
        tone === "light" ? "text-paper/70" : "text-ink/55"
      } ${className}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children ?? "AI concept reference — not final product"}
    </span>
  );
}
