export function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[11px] uppercase tracking-wider text-text-subtle font-medium truncate">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold tabular-nums tracking-tight leading-tight ${accent || "text-text-main"}`}
      >
        {value}
      </div>
    </div>
  );
}

export function SyncMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-text-subtle font-medium truncate">
        {label}
      </p>
      <p className="text-[11px] font-medium text-text-main mt-0.5 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className="font-medium">{label}:</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-surface border border-border-strong rounded-control px-2 py-1.5 text-xs text-text-main cursor-pointer focus:outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
