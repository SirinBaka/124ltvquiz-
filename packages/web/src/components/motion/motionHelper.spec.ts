import { describe, it, expect } from "vitest";
import {
  APPLE_EASE,
  APPLE_SHEET_EASE,
  APPLE_SPRING_EASE,
  APPLE_DURATION,
  getRevealTransform,
  getStaggerDelayMs,
  clamp01,
  computeScrollProgress,
  computeHeroScrollTransforms,
} from "./motionHelper";

describe("motionHelper (Apple 60fps motion tokens)", () => {
  it("defines canonical Apple cubic-bezier easing curves", () => {
    expect(APPLE_EASE).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(APPLE_SHEET_EASE).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
    expect(APPLE_SPRING_EASE).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
  });

  it("defines responsive duration tokens within 60fps HIG ranges", () => {
    expect(APPLE_DURATION.micro).toBeLessThanOrEqual(160);
    expect(APPLE_DURATION.fast).toBeLessThanOrEqual(250);
    expect(APPLE_DURATION.sheet).toBeLessThanOrEqual(360);
  });

  it("returns GPU-reset transform when visible", () => {
    expect(getRevealTransform("up", true)).toBe(
      "translate-x-0 translate-y-0 scale-100",
    );
    expect(getRevealTransform("none", true)).toBe(
      "translate-x-0 translate-y-0 scale-100",
    );
  });

  it("returns directional offset classes before reveal", () => {
    expect(getRevealTransform("up", false)).toBe("translate-y-4");
    expect(getRevealTransform("down", false)).toBe("-translate-y-4");
    expect(getRevealTransform("left", false)).toBe("translate-x-4");
    expect(getRevealTransform("right", false)).toBe("-translate-x-4");
    expect(getRevealTransform("none", false)).toBe("scale-[0.98]");
  });

  it("caps stagger delay to keep large grids snappy", () => {
    expect(getStaggerDelayMs(0)).toBe(0);
    expect(getStaggerDelayMs(3, 35, 280)).toBe(105);
    expect(getStaggerDelayMs(20, 35, 280)).toBe(280);
  });

  it("clamps and computes normalized document scroll progress", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(computeScrollProgress(500, 2000, 1000)).toBe(0.5);
    expect(computeScrollProgress(100, 800, 1000)).toBe(0);
  });

  it("computes Apple-style hero scroll transforms from top to settled", () => {
    const atTop = computeHeroScrollTransforms(0);
    expect(atTop.heroTranslateY).toBe(-0);
    expect(atTop.heroOpacity).toBe(1);
    expect(atTop.previewScale).toBeCloseTo(0.965);
    expect(atTop.previewRotateX).toBeCloseTo(3.5);
    expect(atTop.cueOpacity).toBe(1);

    const scrolled = computeHeroScrollTransforms(320);
    expect(scrolled.previewScale).toBeCloseTo(1);
    expect(scrolled.previewRotateX).toBeCloseTo(0);
    expect(scrolled.previewTranslateY).toBeCloseTo(0);
    expect(scrolled.cueOpacity).toBe(0);
  });
});
