import { useEffect, useRef, useState } from "react";
import type { Question } from "@ltvquiz/shared";
import { CheckCircle2, AlertTriangle, XCircle, Filter } from "lucide-react";

type QuestionNavigatorProps = {
  questions: Question[];
  activeId: string;
  onSelect: (id: string) => void;
};

type FilterType = "all" | "valid" | "warning" | "error";

export function QuestionNavigator({
  questions,
  activeId,
  onSelect,
}: QuestionNavigatorProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const questionList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    questionList.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [activeId, filter]);

  const getIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
      case "error":
        return <XCircle size={14} className="text-rose-500 shrink-0" />;
      default:
        return null;
    }
  };

  const filteredQuestions = questions
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => {
      if (filter === "all") return true;
      return q.validation.status === filter;
    });

  return (
    <div className="min-w-0 min-h-0 flex-1 flex items-center md:items-stretch md:flex-col bg-[var(--color-surface)] select-none">
      <div className="pl-2 md:p-3 md:border-b border-[var(--color-border)] flex flex-col gap-2 bg-[var(--color-surface)] shrink-0">
        <div className="hidden md:flex font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] justify-between items-center">
          <span>Câu hỏi ({questions.length})</span>
          <Filter size={13} className="text-[var(--color-text-secondary)]" />
        </div>
        <select
          aria-label="Lọc trạng thái câu hỏi"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="max-w-28 md:max-w-none md:w-full min-h-11 md:min-h-8 text-xs p-1.5 bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <option value="all">Tất cả ({questions.length})</option>
          <option value="valid">
            Hợp lệ (
            {questions.filter((q) => q.validation.status === "valid").length})
          </option>
          <option value="warning">
            Cảnh báo (
            {questions.filter((q) => q.validation.status === "warning").length})
          </option>
          <option value="error">
            Lỗi (
            {questions.filter((q) => q.validation.status === "error").length})
          </option>
        </select>
      </div>

      <div ref={questionList} className="min-w-0 flex-1 flex items-center gap-1 overflow-x-auto md:block md:overflow-x-hidden md:overflow-y-auto p-2 md:space-y-1 custom-scrollbar">
        {filteredQuestions.length === 0 ? (
          <div className="text-xs text-center text-[var(--color-text-secondary)] md:mt-6 py-2 md:py-4">
            Không có câu hỏi phù hợp
          </div>
        ) : (
          filteredQuestions.map(({ q, index }) => {
            const isActive = q.id === activeId;
            const status = q.validation.status;

            return (
              <button
                key={q.id}
                onClick={() => onSelect(q.id)}
                aria-label={`Câu ${index + 1}`}
                aria-current={isActive ? "step" : undefined}
                className={`shrink-0 min-h-11 md:min-h-0 md:w-full flex items-center justify-between gap-1 px-2 md:px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/50 text-[var(--color-primary)] shadow-2xs font-semibold"
                    : "text-[var(--color-text)] hover:bg-[var(--color-background)] border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold md:w-5 text-left ${
                      isActive
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-secondary)] truncate max-w-[85px] hidden md:inline">
                    {q.type === "true_false_multiple"
                      ? "Đúng/Sai"
                      : "Trắc nghiệm"}
                  </span>
                </span>
                {getIcon(status)}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
