import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@ltvquiz/shared";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardPaste,
  Pencil,
  Search,
  Trash2,
  X,
  Globe,
  Layers,
} from "lucide-react";
import {
  classifyQuestion,
  cloneQuestion,
  parseQuickAnswerKeyString,
  type ExamQuestionKind,
  type ExamVariant,
} from "../../services/shuffleService";
import {
  blocksToEditableString,
  updateBlocksTextPreservingImages,
} from "./InlineExamEditor";

export type AnswerEditScope = "all_variants" | "single_variant";

interface InteractiveAnswerKeyTableProps {
  variant: ExamVariant;
  totalVariantsCount?: number;
  sourceQuestions: Question[];
  onUpdateAnswer: (
    questionId: string,
    newCorrectAnswer: string[],
    scope: AnswerEditScope,
  ) => void;
  onUpdateQuestionText?: (
    questionId: string,
    nextQuestion: Question,
    scope: AnswerEditScope,
  ) => void;
  onBatchApplyAnswers?: (
    updates: Map<string, string[]>,
    scope: AnswerEditScope,
  ) => void;
  onMoveQuestion?: (idx: number, direction: -1 | 1) => void;
  onRemoveQuestion?: (idx: number) => void;
}

type KindFilter = "all" | ExamQuestionKind;

export const InteractiveAnswerKeyTable: React.FC<
  InteractiveAnswerKeyTableProps
> = ({
  variant,
  totalVariantsCount = 1,
  sourceQuestions: _sourceQuestions,
  onUpdateAnswer,
  onUpdateQuestionText,
  onBatchApplyAnswers,
  onMoveQuestion,
  onRemoveQuestion,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [expandedRowIdx, setExpandedRowIdx] = useState<number | null>(null);
  const [editScope, setEditScope] = useState<AnswerEditScope>("all_variants");
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [pasteRawText, setPasteRawText] = useState("");
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const parsedQuickAnswers = useMemo(() => {
    return parseQuickAnswerKeyString(pasteRawText, variant.questions);
  }, [pasteRawText, variant.questions]);

  const notifyChange = (msg: string) => {
    setLastActionNotice(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setLastActionNotice((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const handleSelectOptionAnswer = (
    q: Question,
    optId: string,
    optLabel: string,
    qNum: number,
  ) => {
    onUpdateAnswer(q.id, [optId], editScope);
    const scopeLabel =
      editScope === "all_variants"
        ? `Tất cả ${totalVariantsCount} mã đề`
        : `Mã đề ${variant.examCode}`;
    notifyChange(`Đã đổi đáp án Câu ${qNum} thành ${optLabel} (${scopeLabel})`);
  };

  const handleToggleTfAnswer = (
    q: Question,
    optId: string,
    optLabel: string,
    qNum: number,
  ) => {
    const cur = q.correctAnswer || [];
    const isCurrentlyTrue = cur.includes(optId);
    const nextAnswers = isCurrentlyTrue
      ? cur.filter((id) => id !== optId)
      : [...cur, optId];

    onUpdateAnswer(q.id, nextAnswers, editScope);
    const status = isCurrentlyTrue ? "Sai" : "Đúng";
    const scopeLabel =
      editScope === "all_variants"
        ? `Tất cả ${totalVariantsCount} mã đề`
        : `Mã đề ${variant.examCode}`;
    notifyChange(`Đã đổi ý ${optLabel}) Câu ${qNum} thành ${status} (${scopeLabel})`);
  };

  const handleShortAnswerChange = (q: Question, val: string, qNum: number) => {
    const answers = val
      .split(/\s*;\s*/)
      .map((s) => s.trim())
      .filter((s, _, arr) => arr.length === 1 || s.length > 0);
    onUpdateAnswer(q.id, answers, editScope);
    notifyChange(`Đã cập nhật đáp án Câu ${qNum}`);
  };

  const handleApplyQuickPaste = () => {
    if (parsedQuickAnswers.updates.size === 0) return;
    if (onBatchApplyAnswers) {
      onBatchApplyAnswers(parsedQuickAnswers.updates, editScope);
      const scopeLabel =
        editScope === "all_variants"
          ? `Tất cả ${totalVariantsCount} mã đề`
          : `Mã đề ${variant.examCode}`;
      notifyChange(
        `Đã áp dụng đáp án cho ${parsedQuickAnswers.recognizedCount} câu hỏi (${scopeLabel})`,
      );
    }
    setShowQuickPaste(false);
    setPasteRawText("");
  };

  const patchQuestionDetails = (
    idx: number,
    updater: (prev: Question) => Question,
  ) => {
    const targetQ = variant.questions[idx];
    if (!targetQ) return;
    const patched = updater(cloneQuestion(targetQ));
    if (onUpdateQuestionText) {
      onUpdateQuestionText(targetQ.id, patched, editScope);
    }
  };

  const countsByKind = useMemo(() => {
    const counts = {
      all: variant.answerKey.length,
      multiple_choice: 0,
      true_false_multiple: 0,
      short_answer: 0,
    };
    for (const row of variant.answerKey) {
      if (row.kind === "multiple_choice") counts.multiple_choice++;
      else if (row.kind === "true_false_multiple") counts.true_false_multiple++;
      else if (row.kind === "short_answer") counts.short_answer++;
    }
    return counts;
  }, [variant.answerKey]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return variant.answerKey
      .map((row, idx) => ({
        row,
        idx,
        question: variant.questions[idx],
      }))
      .filter(({ row, question }) => {
        if (!question) return false;
        if (kindFilter !== "all" && row.kind !== kindFilter) return false;
        if (!q) return true;
        const numMatch =
          `câu ${row.questionIndex}`.includes(q) ||
          String(row.questionIndex) === q ||
          String(row.originalIndex) === q;
        const textMatch = blocksToEditableString(question.question)
          .toLowerCase()
          .includes(q);
        return numMatch || textMatch;
      });
  }, [variant.answerKey, variant.questions, kindFilter, searchQuery]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 sm:p-5 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
        {/* Header & Scope Switcher */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)]">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2 flex-wrap">
              <span>Bảng sửa đáp án đề thi</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary-text)] font-semibold tabular-nums">
                Mã đề: {variant.examCode}
              </span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Nhấn trực tiếp vào A/B/C/D hoặc Đ/S để sửa đáp án. Mọi thay đổi sẽ cập nhật lên bản in và file ZIP.
            </p>
          </div>

          {/* Quick Paste & Search Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowQuickPaste((prev) => !prev)}
              aria-expanded={showQuickPaste}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Dán nhanh chuỗi đáp án (VD: 1A 2B 3C... hoặc A B C D)"
            >
              <ClipboardPaste size={14} aria-hidden="true" className="text-emerald-500" />
              <span>Dán chuỗi đáp án</span>
            </button>

            <div className="relative flex-1 sm:w-44">
              <label htmlFor="answer-key-search" className="sr-only">
                Tìm câu số hoặc nội dung
              </label>
              <Search
                size={13}
                aria-hidden="true"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              />
              <input
                id="answer-key-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm câu số / nội dung..."
                className="w-full min-h-[36px] pl-7 pr-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action feedback notice */}
        {lastActionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between gap-2 animate-notice-enter"
          >
            <span className="flex items-center gap-1.5">
              <Check size={14} aria-hidden="true" className="shrink-0" />
              <span>{lastActionNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setLastActionNotice(null)}
              aria-label="Đóng thông báo"
              className="p-1.5 rounded hover:bg-emerald-500/15 cursor-pointer"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Scope selection banner */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-background)]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Phạm vi sửa:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none min-h-[32px]">
              <input
                type="radio"
                name="answerEditScope"
                checked={editScope === "all_variants"}
                onChange={() => setEditScope("all_variants")}
                className="accent-[var(--color-primary)]"
              />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                <Globe size={13} aria-hidden="true" />
                Áp dụng cho tất cả mã đề ({totalVariantsCount} đề)
              </span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none min-h-[32px]">
              <input
                type="radio"
                name="answerEditScope"
                checked={editScope === "single_variant"}
                onChange={() => setEditScope("single_variant")}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-[var(--color-text-secondary)] inline-flex items-center gap-1 font-medium">
                <Layers size={13} aria-hidden="true" />
                Chỉ sửa riêng Mã đề {variant.examCode}
              </span>
            </label>
          </div>
        </div>

        {/* Quick Paste Slide-down Panel */}
        {showQuickPaste && (
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-background)] space-y-3 animate-panel-enter">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardPaste size={15} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                <span className="text-xs font-bold text-[var(--color-text)]">
                  Dán chuỗi đáp án hàng loạt
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPaste(false)}
                aria-label="Đóng bảng dán đáp án"
                className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <label htmlFor="quick-paste-textarea" className="sr-only">
              Nhập chuỗi đáp án hàng loạt
            </label>
            <textarea
              id="quick-paste-textarea"
              rows={3}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder="Dán chuỗi đáp án tại đây. Ví dụ: 1A 2B 3C 4D 5A 6B hoặc A B C D A B C D"
              className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] font-mono leading-relaxed focus:border-[var(--color-primary)] transition-colors"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs">
                {pasteRawText.trim() ? (
                  parsedQuickAnswers.recognizedCount > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Đã nhận diện {parsedQuickAnswers.recognizedCount} câu hỏi hợp lệ.
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Chưa nhận diện được đáp án. Mẫu: 1A 2B 3C hoặc A B C D.
                    </span>
                  )
                ) : (
                  <span className="text-[var(--color-text-secondary)]">
                    Hỗ trợ định dạng 1A 2B 3C, 1.A 2.B, hoặc danh sách chữ cái cách nhau bằng dấu cách.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickPaste(false)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={parsedQuickAnswers.recognizedCount === 0}
                  onClick={handleApplyQuickPaste}
                  className="min-h-[36px] px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-xs font-bold text-white cursor-pointer transition-colors"
                >
                  Áp dụng {parsedQuickAnswers.recognizedCount} câu (
                  {editScope === "all_variants"
                    ? `Cả ${totalVariantsCount} đề`
                    : `Mã đề ${variant.examCode}`}
                  )
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Kind Filter bar */}
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-background)]/40 flex flex-wrap items-center gap-1.5 text-xs">
          {(
            [
              { id: "all", label: `Tất cả (${countsByKind.all})` },
              {
                id: "multiple_choice",
                label: `Phần I. Trắc nghiệm (${countsByKind.multiple_choice})`,
              },
              {
                id: "true_false_multiple",
                label: `Phần II. Đúng/Sai (${countsByKind.true_false_multiple})`,
              },
              {
                id: "short_answer",
                label: `Phần III. Trả lời ngắn (${countsByKind.short_answer})`,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={kindFilter === f.id}
              onClick={() => setKindFilter(f.id)}
              className={`min-h-[34px] px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                kindFilter === f.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty filter state */}
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center space-y-3 animate-panel-enter">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Không tìm thấy câu hỏi phù hợp
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Thử đổi bộ lọc phần hoặc xóa từ khóa tìm kiếm để xem toàn bộ {variant.answerKey.length} câu.
            </p>
            <button
              type="button"
              onClick={() => {
                setKindFilter("all");
                setSearchQuery("");
              }}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text)] cursor-pointer transition-colors"
            >
              Xem tất cả câu hỏi
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (< md) */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {filteredRows.map(({ row, idx, question }) => {
                const kind = classifyQuestion(question);
                const isExpanded = expandedRowIdx === idx;
                const promptSnippet = blocksToEditableString(question.question);

                return (
                  <div key={`m_${question.id}_${idx}`} className="p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--color-text)] tabular-nums">
                          Câu {row.questionIndex}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                          Gốc: Câu {row.originalIndex}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onMoveQuestion && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => onMoveQuestion(idx, -1)}
                              aria-label={`Chuyển câu ${row.questionIndex} lên trên`}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === variant.questions.length - 1}
                              onClick={() => onMoveQuestion(idx, 1)}
                              aria-label={`Chuyển câu ${row.questionIndex} xuống dưới`}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown size={13} aria-hidden="true" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandedRowIdx(isExpanded ? null : idx)}
                          aria-expanded={isExpanded}
                          className={`min-h-[36px] px-2.5 py-1 rounded-md border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                            isExpanded
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {isExpanded ? <X size={12} aria-hidden="true" /> : <Pencil size={12} aria-hidden="true" />}
                          <span>{isExpanded ? "Đóng" : "Sửa"}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-text)] line-clamp-2">
                      {promptSnippet || "Câu hỏi không có văn bản"}
                    </p>

                    <div>
                      {kind === "short_answer" ? (
                        <input
                          type="text"
                          value={(question.correctAnswer || []).join("; ")}
                          onChange={(e) =>
                            handleShortAnswerChange(question, e.target.value, row.questionIndex)
                          }
                          placeholder="Nhập đáp án ngắn..."
                          aria-label={`Đáp án ngắn câu ${row.questionIndex}`}
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                        />
                      ) : kind === "true_false_multiple" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(question.options || []).map((opt) => {
                            const isTrue = question.correctAnswer?.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                aria-pressed={isTrue}
                                onClick={() =>
                                  handleToggleTfAnswer(question, opt.id, opt.label, row.questionIndex)
                                }
                                className={`min-h-[40px] min-w-[54px] px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                                  isTrue
                                    ? "bg-emerald-700 border-emerald-600 text-white"
                                    : "bg-red-500/15 border-red-500/35 text-red-700 dark:text-red-300"
                                }`}
                              >
                                {opt.label}: {isTrue ? "Đ" : "S"}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(question.options || []).map((opt) => {
                            const isCorrect = question.correctAnswer?.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                aria-pressed={isCorrect}
                                onClick={() =>
                                  handleSelectOptionAnswer(question, opt.id, opt.label, row.questionIndex)
                                }
                                className={`min-w-[44px] min-h-[44px] px-3 rounded-lg border text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                  isCorrect
                                    ? "bg-emerald-700 border-emerald-600 text-white"
                                    : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)]"
                                }`}
                              >
                                <span>{opt.label}</span>
                                {isCorrect && <Check size={12} aria-hidden="true" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-background)] p-3 space-y-2.5 animate-panel-enter">
                        <textarea
                          rows={2}
                          value={promptSnippet}
                          aria-label={`Sửa nội dung câu ${row.questionIndex}`}
                          onChange={(e) =>
                            patchQuestionDetails(idx, (prev) => ({
                              ...prev,
                              question: updateBlocksTextPreservingImages(prev.question, e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)]"
                        />
                        {kind !== "short_answer" && (
                          <div className="space-y-1.5">
                            {(question.options || []).map((opt, optIdx) => (
                              <div key={opt.id} className="flex items-center gap-1.5">
                                <span className="w-6 h-8 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs inline-flex items-center justify-center shrink-0">
                                  {opt.label}
                                </span>
                                <input
                                  type="text"
                                  aria-label={`Phương án ${opt.label} câu ${row.questionIndex}`}
                                  value={blocksToEditableString(opt.content)}
                                  onChange={(e) =>
                                    patchQuestionDetails(idx, (prev) => ({
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
                                  className="flex-1 min-h-[36px] px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--color-background)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-3 py-2.5 whitespace-nowrap">Câu mới</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Câu gốc</th>
                    <th className="px-3 py-2.5">Nội dung câu hỏi</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Sửa đáp án đúng</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredRows.map(({ row, idx, question }) => {
                    const kind = classifyQuestion(question);
                    const isExpanded = expandedRowIdx === idx;
                    const promptSnippet = blocksToEditableString(question.question);

                    return (
                      <React.Fragment key={`${question.id}_${idx}`}>
                        <tr className="hover:bg-[var(--color-surface-hover)]/40 transition-colors">
                          {/* New Question Number + Reorder Arrows */}
                          <td className="px-3 py-2.5 whitespace-nowrap align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[var(--color-text)] tabular-nums">
                                Câu {row.questionIndex}
                              </span>
                              {onMoveQuestion && (
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => onMoveQuestion(idx, -1)}
                                    title="Chuyển câu lên trên"
                                    aria-label={`Chuyển câu ${row.questionIndex} lên trên`}
                                    className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-25 cursor-pointer"
                                  >
                                    <ArrowUp size={12} aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === variant.questions.length - 1}
                                    onClick={() => onMoveQuestion(idx, 1)}
                                    title="Chuyển câu xuống dưới"
                                    aria-label={`Chuyển câu ${row.questionIndex} xuống dưới`}
                                    className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-25 cursor-pointer"
                                  >
                                    <ArrowDown size={12} aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Original Question Number */}
                          <td className="px-3 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap align-top">
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] tabular-nums">
                              Gốc: Câu {row.originalIndex}
                            </span>
                          </td>

                          {/* Question Snippet */}
                          <td className="px-3 py-2.5 max-w-[260px] align-top">
                            <div className="truncate text-[var(--color-text)] font-medium" title={promptSnippet}>
                              {promptSnippet || "Câu hỏi không có văn bản"}
                            </div>
                          </td>

                          {/* Interactive Answer Selector */}
                          <td className="px-3 py-2.5 align-top">
                            {kind === "short_answer" ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  aria-label={`Đáp án ngắn câu ${row.questionIndex}`}
                                  value={(question.correctAnswer || []).join("; ")}
                                  onChange={(e) =>
                                    handleShortAnswerChange(
                                      question,
                                      e.target.value,
                                      row.questionIndex,
                                    )
                                  }
                                  placeholder="Nhập đáp án ngắn..."
                                  className="w-36 sm:w-48 px-2.5 py-1 rounded-md bg-[var(--color-background)] border border-emerald-500/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:border-emerald-400"
                                />
                              </div>
                            ) : kind === "true_false_multiple" ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(question.options || []).map((opt) => {
                                  const isTrue = question.correctAnswer?.includes(opt.id);
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      aria-pressed={isTrue}
                                      onClick={() =>
                                        handleToggleTfAnswer(
                                          question,
                                          opt.id,
                                          opt.label,
                                          row.questionIndex,
                                        )
                                      }
                                      title={`Click để chuyển ý ${opt.label}) sang ${isTrue ? "Sai" : "Đúng"}`}
                                      className={`px-2 py-1 rounded border text-[11px] font-bold transition-colors cursor-pointer ${
                                        isTrue
                                          ? "bg-emerald-700 border-emerald-600 text-white"
                                          : "bg-red-500/15 border-red-500/35 text-red-700 dark:text-red-300 hover:bg-red-500/25"
                                      }`}
                                    >
                                      {opt.label}:{isTrue ? "Đ" : "S"}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                {(question.options || []).map((opt) => {
                                  const isCorrect = question.correctAnswer?.includes(opt.id);
                                  const optText = blocksToEditableString(opt.content);
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      aria-pressed={isCorrect}
                                      onClick={() =>
                                        handleSelectOptionAnswer(
                                          question,
                                          opt.id,
                                          opt.label,
                                          row.questionIndex,
                                        )
                                      }
                                      title={`${opt.label}. ${optText}`}
                                      className={`min-w-8 h-8 px-2 rounded-md border text-xs font-bold inline-flex items-center justify-center transition-colors cursor-pointer ${
                                        isCorrect
                                          ? "bg-emerald-700 border-emerald-600 text-white"
                                          : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-emerald-500/50 hover:text-[var(--color-text)]"
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {isCorrect && <Check size={11} aria-hidden="true" className="ml-0.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Row Action: Expand Editor / Delete */}
                          <td className="px-3 py-2.5 text-right whitespace-nowrap align-top">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedRowIdx(isExpanded ? null : idx)
                                }
                                title={isExpanded ? "Đóng chỉnh sửa" : "Sửa chi tiết câu hỏi & phương án"}
                                className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                  isExpanded
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                                }`}
                              >
                                {isExpanded ? <X size={11} aria-hidden="true" /> : <Pencil size={11} aria-hidden="true" />}
                                <span>{isExpanded ? "Đóng" : "Sửa câu"}</span>
                              </button>
                              {onRemoveQuestion && variant.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveQuestion(idx)}
                                  title="Xóa câu này"
                                  aria-label={`Xóa câu ${row.questionIndex}`}
                                  className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={13} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Question Details Editor */}
                        {isExpanded && (
                          <tr className="bg-[var(--color-background)]/70 animate-panel-enter">
                            <td colSpan={5} className="p-3 sm:p-4">
                              <div className="rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-3 space-y-2.5 shadow-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-[var(--color-primary-text)]">
                                    Sửa nội dung chi tiết Câu {row.questionIndex} (
                                    {editScope === "all_variants"
                                      ? `Cập nhật cả ${totalVariantsCount} mã đề`
                                      : `Chỉ Mã đề ${variant.examCode}`}
                                    )
                                  </span>
                                  <input
                                    type="text"
                                    aria-label={`Tiêu đề phần câu ${row.questionIndex}`}
                                    value={question.sectionTitle || ""}
                                    onChange={(e) =>
                                      patchQuestionDetails(idx, (prev) => ({
                                        ...prev,
                                        sectionTitle: e.target.value || undefined,
                                      }))
                                    }
                                    placeholder="Tiêu đề phần..."
                                    className="w-56 px-2 py-1 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] text-[var(--color-text)]"
                                  />
                                </div>

                                <textarea
                                  rows={2}
                                  aria-label={`Nội dung câu ${row.questionIndex}`}
                                  value={promptSnippet}
                                  onChange={(e) =>
                                    patchQuestionDetails(idx, (prev) => ({
                                      ...prev,
                                      question: updateBlocksTextPreservingImages(
                                        prev.question,
                                        e.target.value,
                                      ),
                                    }))
                                  }
                                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-primary)]"
                                />

                                {kind !== "short_answer" && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(question.options || []).map((opt, optIdx) => (
                                      <div key={opt.id} className="flex items-center gap-1.5">
                                        <span className="w-6 h-7 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] font-bold text-xs inline-flex items-center justify-center shrink-0">
                                          {opt.label}
                                        </span>
                                        <input
                                          type="text"
                                          aria-label={`Phương án ${opt.label} câu ${row.questionIndex}`}
                                          value={blocksToEditableString(opt.content)}
                                          onChange={(e) =>
                                            patchQuestionDetails(idx, (prev) => ({
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
                                          className="flex-1 px-2 py-1 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-primary)]"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
