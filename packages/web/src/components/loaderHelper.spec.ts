import { describe, it, expect } from "vitest";
import {
  deriveLoaderText,
  getLoaderBackdropClass,
  getLoaderSizeClasses,
  DEFAULT_LOADER_TIMEOUT_MS,
  LOADER_TIMEOUT_WARNING_TEXT,
  shouldShowSlowLoadingNotice,
} from "./loaderHelper";

describe("deriveLoaderText", () => {
  it("returns customText if provided", () => {
    expect(deriveLoaderText("Lưu lại", "Đang cập nhật...")).toBe(
      "Đang cập nhật...",
    );
  });

  it("formats text starting with + symbol properly", () => {
    expect(deriveLoaderText("+ Tạo bài kiểm tra")).toBe(
      "Đang tạo bài kiểm tra...",
    );
  });

  it("formats action text starting with uppercase letter", () => {
    expect(deriveLoaderText("Xuất bản")).toBe("Đang xuất bản...");
    expect(deriveLoaderText("Lưu cài đặt")).toBe("Đang lưu cài đặt...");
    expect(deriveLoaderText("Nộp bài")).toBe("Đang nộp bài...");
  });

  it('handles already prefix "Đang" correctly without duplicating', () => {
    expect(deriveLoaderText("Đang tải dữ liệu")).toBe("Đang tải dữ liệu...");
  });

  it("returns fallback text for complex non-string children", () => {
    expect(deriveLoaderText(null)).toBe("Đang xử lý...");
    expect(deriveLoaderText({ foo: "bar" })).toBe("Đang xử lý...");
  });
});

describe("getLoaderBackdropClass", () => {
  it("returns backdrop blur class by default", () => {
    const cls = getLoaderBackdropClass({});
    expect(cls).toContain("backdrop-blur-md");
  });

  it("supports different blur levels", () => {
    expect(getLoaderBackdropClass({ blur: "sm" })).toContain(
      "backdrop-blur-sm",
    );
    expect(getLoaderBackdropClass({ blur: "md" })).toContain(
      "backdrop-blur-md",
    );
    expect(getLoaderBackdropClass({ blur: "lg" })).toContain(
      "backdrop-blur-lg",
    );
    expect(getLoaderBackdropClass({ blur: "xl" })).toContain(
      "backdrop-blur-xl",
    );
  });

  it('handles blur=false or "none" without backdrop-blur', () => {
    expect(getLoaderBackdropClass({ blur: false })).not.toContain(
      "backdrop-blur",
    );
    expect(getLoaderBackdropClass({ blur: "none" })).not.toContain(
      "backdrop-blur",
    );
  });

  it("handles fullscreen with and without blur", () => {
    const fsBlur = getLoaderBackdropClass({ fullscreen: true, blur: "md" });
    expect(fsBlur).toContain("backdrop-blur-md");
    const fsNoBlur = getLoaderBackdropClass({ fullscreen: true, blur: false });
    expect(fsNoBlur).not.toContain("backdrop-blur");
  });
});

describe("getLoaderSizeClasses", () => {
  it("returns enlarged default size classes for md", () => {
    const classes = getLoaderSizeClasses("md");
    expect(classes.spinner).toContain("w-14");
    expect(classes.card).toContain("min-w-[280px]");
    expect(classes.title).toContain("text-base");
  });

  it("supports sm, md, and lg sizes", () => {
    const sm = getLoaderSizeClasses("sm");
    const lg = getLoaderSizeClasses("lg");
    expect(sm.spinner).toContain("w-10");
    expect(lg.spinner).toContain("w-16");
  });
});

describe("shouldShowSlowLoadingNotice and constants", () => {
  it("defines standard timeout of 6000ms", () => {
    expect(DEFAULT_LOADER_TIMEOUT_MS).toBe(6000);
  });

  it("contains exact user-requested warning text", () => {
    expect(LOADER_TIMEOUT_WARNING_TEXT).toBe(
      "Nếu bị sự cố, vui lòng khởi động lại trang hoặc nhấn phím F5 trên bàn phím",
    );
  });

  it("returns true when loading duration meets or exceeds timeout threshold", () => {
    expect(shouldShowSlowLoadingNotice(5999, 6000)).toBe(false);
    expect(shouldShowSlowLoadingNotice(6000, 6000)).toBe(true);
    expect(shouldShowSlowLoadingNotice(8000, 6000)).toBe(true);
  });

  it("uses default 6000ms threshold when timeoutMs is omitted", () => {
    expect(shouldShowSlowLoadingNotice(3000)).toBe(false);
    expect(shouldShowSlowLoadingNotice(6000)).toBe(true);
    expect(shouldShowSlowLoadingNotice(10000)).toBe(true);
  });
});

