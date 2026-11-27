import { useEffect, useState } from "react";
import { X, Info, Check, Clock, Award } from "lucide-react";

interface QuizInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timeLimit: number;
  description: string;
  onSave: (data: { title: string; timeLimit: number; description: string }) => void;
}

export function QuizInfoModal({
  isOpen,
  onClose,
  title,
  timeLimit,
  description,
  onSave,
}: QuizInfoModalProps) {
  const [formTitle, setFormTitle] = useState(title);
  const [formTimeLimit, setFormTimeLimit] = useState(timeLimit);
  const [formDesc, setFormDesc] = useState(description);

  useEffect(() => {
    if (!isOpen) return;
    setFormTitle(title);
    setFormTimeLimit(timeLimit);
    setFormDesc(description);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, title, timeLimit, description, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: formTitle.trim() || "Bài kiểm tra mới",
      timeLimit: formTimeLimit > 0 ? formTimeLimit : 45,
      description: formDesc.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-info-modal-title"
      className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
          <div className="flex items-center gap-2 text-[var(--color-text)]">
            <Info size={18} aria-hidden="true" className="text-[var(--color-primary-text)]" />
            <h3 id="quiz-info-modal-title" className="font-bold text-sm sm:text-base">
              Thông tin bài thi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông tin bài thi"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="quiz-info-title" className="block text-xs font-bold text-[var(--color-text)] mb-1.5">
              Tên bài thi / Đề kiểm tra:
            </label>
            <input
              id="quiz-info-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="VD: CÂU HỎI ÔN TẬP GIỮA KỲ 1 MÔN CÔNG NGHỆ 12"
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quiz-info-duration" className="block text-xs font-bold text-[var(--color-text)] mb-1.5 flex items-center gap-1.5">
                <Clock size={13} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                <span>Thời gian làm bài:</span>
              </label>
              <div className="relative">
                <input
                  id="quiz-info-duration"
                  type="number"
                  min="1"
                  max="300"
                  value={formTimeLimit}
                  onChange={(e) => setFormTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-semibold tabular-nums px-3 py-2 pr-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)] font-medium">
                  phút
                </span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[var(--color-text)] mb-1.5 flex items-center gap-1.5">
                <Award size={13} aria-hidden="true" className="text-amber-500" />
                <span>Chế độ thi:</span>
              </span>
              <div className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-text)] flex items-center font-medium">
                Tự động chấm điểm
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="quiz-info-desc" className="block text-xs font-bold text-[var(--color-text)] mb-1.5">
              Mô tả / Hướng dẫn làm bài:
            </label>
            <textarea
              id="quiz-info-desc"
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Ghi chú quy chế phòng thi, nội dung ôn tập..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="min-h-[38px] px-4 py-2 text-xs font-bold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} aria-hidden="true" />
              <span>Lưu thông tin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
