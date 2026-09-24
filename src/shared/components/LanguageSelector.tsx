"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { useLocale } from "next-intl";
import { persistLocale } from "@/shared/lib/persistLocale";

function CountryFlag({ emoji, alt }: { emoji: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!emoji) return null;

  const chars = [...emoji];
  const codePoints = chars.map((c) => c.codePointAt(0) || 0);
  const isRegional = codePoints.every((cp) => cp >= 127462 && cp <= 127487);

  if (!isRegional || codePoints.length !== 2 || error) {
    return <span className="text-base leading-none shrink-0">{emoji}</span>;
  }

  const countryCode = codePoints.map((cp) => String.fromCharCode(cp - 127462 + 97)).join("");

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      className="w-4.5 h-3 object-cover rounded-xs shrink-0 border border-border"
      alt={alt}
      onError={() => setError(true)}
    />
  );
}

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (code: Locale) => {
    if (code === locale) {
      setOpen(false);
      return;
    }

    persistLocale(code);
    setOpen(false);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2 rounded-control text-[13px] font-medium text-text-muted hover:bg-bg-subtle hover:text-text-main transition-colors border border-transparent"
        title={currentLang.name}
      >
        <CountryFlag emoji={currentLang.flag} alt={currentLang.name} />
        <span className="text-xs font-medium">{currentLang.label}</span>
        <span
          className={`material-symbols-outlined text-[14px] text-text-subtle transition-transform ${open ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-full mt-1 w-56 max-h-80 rounded-lg border border-border bg-surface p-1 shadow-[var(--shadow-elevated)] z-50 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] transition-colors ${
                lang.code === locale
                  ? "bg-bg-subtle text-text-main font-medium"
                  : "text-text-muted hover:bg-bg-subtle hover:text-text-main"
              }`}
            >
              <CountryFlag emoji={lang.flag} alt={lang.name} />
              <span className="flex-1 text-start">{lang.name}</span>
              {lang.code === locale && (
                <span className="material-symbols-outlined text-[16px] text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
