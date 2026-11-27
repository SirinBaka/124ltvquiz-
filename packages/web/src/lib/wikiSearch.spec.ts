import { describe, it, expect } from "vitest";
import {
  normalizeVietnamese,
  detectIntent,
  searchArticles,
} from "./wikiSearch";
import type { WikiArticle } from "./wikiSearch";

describe("wikiSearch", () => {
  it("normalizes Vietnamese text and trims punctuation", () => {
    expect(normalizeVietnamese("Làm thế nào để tạo bài kiểm tra?")).toBe(
      "lam the nao de tao bai kiem tra",
    );
    expect(normalizeVietnamese("Hello World!")).toBe("hello world");
  });

  it("detects intent correctly in Vietnamese and English", () => {
    expect(detectIntent("Làm sao để tạo đề")).toBe("how_to");
    expect(detectIntent("how to create quiz")).toBe("how_to");
    expect(detectIntent("Tại sao bị lỗi PDF")).toBe("troubleshooting");
    expect(detectIntent("why error upload")).toBe("troubleshooting");
    expect(detectIntent("LTVQuiz là gì")).toBe("definition");
    expect(detectIntent("what is ltvquiz")).toBe("definition");
    expect(detectIntent("chào bạn")).toBe("general");
  });

  it("finds articles using English keywords through synonyms and normalization", () => {
    const mockArticles: WikiArticle[] = [
      {
        id: "tao-bai-kiem-tra",
        title: "Quy trình tạo bài kiểm tra",
        summary: "Hướng dẫn tạo bài kiểm tra trên hệ thống.",
        content:
          "Nội dung chi tiết về cách tạo bài kiểm tra và xuất bản đề thi.",
        categoryId: "c-management",
        keywords: ["kiem tra", "de thi", "tao de"],
        status: "verified",
        relatedIds: [],
      },
      {
        id: "su-co-tai-file",
        title: "Khắc phục lỗi tải tài liệu",
        summary: "Hướng dẫn xử lý lỗi khi tải file lên.",
        content: "Khi gặp lỗi tải lên, kiểm tra kích thước file.",
        categoryId: "c-troubleshooting",
        keywords: ["loi tai len", "tai file", "upload"],
        status: "verified",
        relatedIds: [],
      },
    ];

    const viResults = searchArticles("tạo bài kiểm tra", mockArticles);
    expect(viResults.length).toBeGreaterThan(0);
    expect(viResults[0].article.id).toBe("tao-bai-kiem-tra");

    const enResults = searchArticles("quiz", mockArticles);
    expect(enResults.length).toBeGreaterThan(0);
    expect(enResults[0].article.id).toBe("tao-bai-kiem-tra");

    const errResults = searchArticles("error upload", mockArticles);
    expect(errResults.length).toBeGreaterThan(0);
    expect(errResults[0].article.id).toBe("su-co-tai-file");
  });
});
