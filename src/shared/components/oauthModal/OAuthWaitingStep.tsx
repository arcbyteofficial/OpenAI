"use client";

import Button from "@/shared/components/Button";

type OAuthWaitingStepProps = {
  waitingLabel: string;
  completeAuthLabel: string;
  popupClosedHint: string;
  popupBlockedLabel: string;
  onManualInput: () => void;
};

/** Localhost popup-mode waiting panel while the OAuth popup completes. */
export default function OAuthWaitingStep({
  waitingLabel,
  completeAuthLabel,
  popupClosedHint,
  popupBlockedLabel,
  onManualInput,
}: OAuthWaitingStepProps) {
  return (
    <div className="text-center py-6">
      <div className="size-16 mx-auto mb-4 rounded-full bg-bg-subtle flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-text-muted animate-spin">
          progress_activity
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-text-main mb-2">{waitingLabel}</h3>
      <p className="text-sm text-text-muted mb-2">{completeAuthLabel}</p>
      <p className="text-xs text-text-subtle mb-4">{popupClosedHint}</p>
      <Button variant="ghost" onClick={onManualInput}>
        {popupBlockedLabel}
      </Button>
    </div>
  );
}
