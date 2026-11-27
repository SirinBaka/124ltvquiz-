import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  Lightbulb,
  Compass,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Reveal } from "../../components/Reveal";
import { useLanguage } from "../../i18n";
import {
  getWikiHomeCategories,
  getWikiFaqs,
  getWikiFeaturedArticles,
  getWikiSearchSuggestions,
} from "./wikiI18nHelper";

export function WikiHome() {
  const { lang, t } = useLanguage();
  const suggestions = getWikiSearchSuggestions(lang);
  const categories = getWikiHomeCategories(lang);
  const faqs = getWikiFaqs(lang);
  const featured = getWikiFeaturedArticles(lang);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="py-6 sm:py-10 lg:py-14 px-3.5 sm:px-6 lg:px-12 max-w-5xl mx-auto">
      {/* 2.1 Tiêu đề trang */}
      <Reveal>
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold mb-3 border border-[var(--color-primary)]/20">
            <Sparkles size={13} />
            <span>Trung tâm trợ giúp & Tri thức LTVQuiz</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[var(--color-text)] tracking-tight mb-2.5 sm:mb-4">
            {t("wiki.home.welcome")}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed px-2">
            {t("wiki.home.subtitle")}
          </p>
        </div>
      </Reveal>

      {/* 2.2 Ô tìm kiếm chuẩn Android */}
      <Reveal delay={100}>
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 shadow-sm">
          <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] mb-3 text-center">
            {t("wiki.home.searchTitle")}
          </h2>
          <form
            className="relative max-w-2xl mx-auto mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              if (q)
                window.location.href = `/wiki/search?q=${encodeURIComponent(q.toString())}`;
            }}
          >
            <Search
              className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              name="q"
              type="text"
              placeholder={t("wiki.home.searchPlaceholder")}
              className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-2.5 sm:py-3.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all shadow-inner text-[var(--color-text)]"
            />
            <button
              type="submit"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all touch-manipulation"
            >
              {t("wiki.home.searchBtn")}
            </button>
          </form>

          {/* Gợi ý tìm kiếm: vuốt ngang mượt mà trên điện thoại */}
          <div className="flex items-center gap-1.5 max-w-2xl mx-auto">
            <span className="text-xs text-[var(--color-text-secondary)] shrink-0 py-1 hidden sm:inline">
              {t("wiki.home.suggestions")}
            </span>
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
              {suggestions.map((tag, i) => (
                <Link
                  key={i}
                  to={`/wiki/search?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 sm:px-3 py-1 bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded-full text-xs font-medium shrink-0 cursor-pointer transition-all border border-[var(--color-border)] active:scale-95 touch-manipulation"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-3 gap-8 sm:gap-10 mb-12">
        <div className="lg:col-span-2 space-y-10 sm:space-y-12">
          {/* 2.4 Các danh mục chính */}
          <Reveal delay={200}>
            <section>
              <h2 className="text-lg sm:text-2xl font-bold text-[var(--color-text)] mb-4 sm:mb-6 flex items-center gap-2">
                <Compass className="text-[var(--color-primary)]" size={22} />
                <span>{t("wiki.home.categories")}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 hover:border-[var(--color-primary)]/50 transition-all group shadow-2xs"
                  >
                    <h3 className="font-bold text-sm sm:text-base text-[var(--color-text)] mb-1.5 group-hover:text-[var(--color-primary)] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                      {cat.desc}
                    </p>
                    <ul className="space-y-1 border-t border-[var(--color-border)]/60 pt-2.5">
                      {cat.links.map((link, lidx) => (
                        <li key={lidx}>
                          <Link
                            to={`/wiki/search?q=${encodeURIComponent(link)}`}
                            className="text-xs sm:text-sm text-[var(--color-primary)] hover:underline flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded-lg active:bg-[var(--color-background)] active:scale-98 transition-all touch-manipulation"
                          >
                            <span className="truncate pr-2">{link}</span>
                            <ChevronRight size={14} className="shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* FAQ Accordion Section (Tối ưu hóa thao tác chạm trên Android) */}
          <Reveal delay={250}>
            <section>
              <h2 className="text-lg sm:text-2xl font-bold text-[var(--color-text)] mb-4 sm:mb-6 flex items-center gap-2">
                <MessageSquare className="text-[var(--color-primary)]" size={22} />
                <span>{t("wiki.home.faq")}</span>
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 active:bg-[var(--color-background)] transition-colors touch-manipulation cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-text)]">
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-[var(--color-text-secondary)] transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[var(--color-primary)]" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-3.5 sm:px-4 pb-3.5 pt-0 border-t border-[var(--color-border)]/50 bg-[var(--color-background)]/30 animate-fade-in">
                          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] pt-2.5 leading-relaxed mb-2.5">
                            {faq.ans}
                          </p>
                          <Link
                            to={`/wiki/article/${faq.link}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline active:scale-98"
                          >
                            <span>{t("wiki.home.viewDetail")}</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>
        </div>
        <div className="space-y-8 sm:space-y-10">
          {/* 2.5 Bài viết nổi bật */}
          <Reveal delay={250}>
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <Lightbulb className="text-amber-500" size={20} />{" "}
                {t("wiki.home.featured")}
              </h2>
              <div className="space-y-4">
                {featured.map((article, idx) => (
                  <Link
                    key={idx}
                    to={`/wiki/search?q=${encodeURIComponent(article.title)}`}
                    className="block group"
                  >
                    <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {article.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>

          {/* 2.6 Bài viết mới cập nhật */}
          <Reveal delay={300}>
            <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />{" "}
                {t("wiki.home.updated")}
              </h2>
              <div className="text-sm text-[var(--color-text-secondary)] italic text-center py-4">
                {t("wiki.home.noUpdates")}
              </div>
            </section>
          </Reveal>

          {/* 2.7 Hộp thông tin */}
          <Reveal delay={350}>
            <section className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[var(--color-primary)] mx-auto mb-4 shadow-sm">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
                {t("wiki.home.noAnswerTitle")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {t("wiki.home.noAnswerDesc")}
              </p>
              <Link
                to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "support" : "liên hệ")}`}
              >
                <Button variant="primary" className="w-full">
                  {t("wiki.home.supportCenter")}
                </Button>
              </Link>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
