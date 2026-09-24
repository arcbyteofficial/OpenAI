"use client";

import { useEffect, useRef, useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import Button, { type ButtonVariant } from "./Button";

// #6265 — preset for content-heavy modals: caps height on the OUTERMOST dialog
// wrapper only (single scroll owner) and keeps the inner body plain (no
// independent max-h/overflow), avoiding a double height cap that clips content.
export const TALL_MODAL_PROPS = {
  className: "max-h-[90vh] overflow-y-auto",
  bodyClassName: "p-5",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
  compactHeader?: boolean;
  maxWidth?: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: React.ReactNode;
  message: React.ReactNode;
  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  showCloseButton = true,
  className,
  bodyClassName,
  compactHeader = false,
}: ModalProps) {
  const t = useTranslations("common");
  const titleId = useId();
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Return keyboard users to the control that opened the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    previouslyFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;

    return () => {
      const previouslyFocused = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    // Focus first focusable element
    const firstFocusable = dialog.querySelector(focusableSelector);
    const focusTimer = firstFocusable
      ? window.setTimeout(() => firstFocusable.focus(), 50)
      : undefined;

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      const focusable = [...dialog.querySelectorAll(focusableSelector)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleTab);
    return () => {
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      dialog.removeEventListener("keydown", handleTab);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative w-full bg-surface",
          "border border-border",
          "rounded-card shadow-[var(--shadow-elevated)]",
          "animate-in fade-in zoom-in-95 duration-200",
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 border-b border-border",
              compactHeader ? "px-4 py-2.5" : "px-5 py-4"
            )}
          >
            <div className="flex items-center min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className={cn(
                    "font-semibold tracking-tight text-text-main truncate min-w-0",
                    compactHeader ? "text-sm" : "text-[15px]"
                  )}
                >
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label={t("close")}
                className="p-1.5 rounded-control text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={bodyClassName ?? "p-5 max-h-[calc(80vh-140px)] overflow-y-auto"}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirm Modal helper
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const t = useTranslations("common");
  const resolvedTitle = title ?? t("confirmTitle");
  const resolvedConfirmText = confirmText ?? t("confirmAction");
  const resolvedCancelText = cancelText ?? t("cancel");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {resolvedCancelText}
          </Button>
          <Button variant={variant} onClick={() => void onConfirm()} loading={loading}>
            {resolvedConfirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-muted">{message}</p>
    </Modal>
  );
}
