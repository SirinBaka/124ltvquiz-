import { useMemo } from "react";
import type { Question } from "@ltvquiz/shared";
import { RichText } from "../RichText";
import {
  Check,
  AlertTriangle,
  Copy,
  Trash2,
  Layers,
} from "lucide-react";

interface AzotaQuestionCardsProps {
  questions: Question[];
  onSelectOptionAsCorrect: (questionIndex: number, optionId: string) => void;
  onUpdateQuestionPoints: (questionIndex: number, points: number) => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onDuplicateQuestion: (questionIndex: number) => void;
}

export function AzotaQuestionCards({
  questions,
  onSelectOptionAsCorrect,
  onUpdateQuestionPoints,
  onDeleteQuestion,
  onDuplicateQuestion,
}: AzotaQuestionCardsProps) {
  // Group questions by sectionTitle
  const groupedSections = useMemo(() => {
    const groups: Array<{
      title: string;
      startIndex: number;
      items: Array<{ question: Question; index: number }>;
    }> = [];

    let currentTitle = "";
    let currentGroup: Array<{ question: Question; index: number }> = [];
    let groupStartIndex = 0;

    questions.forEach((q, idx) => {
      const qSection = q.sectionTitle || "PHẦN I: TRẮC NGHIỆM KHÁCH QUAN";
      if (idx === 0) {
        currentTitle = qSection;
        currentGroup = [{ question: q, index: idx }];
        groupStartIndex = 0;
      } else if (qSection !== currentTitle) {
        groups.push({
          title: currentTitle,
          startIndex: groupStartIndex,
          items: currentGroup,
        });
        currentTitle = qSection;
        currentGroup = [{ question: q, index: idx }];
        groupStartIndex = idx;
      } else {
        currentGroup.push({ question: q, index: idx });
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        title: currentTitle,
        startIndex: groupStartIndex,
        items: currentGroup,
      });
    }

    return groups;
  }, [questions]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[var(--color-text-secondary)]">
        <Layers className="w-12 h-12 text-[var(--color-primary)]/40 mb-3" />
        <h3 className="font-bold text-sm text-[var(--color-text)]">
          Chưa có câu hỏi nào
        </h3>
        <p className="text-xs max-w-sm mt-1">
          Nhập câu hỏi theo định dạng văn bản bên phải hoặc chọn từ các mẫu có
          sẵn bên dưới để tự động tạo đề thi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3 md:p-4 overflow-y-auto custom-scrollbar h-full">
      {groupedSections.map((group, gIdx) => (
        <div key={gIdx} className="space-y-4">
          {/* Section Group Header Card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border)]/60 text-xs">
              <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
                <Layers size={14} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                <span>Tiêu đề nhóm</span>
              </span>
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)] tabular-nums">
                {group.items.length} câu hỏi
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] tracking-wide">
              {group.title}
            </div>
          </div>

          {/* Questions inside this section */}
          {group.items.map(({ question: q, index }) => {
            const promptText = q.question
              .filter((b) => b.type === "text" || b.type === "math")
              .map((b) => b.content)
              .join("\n");
            const isAnswerValid = q.correctAnswer && q.correctAnswer.length > 0;

            return (
              <div
                key={q.id || index}
                id={`question-card-${index + 1}`}
                className={`rounded-2xl border transition-colors duration-150 bg-[var(--color-surface)] shadow-2xs overflow-hidden ${
                  !isAnswerValid
                    ? "border-amber-500/60"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                }`}
              >
                {/* Question Card Toolbar Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[var(--color-background)]/60 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm text-[var(--color-text)] bg-[var(--color-surface)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] shadow-2xs tabular-nums">
                      Câu {index + 1}.
                    </span>

                    <div className="flex items-center gap-1 text-xs">
                      <label htmlFor={`card-points-${index}`} className="sr-only">
                        Điểm cho câu {index + 1}
                      </label>
                      <input
                        id={`card-points-${index}`}
                        type="number"
                        step="0.05"
                        min="0"
                        value={q.points || 0.25}
                        onChange={(e) =>
                          onUpdateQuestionPoints(
                            index,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-16 h-8 text-xs font-semibold tabular-nums px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-center focus:border-[var(--color-primary)]"
                        title="Điểm cho câu hỏi này"
                      />
                      <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                        điểm
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-text)] border border-[var(--color-primary)]/25">
                      {q.type === "true_false_multiple"
                        ? "Đúng - Sai"
                        : "Trắc nghiệm"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateQuestion(index)}
                      aria-label={`Nhân bản câu ${index + 1}`}
                      className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
                      title="Nhân bản câu này"
                    >
                      <Copy size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuestion(index)}
                      aria-label={`Xóa câu ${index + 1}`}
                      className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Question Body */}
                <div className="p-4 space-y-3">
                  <div>
                    {promptText ? (
                      <RichText
                        content={promptText}
                        className="text-xs sm:text-sm text-[var(--color-text)] leading-relaxed font-medium"
                      />
                    ) : (
                      <p className="text-xs text-[var(--color-text-secondary)] italic">
                        (Chưa có nội dung câu hỏi)
                      </p>
                    )}

                    {/* Question Images if any */}
                    {q.question.some((c) => c.type === "image") && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.question.map(
                          (c, i) =>
                            c.type === "image" && (
                              <img
                                key={i}
                                src={c.content}
                                alt={c.alt || `Hình minh họa câu ${index + 1}`}
                                className="max-h-40 rounded-lg border border-[var(--color-border)] object-contain"
                              />
                            ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="flex flex-col gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isCorrect = q.correctAnswer.includes(opt.id);
                      const optText =
                        opt.content
                          .filter((c) => c.type === "text" || c.type === "math")
                          .map((c) => c.content)
                          .join(" ") || "";

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={isCorrect}
                          onClick={() =>
                            onSelectOptionAsCorrect(index, opt.id)
                          }
                          className="group w-full flex items-start text-left gap-2 sm:gap-2.5 cursor-pointer select-none rounded-lg py-0.5 transition-colors"
                        >
                          {/* 1. Checkmark column */}
                          <span className="w-5 h-8 shrink-0 flex items-center justify-center">
                            {isCorrect ? (
                              <Check
                                size={17}
                                strokeWidth={3}
                                aria-hidden="true"
                                className="text-[var(--color-primary-text)]"
                              />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-transparent group-hover:border-[var(--color-border)] opacity-0 group-hover:opacity-60 transition-opacity" />
                            )}
                          </span>

                          {/* 2. Option label box */}
                          <span
                            className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold border transition-colors ${
                              isCorrect
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] group-hover:border-[var(--color-primary)]/60 group-hover:bg-[var(--color-background)]"
                            }`}
                          >
                            {opt.label}
                          </span>

                          {/* 3. Option content box */}
                          <span
                            className={`flex-1 min-w-0 min-h-[34px] px-3.5 py-1.5 sm:py-2 rounded-lg border transition-colors flex flex-col justify-center ${
                              isCorrect
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-[var(--color-primary)]/40 group-hover:bg-[var(--color-background)]/60"
                            }`}
                          >
                            <RichText
                              content={
                                optText || `(Nội dung đáp án ${opt.label})`
                              }
                              className={`text-xs sm:text-sm leading-relaxed ${
                                isCorrect
                                  ? "font-semibold text-[var(--color-primary-text)]"
                                  : "text-[var(--color-text)]"
                              }`}
                            />

                            {opt.content.some((c) => c.type === "image") && (
                              <span className="flex flex-wrap gap-2 mt-2">
                                {opt.content.map(
                                  (c, i) =>
                                    c.type === "image" && (
                                      <img
                                        key={i}
                                        src={c.content}
                                        alt={c.alt || `Hình phương án ${opt.label}`}
                                        className="max-h-24 rounded-lg border border-[var(--color-border)] object-contain"
                                      />
                                    ),
                                )}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!isAnswerValid && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/25">
                      <AlertTriangle size={14} aria-hidden="true" className="shrink-0" />
                      <span>
                        Chưa chọn đáp án đúng. Nhấn vào phương án trên hoặc thêm dấu * trong mã nguồn.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
