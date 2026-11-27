export const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
export const APPLE_SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
export const APPLE_SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const APPLE_DURATION = {
  micro: 140,
  fast: 220,
  normal: 300,
  sheet: 340,
  slow: 520,
} as const;

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

/**
 * Checks whether the user prefers reduced motion via media query.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns GPU-composited translate3d / scale classes for scroll-reveal motion.
 */
export function getRevealTransform(
  direction: RevealDirection,
  isVisible: boolean,
): string {
  if (isVisible) {
    return "translate-x-0 translate-y-0 scale-100";
  }

  switch (direction) {
    case "up":
      return "translate-y-4";
    case "down":
      return "-translate-y-4";
    case "left":
      return "translate-x-4";
    case "right":
      return "-translate-x-4";
    case "none":
      return "scale-[0.98]";
    default:
      return "translate-y-4";
  }
}

/**
 * Computes a gentle Apple-style stagger delay capped to avoid sluggishness on long lists.
 */
export function getStaggerDelayMs(
  index: number,
  stepMs: number = 35,
  maxDelayMs: number = 280,
): number {
  if (index <= 0 || stepMs <= 0) return 0;
  return Math.min(index * stepMs, maxDelayMs);
}

/**
 * Clamps a numeric value to [0, 1].
 */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Computes normalized [0, 1] document scroll progress.
 */
export function computeScrollProgress(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number,
): number {
  const maxScroll = scrollHeight - innerHeight;
  if (maxScroll <= 0) return 0;
  return clamp01(scrollY / maxScroll);
}

export interface HeroScrollTransforms {
  heroTranslateY: number;
  heroOpacity: number;
  previewScale: number;
  previewRotateX: number;
  previewTranslateY: number;
  cueOpacity: number;
}

/**
 * Computes 60fps GPU-composited Apple-style scroll transforms for the Home hero.
 */
export function computeHeroScrollTransforms(
  scrollY: number,
): HeroScrollTransforms {
  const heroProgress = clamp01(scrollY / 420);
  const previewProgress = clamp01(scrollY / 320);
  const cueProgress = clamp01(scrollY / 120);

  return {
    heroTranslateY: -(heroProgress * 28),
    heroOpacity: 1 - heroProgress * 0.85,
    previewScale: 0.965 + previewProgress * 0.035,
    previewRotateX: 3.5 * (1 - previewProgress),
    previewTranslateY: 12 * (1 - previewProgress),
    cueOpacity: 1 - cueProgress,
  };
}
