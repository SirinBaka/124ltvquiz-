import { describe, it, expect } from "vitest";
import { translations, getHeroPhrases } from "./i18n";

describe("i18n translations", () => {
  it("has identical keys for both vi and en", () => {
    const viKeys = Object.keys(translations.vi).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(enKeys).toEqual(viKeys);
  });

  it("contains synchronized navigation keys", () => {
    expect(translations.vi["nav.home"]).toBe("Trang chủ");
    expect(translations.en["nav.home"]).toBe("Home");
    expect(translations.vi["nav.about"]).toBe("Giới thiệu");
    expect(translations.en["nav.about"]).toBe("About");
    expect(translations.vi["nav.founder"]).toBe("Nhà sáng lập");
    expect(translations.en["nav.founder"]).toBe("Founders");
    expect(translations.vi["nav.faq"]).toBe("FAQ");
    expect(translations.en["nav.faq"]).toBe("FAQ");
    expect(translations.vi["nav.community"]).toBe("Cộng đồng");
    expect(translations.en["nav.community"]).toBe("Community");
  });

  it("contains synchronized founder and community keys", () => {
    expect(translations.vi["landing.founder.title"]).toBe(
      "Nhà phát triển và Đóng góp",
    );
    expect(translations.en["landing.founder.title"]).toBe(
      "Developers & Contributors",
    );
    expect(translations.vi["landing.community.title"]).toBe(
      "Cộng đồng & Hỗ trợ",
    );
    expect(translations.en["landing.community.title"]).toBe(
      "Community & Support",
    );
  });

  it("contains synchronized wiki navigation, search, and article keys", () => {
    expect(translations.vi["wiki.title"]).toBe("A4 LTVQuiz Wiki");
    expect(translations.en["wiki.title"]).toBe("A4 LTVQuiz Wiki");
    expect(translations.vi["wiki.backToQuiz"]).toBe("Quay lại LTVQuiz");
    expect(translations.en["wiki.backToQuiz"]).toBe("Back to LTVQuiz");
    expect(translations.vi["wiki.home.welcome"]).toBe(
      "Chào mừng đến với LTVQuiz Wiki",
    );
    expect(translations.en["wiki.home.welcome"]).toBe(
      "Welcome to LTVQuiz Wiki",
    );
    expect(translations.vi["wiki.search.title"]).toBe("Tìm kiếm Wiki");
    expect(translations.en["wiki.search.title"]).toBe("Wiki Search");
    expect(translations.vi["wiki.article.back"]).toBe("Quay lại");
    expect(translations.en["wiki.article.back"]).toBe("Back");
  });

  it("provides localized hero phrases for both languages", () => {
    const viPhrases = getHeroPhrases("vi");
    const enPhrases = getHeroPhrases("en");
    expect(viPhrases.length).toBeGreaterThan(0);
    expect(enPhrases.length).toBeGreaterThan(0);
    expect(viPhrases[0]).toContain("tài liệu");
    expect(enPhrases[0]).toContain("document");
  });
});
