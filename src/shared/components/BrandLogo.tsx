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
 * The ArcByte mark. Each theme variant is a CSS background image and `dark:` shows one, so:
 * - the server render and first paint already match the active theme (no hydration flash);
 * - only the visible variant is downloaded (hidden elements don't fetch backgrounds);
 * - if the CDN is unreachable the slot stays empty instead of showing a broken-image icon.
 */
export function BrandMark({ size = 28, className, alt = "" }: BrandMarkProps) {
  const a11y = alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true as const };
  const variant = "absolute inset-0 bg-contain bg-center bg-no-repeat";
  return (
    <span
      {...a11y}
      className={cn("relative inline-flex shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cn(variant, "dark:hidden")}
        style={{ backgroundImage: `url("${withBasePath(BRAND.logoLight)}")` }}
      />
      <span
        className={cn(variant, "hidden dark:block")}
        style={{ backgroundImage: `url("${withBasePath(BRAND.logoDark)}")` }}
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
