import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  BookOpen,
  Clock,
  Tag,
  MessageSquare,
  Compass,
  Info,
  Phone,
  Globe,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLanguage } from "../../i18n";
import { ThemeToggle } from "../../components/theme/ThemeToggle";
import { KahootLoader } from "../../components/KahootLoader";

export function WikiLayout() {
  useDocumentTitle("A4 LTVQuiz - Wiki");
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang, t } = useLanguage();
  const [topQuery, setTopQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
    setIsMobileSearchOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  const handleTopSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && topQuery.trim()) {
      navigate(`/wiki/search?q=${encodeURIComponent(topQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topQuery.trim()) {
      navigate(`/wiki/search?q=${encodeURIComponent(topQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-2">
          {t("wiki.sidebar.explore")}
        </h3>
        <ul className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]">
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "overview" : "tổng quan")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] active:scale-98 transition-all"
            >
              <Compass size={17} className="text-blue-500" />
              <span>{t("wiki.sidebar.featured")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "guide" : "hướng dẫn")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] active:scale-98 transition-all"
            >
              <Clock size={17} className="text-emerald-500" />
              <span>{t("wiki.sidebar.recent")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "quiz" : "câu hỏi")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] active:scale-98 transition-all"
            >
              <Tag size={17} className="text-purple-500" />
              <span>{t("wiki.sidebar.popular")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "glossary" : "thuật ngữ")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-primary)] active:scale-98 transition-all"
            >
              <BookOpen size={17} className="text-amber-500" />
              <span>{t("wiki.sidebar.glossary")}</span>
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-2">
          {t("wiki.sidebar.ltvquiz")}
        </h3>
        <ul className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]">
          <li>
            <Link
              to="/wiki/article/tong-quan-ve-ltvquiz"
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all active:scale-98 ${
                isLinkActive("/wiki/article/tong-quan-ve-ltvquiz")
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                  : "hover:bg-[var(--color-background)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
              <span>{t("wiki.sidebar.intro")}</span>
            </Link>
          </li>
          <li>
            <Link
              to="/wiki/article/huong-dan-bat-dau-su-dung-ltvquiz"
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all active:scale-98 ${
                isLinkActive("/wiki/article/huong-dan-bat-dau-su-dung-ltvquiz")
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                  : "hover:bg-[var(--color-background)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{t("wiki.sidebar.getStarted")}</span>
            </Link>
          </li>
          <li>
            <Link
              to="/wiki/article/quy-trinh-tao-bai-kiem-tra"
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all active:scale-98 ${
                isLinkActive("/wiki/article/quy-trinh-tao-bai-kiem-tra")
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                  : "hover:bg-[var(--color-background)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>{t("wiki.sidebar.createQuiz")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "document" : "quản lý tài liệu")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>{t("wiki.sidebar.docManage")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "quiz management" : "quản lý đề thi")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>{t("wiki.sidebar.examManage")}</span>
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-2">
          {t("wiki.sidebar.info")}
        </h3>
        <ul className="space-y-1 text-sm font-medium text-[var(--color-text-secondary)]">
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "history" : "lịch sử")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <Clock size={17} className="text-orange-500" />
              <span>{t("wiki.sidebar.history")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "updates" : "cập nhật")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <Info size={17} className="text-cyan-500" />
              <span>{t("wiki.sidebar.updates")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "faq" : "câu hỏi thường gặp")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <MessageSquare size={17} className="text-teal-500" />
              <span>{t("wiki.sidebar.faq")}</span>
            </Link>
          </li>
          <li>
            <Link
              to={`/wiki/search?q=${encodeURIComponent(lang === "en" ? "support" : "liên hệ")}`}
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--color-background)] hover:text-[var(--color-text)] active:scale-98 transition-all"
            >
              <Phone size={17} className="text-rose-500" />
              <span>{t("wiki.sidebar.support")}</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-background)] font-sans antialiased text-[var(--color-text)]">
      {/* Header */}
      <header className="h-14 border-b border-[var(--color-border)] flex items-center justify-between gap-1.5 px-2 sm:px-6 bg-[var(--color-surface)]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Mobile Hamburger Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden grid size-11 shrink-0 place-items-center text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-xl active:scale-95 transition-all touch-manipulation"
            aria-label="Mở danh mục Wiki"
            aria-expanded={isMobileDrawerOpen}
          >
            <Menu size={20} />
          </button>

          <Link to="/wiki" className="flex items-center gap-2 group">
            <img
              src="/a4-logo.png"
              alt="A4 Class LTV"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--color-text)] flex items-center gap-1.5">
              <span>LTVQuiz</span>
              <span className="text-[var(--color-primary)] px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-xs sm:text-sm font-semibold">
                Wiki
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Desktop Search Input */}
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={topQuery}
              onChange={(e) => setTopQuery(e.target.value)}
              onKeyDown={handleTopSearch}
              placeholder={t("wiki.searchPlaceholder")}
              className="pl-9 pr-4 py-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-full text-xs sm:text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all w-48 lg:w-64"
            />
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden grid size-11 shrink-0 place-items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] rounded-full transition-colors active:scale-95 touch-manipulation"
            aria-label="Tìm kiếm trong Wiki"
            aria-expanded={isMobileSearchOpen}
          >
            {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="hidden sm:flex p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] rounded-full transition-colors items-center gap-1 cursor-pointer touch-manipulation active:scale-95"
            title="Đổi ngôn ngữ / Toggle Language"
          >
            <Globe
              size={17}
              key={`globe-${lang}`}
              className="animate-icon-spin-in text-[var(--color-text-secondary)]"
            />
            <span
              key={`text-${lang}`}
              className="text-xs font-bold uppercase animate-text-flip-in inline-block"
            >
              {lang}
            </span>
          </button>

          <ThemeToggle />

          {/* Back to Quiz Button */}
          <Link
            to="/"
            aria-label={t("wiki.backToQuiz")}
            className="flex min-h-11 min-w-11 md:min-h-9 items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 sm:px-3.5 text-sm font-medium hover:bg-[var(--color-surface-hover)] touch-manipulation"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{t("wiki.backToQuiz")}</span>
          </Link>
        </div>
      </header>

      {/* Expandable Mobile Search Dropdown */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 animate-search-down z-30 shadow-sm">
          <form onSubmit={handleMobileSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400" size={16} />
            <input
              type="search"
              autoFocus
              value={topQuery}
              onChange={(e) => setTopQuery(e.target.value)}
              placeholder={t("wiki.searchPlaceholder")}
              className="w-full pl-9 pr-9 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]"
            />
            {topQuery && (
              <button
                type="button"
                onClick={() => setTopQuery("")}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Mobile Android Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 w-[84vw] max-w-[320px] bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl flex flex-col z-50 animate-drawer-in overflow-hidden">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
              <div className="flex items-center gap-2">
                <img
                  src="/a4-logo.png"
                  alt="A4 Class LTV"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-bold text-base text-[var(--color-text)] tracking-tight">
                  A4 LTVQuiz <span className="text-[var(--color-primary)]">Wiki</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] active:scale-95 transition-all"
                aria-label="Đóng danh mục"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-3.5 border-b border-[var(--color-border)] bg-[var(--color-background)]/40">
              <form onSubmit={handleMobileSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  value={topQuery}
                  onChange={(e) => setTopQuery(e.target.value)}
                  placeholder={t("wiki.searchPlaceholder")}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </form>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              {renderNavLinks(() => setIsMobileDrawerOpen(false))}
            </div>

            {/* Drawer Footer */}
            <div className="p-3.5 border-t border-[var(--color-border)] bg-[var(--color-background)]/60 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span className="font-medium">Phiên bản 1.0 (Android Ready)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="px-2 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] font-bold text-[11px] uppercase text-[var(--color-text)]"
                >
                  {lang}
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
        {/* Desktop Fixed Sidebar */}
        <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] hidden lg:block overflow-y-auto sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="p-5">{renderNavLinks()}</div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-[var(--color-background)] pb-[env(safe-area-inset-bottom)]">
          <Suspense fallback={<KahootLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-12 mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center md:text-left grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <img
                src="/a4-logo.png"
                alt="A4 Class LTV"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-lg text-[var(--color-text)]">
                A4 LTVQuiz Wiki
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto md:mx-0">
              {t("wiki.footer.desc")}
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <Link
                to="/wiki"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.home")}
              </Link>
              <Link
                to="/wiki/search?q=category"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.categories")}
              </Link>
              <Link
                to="/wiki/search?q=guide"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.guide")}
              </Link>
              <Link
                to="/wiki/search?q=history"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.history")}
              </Link>
              <Link
                to="/wiki/search?q=support"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.support")}
              </Link>
              <Link
                to="/wiki/article/tong-quan-ve-ltvquiz"
                className="hover:text-[var(--color-primary)] transition-colors"
              >
                {t("wiki.footer.intro")}
              </Link>
            </nav>
            <p className="text-xs text-gray-400 mt-4 max-w-sm text-center md:text-right">
              {t("wiki.footer.disclaimer")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
