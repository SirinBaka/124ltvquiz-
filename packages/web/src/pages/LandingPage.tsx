import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/Button";
import {
  ChevronRight,
  ChevronDown,
  Globe,
  Menu,
  X,
  Home,
  Sparkles,
  Users,
  MessageSquare,
  HelpCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useLanguage, getHeroPhrases } from "../i18n";
import { KahootLoader } from "../components/KahootLoader";
import { TypewriterHeadline } from "../components/TypewriterHeadline";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { FAQAccordion } from "../components/FAQAccordion";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { InteractiveFeatureExplorer } from "../components/InteractiveFeatureExplorer";
import { Reveal } from "../components/Reveal";
import {
  computeHeroScrollTransforms,
  computeScrollProgress,
  prefersReducedMotion,
} from "../components/motion/motionHelper";

export function LandingPage() {
  useDocumentTitle("A4 LTVQuiz - Home");
  const { lang, setLang, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroPreviewRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let rafId: number | null = null;
    const reduced = prefersReducedMotion();

    const applyScrollMotion = () => {
      rafId = null;
      const y = window.scrollY;
      setIsScrolled((prev) => {
        const next = y > 20;
        return prev === next ? prev : next;
      });

      const docProgress = computeScrollProgress(
        y,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      if (scrollProgressRef.current) {
        scrollProgressRef.current.style.transform = `scaleX(${docProgress})`;
      }

      if (reduced) return;

      const {
        heroTranslateY,
        heroOpacity,
        previewScale,
        previewRotateX,
        previewTranslateY,
        cueOpacity,
      } = computeHeroScrollTransforms(y);

      if (heroContentRef.current) {
        heroContentRef.current.style.transform = `translate3d(0, ${heroTranslateY.toFixed(2)}px, 0)`;
        heroContentRef.current.style.opacity = heroOpacity.toFixed(3);
      }

      if (heroPreviewRef.current) {
        heroPreviewRef.current.style.transform = `perspective(1200px) translate3d(0, ${previewTranslateY.toFixed(2)}px, 0) scale(${previewScale.toFixed(4)}) rotateX(${previewRotateX.toFixed(2)}deg)`;
      }

      if (scrollCueRef.current) {
        scrollCueRef.current.style.opacity = cueOpacity.toFixed(3);
        scrollCueRef.current.style.pointerEvents =
          cueOpacity <= 0.05 ? "none" : "auto";
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyScrollMotion);
      }
    };

    applyScrollMotion();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const toggleLang = () => {
    setLang(lang === "vi" ? "en" : "vi");
  };

  const handleStart = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 700);
  };

  const currentHeroPhrases = getHeroPhrases(lang);

  return (
    <>
      {isLoading && (
        <KahootLoader text={t("landing.loading") || "Đang tải hệ thống..."} />
      )}
      <div
        className={`min-h-dvh flex flex-col bg-[var(--color-background)] font-sans transition-opacity duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isLoading ? "opacity-90" : "opacity-100"}`}
      >
        {/* Header */}
        <header
          className={`border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-6 lg:px-12 bg-[var(--color-surface)]/90 backdrop-blur-md fixed top-0 w-full z-50 transition-[height,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] animate-nav-reveal ${isScrolled ? "h-14 shadow-sm" : "h-16 shadow-none"}`}
        >
          {/* Apple-style hairline scroll progress */}
          <div
            ref={scrollProgressRef}
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]/80 origin-left transform-gpu pointer-events-none"
            style={{ transform: "scaleX(0)" }}
          />
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/a4-logo.png"
              alt="A4 Class LTV"
              className="w-8 h-8 object-contain transition-transform duration-300 hover:scale-110"
            />
            <span className="font-bold text-lg sm:text-xl tracking-tight text-[var(--color-text)]">
              A4 <span className="text-[var(--color-primary)]">LTVQuiz</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[var(--color-text-secondary)]">
            <a
              href="#"
              className="hover:text-[var(--color-primary)] transition-colors duration-[140ms] nav-link-underline pb-1"
            >
              {t("nav.home")}
            </a>
            <a
              href="#about"
              className="hover:text-[var(--color-primary)] transition-colors duration-[140ms] nav-link-underline pb-1"
            >
              {t("nav.about")}
            </a>
            <a
              href="#founder"
              className="hover:text-[var(--color-primary)] transition-colors duration-[140ms] nav-link-underline pb-1"
            >
              {t("nav.founder")}
            </a>
            <a
              href="#faq"
              className="hover:text-[var(--color-primary)] transition-colors duration-[140ms] nav-link-underline pb-1"
            >
              {t("nav.faq")}
            </a>
            <Link
              to="/wiki"
              className="hover:text-[var(--color-primary)] transition-colors duration-[140ms] nav-link-underline pb-1"
            >
              {t("nav.wiki")}
            </Link>
          </nav>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <button
              onClick={toggleLang}
              className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/50 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
              title="Toggle Language"
            >
              <Globe
                size={18}
                key={`globe-${lang}`}
                className="animate-icon-spin-in shrink-0"
              />
              <span
                key={`text-${lang}`}
                className="text-xs font-bold uppercase animate-text-flip-in inline-block"
              >
                {lang}
              </span>
            </button>
            <ThemeToggle />

            {/* Desktop Start/Login Buttons */}
            <button
              onClick={handleStart}
              className="hidden lg:block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              {t("landing.header.login")}
            </button>
            <Button
              variant="primary"
              onClick={handleStart}
              loaderText={t("landing.loading")}
              className="hidden sm:inline-flex h-9 px-4 text-xs font-semibold"
            >
              {t("landing.header.start")}
            </Button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden grid size-11 shrink-0 place-items-center rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/50 transition-colors"
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={22} className="animate-fade-in" />
              ) : (
                <Menu size={22} className="animate-fade-in" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer for Android & Mobile */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden animate-fade-in">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide Down Sheet Container */}
            <div className="relative z-50 max-h-dvh overflow-y-auto overscroll-contain bg-[var(--color-surface)] border-b border-[var(--color-border)] pt-20 pb-6 px-6 shadow-2xl flex flex-col space-y-4 animate-fade-in-down">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Menu điều hướng
                </span>
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  A4 LTVQuiz Mobile
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-1">
                <a
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <Home
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>{t("nav.home")}</span>
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <Sparkles
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>{t("nav.about")}</span>
                </a>
                <a
                  href="#founder"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <Users
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>{t("nav.founder")}</span>
                </a>
                <a
                  href="#community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <MessageSquare
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>Cộng đồng Zalo</span>
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <HelpCircle
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>{t("nav.faq")}</span>
                </a>
                <Link
                  to="/wiki"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-background)] active:bg-[var(--color-background)] transition-colors"
                >
                  <BookOpen
                    size={18}
                    className="text-[var(--color-primary)] shrink-0"
                  />
                  <span>{t("nav.wiki")} (Tra cứu)</span>
                </Link>
              </nav>

              {/* Action Buttons in Drawer */}
              <div className="pt-2 flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleStart}
                  loaderText={t("landing.loading")}
                  className="h-12 w-full text-sm font-bold justify-center shadow-md"
                >
                  <span>{t("landing.header.start")}</span>
                  <ArrowRight size={16} />
                </Button>
                <button
                  onClick={handleStart}
                  className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-semibold text-[var(--color-text)] flex items-center justify-center transition-colors active:scale-98"
                >
                  {t("landing.header.login")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <main className="flex-1 pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <div ref={heroContentRef} className="transform-gpu will-change-transform">
              <Reveal delay={0}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--color-text)] tracking-tight leading-snug sm:leading-tight max-w-4xl mx-auto">
                  {t("landing.hero.title1")} <br className="hidden md:block" />
                  <span className="text-[var(--color-primary)] inline-flex min-h-[1.4em] sm:min-h-[1.5em] items-center">
                    <TypewriterHeadline
                      key={`hero-${lang}`}
                      phrases={currentHeroPhrases}
                    />
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={50}>
                <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                  {t("landing.hero.desc")}
                </p>
              </Reveal>

              <Reveal delay={100}>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
                  <Button
                    variant="primary"
                    onClick={handleStart}
                    loaderText={t("landing.loading")}
                    className="h-12 px-8 text-sm sm:text-base w-full sm:w-auto justify-center shadow-md"
                  >
                    {t("landing.hero.btn1")}
                  </Button>
                  <a href="#about" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      className="h-12 px-8 text-sm sm:text-base flex items-center justify-center gap-2 w-full"
                    >
                      {t("landing.hero.btn2")} <ChevronRight size={18} />
                    </Button>
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Apple-style Scroll-Down Cue */}
            <Reveal delay={140} direction="none" className="mt-7 sm:mt-9 flex justify-center">
              <a
                ref={scrollCueRef}
                href="#about"
                className="group inline-flex flex-col items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transform-gpu transition-[color,opacity] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer select-none"
                aria-label={t("landing.hero.scrollCue")}
              >
                <span className="tracking-wide">{t("landing.hero.scrollCue")}</span>
                <span className="w-7 h-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xs flex items-center justify-center shadow-2xs group-hover:border-[var(--color-primary)]/40 transition-colors">
                  <ChevronDown size={14} className="animate-scroll-cue" />
                </span>
              </a>
            </Reveal>

            {/* Product Preview Mockup with 60fps Scroll-Driven Perspective Settle */}
            <Reveal
              delay={160}
              className="mt-6 sm:mt-10 md:mt-14 relative max-w-5xl mx-auto"
            >
              <div
                ref={heroPreviewRef}
                className="transform-gpu will-change-transform rounded-2xl sm:rounded-[var(--radius-xl)] overflow-hidden shadow-[0_12px_36px_-8px_rgba(0,0,0,0.12)] sm:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <img
                  src="/dashboard-preview.png"
                  alt={t("landing.hero.previewAlt")}
                  className="w-full h-auto object-cover block"
                />
              </div>
            </Reveal>
          </div>
        </main>

        <InteractiveFeatureExplorer />

        {/* Founder Section */}
        <section
          id="founder"
          className="scroll-mt-16 sm:scroll-mt-20 py-16 sm:py-24 bg-[var(--color-background)] border-t border-[var(--color-border)]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <Reveal delay={0}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--color-text)] mb-8 sm:mb-12">
                {t("landing.founder.title")}
              </h2>
            </Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-center">
                {/* Founder 1 */}
                <Reveal delay={40} className="h-full">
                <div className="bg-[var(--color-surface)] p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-sm flex flex-col h-full transform-gpu hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow,border-color] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-5 sm:mb-6 overflow-hidden shrink-0">
                    <img
                      src="/cofounder.jpg"
                      alt="Phùng Tấn Đạt"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1">
                    Phùng Tấn Đạt
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6">
                    {t("landing.founder1.role")}
                  </p>
                  <p className="text-sm sm:text-lg leading-relaxed text-[var(--color-text)] italic mb-6 sm:mb-8 grow">
                    {t("landing.founder1.quote")}
                  </p>
                  <a
                    href="https://zalo.me/0898856478"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full sm:w-auto"
                  >
                    <Button
                      variant="secondary"
                      className="h-11 px-6 flex items-center justify-center gap-2 mx-auto w-full sm:w-auto !text-[#0068ff] !border-[#0068ff] hover:!bg-[#0068ff]/10 active:scale-98"
                    >
                      <img
                        src="/zalo-logo.png"
                        alt="Zalo"
                        className="h-5 w-auto object-contain"
                      />
                      {t("landing.founder.contactZalo")}
                    </Button>
                  </a>
                </div>
                </Reveal>

                {/* Founder 2 */}
                <Reveal delay={120} className="h-full">
                <div className="bg-[var(--color-surface)] p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-sm flex flex-col h-full transform-gpu hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow,border-color] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-5 sm:mb-6 overflow-hidden shrink-0">
                    <img
                      src="/founder.png"
                      alt="Lê Việt Tân"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1">
                    Lê Việt Tân
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6">
                    {t("landing.founder2.role")}
                  </p>
                  <p className="text-sm sm:text-lg leading-relaxed text-[var(--color-text)] italic mb-6 sm:mb-8 grow">
                    {t("landing.founder2.quote")}
                  </p>
                  <a
                    href="https://zalo.me/0901105860"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full sm:w-auto"
                  >
                    <Button
                      variant="secondary"
                      className="h-11 px-6 flex items-center justify-center gap-2 mx-auto w-full sm:w-auto !text-[#0068ff] !border-[#0068ff] hover:!bg-[#0068ff]/10 active:scale-98"
                    >
                      <img
                        src="/zalo-logo.png"
                        alt="Zalo"
                        className="h-5 w-auto object-contain"
                      />
                      {t("landing.founder.contactZalo")}
                    </Button>
                  </a>
                </div>
                </Reveal>
              </div>
          </div>
        </section>

        {/* Zalo Community Section */}
        <section
          id="community"
          className="scroll-mt-16 sm:scroll-mt-20 py-16 sm:py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <Reveal>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-6 sm:mb-8">
                {t("landing.community.title")}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="bg-[var(--color-background)] p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-sm flex flex-col items-center">
                <div className="mb-6">
                  <img
                    src="/zalo-qr.png"
                    alt="Zalo QR Code"
                    className="w-auto h-auto max-w-[220px] sm:max-w-sm mx-auto rounded-xl shadow-xs"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                <p className="text-sm sm:text-lg leading-relaxed text-[var(--color-text)] italic mb-6 sm:mb-8 max-w-xl text-center">
                  {t("landing.community.desc")}
                </p>
                <a
                  href="https://zalo.me/g/tumztbc1hfpy2vzmarpw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    className="h-12 px-8 text-sm sm:text-base flex items-center justify-center gap-2 mx-auto w-full sm:w-auto !bg-[#0068ff] hover:!bg-[#0052cc] active:scale-98 shadow-md"
                  >
                    <img
                      src="/zalo-logo.png"
                      alt="Zalo"
                      className="h-6 w-auto object-contain brightness-0 invert"
                    />
                    {t("landing.community.btn")}
                  </Button>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="scroll-mt-16 sm:scroll-mt-20 py-16 sm:py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-8 sm:mb-12">
              <Reveal>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
                  {t("landing.faq.title")}
                </h2>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <FAQAccordion />
            </Reveal>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-[var(--color-background)] border-t border-[var(--color-border)] overflow-hidden">
          <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-4 sm:mb-6">
              {t("landing.cta.title")}
            </h2>
            <p className="text-sm sm:text-lg text-[var(--color-text-secondary)] mb-6 sm:mb-8">
              {t("landing.cta.desc")}
            </p>
            <Button
              variant="primary"
              onClick={handleStart}
              loaderText={t("landing.loading")}
              className="h-12 px-8 text-sm sm:text-base w-full sm:w-auto justify-center max-w-xs mx-auto active:scale-98 shadow-md"
            >
              {t("landing.cta.btn")}
            </Button>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--color-background)] py-8 sm:py-12 flex justify-center pb-20 sm:pb-24">
          <div className="w-full max-w-4xl mx-4 sm:mx-6 px-6 py-5 flex flex-col sm:flex-row items-center justify-between rounded-2xl sm:rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-[box-shadow,border-color] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-md gap-4 sm:gap-0">
            <div className="flex items-center gap-2">
              <img
                src="/a4-logo.png"
                alt="A4 Class LTV"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-[var(--color-text)] tracking-wide">
                A4 LTVQuiz
              </span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
              <a
                href="#about"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {t("landing.footer.about")}
              </a>
              <a
                href="#community"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {t("landing.footer.community")}
              </a>
              <a
                href="#faq"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {t("landing.footer.faq")}
              </a>
              <Link
                to="/wiki"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {t("landing.footer.wiki")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
