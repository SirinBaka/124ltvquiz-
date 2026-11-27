import React, { useState, useRef } from "react";
import type { Question } from "@ltvquiz/shared";
import {
  Trash2,
  Plus,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ImagePlus,
  Check,
} from "lucide-react";
import { ScientificToolbar } from "./ScientificToolbar";
import { insertSnippetAtCursor } from "./scientificHelper";

type QuestionFormProps = {
  question: Question;
  onChange: (q: Question) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

export function QuestionForm({
  question,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: QuestionFormProps) {
  const [activeTarget, setActiveTarget] = useState<"question" | string>(
    "question",
  );
  const [showMobileSymbols, setShowMobileSymbols] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const optionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const textContent =
    question.question.find((c) => c.type === "text")?.content || "";

  const handleInsertSnippet = (
    snippet: string,
    target?: "question" | string,
  ) => {
    const finalTarget = target || activeTarget;
    if (finalTarget === "question") {
      const current =
        question.question.find((c) => c.type === "text")?.content || "";
      const start = questionRef.current?.selectionStart ?? current.length;
      const end = questionRef.current?.selectionEnd ?? current.length;
      const result = insertSnippetAtCursor(current, start, end, snippet);

      const newContent = [...question.question];
      const textIdx = newContent.findIndex((c) => c.type === "text");
      if (textIdx >= 0) {
        newContent[textIdx] = { ...newContent[textIdx], content: result.text };
      } else {
        newContent.push({ type: "text", content: result.text });
      }
      onChange({ ...question, question: newContent });

      requestAnimationFrame(() => {
        if (questionRef.current) {
          questionRef.current.focus();
          questionRef.current.setSelectionRange(
            result.cursorIndex,
            result.cursorIndex,
          );
        }
      });
    } else {
      const opt = question.options.find((o) => o.id === finalTarget);
      if (!opt) return;
      const current = opt.content.find((c) => c.type === "text")?.content || "";
      const el = optionRefs.current[finalTarget];
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? current.length;
      const result = insertSnippetAtCursor(current, start, end, snippet);

      const newOpts = question.options.map((o) => {
        if (o.id === finalTarget) {
          const textIdx = o.content.findIndex((c) => c.type === "text");
          const newContent = [...o.content];
          if (textIdx >= 0) {
            newContent[textIdx] = {
              ...newContent[textIdx],
              content: result.text,
            };
          } else {
            newContent.push({ type: "text", content: result.text });
          }
          return { ...o, content: newContent };
        }
        return o;
      });
      onChange({ ...question, options: newOpts });

      requestAnimationFrame(() => {
        const inputEl = optionRefs.current[finalTarget];
        if (inputEl) {
          inputEl.focus();
          inputEl.setSelectionRange(result.cursorIndex, result.cursorIndex);
        }
      });
    }
  };

  const handleQuestionTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newContent = [...question.question];
    const textIdx = newContent.findIndex((c) => c.type === "text");
    if (textIdx >= 0) {
      newContent[textIdx] = { ...newContent[textIdx], content: e.target.value };
    } else {
      newContent.push({ type: "text", content: e.target.value });
    }
    onChange({ ...question, question: newContent });
  };

  const handleOptionChange = (optId: string, val: string) => {
    const newOpts = question.options.map((opt) => {
      if (opt.id === optId) {
        const textIdx = opt.content.findIndex((c) => c.type === "text");
        const newContent = [...opt.content];
        if (textIdx >= 0) {
          newContent[textIdx] = { ...newContent[textIdx], content: val };
        } else {
          newContent.push({ type: "text", content: val });
        }
        return { ...opt, content: newContent };
      }
      return opt;
    });
    onChange({ ...question, options: newOpts });
  };

  const handleCorrectAnswerToggle = (optId: string) => {
    onChange({ ...question, correctAnswer: [optId] });
  };

  const handleDeleteOption = (optId: string) => {
    if (question.options.length <= 2) {
      alert("Câu hỏi cần có ít nhất 2 đáp án.");
      return;
    }
    const filtered = question.options.filter((o) => o.id !== optId);
    const labels = ["A", "B", "C", "D", "E", "F", "G"];
    const newOpts = filtered.map((o, idx) => ({ ...o, label: labels[idx] }));
    const newCorrect = question.correctAnswer.filter((id) => id !== optId);
    onChange({ ...question, options: newOpts, correctAnswer: newCorrect });
  };

  const handleAddOption = () => {
    if (question.options.length >= 6) return;
    const labels = ["A", "B", "C", "D", "E", "F", "G"];
    const newOpt = {
      id: "opt_" + Math.random().toString(36).substr(2, 6),
      label: labels[question.options.length],
      content: [{ type: "text" as const, content: "" }],
    };
    onChange({ ...question, options: [...question.options, newOpt] });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isOption: boolean,
    optId?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const imgBlock = {
        type: "image" as const,
        content: dataUrl,
        alt: file.name,
      };
      if (!isOption) {
        onChange({ ...question, question: [...question.question, imgBlock] });
      } else if (optId) {
        const newOpts = question.options.map((o) => {
          if (o.id === optId)
            return { ...o, content: [...o.content, imgBlock] };
          return o;
        });
        onChange({ ...question, options: newOpts });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeBlock = (index: number, isOption: boolean, optId?: string) => {
    if (!isOption) {
      const newBlocks = [...question.question];
      newBlocks.splice(index, 1);
      onChange({ ...question, question: newBlocks });
    } else if (optId) {
      const newOpts = question.options.map((o) => {
        if (o.id === optId) {
          const newBlocks = [...o.content];
          newBlocks.splice(index, 1);
          return { ...o, content: newBlocks };
        }
        return o;
      });
      onChange({ ...question, options: newOpts });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-surface)] p-4 md:p-6 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-12 sm:pb-20">
        {/* Actions bar */}
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-bold text-[var(--color-text)]">
            Chi tiết câu hỏi
          </h2>
          <div className="flex items-center gap-1">
            <button
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className={`p-1.5 rounded-lg transition-colors ${
                canMoveUp
                  ? "hover:bg-[var(--color-background)] text-[var(--color-text)] cursor-pointer"
                  : "text-[var(--color-text-secondary)] opacity-30 cursor-not-allowed"
              }`}
              title="Di chuyển lên"
            >
              <ArrowUp size={15} />
            </button>
            <button
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className={`p-1.5 rounded-lg transition-colors ${
                canMoveDown
                  ? "hover:bg-[var(--color-background)] text-[var(--color-text)] cursor-pointer"
                  : "text-[var(--color-text-secondary)] opacity-30 cursor-not-allowed"
              }`}
              title="Di chuyển xuống"
            >
              <ArrowDown size={15} />
            </button>
            <div className="w-[1px] h-4 bg-[var(--color-border)] mx-1" />
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text)] transition-colors cursor-pointer"
              title="Nhân bản câu hỏi"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
              title="Xóa câu hỏi"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Question Type & Points Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text)]">
              Loại câu hỏi
            </label>
            <select
              className="w-full bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value as any;
                let newCorrect = [...question.correctAnswer];
                if (newType === "multiple_choice" && newCorrect.length > 1) {
                  newCorrect = [newCorrect[0]];
                }
                onChange({
                  ...question,
                  type: newType,
                  correctAnswer: newCorrect,
                });
              }}
            >
              <option value="multiple_choice">Trắc nghiệm 1 đáp án</option>
              <option value="true_false_multiple">
                Đúng / Sai nhiều mệnh đề
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text)]">
              Điểm
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-mono"
              value={question.points}
              onChange={(e) =>
                onChange({
                  ...question,
                  points: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        {/* Scientific & Catalyst Toolbar */}
        <div>
          <button
            type="button"
            aria-expanded={showMobileSymbols}
            aria-controls="question-symbols"
            onClick={() => setShowMobileSymbols(!showMobileSymbols)}
            className="md:hidden flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]"
          >
            Ký hiệu và công thức
            <ChevronDown size={16} aria-hidden="true" className={showMobileSymbols ? "rotate-180" : ""} />
          </button>
          <div id="question-symbols" className={showMobileSymbols ? "mt-2 md:mt-0" : "hidden md:block"}>
            <ScientificToolbar
              onInsertSnippet={handleInsertSnippet}
              currentTarget={activeTarget}
              options={question.options.map((o) => ({ id: o.id, label: o.label }))}
              onSelectTarget={(target) => {
                setActiveTarget(target);
                if (target === "question") {
                  questionRef.current?.focus();
                } else {
                  optionRefs.current[target]?.focus();
                }
              }}
            />
          </div>
        </div>

        {/* Question Textarea */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-semibold text-[var(--color-text)]">
                Nội dung câu hỏi
              </label>
              {activeTarget === "question" && (
                <span className="text-[10px] bg-[var(--color-primary)]/15 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium">
                  Đang chọn chèn ký hiệu
                </span>
              )}
            </div>
            <label className="cursor-pointer text-xs font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
              <ImagePlus size={14} /> Thêm ảnh
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, false)}
              />
            </label>
          </div>

          <div className="space-y-2 border border-[var(--color-border)] bg-[var(--color-background)]/50 rounded-xl p-3 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all min-h-[120px]">
            <textarea
              ref={questionRef}
              onFocus={() => setActiveTarget("question")}
              className="w-full p-1 text-sm bg-transparent text-[var(--color-text)] placeholder-[var(--color-text-secondary)]/50 focus:ring-0 outline-none resize-y border-none min-h-[90px]"
              value={textContent}
              onChange={handleQuestionTextChange}
              placeholder="Nhập nội dung câu hỏi (hỗ trợ KaTeX $...$, phương trình hóa học, ký hiệu Toán - Lý - Hóa)..."
            />
            {question.question.map(
              (block, idx) =>
                block.type === "image" && (
                  <div key={idx} className="relative inline-block m-1 group">
                    <img
                      src={block.content}
                      alt={block.alt}
                      className="max-h-40 rounded-lg border border-[var(--color-border)] object-contain"
                    />
                    <button
                      onClick={() => removeBlock(idx, false)}
                      className="absolute top-1.5 right-1.5 bg-[var(--color-surface)] rounded-full p-1 shadow-sm text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-[var(--color-text)]">
              {question.type === "true_false_multiple"
                ? "Các mệnh đề"
                : "Các đáp án"}
            </label>
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {question.type === "true_false_multiple"
                ? "Đánh dấu Đúng / Sai cho từng mệnh đề"
                : "Bấm vòng tròn để chọn đáp án đúng"}
            </span>
          </div>

          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const optContent =
                opt.content.find((c) => c.type === "text")?.content || "";
              const isCorrect = question.correctAnswer.includes(opt.id);

              return (
                <div
                  key={opt.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    isCorrect
                      ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-2xs"
                      : "border-[var(--color-border)] bg-[var(--color-background)]/40 hover:border-[var(--color-border)]"
                  }`}
                >
                  {/* Correct toggle button */}
                  {question.type === "multiple_choice" ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCorrectAnswerToggle(opt.id)}
                        title={
                          isCorrect
                            ? "Đáp án đúng"
                            : `Nhấp để đặt ${opt.label} làm đáp án đúng`
                        }
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-2xs"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-emerald-500 text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1.5 flex flex-col gap-1 text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          const newAns = [...question.correctAnswer, opt.id];
                          onChange({
                            ...question,
                            correctAnswer: Array.from(new Set(newAns)),
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                        }`}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newAns = question.correctAnswer.filter(
                            (id) => id !== opt.id,
                          );
                          onChange({ ...question, correctAnswer: newAns });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          !isCorrect
                            ? "bg-rose-500 text-white"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                        }`}
                      >
                        Sai
                      </button>
                    </div>
                  )}

                  {/* Option Label & Textarea */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTarget(opt.id);
                          optionRefs.current[opt.id]?.focus();
                        }}
                        className={`flex-none font-bold w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                          activeTarget === opt.id
                            ? "bg-[var(--color-primary)] text-white shadow-xs"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
                        }`}
                        title={`Chọn đáp án ${opt.label} để chèn ký hiệu`}
                      >
                        {opt.label}
                      </button>
                      <textarea
                        ref={(el) => {
                          optionRefs.current[opt.id] = el;
                        }}
                        onFocus={() => setActiveTarget(opt.id)}
                        className={`flex-1 border rounded-xl p-2.5 text-sm outline-none min-h-[42px] resize-y transition-colors bg-[var(--color-surface)] text-[var(--color-text)] ${
                          activeTarget === opt.id
                            ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                            : "border-[var(--color-border)]"
                        }`}
                        value={optContent}
                        onChange={(e) =>
                          handleOptionChange(opt.id, e.target.value)
                        }
                        placeholder={`Nội dung ${opt.label}...`}
                      />
                    </div>

                    {/* Option Images */}
                    {opt.content.some((c) => c.type === "image") && (
                      <div className="flex flex-wrap gap-2 pl-9">
                        {opt.content.map(
                          (block, idx) =>
                            block.type === "image" && (
                              <div
                                key={idx}
                                className="relative group inline-block"
                              >
                                <img
                                  src={block.content}
                                  alt={block.alt}
                                  className="h-20 rounded-lg border border-[var(--color-border)] object-contain"
                                />
                                <button
                                  onClick={() => removeBlock(idx, true, opt.id)}
                                  className="absolute top-1 right-1 bg-[var(--color-surface)] rounded-full p-1 shadow-sm text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ),
                        )}
                      </div>
                    )}

                    <label className="text-[11px] font-medium text-[var(--color-primary)] hover:underline cursor-pointer pl-9 inline-flex items-center gap-1 w-fit">
                      <ImagePlus size={12} /> Thêm ảnh cho đáp án {opt.label}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true, opt.id)}
                      />
                    </label>
                  </div>

                  {/* Delete option */}
                  <button
                    onClick={() => handleDeleteOption(opt.id)}
                    className="pt-2 text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                    title="Xóa đáp án này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {question.options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="w-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] bg-[var(--color-background)]/30 hover:bg-[var(--color-background)] font-medium text-xs rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
            >
              <Plus size={15} /> Thêm{" "}
              {question.type === "true_false_multiple" ? "mệnh đề" : "đáp án"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
