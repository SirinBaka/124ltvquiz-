import React, { useMemo, useState } from "react";
import type { ContentBlock, Option, Question } from "@ltvquiz/shared";
import { Plus, Search, Trash2, Check, Image as ImageIcon } from "lucide-react";
import { classifyQuestion, cloneQuestion } from "../../services/shuffleService";

export function blocksToEditableString(blocks: readonly ContentBlock[] = []): string {
  return blocks
    .filter((b) => b.type !== "image")
    .map((b) => (b.type === "math" && !b.content.startsWith("$") ? `$${b.content}$` : b.content))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function updateBlocksTextPreservingImages(
  blocks: readonly ContentBlock[] = [],
  nextText: string,
): ContentBlock[] {
  const imageBlocks = blocks.filter((b) => b.type === "image").map((b) => ({ ...b }));
  if (imageBlocks.length === 0) {
    return [{ type: "text", content: nextText }];
  }
  const textBlock: ContentBlock = { type: "text", content: nextText };
  const firstBlockWasImage = blocks.length > 0 && blocks[0].type === "image";
  return firstBlockWasImage ? [...imageBlocks, textBlock] : [textBlock, ...imageBlocks];
}

function createEmptyQuestion(
  kind: "multiple_choice" | "true_false_multiple" | "short_answer",
): Question {
  const uid = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  if (kind === "short_answer") {
    return {
      id: uid,
      type: "multiple_choice",
      sectionTitle: "PHẦN III. Câu trắc nghiệm trả lời ngắn",
      points: 0.5,
      question: [{ type: "text", content: "Nhập nội dung câu hỏi trả lời ngắn..." }],
      options: [],
      correctAnswer: [""],
      validation: { status: "valid", warnings: [] },
    };
  }

  const isTf = kind === "true_false_multiple";
  const labels = isTf ? ["a", "b", "c", "d"] : ["A", "B", "C", "D"];
  const options: Option[] = labels.map((label, idx) => ({
    id: `${uid}_opt_${idx}`,
    label,
    content: [{ type: "text", content: isTf ? `Mệnh đề ${label}` : `Phương án ${label}` }],
  }));

  return {
    id: uid,
    type: isTf ? "true_false_multiple" : "multiple_choice",
    sectionTitle: isTf
      ? "PHẦN II. Câu trắc nghiệm đúng sai"
      : "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn",
    points: isTf ? 1.0 : 0.25,
    question: [{ type: "text", content: "Nhập nội dung câu hỏi..." }],
    options,
    correctAnswer: [options[0].id],
    validation: { status: "valid", warnings: [] },
  };
}

interface InlineExamEditorProps {
  questions: Question[];
  onChangeQuestions: (next: Question[]) => void;
  allowAddDelete?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export const InlineExamEditor: React.FC<InlineExamEditorProps> = ({
  questions,
  onChangeQuestions,
  allowAddDelete = true,
  compact = false,
  emptyMessage = "Chưa có câu hỏi nào.",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return questions
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => {
        if (!q) return true;
        const numMatch = `câu ${index + 1}`.includes(q) || String(index + 1) === q;
        const bodyMatch = blocksToEditableString(item.question).toLowerCase().includes(q);
        const optMatch = (item.options || []).some((o) =>
          blocksToEditableString(o.content).toLowerCase().includes(q),
        );
        return numMatch || bodyMatch || optMatch;
      });
  }, [questions, searchQuery]);

  const patchQuestion = (index: number, updater: (prev: Question) => Question) => {
    const next = questions.map((item, i) =>
      i === index ? updater(cloneQuestion(item)) : item,
    );
    onChangeQuestions(next);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    onChangeQuestions(questions.filter((_, i) => i !== index));
  };

  const appendQuestion = (kind: "multiple_choice" | "true_false_multiple" | "short_answer") => {
    onChangeQuestions([...questions, createEmptyQuestion(kind)]);
  };

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <label htmlFor="inline-exam-search" className="sr-only">
            Tìm câu số hoặc nội dung
          </label>
          <Search
            aria-hidden="true"
            className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            id="inline-exam-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm câu số hoặc nội dung..."
            className="w-full min-h-[36px] pl-8 pr-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary-text)] focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <span className="text-[11px] text-[var(--color-text-secondary)] font-mono tabular-nums">
          {filteredEntries.length}/{questions.length} câu
        </span>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-3 ${compact ? "p-3" : "p-4"}`}>
        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center space-y-2.5 animate-panel-enter">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Không tìm thấy câu hỏi nào khớp với &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] transition-colors cursor-pointer"
            >
              Xóa từ khóa tìm kiếm
            </button>
          </div>
        ) : (
          filteredEntries.map(({ item: q, index }) => {
            const kind = classifyQuestion(q);
            const promptImages = q.question.filter((b) => b.type === "image");

            return (
              <div
                key={`${q.id}_${index}`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-3.5 space-y-2.5 hover:border-[var(--color-primary)]/40 transition-colors"
              >
                {/* Question card header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary-text)] text-xs font-bold tabular-nums">
                      Câu {index + 1}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium">
                      {kind === "true_false_multiple"
                        ? "Đúng / Sai"
                        : kind === "short_answer"
                          ? "Trả lời ngắn"
                          : "Trắc nghiệm"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`inline-sec-${index}`} className="sr-only">
                      Nhóm phần câu {index + 1}
                    </label>
                    <input
                      id={`inline-sec-${index}`}
                      type="text"
                      value={q.sectionTitle || ""}
                      onChange={(e) =>
                        patchQuestion(index, (prev) => ({
                          ...prev,
                          sectionTitle: e.target.value || undefined,
                        }))
                      }
                      placeholder="Nhóm phần (tuỳ chọn)"
                      className="w-36 sm:w-44 min-h-[32px] px-2 py-1 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] transition-colors"
                    />
                    {allowAddDelete && questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        title="Xóa câu này"
                        aria-label={`Xóa câu ${index + 1}`}
                        className="min-w-[34px] min-h-[34px] inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt text */}
                <label htmlFor={`inline-prompt-${index}`} className="sr-only">
                  Nội dung câu {index + 1}
                </label>
                <textarea
                  id={`inline-prompt-${index}`}
                  rows={2}
                  value={blocksToEditableString(q.question)}
                  onChange={(e) =>
                    patchQuestion(index, (prev) => ({
                      ...prev,
                      question: updateBlocksTextPreservingImages(
                        prev.question,
                        e.target.value,
                      ),
                    }))
                  }
                  placeholder="Nội dung câu hỏi..."
                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] leading-relaxed focus:border-[var(--color-primary)] resize-y transition-colors"
                />

                {/* Attached images preview */}
                {promptImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {promptImages.map((img, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-1"
                      >
                        <img
                          src={img.content}
                          alt={img.alt || `Hình câu ${index + 1}`}
                          className="h-14 w-auto max-w-[140px] object-contain rounded"
                        />
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] mt-0.5 px-1">
                          <ImageIcon className="w-2.5 h-2.5" aria-hidden="true" />
                          Ảnh #{imgIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Short answer input */}
                {kind === "short_answer" ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    <label
                      htmlFor={`inline-short-${index}`}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0"
                    >
                      Đáp án:
                    </label>
                    <input
                      id={`inline-short-${index}`}
                      type="text"
                      value={(q.correctAnswer || []).join("; ")}
                      onChange={(e) =>
                        patchQuestion(index, (prev) => ({
                          ...prev,
                          correctAnswer: e.target.value
                            .split(/\s*;\s*/)
                            .map((s) => s.trim())
                            .filter((s, _, arr) => arr.length === 1 || s.length > 0),
                        }))
                      }
                      placeholder="Nhập đáp án ngắn (ngăn cách bằng dấu ; nếu có nhiều giá trị)"
                      className="flex-1 min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-emerald-700 dark:text-emerald-300 font-medium focus:border-emerald-500 transition-colors"
                    />
                  </div>
                ) : (
                  /* Options for Multiple Choice / True False Multiple */
                  <div className="space-y-1.5 pt-0.5">
                    {(q.options || []).map((opt, optIdx) => {
                      const isCorrect = (q.correctAnswer || []).includes(opt.id);
                      const hasOptImage = opt.content.some((b) => b.type === "image");

                      return (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-pressed={isCorrect}
                            onClick={() => {
                              patchQuestion(index, (prev) => {
                                if (kind === "true_false_multiple") {
                                  const exists = prev.correctAnswer.includes(opt.id);
                                  return {
                                    ...prev,
                                    correctAnswer: exists
                                      ? prev.correctAnswer.filter((id) => id !== opt.id)
                                      : [...prev.correctAnswer, opt.id],
                                  };
                                }
                                return {
                                  ...prev,
                                  correctAnswer: [opt.id],
                                };
                              });
                            }}
                            title={
                              kind === "true_false_multiple"
                                ? "Nhấn để bật/tắt Đúng hoặc Sai"
                                : "Nhấn để chọn làm đáp án đúng"
                            }
                            aria-label={
                              kind === "true_false_multiple"
                                ? `Câu ${index + 1} ý ${opt.label}: đang đặt là ${isCorrect ? "Đúng" : "Sai"}`
                                : `Chọn phương án ${opt.label} làm đáp án đúng cho câu ${index + 1}`
                            }
                            className={`shrink-0 min-h-[34px] px-2.5 rounded-md border text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                              isCorrect
                                ? "bg-emerald-700 border-emerald-600 text-white"
                                : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text)]"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {kind === "true_false_multiple" ? (
                              <span className="text-[10px]">
                                {isCorrect ? "Đ" : "S"}
                              </span>
                            ) : (
                              isCorrect && <Check className="w-3 h-3" aria-hidden="true" />
                            )}
                          </button>

                          <label htmlFor={`inline-opt-${index}-${optIdx}`} className="sr-only">
                            Nội dung phương án {opt.label} câu {index + 1}
                          </label>
                          <input
                            id={`inline-opt-${index}-${optIdx}`}
                            type="text"
                            value={blocksToEditableString(opt.content)}
                            onChange={(e) =>
                              patchQuestion(index, (prev) => ({
                                ...prev,
                                options: prev.options.map((o, j) =>
                                  j === optIdx
                                    ? {
                                        ...o,
                                        content: updateBlocksTextPreservingImages(
                                          o.content,
                                          e.target.value,
                                        ),
                                      }
                                    : o,
                                ),
                              }))
                            }
                            className="flex-1 min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
                          />

                          {hasOptImage && (
                            <span
                              title="Phương án có chứa ảnh (được giữ nguyên)"
                              className="shrink-0 p-1.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {allowAddDelete && (
        <div className="px-3 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => appendQuestion("multiple_choice")}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--color-primary-text)]" aria-hidden="true" />
            <span>Trắc nghiệm A-D</span>
          </button>
          <button
            type="button"
            onClick={() => appendQuestion("true_false_multiple")}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>Đúng / Sai</span>
          </button>
          <button
            type="button"
            onClick={() => appendQuestion("short_answer")}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span>Trả lời ngắn</span>
          </button>
        </div>
      )}
    </div>
  );
};
