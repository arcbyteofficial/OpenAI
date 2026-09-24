import { BRAND } from "@/shared/constants/appConfig";
import { withBasePath } from "@/shared/utils/basePath";
import { cn } from "@/shared/utils/cn";

interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Accessible name. Leave empty when a visible wordmark sits next to the mark. */
  alt?: string;
}

/**
 * The ArcByte mark. Both theme variants are rendered and CSS (`dark:`) shows one, so the
 * server render and first paint already match the active theme — no hydration flash.
 */
export function BrandMark({ size = 28, className, alt = "" }: BrandMarkProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset from the ArcByte CDN; images are unoptimized (next.config), so next/image adds nothing here */}
      <img
        src={withBasePath(BRAND.logoLight)}
        alt={alt}
        width={size}
        height={size}
        draggable={false}
        className="size-full object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- dark-theme variant of the same static asset */}
      <img
        src={withBasePath(BRAND.logoDark)}
        alt={alt}
        width={size}
        height={size}
        draggable={false}
        className="hidden size-full object-contain dark:block"
      />
    </span>
  );
}

/** "ArcByte | Open AI" with a quiet separator; assistive tech reads "ArcByte Open AI". */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("whitespace-nowrap font-semibold tracking-tight text-text-main", className)}
    >
      {BRAND.company}{" "}
      <span aria-hidden="true" className="font-normal text-text-subtle">
        |
      </span>{" "}
      {BRAND.product}
    </span>
  );
}
