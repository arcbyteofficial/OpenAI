import { Card } from "@/shared/components";

export function MetricCard({
  label,
  value,
  subValue,
  color = "text-text-main",
  loading = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight tabular-nums mt-1 ${color}`}>
        {loading ? "…" : value}
      </p>
      {subValue ? <p className="text-xs text-text-muted mt-1">{subValue}</p> : null}
    </Card>
  );
}
