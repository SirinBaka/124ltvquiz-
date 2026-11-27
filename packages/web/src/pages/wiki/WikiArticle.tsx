import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Bookmark,
  Tag,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Type,
} from "lucide-react";
import { Button } from "../../components/Button";
import { Reveal } from "../../components/Reveal";
import { WIKI_ARTICLES } from "../../data/wikiArticles";
import { useLanguage } from "../../i18n";
import {
  getCategoryName,
  getLocalizedStatus,
  translateArticleContent,
} from "./wikiI18nHelper";

export function WikiArticle() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();

  const articleIndex = useMemo(
    () => WIKI_ARTICLES.findIndex((a) => a.id === id),
    [id],
  );
  const article = articleIndex !== -1 ? WIKI_ARTICLES[articleIndex] : null;

  const prevArticle = articleIndex > 0 ? WIKI_ARTICLES[articleIndex - 1] : null;
  const nextArticle =
    articleIndex !== -1 && articleIndex < WIKI_ARTICLES.length - 1
      ? WIKI_ARTICLES[articleIndex + 1]
      : null;

  const lastUpdatedDate = useMemo(
    () => new Date().toLocaleDateString(lang === "en" ? "en-US" : "vi-VN"),
    [lang],
  );

  // Android Mobile features: font scale, share, bookmark, scroll-to-top
  const [fontSizeScale, setFontSizeScale] = useState<"normal" | "large" | "xlarge">("normal");
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${article?.title || "Wiki"} - A4 LTVQuiz`,
      text: article?.summary || "Cẩm nang hướng dẫn A4 LTVQuiz",
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or aborted share, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const cycleFontSize = () => {
    setFontSizeScale((prev) => {
      if (prev === "normal") return "large";
      if (prev === "large") return "xlarge";
      return "normal";
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!article) {
    return (
      <div className="py-16 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <Reveal>
          <div className="w-16 h-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Search className="text-gray-400" size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
            {t("wiki.article.notFoundTitle")}
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-6">
            {t("wiki.article.notFoundDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/wiki">
              <Button variant="secondary" className="text-xs sm:text-sm">
                {t("wiki.article.backHome")}
              </Button>
            </Link>
            <Link to="/wiki/search?q=category">
              <Button variant="primary" className="text-xs sm:text-sm">
                {t("wiki.article.browseCategories")}
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  const categoryName = getCategoryName(article.categoryId, lang);
  const localizedContent = translateArticleContent(article.content, lang);

  const fontClasses =
    fontSizeScale === "normal"
      ? "text-sm sm:text-base"
      : fontSizeScale === "large"
        ? "text-base sm:text-lg"
        : "text-lg sm:text-xl";

  return (
    <div className="py-6 sm:py-10 lg:py-14 px-3.5 sm:px-6 lg:px-12 max-w-4xl mx-auto min-h-screen relative">
      {/* 1. Thanh công cụ bài viết chuẩn Android */}
      <div className="flex items-center justify-between mb-6 pb-3.5 border-b border-[var(--color-border)] gap-2">
        <Link
          to="/wiki"
          className="text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] active:scale-95 transition-all touch-manipulation"
        >
          <ArrowLeft size={16} />
          <span>{t("wiki.article.back")}</span>
        </Link>

        {/* Action Buttons for Mobile Screen */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Font Size Toggle */}
          <button
            type="button"
            onClick={cycleFontSize}
            className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] active:scale-95 transition-all flex items-center gap-1 touch-manipulation"
            title="Đổi cỡ chữ đọc bài"
            aria-label="Cỡ chữ"
          >
            <Type size={14} />
            <span className="text-[11px] font-bold">
              {fontSizeScale === "normal" ? "A" : fontSizeScale === "large" ? "A+" : "A++"}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl border border-[var(--color-border)] active:scale-95 transition-all touch-manipulation ${
              isBookmarked
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            }`}
            title="Lưu bài viết"
            aria-label="Đánh dấu"
          >
            <Bookmark size={15} className={isBookmarked ? "fill-amber-500" : ""} />
          </button>

          {/* Android Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-background)] border border-[var(--color-border)] active:scale-95 transition-all flex items-center gap-1.5 text-[var(--color-text)] touch-manipulation shadow-2xs"
            title="Chia sẻ bài viết"
            aria-label="Chia sẻ"
          >
            {isCopied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-600 text-xs font-semibold">Đã chép</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-[var(--color-primary)]" />
                <span className="hidden sm:inline">Chia sẻ</span>
              </>
            )}
          </button>
        </div>
      </div>

      <Reveal>
        <article className={`max-w-none ${fontClasses}`}>
          {/* Metadata Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] font-medium">
              <Tag size={13} className="text-[var(--color-primary)]" />
              <span>{categoryName}</span>
            </span>

            {article.status === "verified" && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                {getLocalizedStatus("verified", lang)}
              </span>
            )}
            {article.status === "conditional" && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                {getLocalizedStatus("conditional", lang)}
              </span>
            )}
            {article.status === "needs_verification" && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                {getLocalizedStatus("needs_verification", lang)}
              </span>
            )}
            {article.status === "unavailable" && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                {getLocalizedStatus("unavailable", lang)}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--color-text)] tracking-tight mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="lead font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] p-3.5 sm:p-5 rounded-2xl border-l-4 border-[var(--color-primary)] shadow-2xs mb-6 sm:mb-8 leading-relaxed">
            {article.summary}
          </div>

          {/* Render article body with mobile word-break and overflow prevention */}
          <div className="mt-6 whitespace-pre-wrap leading-relaxed text-[var(--color-text)] space-y-2">
            {localizedContent.split("\n").map((line, idx) => {
              if (line.startsWith("## "))
                return (
                  <h2
                    key={idx}
                    className="mt-6 sm:mt-8 mb-3 font-bold text-lg sm:text-2xl text-[var(--color-text)] tracking-tight border-b border-[var(--color-border)]/50 pb-2"
                  >
                    {line.replace("## ", "")}
                  </h2>
                );
              if (line.startsWith("### "))
                return (
                  <h3
                    key={idx}
                    className="mt-5 sm:mt-6 mb-2 font-bold text-base sm:text-xl text-[var(--color-text)]"
                  >
                    {line.replace("### ", "")}
                  </h3>
                );
              if (line.startsWith("- "))
                return (
                  <li key={idx} className="ml-5 list-disc text-[var(--color-text-secondary)] py-0.5">
                    {line.replace("- ", "")}
                  </li>
                );
              if (line.match(/^\d+\. /))
                return (
                  <li key={idx} className="ml-5 list-decimal text-[var(--color-text-secondary)] py-0.5">
                    {line.replace(/^\d+\. /, "")}
                  </li>
                );
              if (line.trim() === "") return <div key={idx} className="h-2" />;

              // Handle bold text like **bold**
              const parts = line
                .split(/(\*\*.*?\*\*)/g)
                .map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={pIdx} className="font-bold text-[var(--color-text)]">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                });

              return (
                <p key={idx} className="mb-3 text-[var(--color-text-secondary)] leading-relaxed">
                  {parts}
                </p>
              );
            })}
          </div>

          {/* Related search tags */}
          <div className="mt-10 sm:mt-12 p-4 sm:p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xs">
            <h3 className="text-sm sm:text-base font-bold mb-3 text-[var(--color-text)]">
              {t("wiki.article.relatedSearch")}
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {article.keywords.map((kw, idx) => (
                <Link
                  key={idx}
                  to={`/wiki/search?q=${encodeURIComponent(kw)}`}
                  className="px-3 py-1 bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded-full text-xs font-medium transition-all border border-[var(--color-border)] active:scale-95 touch-manipulation"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        </article>
      </Reveal>

      {/* 2. Điều hướng kế tiếp / trước đó cho Android (Next/Prev Cards) */}
      <div className="mt-8 sm:mt-12 pt-6 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {prevArticle ? (
          <Link
            to={`/wiki/article/${prevArticle.id}`}
            className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] active:scale-98 transition-all group flex items-center gap-3 touch-manipulation shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--color-background)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]">
              <ChevronLeft size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">
                Bài viết trước
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)]">
                {prevArticle.title}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextArticle && (
          <Link
            to={`/wiki/article/${nextArticle.id}`}
            className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] active:scale-98 transition-all group flex items-center justify-between gap-3 text-right touch-manipulation shadow-2xs"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">
                Bài viết kế tiếp
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)]">
                {nextArticle.title}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-background)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]">
              <ChevronRight size={18} />
            </div>
          </Link>
        )}
      </div>

      {/* Floating Scroll-To-Top Button (Chuẩn FAB trên Android) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-5 z-40 w-11 h-11 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center active:scale-90 hover:bg-blue-600 transition-all animate-fade-in touch-manipulation"
          aria-label="Cuộn lên đầu trang"
        >
          <ArrowUp size={20} />
        </button>
      )}

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-xs text-gray-400 text-center">
        {t("wiki.article.lastUpdated")} {lastUpdatedDate}
      </div>
    </div>
  );
}

