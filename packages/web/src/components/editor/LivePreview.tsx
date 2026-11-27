import type { Question } from "@ltvquiz/shared";
import { RichText } from "../RichText";
import { Eye, Check } from "lucide-react";

type LivePreviewProps = {
  question: Question;
  index: number;
};

export function LivePreview({ question, index }: LivePreviewProps) {
  const textContent = question.question
    .filter((c) => c.type === "text" || c.type === "math")
    .map((c) => c.content)
    .join("\n");

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)] select-none">
      {/* Header Toolbar */}
      <div className="h-10 border-b border-[var(--color-border)] flex items-center justify-between px-4 bg-[var(--color-surface)] shrink-0">
        <div className="flex items-center gap-1.5">
          <Eye size={14} className="text-[var(--color-text-secondary)]" />
          <span className="text-xs font-bold text-[var(--color-text)] tracking-wider">
            XEM TRƯỚC
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {question.type === "true_false_multiple"
            ? "Đúng/Sai nhiều ý"
            : "Trắc nghiệm 1 đáp án"}
        </span>
      </div>

      {/* Preview Canvas Area */}
      <div className="flex-1 overflow-y-auto bg-[var(--color-background)] custom-scrollbar p-3 md:p-5 flex flex-col items-center">
        <div className="w-full max-w-xl bg-[var(--color-surface)] p-5 md:p-6 shadow-xs border border-[var(--color-border)] rounded-2xl transition-all">
          {/* Question Header */}
          <div className="mb-5 flex justify-between items-center border-b border-[var(--color-border)] pb-3">
            <span className="text-base font-bold text-[var(--color-text)]">
              Câu {index + 1}
            </span>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {question.points} điểm
            </span>
          </div>

          {/* Question Content */}
          <div className="mb-5">
            {textContent ? (
              <RichText
                content={textContent}
                className="text-[var(--color-text)] leading-relaxed text-[15px]"
              />
            ) : (
              <p className="text-[var(--color-text-secondary)] italic text-sm">
                (Chưa nhập nội dung câu hỏi...)
              </p>
            )}

            {question.question.some((c) => c.type === "image") && (
              <div className="flex flex-col gap-3 mt-4">
                {question.question.map(
                  (c, i) =>
                    c.type === "image" && (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-background)]/50 p-1 flex justify-center"
                      >
                        <img
                          src={c.content}
                          alt={c.alt || "Hình minh họa"}
                          className="max-h-56 object-contain rounded-lg"
                        />
                      </div>
                    ),
                )}
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const optContent =
                opt.content.find((c) => c.type === "text")?.content || "";
              const isCorrect = question.correctAnswer.includes(opt.id);
              const hasImages = opt.content.some((c) => c.type === "image");

              if (question.type === "true_false_multiple") {
                return (
                  <div
                    key={opt.id}
                    className={`flex items-start justify-between p-3.5 border rounded-xl transition-all ${
                      isCorrect
                        ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]/70"
                    }`}
                  >
                    <div className="text-sm flex gap-2.5 flex-1 pr-3">
                      <span className="font-bold text-[var(--color-text)] shrink-0">
                        {opt.label}.
                      </span>
                      <div className="flex-1">
                        <RichText
                          content={optContent || `(Mệnh đề ${opt.label})`}
                          className="text-[var(--color-text)]"
                        />
                        {hasImages && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {opt.content.map(
                              (c, i) =>
                                c.type === "image" && (
                                  <img
                                    key={i}
                                    src={c.content}
                                    alt={c.alt}
                                    className="max-h-24 rounded-lg border border-[var(--color-border)]"
                                  />
                                ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                          isCorrect
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-60"
                        }`}
                      >
                        Đúng
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                          !isCorrect
                            ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                            : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-60"
                        }`}
                      >
                        Sai
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={opt.id}
                  className={`flex items-start p-3.5 border rounded-xl transition-all cursor-default ${
                    isCorrect
                      ? "border-emerald-500/70 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-2xs"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="pt-0.5 mr-3 shrink-0">
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[var(--color-border)] bg-[var(--color-background)]"
                      }`}
                    >
                      {isCorrect && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="text-sm flex gap-2 flex-1">
                    <span
                      className={`font-bold shrink-0 ${
                        isCorrect
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--color-text)]"
                      }`}
                    >
                      {opt.label}.
                    </span>
                    <div className="flex-1">
                      <RichText
                        content={optContent || `(Đáp án ${opt.label})`}
                        className={`text-[var(--color-text)] leading-relaxed ${
                          isCorrect ? "font-medium" : ""
                        }`}
                      />
                      {hasImages && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {opt.content.map(
                            (c, i) =>
                              c.type === "image" && (
                                <img
                                  key={i}
                                  src={c.content}
                                  alt={c.alt}
                                  className="max-h-24 rounded-lg border border-[var(--color-border)]"
                                />
                              ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
