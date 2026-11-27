import { useSearchParams, Link } from "react-router-dom";
import { Search, AlertCircle, HelpCircle, X } from "lucide-react";
import { searchArticles } from "../../lib/wikiSearch";
import { WIKI_ARTICLES } from "../../data/wikiArticles";
import { Button } from "../../components/Button";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../../i18n";
import {
  getCategoryName,
  getLocalizedStatus,
  getLocalizedMatchType,
} from "./wikiI18nHelper";

export function WikiSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const { lang, t } = useLanguage();

  useDocumentTitle(
    q
      ? lang === "en"
        ? `Search: ${q} - LTVQuiz Wiki`
        : `Tìm kiếm: ${q} - LTVQuiz Wiki`
      : lang === "en"
        ? "Wiki Search - LTVQuiz"
        : "Tìm kiếm Wiki - LTVQuiz",
  );

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const results = useMemo(() => {
    return searchArticles(q, WIKI_ARTICLES);
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
  };

  return (
    <div className="py-6 sm:py-10 px-3.5 sm:px-6 lg:px-12 max-w-4xl mx-auto min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] mb-3 sm:mb-5 tracking-tight">
          {t("wiki.search.title")}
        </h1>
        <form onSubmit={handleSearch} className="relative">
          <Search
            className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("wiki.search.placeholder")}
            className="w-full pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 sm:py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-sm sm:text-base text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg active:scale-95"
                aria-label="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              className="bg-[var(--color-primary)] text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all touch-manipulation"
            >
              {t("wiki.search.btn")}
            </button>
          </div>
        </form>
      </div>

      <div>
        {q && (
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6">
            {t("wiki.search.found")} <strong>{results.length}</strong>{" "}
            {t("wiki.search.resultsFor")} "{q}"
          </p>
        )}

        {!q && (
          <div className="text-center py-16 sm:py-20 text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <Search className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={40} />
            <p className="text-sm font-medium">{t("wiki.search.emptyPrompt")}</p>
          </div>
        )}

        {q && results.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xs">
            <AlertCircle className="mx-auto mb-3 text-amber-500" size={42} />
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-2">
              {t("wiki.search.noMatchTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
              {t("wiki.search.noMatchDesc")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/wiki/search?q=category">
                <Button variant="secondary" className="text-xs sm:text-sm">
                  {t("wiki.search.viewCategories")}
                </Button>
              </Link>
              <Link to="/wiki/search?q=support">
                <Button variant="primary" className="text-xs sm:text-sm">
                  {t("wiki.search.contactSupport")}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-3.5 sm:space-y-4">
          {results.map((result, idx) => (
            <Link
              key={idx}
              to={`/wiki/article/${result.article.id}`}
              className="block bg-[var(--color-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] active:scale-[0.99] transition-all group shadow-2xs touch-manipulation"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-primary)] group-hover:underline leading-snug">
                  {result.article.title}
                </h3>
                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 bg-[var(--color-background)] text-[var(--color-text-secondary)] rounded-md border border-[var(--color-border)]">
                  {getCategoryName(result.article.categoryId, lang)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed line-clamp-2">
                {result.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)] border-t border-[var(--color-border)]/50 pt-2.5">
                <span className="flex items-center gap-1 font-medium">
                  <HelpCircle size={13} className="text-blue-500" />
                  <span>{getLocalizedMatchType(result.matchType, lang)}</span>
                </span>
                {result.article.status === "verified" && (
                  <span className="text-emerald-600 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10">
                    {getLocalizedStatus("verified", lang)}
                  </span>
                )}
                {result.article.status === "conditional" && (
                  <span className="text-amber-600 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10">
                    {getLocalizedStatus("conditional", lang)}
                  </span>
                )}
                {result.article.status === "needs_verification" && (
                  <span className="text-blue-600 font-semibold px-1.5 py-0.5 rounded bg-blue-500/10">
                    {getLocalizedStatus("needs_verification", lang)}
                  </span>
                )}
                {result.article.status === "unavailable" && (
                  <span className="text-rose-600 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10">
                    {getLocalizedStatus("unavailable", lang)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
