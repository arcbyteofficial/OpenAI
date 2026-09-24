"use client";

interface PayloadPreviewProps {
  payload: Record<string, unknown> | null;
  label?: string;
}

export function PayloadPreview({ payload, label }: PayloadPreviewProps) {
  if (!payload) return null;
  return (
    <div className="space-y-1">
      {label && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-subtle">{label}</p>
      )}
      <pre className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3 font-mono text-[12px] text-text-main">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
