"use client";

import { cn } from "@/shared/utils/cn";

export default function Avatar({ src, alt = "Avatar", name, size = "md", className }) {
  const sizes = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-lg",
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate color from name
  const getColorFromName = (name) => {
    if (!name) return "bg-bg-subtle";
    const colors = [
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
      "bg-bg-subtle",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (src) {
    return (
      <div
        className={cn(
          "rounded-full bg-cover bg-center bg-no-repeat",
          "border border-border",
          sizes[size],
          className
        )}
        style={{ backgroundImage: `url(${src})` }}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-text-muted",
        "border border-border",
        sizes[size],
        getColorFromName(name),
        className
      )}
      role="img"
      aria-label={alt}
    >
      {getInitials(name)}
    </div>
  );
}
