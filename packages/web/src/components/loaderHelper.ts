import { useState, useEffect } from "react";

export const DEFAULT_LOADER_TIMEOUT_MS = 6000;
export const LOADER_TIMEOUT_WARNING_TEXT =
  "Nếu bị sự cố, vui lòng khởi động lại trang hoặc nhấn phím F5 trên bàn phím";

/**
 * Checks whether an elapsed loading duration meets or exceeds the slow threshold.
 */
export function shouldShowSlowLoadingNotice(
  elapsedMs: number,
  timeoutMs: number = DEFAULT_LOADER_TIMEOUT_MS,
): boolean {
  return elapsedMs >= timeoutMs;
}

/**
 * React hook that triggers a slow loading state flag after timeoutMs of continuous loading.
 */
export function useSlowLoadingNotice(
  isActive: boolean = true,
  timeoutMs: number = DEFAULT_LOADER_TIMEOUT_MS,
): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsSlow(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSlow(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isActive, timeoutMs]);

  return isSlow;
}

export function deriveLoaderText(
  children?: unknown,
  customText?: string,
): string {
  if (customText?.trim()) {
    return customText.trim();
  }

  if (typeof children !== "string") {
    return "Đang xử lý...";
  }

  let text = children.trim();
  text = text.replace(/^[+\-•\s]+/, "").trim();

  if (!text) {
    return "Đang xử lý...";
  }

  if (text.startsWith("Đang ") || text.startsWith("đang ")) {
    return text.endsWith("...") ? text : `${text}...`;
  }

  const firstChar = text.charAt(0).toLowerCase();
  const rest = text.slice(1);
  return `Đang ${firstChar}${rest}...`;
}

export type BlurLevel = boolean | "none" | "sm" | "md" | "lg" | "xl";

export interface LoaderBackdropOptions {
  fullscreen?: boolean;
  blur?: BlurLevel;
}

export function getLoaderBackdropClass({
  fullscreen = false,
  blur = "md",
}: LoaderBackdropOptions = {}): string {
  const isBlurred = blur !== false && blur !== "none";
  const blurClass =
    blur === "sm"
      ? "backdrop-blur-sm"
      : blur === "lg"
        ? "backdrop-blur-lg"
        : blur === "xl"
          ? "backdrop-blur-xl"
          : isBlurred
            ? "backdrop-blur-md"
            : "";

  if (fullscreen) {
    if (isBlurred) {
      return `bg-[var(--color-background)]/80 ${blurClass}`.trim();
    }
    return "bg-[var(--color-background)]";
  }

  if (isBlurred) {
    return `bg-black/35 ${blurClass}`.trim();
  }
  return "bg-black/40";
}

export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderSizeStyles {
  card: string;
  spinner: string;
  spinnerBorder: string;
  title: string;
  subtext: string;
}

export function getLoaderSizeClasses(
  size: LoaderSize = "md",
): LoaderSizeStyles {
  switch (size) {
    case "sm":
      return {
        card: "px-6 py-4.5 min-w-[220px] max-w-xs rounded-2xl",
        spinner: "w-10 h-10",
        spinnerBorder: "border-[3px]",
        title: "text-sm sm:text-base font-bold mb-1",
        subtext: "text-[11px]",
      };
    case "lg":
      return {
        card: "px-10 py-9 sm:px-12 sm:py-10 min-w-[320px] sm:min-w-[360px] max-w-md rounded-3xl",
        spinner: "w-16 h-16 sm:w-20 sm:h-20",
        spinnerBorder: "border-[5px]",
        title: "text-lg sm:text-xl font-bold mb-2",
        subtext: "text-xs",
      };
    case "md":
    default:
      return {
        card: "px-8 py-7 sm:px-10 sm:py-8 min-w-[280px] sm:min-w-[320px] max-w-sm rounded-3xl",
        spinner: "w-14 h-14 sm:w-16 sm:h-16",
        spinnerBorder: "border-[4px]",
        title: "text-base sm:text-lg font-bold mb-1.5",
        subtext: "text-xs",
      };
  }
}
