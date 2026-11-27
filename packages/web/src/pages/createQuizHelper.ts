import type { Document } from "@ltvquiz/shared";

export type FileValidationResult = {
  valid: boolean;
  error?: string;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_EXTS = [".pdf", ".docx", ".txt", ".md"];
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

export function validateUploadFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    return {
      valid: false,
      error:
        "Định dạng file không được hỗ trợ. Vui lòng tải lên PDF, DOCX, TXT hoặc Markdown.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File quá lớn. Vui lòng chọn file dưới ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export function filterExistingDocuments(
  docs: Document[],
  query: string,
): Document[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter((doc) => {
    const nameMatch = doc.name.toLowerCase().includes(q);
    const fileMatch = (doc.originalFileName || "").toLowerCase().includes(q);
    return nameMatch || fileMatch;
  });
}

export function updateRawTextOption(
  rawText: string,
  questionIndex: number,
  selectedOptionLabel: string
): string {
  const qRegex = /(?:^|\n)\s*(?:Câu|Question|Bài)\s*(\d+)[:.\-)]?/gi;
  const matches: Array<{ index: number; qNum: number }> = [];
  let m;
  while ((m = qRegex.exec(rawText)) !== null) {
    matches.push({ index: m.index, qNum: parseInt(m[1], 10) });
  }

  if (questionIndex >= matches.length) return rawText;

  const currentMatch = matches[questionIndex];
  const nextMatch = matches[questionIndex + 1];
  const qStart = currentMatch.index;
  const qEnd = nextMatch ? nextMatch.index : rawText.length;
  let qText = rawText.substring(qStart, qEnd);

  // Remove any existing * from options in this question block
  qText = qText.replace(/(?:^|\n)(\s*)\*([A-Da-d][.:)\-])/g, "$1$2");
  qText = qText.replace(/(?:^|\n)(\s*)\*\s*([A-Da-d][.:)\-])/g, "$1$2");

  // Now add * to selected option:
  const optRegex = new RegExp(`(?:^|\\n)(\\s*)(${selectedOptionLabel}[.:)\\-])`, "i");
  qText = qText.replace(optRegex, (match, prefix, optLabel) => {
    return (match.startsWith("\n") ? "\n" : "") + prefix + "*" + optLabel;
  });

  return rawText.substring(0, qStart) + qText + rawText.substring(qEnd);
}

function serializeAzotaBlocks(
  blocks: any[] | undefined,
  wrapTextBold: boolean,
  fallbackText: string = "",
): string {
  if (!blocks || blocks.length === 0) {
    return wrapTextBold && fallbackText ? `[!b:$${fallbackText}$]` : fallbackText;
  }

  const parts: string[] = [];
  for (const b of blocks) {
    if (b?.type === "image" && b.content) {
      const safeAlt = String(b.alt || "image").replace(/[\r\n[\]]+/g, " ").trim() || "image";
      parts.push(`\n![${safeAlt}](${b.content})\n`);
    } else if (b?.content) {
      const cleaned = String(b.content)
        .replace(/^\[!b:\$?(.*?)\$?\]$/i, "$1")
        .replace(/^\[BOLD\](.*?)\[\/BOLD\]$/i, "$1")
        .trim();
      if (cleaned) {
        parts.push(wrapTextBold ? `[!b:$${cleaned}$]` : cleaned);
      }
    }
  }

  const joined = parts.join(" ").replace(/\s*\n\s*/g, "\n").trim();
  if (!joined && fallbackText) {
    return wrapTextBold ? `[!b:$${fallbackText}$]` : fallbackText;
  }
  return joined;
}

export function questionsToAzotaText(questions: any[]): string {
  if (!questions || questions.length === 0) return "";
  let output = "";
  let currentSection = "";

  questions.forEach((q, idx) => {
    const sec = q.sectionTitle || "PHẦN I";
    if (sec !== currentSection) {
      currentSection = sec;
      const cleanSec = currentSection
        .replace(/^\[!b:\$?(.*?)\$?\]$/i, "$1")
        .replace(/\$?\]$/i, "")
        .replace(/^\[!b:\$?/i, "")
        .trim();
      output += `[!b:$${cleanSec || "PHẦN I"}$]\n`;
    }

    const prompt = serializeAzotaBlocks(
      q.question,
      true,
      `Câu hỏi ${idx + 1}`,
    );

    output += `Câu ${idx + 1}. ${prompt}\n`;

    if (q.options) {
      q.options.forEach((opt: any) => {
        const isCorrect = q.correctAnswer?.includes(opt.id);
        const optContent = serializeAzotaBlocks(opt.content, false, "");
        const prefix = isCorrect ? `*${opt.label}.` : `${opt.label}.`;
        output += `${prefix} ${optContent}\n`;
      });
    }

    output += "\n";
  });

  return output.trim();
}
