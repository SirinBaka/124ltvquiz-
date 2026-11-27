import { useState, useMemo, useId } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "katex/dist/contrib/mhchem.mjs";
import {
  Atom,
  Sigma,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  FlaskConical,
  ArrowRight,
} from "lucide-react";
import {
  QUICK_SYMBOLS,
  CHEMISTRY_SECTIONS,
  MATH_SECTIONS,
  PHYSICS_SECTIONS,
  GREEK_SECTIONS,
  type ScientificCategory,
  type SymbolItem,
} from "./scientificSymbols";
import { buildCatalystEquation } from "./scientificHelper";

type ScientificToolbarProps = {
  onInsertSnippet: (snippet: string, target?: "question" | string) => void;
  currentTarget: "question" | string;
  options: Array<{ id: string; label: string }>;
  onSelectTarget?: (target: "question" | string) => void;
  className?: string;
};

function MiniTex({ tex, className = "" }: { tex: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: false,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex]);

  return (
    <span
      className={`inline-flex items-center justify-center pointer-events-none select-none text-[13px] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ScientificToolbar({
  onInsertSnippet,
  currentTarget,
  options,
  onSelectTarget,
  className = "",
}: ScientificToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ScientificCategory>("chemistry");
  const [searchTerm, setSearchTerm] = useState("");

  // Catalyst builder state
  const [builderReactants, setBuilderReactants] = useState("2H2 + O2");
  const [builderArrowType, setBuilderArrowType] = useState<
    "single" | "reversible"
  >("single");
  const [builderTopCondition, setBuilderTopCondition] = useState("t^\\circ");
  const [builderBottomCondition, setBuilderBottomCondition] = useState("xt");
  const [builderProducts, setBuilderProducts] = useState("2H2O");
  const [builderMode, setBuilderMode] = useState<"mhchem" | "latex">("mhchem");

  const currentTargetLabel = useMemo(() => {
    if (currentTarget === "question") return "Nội dung câu hỏi";
    const opt = options.find((o) => o.id === currentTarget);
    return opt ? `Đáp án ${opt.label}` : "Đáp án đang chọn";
  }, [currentTarget, options]);

  const previewBuiltEquation = useMemo(() => {
    return buildCatalystEquation({
      type: builderArrowType,
      reactants: builderReactants,
      products: builderProducts,
      conditionTop: builderTopCondition,
      conditionBottom: builderBottomCondition,
      format: builderMode,
    });
  }, [
    builderArrowType,
    builderReactants,
    builderProducts,
    builderTopCondition,
    builderBottomCondition,
    builderMode,
  ]);

  const activeSections = useMemo(() => {
    switch (activeTab) {
      case "chemistry":
        return CHEMISTRY_SECTIONS;
      case "math":
        return MATH_SECTIONS;
      case "physics":
        return PHYSICS_SECTIONS;
      case "greek":
        return GREEK_SECTIONS;
      default:
        return CHEMISTRY_SECTIONS;
    }
  }, [activeTab]);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return activeSections;
    const lower = searchTerm.toLowerCase();
    return activeSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.snippet.toLowerCase().includes(lower) ||
            (item.tooltip && item.tooltip.toLowerCase().includes(lower)),
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [activeSections, searchTerm]);

  const handleInsert = (item: SymbolItem) => {
    onInsertSnippet(item.snippet, currentTarget);
  };

  const handleInsertBuiltEquation = () => {
    const formatted = `$${previewBuiltEquation}$`;
    onInsertSnippet(formatted, currentTarget);
  };

  const rawBuilderTex = useMemo(() => {
    if (
      previewBuiltEquation.startsWith("\\ce{") &&
      previewBuiltEquation.endsWith("}")
    ) {
      return previewBuiltEquation;
    }
    return previewBuiltEquation;
  }, [previewBuiltEquation]);

  const baseId = useId();

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Top Header & Quick Buttons */}
      <div className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white shadow-xs font-semibold text-xs">
              ∑
            </span>
            <div>
              <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                Ký hiệu Khoa học & Phương trình
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  Toán • Lý • Hóa
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                <span>Chèn vào:</span>
                <select
                  value={currentTarget}
                  onChange={(e) => onSelectTarget?.(e.target.value)}
                  className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-1.5 py-0.5 font-medium text-[var(--color-primary)] text-[11px] outline-none hover:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                >
                  <option value="question">Nội dung câu hỏi</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Đáp án {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-lg transition-colors cursor-pointer select-none"
              title={
                isExpanded
                  ? "Thu gọn bảng ký hiệu"
                  : "Mở rộng bảng ký hiệu đầy đủ"
              }
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} /> Thu gọn
                </>
              ) : (
                <>
                  <FlaskConical size={14} /> Bảng đầy đủ & Xúc tác{" "}
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick 1-click Symbol Bar (No ugly scrollbar) */}
        <div className="flex items-center gap-1 pt-2 overflow-x-auto no-scrollbar scroll-smooth">
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)] shrink-0 pr-1 select-none">
            Phổ biến:
          </span>
          {QUICK_SYMBOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleInsert(item)}
              title={`${item.label} (${item.tooltip || item.snippet})`}
              className="h-7 min-w-[34px] px-2 py-0.5 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] text-[var(--color-text)] font-medium text-xs flex items-center justify-center shrink-0 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MiniTex tex={item.displayTex} />
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Comprehensive Drawer */}
      {isExpanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4 animate-search-down">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center gap-1 bg-[var(--color-background)] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("chemistry")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "chemistry"
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <FlaskConical
                  size={14}
                  className={
                    activeTab === "chemistry"
                      ? "text-[var(--color-primary)]"
                      : ""
                  }
                />
                Hóa học & Xúc tác
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("math")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "math"
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <Sigma
                  size={14}
                  className={
                    activeTab === "math" ? "text-[var(--color-primary)]" : ""
                  }
                />
                Toán học
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("physics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "physics"
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <Zap
                  size={14}
                  className={activeTab === "physics" ? "text-amber-500" : ""}
                />
                Vật lý
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("greek")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "greek"
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-bold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <Sparkles
                  size={14}
                  className={activeTab === "greek" ? "text-purple-500" : ""}
                />
                Ký tự Hy Lạp
              </button>
            </div>

            {/* Quick search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm ký hiệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 px-2.5 py-1 text-xs bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Catalyst Equation Builder (When Chemistry Tab is active) */}
          {activeTab === "chemistry" && (
            <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text)]">
                  <Atom size={16} className="text-[var(--color-primary)]" />
                  Bộ tạo Phương trình phản ứng & Xúc tác tùy chỉnh
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={builderMode === "mhchem"}
                      onChange={() => setBuilderMode("mhchem")}
                      name={`chem_mode_${baseId}`}
                    />
                    Chuẩn hóa học (mhchem)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      checked={builderMode === "latex"}
                      onChange={() => setBuilderMode("latex")}
                      name={`chem_mode_${baseId}`}
                    />
                    LaTeX thuần
                  </label>
                </div>
              </div>

              {/* Visual equation builder row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-2xs">
                {/* Reactants */}
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5">
                    Chất tham gia
                  </label>
                  <input
                    type="text"
                    value={builderReactants}
                    onChange={(e) => setBuilderReactants(e.target.value)}
                    placeholder="2H2 + O2"
                    className="w-full px-2 py-1 text-xs bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md focus:border-[var(--color-primary)] outline-none font-mono"
                  />
                </div>

                {/* Arrow & Conditions */}
                <div className="sm:col-span-5 flex flex-col items-center gap-1">
                  <div className="w-full flex items-center justify-between text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    <span>Điều kiện trên:</span>
                    <span>Xúc tác dưới:</span>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={builderTopCondition}
                      onChange={(e) => setBuilderTopCondition(e.target.value)}
                      placeholder="t° hoặc as"
                      className="px-2 py-0.5 text-xs bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md focus:border-[var(--color-primary)] outline-none font-mono text-center"
                    />
                    <input
                      type="text"
                      value={builderBottomCondition}
                      onChange={(e) =>
                        setBuilderBottomCondition(e.target.value)
                      }
                      placeholder="xt hoặc Fe"
                      className="px-2 py-0.5 text-xs bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md focus:border-[var(--color-primary)] outline-none font-mono text-center"
                    />
                  </div>

                  {/* Arrow selector */}
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBuilderArrowType("single")}
                      className={`px-2 py-0.5 rounded-md text-xs transition-colors cursor-pointer ${
                        builderArrowType === "single"
                          ? "bg-[var(--color-primary)] text-white font-bold"
                          : "bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)]/50"
                      }`}
                    >
                      1 chiều (→)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderArrowType("reversible")}
                      className={`px-2 py-0.5 rounded-md text-xs transition-colors cursor-pointer ${
                        builderArrowType === "reversible"
                          ? "bg-[var(--color-primary)] text-white font-bold"
                          : "bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-border)]/50"
                      }`}
                    >
                      Thuận nghịch (⇄)
                    </button>
                  </div>
                </div>

                {/* Products */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5">
                    Sản phẩm
                  </label>
                  <input
                    type="text"
                    value={builderProducts}
                    onChange={(e) => setBuilderProducts(e.target.value)}
                    placeholder="2H2O"
                    className="w-full px-2 py-1 text-xs bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md focus:border-[var(--color-primary)] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Preview and Insert Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                    Xem trước:
                  </span>
                  <div className="bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-medium min-w-[200px] flex items-center justify-center shadow-2xs">
                    <MiniTex tex={rawBuilderTex} className="text-sm" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInsertBuiltEquation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-95 text-white font-medium text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Chèn phương trình vào {currentTargetLabel}{" "}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Categorized symbol grid */}
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredSections.map((sec) => (
              <div key={sec.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                    {sec.title}
                  </h4>
                  {sec.description && (
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      {sec.description}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {sec.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInsert(item)}
                      title={item.tooltip || item.label}
                      className="group flex flex-col items-center justify-center p-2 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-primary)]/10 shadow-2xs transition-all hover:shadow-xs hover:-translate-y-0.5 text-center min-h-[58px] cursor-pointer"
                    >
                      <div className="flex items-center justify-center py-1 group-hover:scale-105 transition-transform text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
                        <MiniTex tex={item.displayTex} />
                      </div>
                      <span className="text-[10px] font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
