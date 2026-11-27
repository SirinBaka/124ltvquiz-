import React, { useState, useRef, useEffect } from "react";
import {
  FileUp,
  SquarePen,
  CheckSquare,
  Calculator,
  Share2,
  GraduationCap,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Zap,
  HelpCircle,
} from "lucide-react";
import { RichText } from "./RichText";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";

import { useLanguage } from "../i18n";

export interface ExplorerFeature {
  id: string;
  step: string;
  badge: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ElementType;
  highlights: string[];
  routePath: string;
  previewType:
    "extract" | "editor" | "truefalse" | "math" | "management" | "student";
}

const featuresVi: ExplorerFeature[] = [
  {
    id: "extract",
    step: "01",
    badge: "Tự động hóa",
    title: "Tải & bóc tách tài liệu",
    shortDesc: "Chuyển đổi file PDF, DOCX, TXT thành bộ câu hỏi tự động.",
    fullDesc:
      "Hệ thống tự động phân tích cấu trúc tài liệu, bóc tách câu hỏi, nhận diện các lựa chọn A/B/C/D và phát hiện đáp án sẵn có chỉ trong vài giây.",
    icon: FileUp,
    highlights: [
      "Tự động nhận diện câu hỏi & các phương án A/B/C/D",
      "Hỗ trợ định dạng PDF, Word (DOCX), TXT, Markdown",
      "Phân tích lỗi định dạng và đưa ra gợi ý điều chỉnh",
    ],
    routePath: "/dashboard/create",
    previewType: "extract",
  },
  {
    id: "editor",
    step: "02",
    badge: "Trình soạn thảo",
    title: "Biên tập câu hỏi trực quan",
    shortDesc: "Tùy chỉnh nội dung, xáo trộn đáp án và cài đặt điểm số.",
    fullDesc:
      "Giao diện biên tập linh hoạt giúp bạn xem trước câu hỏi theo định dạng thực tế, đổi đáp án đúng chỉ bằng 1 click và xáo trộn vị trí phương án dễ dàng.",
    icon: SquarePen,
    highlights: [
      "Chỉnh sửa trực tiếp với xem trước thời gian thực",
      "Tùy chỉnh số lượng phương án (3 - 6 phương án)",
      "Tự động xáo trộn thứ tự câu hỏi và đáp án khi ra đề",
    ],
    routePath: "/dashboard/quizzes",
    previewType: "editor",
  },
  {
    id: "truefalse",
    step: "03",
    badge: "Chuẩn Bộ GD&ĐT",
    title: "Hỗ trợ câu hỏi Đúng / Sai",
    shortDesc: "Tổ chức câu hỏi Đúng/Sai theo chuẩn cấu trúc đề thi mới.",
    fullDesc:
      "Hỗ trợ đầy đủ dạng bài Đúng/Sai 4 ý (a, b, c, d) theo định dạng cấu trúc đề thi minh họa của Bộ GD&ĐT. Tính điểm linh hoạt theo số ý chọn đúng.",
    icon: CheckSquare,
    highlights: [
      "Định dạng Đúng/Sai 4 mệnh đề độc lập",
      "Thước đo điểm thưởng linh hoạt theo quy chuẩn",
      "Phù hợp cho các môn Toán, Lý, Hóa, Sinh, Sử, Địa",
    ],
    routePath: "/dashboard/create",
    previewType: "truefalse",
  },
  {
    id: "math",
    step: "04",
    badge: "Công thức & Media",
    title: "Công thức KaTeX & Hình ảnh",
    shortDesc: "Hiển thị biểu thức toán học KaTeX và ảnh minh họa.",
    fullDesc:
      "Tích hợp bộ gõ công thức LaTeX chuẩn KaTeX sắc nét, hỗ trợ chèn hình ảnh minh họa sắc nét vào cả thân câu hỏi lẫn từng phương án lựa chọn.",
    icon: Calculator,
    highlights: [
      "Render công thức toán KaTeX mượt mà & chuẩn xác",
      "Đính kèm hình ảnh minh họa cho câu hỏi & đáp án",
      "Hiển thị rõ nét trên cả máy tính và thiết bị di động",
    ],
    routePath: "/dashboard/quizzes",
    previewType: "math",
  },
  {
    id: "management",
    step: "05",
    badge: "Quản lý & Chia sẻ",
    title: "Quản lý đề thi & Chia sẻ",
    shortDesc: "Tổ chức bài thi, xuất bản link và tạo mã QR.",
    fullDesc:
      "Tạo liên kết công khai hoặc chia sẻ qua mã QR để học sinh mở và làm bài trực tiếp trên trình duyệt mà không cần cài đặt ứng dụng phức tạp.",
    icon: Share2,
    highlights: [
      "Tạo đường link làm bài công khai hoặc giới hạn",
      "Chia sẻ nhanh qua mã QR code",
      "Theo dõi danh sách bài thi và trạng thái xuất bản",
    ],
    routePath: "/dashboard/documents",
    previewType: "management",
  },
  {
    id: "student",
    step: "06",
    badge: "Trải nghiệm làm bài",
    title: "Giao diện thi trực tuyến",
    shortDesc: "Học sinh làm bài mượt mà với đồng hồ đếm ngược.",
    fullDesc:
      "Giao diện làm bài trực quan, tích hợp đồng hồ đếm ngược, danh sách câu hỏi thông minh giúp học sinh kiểm tra kiến thức thuận tiện và tập trung.",
    icon: GraduationCap,
    highlights: [
      "Đồng hồ đếm ngược thời gian thi chính xác",
      "Bảng điều hướng danh sách câu hỏi trực quan",
      "Tự động lưu tiến trình làm bài của học sinh",
    ],
    routePath: "/dashboard/results",
    previewType: "student",
  },
];

const featuresEn: ExplorerFeature[] = [
  {
    id: "extract",
    step: "01",
    badge: "Automation",
    title: "Document Upload & Parsing",
    shortDesc:
      "Convert PDF, DOCX, TXT files into structured questions automatically.",
    fullDesc:
      "The system automatically parses document structure, extracts questions, identifies A/B/C/D choices, and detects available answers in seconds.",
    icon: FileUp,
    highlights: [
      "Automatic recognition of questions & options A/B/C/D",
      "Supports PDF, Word (DOCX), TXT, Markdown formats",
      "Analyzes formatting issues and provides guidance",
    ],
    routePath: "/dashboard/create",
    previewType: "extract",
  },
  {
    id: "editor",
    step: "02",
    badge: "Visual Editor",
    title: "Intuitive Question Editor",
    shortDesc:
      "Customize content, shuffle choices, and configure scoring rules.",
    fullDesc:
      "A responsive editor lets you preview questions in real-time format, toggle correct answers with 1 click, and easily shuffle choices.",
    icon: SquarePen,
    highlights: [
      "Direct editing with instant real-time preview",
      "Configurable option count (3 to 6 choices)",
      "Auto-shuffle questions and choices for tests",
    ],
    routePath: "/dashboard/quizzes",
    previewType: "editor",
  },
  {
    id: "truefalse",
    step: "03",
    badge: "Standard Format",
    title: "True / False Multi-Statement",
    shortDesc:
      "Organize True/False questions following standard exam blueprints.",
    fullDesc:
      "Fully supports 4-statement True/False questions (a, b, c, d) matching official national standardized exam formats with flexible partial credit scoring.",
    icon: CheckSquare,
    highlights: [
      "Format 4 independent statements (a, b, c, d)",
      "Flexible partial credit scoring rules",
      "Ideal for Math, Physics, Chemistry, Biology, History",
    ],
    routePath: "/dashboard/create",
    previewType: "truefalse",
  },
  {
    id: "math",
    step: "04",
    badge: "Formulas & Media",
    title: "KaTeX Math & Rich Media",
    shortDesc: "Display crisp KaTeX formulas and attached illustration media.",
    fullDesc:
      "Integrates KaTeX LaTeX formula rendering with support for inserting crisp images into both question prompts and answer choices.",
    icon: Calculator,
    highlights: [
      "Seamless, precise KaTeX math & chemistry rendering",
      "Attach images to questions & option choices",
      "Crystal clear display on desktop and mobile",
    ],
    routePath: "/dashboard/quizzes",
    previewType: "math",
  },
  {
    id: "management",
    step: "05",
    badge: "Management & Sharing",
    title: "Quiz Management & QR Sharing",
    shortDesc:
      "Organize tests, publish shareable links, and generate QR codes.",
    fullDesc:
      "Generate public or restricted test links and share via QR code so students can take quizzes directly in their browser without installing anything.",
    icon: Share2,
    highlights: [
      "Generate public or restricted test links",
      "Instant sharing via QR codes",
      "Track test statuses and publishing logs",
    ],
    routePath: "/dashboard/documents",
    previewType: "management",
  },
  {
    id: "student",
    step: "06",
    badge: "Student Experience",
    title: "Interactive Online Exam Room",
    shortDesc: "Students take quizzes smoothly with accurate countdown timers.",
    fullDesc:
      "An intuitive exam environment featuring countdown timers and smart question navigation palettes to keep students focused.",
    icon: GraduationCap,
    highlights: [
      "Accurate countdown exam timer",
      "Intuitive question navigator palette",
      "Auto-saves student exam progress in real time",
    ],
    routePath: "/dashboard/results",
    previewType: "student",
  },
];

export function InteractiveFeatureExplorer() {
  const { lang } = useLanguage();
  const features = lang === "en" ? featuresEn : featuresVi;

  const [activeId, setActiveId] = useState<string>("extract");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string>(activeId);
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();

  const activeFeature = features.find((f) => f.id === activeId) || features[0];
  const activeIndex = features.findIndex((f) => f.id === activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Handle scroll-driven sticky feature progression on desktop
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (!sectionRef.current) return;
        if (window.innerWidth < 1024) return; // Only run on desktop where sticky is active

        const rect = sectionRef.current.getBoundingClientRect();
        const topOffset = 64; // height of fixed header
        const scrolled = topOffset - rect.top;
        const scrollableDist = rect.height - window.innerHeight;

        if (scrollableDist <= 0) return;

        // Check if currently within sticky zone
        if (scrolled >= 0 && scrolled <= scrollableDist) {
          const progress = scrolled / scrollableDist;
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
          }
          const index = Math.min(
            features.length - 1,
            Math.max(0, Math.floor(progress * features.length)),
          );

          const targetId = features[index].id;
          if (targetId !== activeIdRef.current) {
            activeIdRef.current = targetId;
            setIsAnimating(true);
            setActiveId(targetId);
            setTimeout(() => setIsAnimating(false), 150);
          }
        } else if (progressBarRef.current) {
          progressBarRef.current.style.transform =
            scrolled < 0 ? "scaleX(0)" : "scaleX(1)";
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [features]);

  const handleSelect = (id: string, manual = false) => {
    if (id === activeId) return;
    activeIdRef.current = id;
    setIsAnimating(true);
    setActiveId(id);
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);

    // If manually clicked on desktop, smoothly scroll to corresponding feature zone in the sticky section
    if (manual && sectionRef.current && window.innerWidth >= 1024) {
      const idx = features.findIndex((f) => f.id === id);
      if (idx !== -1) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrollableDist = rect.height - window.innerHeight;
        if (scrollableDist > 0) {
          const targetScroll =
            window.scrollY +
            rect.top -
            64 +
            (idx / features.length) * scrollableDist +
            20;
          window.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (index + 1) % features.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (index - 1 + features.length) % features.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = features.length - 1;
    } else {
      return;
    }
    handleSelect(features[nextIndex].id, true);
    navRefs.current[nextIndex]?.focus();
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      className="scroll-mt-16 sm:scroll-mt-20 relative bg-[var(--color-surface)] border-t border-[var(--color-border)] lg:h-[260vh] h-auto"
    >
      {/* Background Decorative Glow (pointer-events-none, no overflow-hidden on section) */}
      <div aria-hidden="true" className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Sticky Content Viewport Container */}
      <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center py-4 lg:py-6">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text)] tracking-tight text-balance">
            {lang === "en"
              ? "All the tools you need for the perfect quiz"
              : "Mọi công cụ cần thiết cho bài kiểm tra hoàn hảo"}
          </h2>
        </div>

        {/* Mobile Selector Bar (Horizontal Scrollable Tabs) */}
        <div
          className="lg:hidden flex overflow-x-auto gap-2 pb-2 mb-4 no-scrollbar snap-x border-b border-[var(--color-border)] -mx-4 px-4 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="LTVQuiz Feature Selector Mobile"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isActive = activeId === feature.id;

            return (
              <button
                key={feature.id}
                ref={(el) => {
                  navRefs.current[idx] = el;
                }}
                role="tab"
                id={`tab-mobile-${feature.id}`}
                aria-controls={`panel-${feature.id}`}
                aria-selected={isActive}
                onClick={() => handleSelect(feature.id, false)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`snap-start shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transform-gpu transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <Icon size={16} />
                <span>{feature.title}</span>
              </button>
            );
          })}
        </div>

        {/* Core Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Feature Selector (Desktop Vertical List) */}
          <div
            className="hidden lg:flex lg:col-span-5 flex-col gap-2.5"
            role="tablist"
            aria-label="LTVQuiz Feature Selector Desktop"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = activeId === feature.id;

              return (
                <button
                  key={feature.id}
                  ref={(el) => {
                    navRefs.current[idx] = el;
                  }}
                  role="tab"
                  id={`tab-desktop-${feature.id}`}
                  aria-controls={`panel-${feature.id}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelect(feature.id, true)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`group relative text-left p-3.5 rounded-[var(--radius-lg)] border transform-gpu transition-[transform,background-color,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    isActive
                      ? "bg-[var(--color-surface)] border-[var(--color-primary)] shadow-md translate-x-1"
                      : "bg-[var(--color-background)]/50 border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  {/* Left Restrained Active Indicator Strip */}
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[var(--color-primary)] rounded-r-full" />
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-[background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/40"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`font-bold text-sm tracking-tight ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}
                        >
                          {feature.title}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)]">
                          {feature.step}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 leading-relaxed">
                        {feature.shortDesc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Large Interactive Product Preview Container */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              id={`panel-${activeFeature.id}`}
              role="tabpanel"
              aria-labelledby={`tab-desktop-${activeFeature.id}`}
              className="flex-1 flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_36px_-8px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              {/* Window Header Chrome */}
              <div className="relative h-10 bg-[var(--color-background)] border-b border-[var(--color-border)] px-4 flex items-center justify-between shrink-0">
                <div
                  ref={progressBarRef}
                  aria-hidden="true"
                  className="hidden lg:block absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]/75 origin-left transform-gpu"
                  style={{ transform: "scaleX(0)" }}
                />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-4 py-0.5 text-[11px] font-mono text-[var(--color-text-secondary)] truncate max-w-[220px] sm:max-w-xs text-center shadow-2xs">
                  ltvquiz.edu.vn{activeFeature.routePath}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                  <span>
                    {lang === "en"
                      ? `FEATURE ${activeIndex + 1} / ${features.length}`
                      : `TÍNH NĂNG ${activeIndex + 1} / ${features.length}`}
                  </span>
                </div>
              </div>

              {/* Dynamic Preview Area */}
              <div className="p-5 flex-1 flex flex-col justify-between min-h-[340px] sm:min-h-[380px]">
                <div
                  className={`flex-1 transform-gpu transition-[transform,opacity] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isAnimating
                      ? "opacity-0 translate-x-2 scale-[0.99]"
                      : "opacity-100 translate-x-0 scale-100"
                  }`}
                >
                  {/* Render UI Preview based on active feature type */}
                  {activeFeature.previewType === "extract" && (
                    <div className="space-y-4">
                      {/* Document Dropzone Mockup */}
                      <div className="p-5 rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                          <FileUp size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--color-text)]">
                            Đã tải lên file thành công
                          </p>
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            De_thi_Thu_Thpt_Qg_Toan.pdf (1.4 MB)
                          </p>
                        </div>
                        <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-[var(--color-primary)] h-full w-full rounded-full transition-all duration-500" />
                        </div>
                      </div>

                      {/* Extraction Status List */}
                      <div className="bg-[var(--color-background)] p-3.5 rounded-xl border border-[var(--color-border)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
                          <span>Kết quả bóc tách tự động</span>
                          <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 text-[10px]">
                            <CheckCircle2 size={12} /> 25 Câu hỏi hoàn tất
                          </span>
                        </div>

                        <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[var(--color-text)] font-semibold">
                            <RichText
                              content="Câu 1: Hàm số $y = f(x)$ đồng biến trên khoảng nào?"
                              className="leading-snug"
                            />
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                              4 đáp án
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--color-text-secondary)] text-[11px]">
                            <RichText content="A. $(-\infty; 1)$" />
                            <RichText content="B. $(1; 3)$" />
                            <RichText content="C. $(3; +\infty)$" />
                            <RichText content="D. $(0; 2)$" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature.previewType === "editor" && (
                    <div className="space-y-4">
                      {/* Editor Question Panel Mockup */}
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-md">
                            Câu 01 — Trắc nghiệm 4 lựa chọn
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            Điểm: 0.25đ
                          </span>
                        </div>

                        <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)]">
                          <RichText content="Nghiệm của phương trình $2^x = 8$ là bao nhiêu?" />
                        </div>

                        {/* Options List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: "A", text: "$x = 1$", isCorrect: false },
                            { key: "B", text: "$x = 3$", isCorrect: true },
                            { key: "C", text: "$x = 4$", isCorrect: false },
                            { key: "D", text: "$x = 2$", isCorrect: false },
                          ].map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                opt.isCorrect
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    opt.isCorrect
                                      ? "bg-emerald-600 text-white"
                                      : "bg-gray-200 dark:bg-gray-700 text-[var(--color-text-secondary)]"
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <RichText content={opt.text} />
                              </div>
                              {opt.isCorrect && (
                                <Check
                                  size={14}
                                  className="text-emerald-600 shrink-0"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature.previewType === "truefalse" && (
                    <div className="space-y-4">
                      {/* True/False Matrix Question Preview */}
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                            Câu Đúng / Sai (Cấu trúc mới)
                          </span>
                          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                            Tối đa 1.0đ
                          </span>
                        </div>

                        <RichText
                          content="Cho hàm số $f(x) = x^2 - 4x + 3$. Các mệnh đề sau đúng hay sai?"
                          className="text-xs font-semibold text-[var(--color-text)]"
                        />

                        <div className="space-y-1.5">
                          {[
                            {
                              letter: "a",
                              text: "Đồ thị hàm số có đỉnh $I(2; -1)$",
                              isTrue: true,
                            },
                            {
                              letter: "b",
                              text: "Hàm số đồng biến trên khoảng $(2; +\\infty)$",
                              isTrue: true,
                            },
                            {
                              letter: "c",
                              text: "Hàm số cắt trục tung tại điểm $(0; 3)$",
                              isTrue: true,
                            },
                            {
                              letter: "d",
                              text: "Phương trình $f(x) = 0$ vô nghiệm",
                              isTrue: false,
                            },
                          ].map((item) => (
                            <div
                              key={item.letter}
                              className="p-2 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center justify-between text-xs gap-3"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--color-primary)]">
                                  {item.letter})
                                </span>
                                <RichText
                                  content={item.text}
                                  className="text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${item.isTrue ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                  Đúng
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${!item.isTrue ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                  Sai
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature.previewType === "math" && (
                    <div className="space-y-4">
                      {/* Math LaTeX & Media Display */}
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                            Công thức KaTeX & Hình ảnh
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                            Render trực tiếp
                          </span>
                        </div>

                        <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] space-y-2">
                          <p className="text-xs font-semibold text-[var(--color-text)]">
                            Tính tích phân sau:
                          </p>
                          <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] text-center text-xs">
                            <RichText content={"$$\\int_0^1 (3x^2 + 2x - 1) \\, dx$$"} />
                          </div>
                        </div>

                        <div className="p-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="text-xs space-y-0.5">
                            <p className="font-bold text-[var(--color-text)]">
                              Đồ thị hình học minh họa
                            </p>
                            <p className="text-[var(--color-text-secondary)] text-[11px]">
                              Hình ảnh đính kèm tự động căn chỉnh và hỗ trợ
                              phóng to sắc nét.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature.previewType === "management" && (
                    <div className="space-y-4">
                      {/* Quiz List & Share Link Panel */}
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-text)]">
                            Danh sách đề thi của bạn
                          </span>
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            Đã xuất bản
                          </span>
                        </div>

                        <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[var(--color-text)]">
                              Đề thi HK1 - Toán 12
                            </p>
                            <p className="text-[var(--color-text-secondary)] text-[11px]">
                              25 câu hỏi • 45 phút • 120 lượt làm
                            </p>
                          </div>
                          <button
                            onClick={handleCopyLink}
                            className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-[var(--color-primary-hover)]"
                          >
                            {copiedLink ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                            <span>
                              {copiedLink ? "Đã sao chép!" : "Sao chép link"}
                            </span>
                          </button>
                        </div>

                        <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-center gap-2 text-blue-800 dark:text-blue-300">
                          <Zap
                            size={16}
                            className="shrink-0 text-[var(--color-primary)]"
                          />
                          <span>
                            Link công khai:{" "}
                            <strong>ltvquiz.edu.vn/exam/share-9821</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeature.previewType === "student" && (
                    <div className="space-y-4">
                      {/* Student Test Taking Interface */}
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3">
                        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap
                              size={16}
                              className="text-[var(--color-primary)]"
                            />
                            <span className="text-xs font-bold text-[var(--color-text)]">
                              Bài thi Toán 12 — Trực tuyến
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <Clock size={12} />
                            <span>34:20 còn lại</span>
                          </div>
                        </div>

                        <div className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                            <span>Câu hỏi 5 / 25</span>
                            <span>Đã trả lời: 4</span>
                          </div>
                          <div className="text-xs font-medium text-[var(--color-text)]">
                            <RichText
                              content={
                                "Tìm giá trị nhỏ nhất của hàm số $y = x + \\frac{4}{x}$ trên khoảng $(0; +\\infty)$."
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {["A. 2", "B. 4 (Đã chọn)", "C. 1", "D. 3"].map(
                            (item, i) => (
                              <div
                                key={i}
                                className={`p-2 rounded-lg border font-medium ${
                                  i === 1
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                                }`}
                              >
                                {item}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feature Description & Highlights Footer */}
                <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-1">
                      {activeFeature.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {activeFeature.fullDesc}
                    </p>
                  </div>

                  {/* Highlight Bullets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {activeFeature.highlights.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]"
                      >
                        <CheckCircle2
                          size={13}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Primary CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <HelpCircle size={13} />
                      <span>
                        {lang === "en"
                          ? "Instant access without installation"
                          : "Thao tác trực tiếp không cần cài đặt"}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => navigate("/dashboard")}
                      className="text-xs h-8 px-3.5 flex items-center gap-1.5"
                    >
                      <span>
                        {lang === "en" ? "Try it now" : "Trải nghiệm ngay"}
                      </span>
                      <ArrowRight size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
