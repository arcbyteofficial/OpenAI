"use client";

interface DnsStatusBadgeProps {
  enabled: boolean;
}

export function DnsStatusBadge({ enabled }: DnsStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        enabled ? "bg-success/10 text-success" : "bg-bg-subtle text-text-muted"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-success" : "bg-text-subtle"}`} />
      {enabled ? "DNS on" : "DNS off"}
    </span>
  );
}
