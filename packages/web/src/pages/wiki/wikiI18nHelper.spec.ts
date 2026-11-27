import { describe, it, expect } from "vitest";
import {
  getCategoryName,
  getLocalizedStatus,
  getLocalizedMatchType,
  getWikiHomeCategories,
  getWikiFaqs,
  getWikiFeaturedArticles,
  getWikiSearchSuggestions,
  translateArticleContent,
} from "./wikiI18nHelper";

describe("wikiI18nHelper", () => {
  it("translates category names based on language", () => {
    expect(getCategoryName("c-getting-started", "vi")).toBe("Bắt đầu sử dụng");
    expect(getCategoryName("c-getting-started", "en")).toBe("Getting Started");
    expect(getCategoryName("c-troubleshooting", "vi")).toBe("Khắc phục sự cố");
    expect(getCategoryName("c-troubleshooting", "en")).toBe("Troubleshooting");
    expect(getCategoryName("non-existent", "vi")).toBe("Khác");
    expect(getCategoryName("non-existent", "en")).toBe("Other");
  });

  it("translates article verification status", () => {
    expect(getLocalizedStatus("verified", "vi")).toBe("Đã xác minh");
    expect(getLocalizedStatus("verified", "en")).toBe("Verified");
    expect(getLocalizedStatus("conditional", "vi")).toBe("Theo điều kiện");
    expect(getLocalizedStatus("conditional", "en")).toBe("Conditional");
    expect(getLocalizedStatus("needs_verification", "en")).toBe(
      "Needs Verification",
    );
    expect(getLocalizedStatus("unavailable", "en")).toBe("Unavailable");
  });

  it("translates search match type", () => {
    expect(getLocalizedMatchType("Trùng khớp tiêu đề", "vi")).toBe(
      "Trùng khớp tiêu đề",
    );
    expect(getLocalizedMatchType("Trùng khớp tiêu đề", "en")).toBe(
      "Title match",
    );
    expect(getLocalizedMatchType("Trùng khớp nội dung", "en")).toBe(
      "Content match",
    );
    expect(getLocalizedMatchType("Liên quan", "en")).toBe("Related");
  });

  it("returns localized categories for WikiHome", () => {
    const viCats = getWikiHomeCategories("vi");
    const enCats = getWikiHomeCategories("en");
    expect(viCats).toHaveLength(6);
    expect(enCats).toHaveLength(6);
    expect(viCats[0].title).toContain("Tổng quan về LTVQuiz");
    expect(enCats[0].title).toContain("LTVQuiz Overview");
    expect(enCats[0].links[0]).toBe("What is LTVQuiz?");
  });

  it("returns localized FAQs for WikiHome", () => {
    const viFaqs = getWikiFaqs("vi");
    const enFaqs = getWikiFaqs("en");
    expect(viFaqs).toHaveLength(6);
    expect(enFaqs).toHaveLength(6);
    expect(viFaqs[0].q).toContain("Làm sao");
    expect(enFaqs[0].q).toContain("How to create");
  });

  it("returns localized search suggestions", () => {
    const viSug = getWikiSearchSuggestions("vi");
    const enSug = getWikiSearchSuggestions("en");
    expect(viSug.length).toBeGreaterThan(0);
    expect(enSug.length).toBeGreaterThan(0);
    expect(enSug[0]).toContain("quiz");
  });

  it("returns localized featured articles", () => {
    const viFeatured = getWikiFeaturedArticles("vi");
    const enFeatured = getWikiFeaturedArticles("en");
    expect(viFeatured.length).toBeGreaterThan(0);
    expect(enFeatured.length).toBeGreaterThan(0);
    expect(enFeatured[0].title).toBe("What is LTVQuiz?");
  });

  it("translates markdown content headers and steps to English", () => {
    const viContent =
      "## Mục đích\nBài viết này hướng dẫn chi tiết.\n\n## Hướng dẫn thực hiện\n1. **Truy cập chức năng:** Mở menu.\n2. **Kiểm tra và lưu:** Nhấn Lưu.";
    const translated = translateArticleContent(viContent, "en");
    expect(translated).toContain("## Purpose");
    expect(translated).toContain("## Step-by-step Instructions");
    expect(translated).toContain("Access feature:");
    expect(translated).toContain("Review and save:");
  });

  it("preserves Vietnamese content when lang is vi", () => {
    const viContent = "## Mục đích\nBài viết này hướng dẫn chi tiết.";
    const translated = translateArticleContent(viContent, "vi");
    expect(translated).toBe(viContent);
  });
});
