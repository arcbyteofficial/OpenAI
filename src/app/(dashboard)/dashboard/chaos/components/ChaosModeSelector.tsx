"use client";

/**
 * Parallel / Collaborative mode selector for the Chaos Mode config page.
 * Extracted out of ChaosConfigPageClient.tsx to keep the page component under
 * the complexity/size ratchet (config/quality/complexity-baseline.json).
 */
export function ChaosModeSelector({
  mode,
  onChange,
  label,
  parallelLabel,
  parallelDesc,
  collaborativeLabel,
  collaborativeDesc,
}: {
  mode: "parallel" | "collaborative";
  onChange: (mode: "parallel" | "collaborative") => void;
  label: string;
  parallelLabel: string;
  parallelDesc: string;
  collaborativeLabel: string;
  collaborativeDesc: string;
}) {
  return (
    <div className="p-4 rounded-card border border-border bg-surface">
      <p className="text-sm font-medium text-text-main mb-2">{label}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("parallel")}
          className={`flex-1 px-3 py-2 rounded-control text-xs font-medium transition-colors ${
            mode === "parallel"
              ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
              : "bg-bg-subtle text-text-muted ring-1 ring-inset ring-transparent hover:text-text-main hover:ring-border-strong"
          }`}
        >
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">
            call_split
          </span>
          {parallelLabel}
          <p className="text-[10px] opacity-70 mt-0.5">{parallelDesc}</p>
        </button>
        <button
          type="button"
          onClick={() => onChange("collaborative")}
          className={`flex-1 px-3 py-2 rounded-control text-xs font-medium transition-colors ${
            mode === "collaborative"
              ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
              : "bg-bg-subtle text-text-muted ring-1 ring-inset ring-transparent hover:text-text-main hover:ring-border-strong"
          }`}
        >
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">merge</span>
          {collaborativeLabel}
          <p className="text-[10px] opacity-70 mt-0.5">{collaborativeDesc}</p>
        </button>
      </div>
    </div>
  );
}
