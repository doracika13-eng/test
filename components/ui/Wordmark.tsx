/**
 * TEMPORARY TYPOGRAPHIC PLACEHOLDER — not the official DAMI logo.
 * The official logo asset has not been supplied. To replace it, drop the
 * final file at /public/brand/dami-logo.svg and render it here instead.
 */
type Props = { className?: string; as?: "span" | "div"; title?: string };

export function Wordmark({ className = "", as: Tag = "span", title = "DAMI" }: Props) {
  return (
    <Tag className={`display inline-block select-none tracking-[0.18em] ${className}`} aria-label={title}>
      <span aria-hidden="true">DAMI</span>
    </Tag>
  );
}
