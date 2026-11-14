/** Renders each line inside a mask so Motion can slide it up (data-reveal="lines"). */
export function SplitLines({ lines, className = "", as: Tag = "h2", delay }: { lines: React.ReactNode[]; className?: string; as?: "h1" | "h2" | "h3" | "p"; delay?: number }) {
  return (
    <Tag className={className} data-reveal="lines" data-delay={delay}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
