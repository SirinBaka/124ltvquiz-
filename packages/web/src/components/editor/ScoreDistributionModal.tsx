import { useEffect, useState } from "react";
import { X, Calculator, Check } from "lucide-react";

interface ScoreDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionCount: number;
  currentPoints: number[];
  onApply: (pointsPerQuestion: number) => void;
}

export function ScoreDistributionModal({
  isOpen,
  onClose,
  questionCount,
  currentPoints,
  onApply,
}: ScoreDistributionModalProps) {
  const currentTotal = currentPoints.reduce((sum, p) => sum + p, 0);
  const [targetTotal, setTargetTotal] = useState<number>(10);
  const [customPerQuestion, setCustomPerQuestion] = useState<string>("0.25");
  const [mode, setMode] = useState<"total" | "perQuestion">("total");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calculatedPerQuestion =
    questionCount > 0 ? Number((targetTotal / questionCount).toFixed(2)) : 0;

  const handleConfirm = () => {
    if (mode === "total") {
      if (questionCount <= 0 || targetTotal <= 0) return;
      onApply(calculatedPerQuestion);
    } else {
      const p = parseFloat(customPerQuestion);
      if (isNaN(p) || p <= 0) return;
      onApply(p);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-dist-modal-title"
      className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
          <div className="flex items-center gap-2 text-[var(--color-text)]">
            <Calculator size={18} aria-hidden="true" className="text-[var(--color-primary-text)]" />
            <h3 id="score-dist-modal-title" className="font-bold text-sm sm:text-base">
              Chia điểm bài thi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại chia điểm"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <span>Tổng số câu hỏi hiện tại:</span>
            <span className="font-black text-sm">{questionCount} câu ({currentTotal.toFixed(2)}đ)</span>
          </div>

          <div className="flex rounded-xl bg-[var(--color-background)] p-1 border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setMode("total")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "total"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              Chia đều theo thang điểm
            </button>
            <button
              type="button"
              onClick={() => setMode("perQuestion")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "perQuestion"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              Nhập điểm mỗi câu
            </button>
          </div>

          {mode === "total" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  Thang điểm tổng của toàn bộ bài thi:
                </label>
                <div className="flex items-center gap-2">
                  {[10, 100, 40].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetTotal(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        targetTotal === val
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-border)]/50"
                      }`}
                    >
                      {val} điểm
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={targetTotal}
                      onChange={(e) => setTargetTotal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                      placeholder="Tùy chỉnh..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Điểm mỗi câu:</span>
                  <span className="font-bold text-[var(--color-primary)] text-sm">
                    {calculatedPerQuestion} điểm
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Tổng điểm ước tính:</span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {(calculatedPerQuestion * questionCount).toFixed(2)} điểm
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                  Điểm cho mỗi câu hỏi:
                </label>
                <div className="flex items-center gap-2">
                  {["0.25", "0.5", "1.0", "2.0"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCustomPerQuestion(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        customPerQuestion === val
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-border)]/50"
                      }`}
                    >
                      {val}đ
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={customPerQuestion}
                    onChange={(e) => setCustomPerQuestion(e.target.value)}
                    className="w-24 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                    placeholder="Điểm..."
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/50 text-xs text-[var(--color-text-secondary)] flex justify-between">
                <span>Tổng điểm cả đề ({questionCount} câu):</span>
                <span className="font-bold text-[var(--color-primary)] text-sm">
                  {((parseFloat(customPerQuestion) || 0) * questionCount).toFixed(2)} điểm
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-background)]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            <span>Áp dụng điểm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
