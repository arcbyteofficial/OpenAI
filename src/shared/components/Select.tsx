"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  selectClassName?: string;
  /** Keep the placeholder selectable after a real value is chosen. */
  placeholderDisabled?: boolean;
}

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className,
  selectClassName,
  placeholderDisabled = true,
  id: externalId,
  children,
  ...props
}: SelectProps) {
  const t = useTranslations("common");
  const generatedId = useId();
  const selectId = externalId || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint && !error ? `${selectId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-text-main">
          {label}
          {required && (
            <span className="text-error ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full h-8 px-3 pe-10 text-text-main",
            "bg-surface border border-border-strong rounded-control appearance-none cursor-pointer hover:border-text-subtle/50",
            "focus:border-focus focus:ring-[3px] focus:ring-focus/15 focus:outline-none",
            "transition-[border-color,box-shadow] duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            "text-[16px] sm:text-[13px]",
            error ? "border-error hover:border-error focus:border-error focus:ring-error/15" : "",
            selectClassName
          )}
          {...props}
        >
          {!children && (placeholder ?? t("selectOption")) && (
            <option value="" disabled={placeholderDisabled} className="bg-surface text-text-muted">
              {placeholder ?? t("selectOption")}
            </option>
          )}
          {!children &&
            options.map((option) => (
              <option key={option.value} value={option.value} className="bg-surface text-text-main">
                {option.label}
              </option>
            ))}
          {children}
        </select>
        <div
          className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-text-subtle"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-error flex items-center gap-1" role="alert">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            error
          </span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
