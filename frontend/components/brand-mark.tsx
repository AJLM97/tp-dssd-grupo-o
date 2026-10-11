export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark" aria-label="Rentar">
      <span className="brand-mark-symbol" aria-hidden="true">R</span>
      {!compact ? <span className="brand-mark-name">rentar<span>.</span></span> : null}
    </span>
  );
}