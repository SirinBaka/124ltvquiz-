import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  ListOrdered,
  FolderKanban,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  Globe,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Shuffle,
} from "lucide-react";
import { useLanguage } from "../i18n";
import { ThemeToggle } from "./theme/ThemeToggle";
import { KahootLoader } from "./KahootLoader";

interface NavGroup {
  title: string;
  items: {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: string;
  }[];
}

export function Layout() {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const mobileMenuButton = useRef<HTMLButtonElement>(null);
  const mobileMenuCloseButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const [userName, setUserName] = useState("Lê Việt Tân");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ltvquiz_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accountName) setUserName(parsed.accountName);
      }
    } catch {}
  }, [location.pathname]);

  const userInitials = useMemo(() => {
    if (userName === "Lê Việt Tân") return "LVT";
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase() || "LVT";
  }, [userName]);

  const navGroups: NavGroup[] = [
    {
      title: "Không gian làm việc",
      items: [
        {
          label: t("nav.dashboard") || "Tổng quan",
          icon: <LayoutDashboard size={18} className="shrink-0" />,
          path: "/dashboard",
        },
        {
          label: t("nav.create") || "Tạo đề thi",
          icon: <FilePlus2 size={18} className="shrink-0" />,
          path: "/dashboard/create",
        },
        {
          label: "Xáo mã đề",
          icon: <Shuffle size={18} className="shrink-0" />,
          path: "/dashboard/shuffle",
        },
        {
          label: "Kho đề",
          icon: <FolderKanban size={18} className="shrink-0" />,
          path: "/dashboard/library",
        },
        {
          label: t("nav.quizzes") || "Quản lý bài thi",
          icon: <ListOrdered size={18} className="shrink-0" />,
          path: "/dashboard/quizzes",
        },
        {
          label: t("nav.documents") || "Tài liệu & Thư viện",
          icon: <FileText size={18} className="shrink-0" />,
          path: "/dashboard/documents",
        },
      ],
    },
    {
      title: "Theo dõi & Báo cáo",
      items: [
        {
          label: t("nav.results") || "Kết quả thí sinh",
          icon: <GraduationCap size={18} className="shrink-0" />,
          path: "/dashboard/results",
        },
        {
          label: t("nav.statistics") || "Thống kê số liệu",
          icon: <BarChart3 size={18} className="shrink-0" />,
          path: "/dashboard/statistics",
        },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          label: t("nav.settings") || "Cài đặt & Tài khoản",
          icon: <Settings size={18} className="shrink-0" />,
          path: "/dashboard/settings",
        },
      ],
    },
  ];

  const toggleLang = () => setLang(lang === "vi" ? "en" : "vi");
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    if (mobileMenuOpen) mobileMenuButton.current?.focus({ preventScroll: true });
  };
  const isExpanded = mobileMenuOpen || sidebarHovered;

  useEffect(() => {
    if (mobileMenuOpen) mobileMenuCloseButton.current?.focus({ preventScroll: true });
  }, [mobileMenuOpen]);

  // Derive current section name for breadcrumb
  const currentSectionName = (() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.path === location.pathname) return item.label;
      }
    }
    if (location.pathname.startsWith("/dashboard/create")) return "Tạo bài thi";
    if (location.pathname.startsWith("/dashboard/shuffle")) return "Xáo mã đề";
    if (location.pathname.startsWith("/dashboard/library")) return "Kho đề";
    if (location.pathname.startsWith("/dashboard/quizzes")) return "Quản lý bài thi";
    if (location.pathname.startsWith("/dashboard/documents")) return "Tài liệu & Thư viện";
    return "Bảng điều khiển";
  })();

  return (
    <div className="min-h-dvh bg-[var(--color-background)] flex flex-col lg:flex-row text-[var(--color-text)] font-sans antialiased selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-primary)]">
      {/* Mobile Backdrop */}
      {!fullscreenMode && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Compact Hover-Expand Sidebar */}
      {!fullscreenMode && (
        <aside
          id="dashboard-navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape" && mobileMenuOpen) closeMobileMenu();
          }}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={`fixed inset-y-0 left-0 z-50 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transform-gpu transition-[width,box-shadow,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] lg:translate-x-0 overflow-hidden ${
            mobileMenuOpen
              ? "w-64 translate-x-0 shadow-xl"
              : isExpanded
                ? "invisible lg:visible w-64 -translate-x-full lg:w-64 lg:shadow-2xl"
                : "invisible lg:visible w-64 -translate-x-full lg:w-[68px]"
          }`}
        >
          {/* Brand Header */}
          <div className="h-14 flex items-center justify-between px-[18px] border-b border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
            <Link
              to="/"
              className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-md min-w-0"
              onClick={closeMobileMenu}
              title="12/4 LTVQuiz - Trang chủ"
            >
              <img
                src="/a4-logo.png"
                alt="12/4 LTVQuiz"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div
                className={`flex flex-col min-w-[140px] ml-2.5 whitespace-nowrap transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 pointer-events-none"
                }`}
              >
                <span className="font-bold text-sm tracking-tight text-[var(--color-text)] leading-tight">
                  12/4 LTVQuiz
                </span>
                <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                  Hệ thống Luyện thi
                </span>
              </div>
            </Link>

            <button
              ref={mobileMenuCloseButton}
              onClick={closeMobileMenu}
              className="grid size-11 place-items-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] lg:hidden transition-colors"
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Grouped Navigation */}
          <nav aria-label="Điều hướng bảng điều khiển" className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 space-y-2 custom-scrollbar text-xs">
            {navGroups.map((group, groupIdx) => (
              <div key={group.title} className="space-y-1">
                {/* Fixed-height slot prevents vertical layout jump when hovering */}
                <div className="h-5 relative flex items-center px-2.5 select-none">
                  {groupIdx > 0 && (
                    <div
                      className={`absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-[var(--color-border)] transition-opacity duration-200 ${
                        isExpanded ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] whitespace-nowrap transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isExpanded
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-1.5 pointer-events-none"
                    }`}
                  >
                    {group.title}
                  </span>
                </div>

                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    onClick={closeMobileMenu}
                    title={!isExpanded ? item.label : undefined}
                    className={({ isActive }) =>
                      `group/item flex min-h-11 lg:min-h-0 items-center px-[13px] py-2 rounded-lg transition-colors duration-200 select-none ${
                        isActive
                          ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)] font-semibold shadow-2xs"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                      }`
                    }
                  >
                    <span className="shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:scale-105">
                      {item.icon}
                    </span>

                    <span
                      className={`text-[13px] leading-tight whitespace-nowrap ml-3 min-w-[150px] transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2 pointer-events-none"
                      }`}
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] ml-auto shrink-0 transition-opacity duration-200 ${
                          isExpanded ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* User Account / Profile Area at bottom */}
          <div className="p-3 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
            <Link
              to="/dashboard/settings"
              onClick={closeMobileMenu}
              className="flex items-center p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] transition-colors duration-200 group"
              title={!isExpanded ? `${userName} — Cài đặt tài khoản` : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {userInitials}
              </div>
              <div
                className={`flex items-center min-w-[168px] ml-2.5 whitespace-nowrap transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 pointer-events-none"
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                    {userName}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
                    admin@ltvquiz.edu.vn
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ml-1"
                />
              </div>
            </Link>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-dvh min-w-0 transition-[margin] duration-200 ${
          fullscreenMode ? "" : "lg:ml-[68px]"
        }`}
      >
        {/* Top Header */}
        {!fullscreenMode && (
          <header className="min-h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-30 shadow-2xs">
            {/* Left: Mobile hamburger & desktop breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={mobileMenuButton}
                onClick={() => setMobileMenuOpen(true)}
                aria-controls="dashboard-navigation"
                aria-expanded={mobileMenuOpen}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] lg:hidden transition-colors"
                aria-label="Mở menu"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] font-medium truncate">
                <span className="hidden sm:inline text-[var(--color-text-muted)]">
                  12/4 LTVQuiz
                </span>
                <span className="hidden sm:inline text-[var(--color-text-muted)]">/</span>
                <span className="font-semibold text-[var(--color-text)] truncate">
                  {currentSectionName}
                </span>
              </div>
            </div>

            {/* Right: Quick actions (View Landing, Theme & Language) */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] transition-colors"
                title="Xem trang giới thiệu"
              >
                <span>Trang chủ</span>
                <ExternalLink size={12} className="opacity-70" />
              </Link>

              <div className="h-4 w-px bg-[var(--color-border)] hidden lg:block mx-0.5" />

              <ThemeToggle />

              <button
                onClick={toggleLang}
                className="flex min-h-11 lg:min-h-0 items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors text-xs font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] shadow-2xs cursor-pointer"
                title="Đổi ngôn ngữ giao diện (VI / EN)"
              >
                <Globe size={13} className="text-[var(--color-primary)]" />
                <span>{lang.toUpperCase()}</span>
              </button>
            </div>
          </header>
        )}

        {/* Page Content Viewport */}
        <main
          className={
            fullscreenMode
              ? "h-dvh overflow-hidden w-full min-w-0"
              : "p-3 sm:p-6 lg:p-7 flex-1 w-full max-w-7xl mx-auto min-w-0"
          }
        >
          <div
            key={location.pathname}
            className={fullscreenMode ? "h-full" : "animate-page-enter"}
          >
            <Suspense fallback={<KahootLoader />}>
              <Outlet context={{ setFullscreenMode }} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
