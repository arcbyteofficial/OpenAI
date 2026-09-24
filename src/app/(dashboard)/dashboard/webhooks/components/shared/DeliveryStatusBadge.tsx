"use client";

interface DeliveryStatusBadgeProps {
  status: string;
  httpStatus?: number | null;
}

export function DeliveryStatusBadge({ status, httpStatus }: DeliveryStatusBadgeProps) {
  const isSuccess = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${
        isSuccess
          ? "border-success/30 bg-success/10 text-success"
          : "border-error/30 bg-error/10 text-error"
      }`}
    >
      <span className="material-symbols-outlined text-[12px]">
        {isSuccess ? "check_circle" : "error"}
      </span>
      {httpStatus ? httpStatus : isSuccess ? "OK" : "ERR"}
    </span>
  );
}
