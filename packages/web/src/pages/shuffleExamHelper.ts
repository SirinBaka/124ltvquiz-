import type { Question } from "@ltvquiz/shared";
import { classifyQuestion, MAX_SHUFFLE_VARIANTS } from "../services/shuffleService";
import type { ExamVariant } from "../services/shuffleService";

export interface QuestionBreakdown {
  total: number;
  multipleChoice: number;
  trueFalseMulti: number;
  trueFalse: number;
  shortAnswer: number;
  withAnswers: number;
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "De_thi";
}

export function stripFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").trim() || "De_thi";
}

export function formatExamVariantFilename(
  baseName: string,
  examCode: string,
  ext: "pdf" | "html" = "html",
): string {
  const safeBase = sanitizeFilename(baseName);
  const safeCode = sanitizeFilename(examCode);
  return `${safeBase} - mã đề ${safeCode}.${ext}`;
}

export function clampVariantCount(
  raw: number,
  max: number = MAX_SHUFFLE_VARIANTS,
): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(Math.floor(raw), max);
}

export function summarizeQuestions(questions: readonly Question[]): QuestionBreakdown {
  let multipleChoice = 0;
  let trueFalseMulti = 0;
  let trueFalse = 0;
  let shortAnswer = 0;
  let withAnswers = 0;

  for (const q of questions) {
    const kind = classifyQuestion(q);
    if (kind === "multiple_choice") multipleChoice++;
    else if (kind === "true_false_multiple") trueFalseMulti++;
    else if (kind === "true_false") trueFalse++;
    else shortAnswer++;

    if (q.correctAnswer && q.correctAnswer.length > 0) {
      withAnswers++;
    }
  }

  return {
    total: questions.length,
    multipleChoice,
    trueFalseMulti,
    trueFalse,
    shortAnswer,
    withAnswers,
  };
}

export function filterVariantsByCode(
  variants: readonly ExamVariant[],
  query: string,
): ExamVariant[] {
  const q = query.trim().toLowerCase();
  if (!q) return variants as ExamVariant[];
  return variants.filter((v) => v.examCode.toLowerCase().includes(q));
}
