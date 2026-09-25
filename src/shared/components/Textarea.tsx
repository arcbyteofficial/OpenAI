"use client";

import { cn } from "@/shared/utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * Textarea — token-driven multiline input mirroring the Input primitive (same border,
 * focus ring and control radius). Replaces ad-hoc raw `<textarea>` styling at call sites.
 */
export default function Textarea({ className, error = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full py-1.5 px-3 text-text-main",
        "bg-surface border border-border-strong rounded-control",
        "placeholder:text-text-subtle hover:border-text-subtle/50",
        "focus:border-focus focus:ring-[3px] focus:ring-focus/15 focus:outline-none",
        "transition-[border-color,box-shadow] duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        "text-[16px] sm:text-[13px]",
        error ? "border-error hover:border-error focus:border-error focus:ring-error/15" : "",
        className
      )}
      {...props}
    />
  );
}
