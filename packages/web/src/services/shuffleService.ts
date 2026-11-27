import type { Question, Option, ContentBlock } from "@ltvquiz/shared";
import { yieldToMain } from "./parserService";

export type ExamQuestionKind =
  | "multiple_choice"
  | "true_false_multiple"
  | "true_false"
  | "short_answer";

export interface AnswerKeyEntry {
  questionIndex: number;
  originalIndex: number;
  kind: ExamQuestionKind;
  sectionTitle?: string;
  originalAnswer: string;
  shuffledAnswer: string;
}

export interface ExamVariant {
  examCode: string;
  questions: Question[];
  answerKey: AnswerKeyEntry[];
}

export interface ShuffleConfig {
  baseName: string;
  variantCount: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  shuffleTrueFalseStatements?: boolean;
  shuffleShortAnswer?: boolean;
  pinSummaryOptions?: boolean;
  balanceAnswers?: boolean;
  ensureUniqueVariants?: boolean;
  groupBySection: boolean;
  preserveMediaChemistry?: boolean;
  startingCode: number;
  codeDigits: number;
  randomCodes: boolean;
  seed?: number;
}

export interface VariantShuffleOptions {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  shuffleTrueFalseStatements?: boolean;
  shuffleShortAnswer?: boolean;
  pinSummaryOptions?: boolean;
  balanceAnswers?: boolean;
  groupBySection?: boolean;
  preserveMediaChemistry?: boolean;
}

export interface StandardSection {
  id: string;
  title: string;
  kind: ExamQuestionKind;
  questions: Question[];
}

export const MAX_SHUFFLE_VARIANTS = 2000;
const MAX_CONSECUTIVE_SAME_ANSWER = 2;

const SUMMARY_OPTION_REGEX =
  /^(?:tất\s*cả\s*(?:các\s*)?(?:(?:đáp\s*án|phương\s*án|ý|câu|lựa\s*chọn)\s*(?:trên|sau|dưới)?\s*)?(?:đều\s*)?(?:đúng|sai)|tất\s*cả\s*(?:các\s*)?(?:đáp\s*án|phương\s*án|ý|lựa\s*chọn)\s*trên|cả\s+(?:[a-d](?:\s*(?:,|và|&)\s*[a-d])+|(?:hai|ba|2|3)\s*(?:đáp\s*án|phương\s*án|ý)\s*trên)(?:\s*(?:đều\s*)?(?:đúng|sai))?|không\s+(?:có|phải)\s+(?:đáp\s*án|phương\s*án|ý)\s*nào\s*(?:đúng|trên)|all\s+of\s+the\s+above|none\s+of\s+the\s+above|both\s+[a-d]\s+and\s+[a-d])/i;

/**
 * Mulberry32 deterministic PRNG so shuffle tests can be reproducible
 * while production passes fresh random seeds on each shuffle action.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function fisherYatesShuffle<T>(
  items: readonly T[],
  rng: () => number = Math.random,
): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function cloneContentBlocks(blocks: readonly ContentBlock[] = []): ContentBlock[] {
  return blocks.map((b) => ({ ...b }));
}

export function cloneQuestion(q: Question): Question {
  return {
    ...q,
    question: cloneContentBlocks(q.question),
    options: (q.options || []).map((opt) => ({
      ...opt,
      content: cloneContentBlocks(opt.content),
    })),
    correctAnswer: q.correctAnswer ? [...q.correctAnswer] : [],
    validation: q.validation
      ? {
          status: q.validation.status,
          warnings: [...(q.validation.warnings || [])],
        }
      : { status: "valid", warnings: [] },
  };
}

export function classifyQuestion(q: Question): ExamQuestionKind {
  if (q.type === "true_false_multiple") return "true_false_multiple";
  if (q.type === "true_false") return "true_false";
  if (!q.options || q.options.length === 0) {
    return "short_answer";
  }
  return "multiple_choice";
}

function getRelabeledChar(index: number, lowercase: boolean): string {
  const baseCode = lowercase ? 97 : 65; // 'a' or 'A'
  return String.fromCharCode(baseCode + index);
}

export function getOptionPlainText(opt: Option): string {
  return (opt.content || [])
    .filter((b) => b.type === "text" || b.type === "math")
    .map((b) => b.content || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPinnedSummaryOption(opt: Option): boolean {
  const plain = getOptionPlainText(opt);
  // Strip leading label if present
  const cleaned = plain.replace(/^\s*(?:\*\s*)?[A-Da-d]\s*[.):\-]\s*/, "").trim();
  if (!cleaned) return false;
  return SUMMARY_OPTION_REGEX.test(cleaned);
}

/**
 * Strips residual prefixes like `A. `, `*B) `, `c: ` safely without corrupting math labels.
 */
function stripResidualOptionPrefix(
  blocks: ContentBlock[],
  expectedLabel?: string,
): ContentBlock[] {
  if (blocks.length === 0) return blocks;
  const firstIdx = blocks.findIndex((b) => b.content.trim().length > 0);
  if (firstIdx === -1) return blocks;

  const first = blocks[firstIdx];
  if (first.type !== "text") return blocks;

  const match = first.content.match(/^\s*(?:\*\s*)?([A-Da-d])\s*([.):\-])\s*/);
  if (!match) return blocks;

  // Only strip if it matches the current expected label or if explicit prefix is standard
  if (expectedLabel && match[1].toLowerCase() !== expectedLabel.toLowerCase()) {
    return blocks;
  }

  const strippedFirst = first.content.slice(match[0].length);
  const hasRemainderAfter =
    strippedFirst.trim().length > 0 ||
    blocks.slice(firstIdx + 1).some((b) => b.content.trim().length > 0 || hasBlockImage(b));
  if (!hasRemainderAfter) return blocks;

  return blocks.map((b, idx) =>
    idx === firstIdx ? { ...b, content: strippedFirst } : b,
  );
}

const INLINE_IMAGE_RE = /!\[[^\]]*\]\([^)]+\)|<img\b[^>]*>/i;

function hasBlockImage(b: ContentBlock): boolean {
  return b.type === "image" || (b.type === "text" && INLINE_IMAGE_RE.test(b.content || ""));
}

export function hasQuestionImage(q: Question): boolean {
  return (q.question || []).some(hasBlockImage);
}

export function getQuestionPromptText(q: Question): string {
  return (q.question || [])
    .filter((b) => b.type !== "image")
    .map((b) => b.content)
    .join(" ");
}

/**
 * Checks whether a question's options should be protected and kept in original order.
 * Triggers for:
 * - Questions with images in options (e.g. diagrams A, B, C, D).
 * - Questions whose options are ordered numbers (A. 1, B. 2, C. 3, D. 4).
 * - Questions with subsets/combinations (A. (1), (2); B. (2), (3)...).
 * - Questions with explicit chemical entity references matching options (e.g. "chất A", "bình B", "hình A").
 */
export function shouldPreserveQuestionOptions(q: Question): boolean {
  if (!q.options || q.options.length <= 1) return false;

  // 1. Any option contains an image block (or inline markdown/html image)
  const hasImage = q.options.some((opt) =>
    (opt.content || []).some(hasBlockImage),
  );
  if (hasImage) return true;

  // 2. Options contain pure ascending/descending numeric values or sequential counts
  // e.g. A. 1  B. 2  C. 3  D. 4  or  A. 0  B. 1  C. 2  D. 3  or  A. 4  B. 3  C. 2  D. 1
  const optionTexts = q.options.map((opt) => getOptionPlainText(opt));
  const numericValues = optionTexts.map((txt) => {
    const cleaned = txt.replace(/^[A-Da-d]\s*[.):\-]\s*/, "").trim();
    const num = Number(cleaned);
    return !isNaN(num) && cleaned !== "" ? num : null;
  });
  if (numericValues.every((v) => v !== null)) {
    const nums = numericValues as number[];
    const isAsc = nums.every((val, i) => i === 0 || val >= nums[i - 1]);
    const isDesc = nums.every((val, i) => i === 0 || val <= nums[i - 1]);
    if (isAsc || isDesc) return true;
  }

  // 3. Options contain combinations or subsets of numbered items:
  // e.g. "(1), (2)", "(1) và (2)", "(I), (II)", "(1), (3), (4)"
  const hasSubsets = optionTexts.some((txt) => {
    const cleaned = txt.replace(/^[A-Da-d]\s*[.):\-]\s*/, "").trim();
    return (
      /\(\s*(?:[1-9]|I|II|III|IV|V)\s*\)\s*(?:,|và|\+|-)\s*\(\s*(?:[1-9]|I|II|III|IV|V)\s*\)/i.test(
        cleaned,
      ) ||
      /^(?:\([1-9]\)|\([a-d]\)|\b[1-9]\b)(?:\s*(?:,|và|\+)\s*(?:\([1-9]\)|\([a-d]\)|\b[1-9]\b))+$/i.test(
        cleaned,
      )
    );
  });
  if (hasSubsets) return true;

  // 4. Prompt or options explicitly refer to labeled entities matching the options:
  // e.g. "chất A", "chất B", "bình A", "hình A", "sơ đồ (A)", "thí nghiệm A"
  // Note: Avoid ASCII \b trap with Vietnamese characters (e.g. "Kim loại có" -> "c" + "ó" falsely matching \b[A-D]\b)
  const promptPlain = getQuestionPromptText(q);
  const VN_NON_WORD_OR_END =
    "(?=[^a-zA-Z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẸÊẾỀỂỄỆĐÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ]|$)";
  const entityRefPattern = new RegExp(
    `(?:chất|dung\\s*dịch|kim\\s*loại|khí|kết\\s*tủa|chất\\s*rắn|chất\\s*lỏng|hợp\\s*chất|bình|ống\\s*nghiệm|mẫu|hình|sơ\\s*đồ|thí\\s*nghiệm|dụng\\s*cụ)\\s+(?:\\(?([A-D])\\)?)${VN_NON_WORD_OR_END}`,
    "i",
  );
  if (entityRefPattern.test(promptPlain)) return true;

  // 5. Options start with "[A-D] là" or "chất [A-D]"
  const refersToOptionIdentity = optionTexts.some((txt) => {
    const cleaned = txt.replace(/^[A-Da-d]\s*[.):\-]\s*/, "").trim();
    return (
      /^[A-D]\s*là\b/i.test(cleaned) ||
      /^chất\s+[A-D]\s*là\b/i.test(cleaned) ||
      new RegExp(`^hình\\s+[A-D]${VN_NON_WORD_OR_END}`, "i").test(cleaned) ||
      new RegExp(`^thí\\s*nghiệm\\s+[A-D]${VN_NON_WORD_OR_END}`, "i").test(cleaned)
    );
  });
  if (refersToOptionIdentity) return true;

  return false;
}

/**
 * Checks whether question `curr` relies on or refers to `prev`.
 * Commonly in Chemistry/Physics/Biology/Math:
 * - "Trong thí nghiệm trên, ..."
 * - "Dựa vào hình vẽ trên, ..."
 * - "Sơ đồ phản ứng trên, ..."
 * - "Cho hình vẽ... Dùng cho các câu 1, 2, 3"
 */
export function isQuestionLinkedToPreceding(
  curr: Question,
  prev: Question,
  clusterHasImage: boolean,
): boolean {
  const currText = getQuestionPromptText(curr).trim();
  const prevText = getQuestionPromptText(prev).trim();

  // Pattern 1: Explicit reference to preceding visual / experiment / context
  const directPrecedingRef =
    /(?:dựa\s*vào|trong|từ|theo)\s+(?:hình\s*(?:vẽ|ảnh)?|thí\s*nghiệm|sơ\s*đồ|đoạn\s*(?:văn|thông\s*tin)|dữ\s*(?:kiện|liệu)|bảng\s*(?:số\s*liệu)?)\s*(?:trên|ở\s*trên|nêu\s*trên|đã\s*cho)/i.test(
      currText,
    ) ||
    /(?:hình\s*(?:vẽ|ảnh)?|thí\s*nghiệm|sơ\s*đồ|đoạn\s*văn|thông\s*tin|dữ\s*kiện)\s*(?:trên|ở\s*trên|nêu\s*trên)\b/i.test(
      currText,
    ) ||
    /(?:ở|trong)\s+(?:thí\s*nghiệm|hình\s*(?:vẽ|ảnh)?|sơ\s*đồ)\s*(?:trên|nêu\s*trên|đó)\b/i.test(
      currText,
    ) ||
    /(?:câu\s*hỏi|câu)\s*(?:trên|trước|ngay\s*trên)\b/i.test(currText);

  if (directPrecedingRef) return true;

  // Pattern 2: Preceding question introduced a range ("Dùng cho các câu X đến Y" or "Dùng cho câu X, Y")
  const rangeMatch = prevText.match(
    /(?:dùng|áp\s*dụng|trả\s*lời)\s+(?:cho\s+)?(?:các\s+)?câu\s+(\d+)\s*(?:-|đến|,|\bvà\b)\s*(\d+)/i,
  );
  if (rangeMatch) {
    const startNum = parseInt(rangeMatch[1], 10);
    const endNum = parseInt(rangeMatch[2], 10);
    if (!isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
      return true;
    }
  }

  // Pattern 3: Cluster contains an image, and current question has NO image but refers to the experiment / apparatus
  // e.g. "thí nghiệm", "bình tam giác", "ống nghiệm", "khí X", "dung dịch Y"
  if (clusterHasImage && !hasQuestionImage(curr)) {
    const refersToApparatusOrExperiment =
      /(?:thí\s*nghiệm|bình\s*(?:tam\s*giác|cầu|nón|thu|rửa)?|ống\s*(?:nghiệm|dẫn)|khí\s*[A-Z]|dung\s*dịch\s*[A-Z]|kết\s*tủa|chất\s*[A-Z]\s*trong\s*bình)\b/i.test(
        currText,
      );
    if (refersToApparatusOrExperiment) {
      return true;
    }
  }

  return false;
}

function extractRangeSpanCount(promptText: string): number {
  const rangeMatch = promptText.match(
    /(?:dùng|áp\s*dụng|trả\s*lời)\s+(?:cho\s+)?(?:các\s+)?câu\s+(\d+)\s*(?:-|đến|tới)\s*(\d+)/i,
  );
  if (rangeMatch) {
    const startNum = parseInt(rangeMatch[1], 10);
    const endNum = parseInt(rangeMatch[2], 10);
    if (!isNaN(startNum) && !isNaN(endNum) && endNum > startNum && endNum - startNum <= 10) {
      return endNum - startNum;
    }
  }
  const listMatch = promptText.match(
    /(?:dùng|áp\s*dụng|trả\s*lời)\s+(?:cho\s+)?(?:các\s+)?câu\s+(\d+(?:\s*(?:,|và)\s*\d+)+)/i,
  );
  if (listMatch) {
    const nums = listMatch[1].match(/\d+/g);
    if (nums && nums.length >= 2) {
      return nums.length - 1;
    }
  }
  return 0;
}

/**
 * Groups consecutive questions that share a common visual/experiment/context into clusters.
 * When shuffling questions, each cluster moves as an indivisible unit, preserving
 * the image and related chemistry notations directly with their dependent questions.
 */
export function groupQuestionsIntoClusters(questions: readonly Question[]): Question[][] {
  if (questions.length === 0) return [];

  const clusters: Question[][] = [];
  let currentCluster: Question[] = [questions[0]];
  let clusterHasImage = hasQuestionImage(questions[0]);
  let remainingRangeLinks = extractRangeSpanCount(getQuestionPromptText(questions[0]));

  for (let i = 1; i < questions.length; i++) {
    const q = questions[i];
    const prevQ = questions[i - 1];

    const linkedByRange = remainingRangeLinks > 0;
    if (linkedByRange || isQuestionLinkedToPreceding(q, prevQ, clusterHasImage)) {
      currentCluster.push(q);
      if (linkedByRange) remainingRangeLinks--;
      const qSpan = extractRangeSpanCount(getQuestionPromptText(q));
      if (qSpan > remainingRangeLinks) remainingRangeLinks = qSpan;
      if (hasQuestionImage(q)) {
        clusterHasImage = true;
      }
    } else {
      clusters.push(currentCluster);
      currentCluster = [q];
      clusterHasImage = hasQuestionImage(q);
      remainingRangeLinks = extractRangeSpanCount(getQuestionPromptText(q));
    }
  }

  clusters.push(currentCluster);
  return clusters;
}

/**
 * Shuffles options inside a question without mutating the source object.
 * Option IDs are preserved so `correctAnswer` IDs remain accurate after re-labeling.
 */
export function shuffleQuestionOptions(
  question: Question,
  rng: () => number = Math.random,
  opts: { pinSummaryOptions?: boolean; preserveMediaChemistry?: boolean } = {},
): Question {
  const kind = classifyQuestion(question);
  if (
    kind === "short_answer" ||
    kind === "true_false" ||
    !question.options ||
    question.options.length <= 1
  ) {
    return cloneQuestion(question);
  }

  if (
    opts.preserveMediaChemistry !== false &&
    shouldPreserveQuestionOptions(question)
  ) {
    return cloneQuestion(question);
  }

  const lowercase = kind === "true_false_multiple";
  const shouldPinSummary =
    opts.pinSummaryOptions !== false && kind === "multiple_choice";

  const preparedOpts: Option[] = question.options.map((opt) => ({
    ...opt,
    content: stripResidualOptionPrefix(cloneContentBlocks(opt.content), opt.label),
  }));

  let arrangedOpts: Option[];
  if (shouldPinSummary) {
    const pinnedIndices = new Set<number>();
    preparedOpts.forEach((opt, idx) => {
      if (isPinnedSummaryOption(opt)) {
        pinnedIndices.add(idx);
      }
    });

    if (pinnedIndices.size > 0 && pinnedIndices.size < preparedOpts.length - 1) {
      const unpinned = preparedOpts.filter((_, idx) => !pinnedIndices.has(idx));
      const shuffledUnpinned = fisherYatesShuffle(unpinned, rng);
      let cursor = 0;
      arrangedOpts = preparedOpts.map((opt, idx) =>
        pinnedIndices.has(idx) ? opt : shuffledUnpinned[cursor++],
      );
    } else {
      arrangedOpts = fisherYatesShuffle(preparedOpts, rng);
    }
  } else {
    arrangedOpts = fisherYatesShuffle(preparedOpts, rng);
  }

  const relabeledOpts: Option[] = arrangedOpts.map((opt, idx) => ({
    ...opt,
    label: getRelabeledChar(idx, lowercase),
  }));

  return {
    ...cloneQuestion(question),
    options: relabeledOpts,
  };
}

export function getDefaultSectionTitle(kind: ExamQuestionKind): string {
  switch (kind) {
    case "multiple_choice":
      return "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn";
    case "true_false_multiple":
    case "true_false":
      return "PHẦN II. Câu trắc nghiệm đúng sai";
    case "short_answer":
      return "PHẦN III. Câu trắc nghiệm trả lời ngắn";
    default:
      return "PHẦN I. Trắc nghiệm";
  }
}

/**
 * Splits questions strictly into standard canonical sections (Phần I, Phần II, Phần III)
 * so questions from different parts never get mixed or scrambled during shuffle.
 */
export function splitQuestionsIntoStandardSections(
  questions: readonly Question[],
): StandardSection[] {
  if (questions.length === 0) return [];

  const sections: StandardSection[] = [];
  let currentGroup: Question[] = [];
  let currentKind: ExamQuestionKind | null = null;
  let currentTitle = "";

  const flush = () => {
    if (currentGroup.length > 0 && currentKind) {
      sections.push({
        id: `sec_${sections.length + 1}`,
        title: currentTitle || getDefaultSectionTitle(currentKind),
        kind: currentKind,
        questions: currentGroup,
      });
      currentGroup = [];
    }
  };

  for (const q of questions) {
    const kind = classifyQuestion(q);
    const rawTitle = (q.sectionTitle || "").trim();

    const kindChanged = currentKind !== null && currentKind !== kind;
    const titleChanged =
      rawTitle.length > 0 &&
      currentTitle.length > 0 &&
      rawTitle.toLowerCase() !== currentTitle.toLowerCase();

    if (currentKind === null || kindChanged || titleChanged) {
      flush();
      currentKind = kind;
      currentTitle = rawTitle || getDefaultSectionTitle(kind);
    }

    currentGroup.push(q);
  }

  flush();
  return sections;
}

/**
 * Rebalances multiple-choice answer key letters across unpinned option slots
 * so A/B/C/D counts stay balanced and identical answer streaks never exceed `MAX_CONSECUTIVE_SAME_ANSWER`.
 */
function rebalanceMultipleChoiceAnswers(
  questions: Question[],
  allowAdjustOptionOrder: boolean,
  pinSummaryOptions: boolean,
  rng: () => number,
  preserveMediaChemistry = true,
): void {
  if (!allowAdjustOptionOrder) return;

  const counts = new Map<string, number>();
  const labelUniverse: string[] = [];
  const recentLabels: string[] = [];

  for (const q of questions) {
    if (classifyQuestion(q) !== "multiple_choice") continue;
    if (preserveMediaChemistry && shouldPreserveQuestionOptions(q)) continue;
    for (const opt of q.options || []) {
      if (!counts.has(opt.label)) {
        counts.set(opt.label, 0);
        labelUniverse.push(opt.label);
      }
    }
  }

  if (labelUniverse.length < 2) return;

  for (const q of questions) {
    if (classifyQuestion(q) !== "multiple_choice") continue;
    if (preserveMediaChemistry && shouldPreserveQuestionOptions(q)) continue;
    const opts = q.options || [];
    if (opts.length < 2 || !q.correctAnswer || q.correctAnswer.length !== 1) continue;

    const correctId = q.correctAnswer[0];
    const currentCorrectIdx = opts.findIndex((o) => o.id === correctId);
    if (currentCorrectIdx === -1) continue;

    const isPinnedAtIdx = (idx: number) =>
      pinSummaryOptions && isPinnedSummaryOption(opts[idx]);

    if (isPinnedAtIdx(currentCorrectIdx)) {
      const lbl = opts[currentCorrectIdx].label;
      counts.set(lbl, (counts.get(lbl) ?? 0) + 1);
      recentLabels.push(lbl);
      continue;
    }

    const movableSlotIndices = opts
      .map((_, idx) => idx)
      .filter((idx) => !isPinnedAtIdx(idx));

    if (movableSlotIndices.length < 2) {
      const lbl = opts[currentCorrectIdx].label;
      counts.set(lbl, (counts.get(lbl) ?? 0) + 1);
      recentLabels.push(lbl);
      continue;
    }

    const streakVal =
      recentLabels.length >= MAX_CONSECUTIVE_SAME_ANSWER &&
      recentLabels
        .slice(-MAX_CONSECUTIVE_SAME_ANSWER)
        .every((l) => l === recentLabels[recentLabels.length - 1])
        ? recentLabels[recentLabels.length - 1]
        : null;

    let candidates = movableSlotIndices.filter(
      (idx) => opts[idx].label !== streakVal,
    );
    if (candidates.length === 0) {
      candidates = movableSlotIndices;
    }

    const minCount = Math.min(
      ...candidates.map((idx) => counts.get(opts[idx].label) ?? 0),
    );
    const balancedCandidates = candidates.filter(
      (idx) => (counts.get(opts[idx].label) ?? 0) === minCount,
    );

    const chosenIdx =
      balancedCandidates[Math.floor(rng() * balancedCandidates.length)] ??
      currentCorrectIdx;

    if (chosenIdx !== currentCorrectIdx) {
      const tmp = opts[currentCorrectIdx];
      opts[currentCorrectIdx] = opts[chosenIdx];
      opts[chosenIdx] = tmp;

      for (let k = 0; k < opts.length; k++) {
        opts[k] = { ...opts[k], label: getRelabeledChar(k, false) };
      }
    }

    const finalLabel = opts[chosenIdx].label;
    counts.set(finalLabel, (counts.get(finalLabel) ?? 0) + 1);
    recentLabels.push(finalLabel);
  }
}

/**
 * Formats a question's answer cleanly for answer-key tables across all question types.
 */
export function formatQuestionAnswer(
  question: Question,
  kind: ExamQuestionKind = classifyQuestion(question),
): string {
  if (kind === "short_answer") {
    if (question.correctAnswer && question.correctAnswer.length > 0) {
      return question.correctAnswer.join("; ");
    }
    return "Chưa có";
  }

  if (kind === "true_false_multiple") {
    if (!question.options || question.options.length === 0) return "Chưa có";
    return question.options
      .map((opt) => {
        const isTrue = question.correctAnswer?.includes(opt.id);
        return `${opt.label}:${isTrue ? "Đ" : "S"}`;
      })
      .join(" ");
  }

  const labels = (question.options || [])
    .filter((opt) => question.correctAnswer?.includes(opt.id))
    .map((opt) => opt.label);

  return labels.length > 0 ? labels.join(", ") : "Chưa có";
}

/**
 * Rebuilds the complete answer-key list for an edited or shuffled list of questions.
 * Accurately maps each question by `q.id` back to its original index and answer.
 */
export function recomputeVariantAnswerKey(
  questions: readonly Question[],
  sourceQuestions?: readonly Question[],
  previousAnswerKey?: readonly AnswerKeyEntry[],
): AnswerKeyEntry[] {
  const sourceMap = new Map<string, { question: Question; originalIndex: number }>();
  if (sourceQuestions) {
    sourceQuestions.forEach((sq, idx) => {
      sourceMap.set(sq.id, { question: sq, originalIndex: idx + 1 });
    });
  }

  const prevKeyMap = new Map<string, AnswerKeyEntry>();
  if (previousAnswerKey) {
    previousAnswerKey.forEach((pk, idx) => {
      const q = questions[idx];
      if (q) prevKeyMap.set(q.id, pk);
    });
  }

  return questions.map((q, idx) => {
    const kind = classifyQuestion(q);
    const sourceEntry = sourceMap.get(q.id);
    const originalIndex =
      sourceEntry?.originalIndex ??
      prevKeyMap.get(q.id)?.originalIndex ??
      idx + 1;
    const sourceMatch = sourceEntry?.question;
    const originalAnswer = sourceMatch
      ? formatQuestionAnswer(sourceMatch, classifyQuestion(sourceMatch))
      : prevKeyMap.get(q.id)?.originalAnswer ?? formatQuestionAnswer(q, kind);

    return {
      questionIndex: idx + 1,
      originalIndex,
      kind,
      sectionTitle: q.sectionTitle,
      originalAnswer,
      shuffledAnswer: formatQuestionAnswer(q, kind),
    };
  });
}

export function getVariantSignature(variant: Pick<ExamVariant, "questions" | "answerKey">): string {
  return variant.questions
    .map((q, idx) => {
      const origIdx = variant.answerKey[idx]?.originalIndex ?? idx + 1;
      const optOrder = (q.options || []).map((o) => o.id).join(",");
      return `${origIdx}:${optOrder}`;
    })
    .join("|");
}

/**
 * Generates one shuffled exam variant along with a complete answer-key mapping.
 * Strictly maintains Phần I -> Phần II -> Phần III order so the exam is never scrambled or chaotic.
 */
export function generateExamVariant(
  questions: readonly Question[],
  examCode: string,
  options: VariantShuffleOptions,
  rng: () => number = Math.random,
): ExamVariant {
  const allowShortAnswerOrder =
    options.shuffleShortAnswer ?? options.shuffleQuestions;
  const allowGeneralQuestionOrder = options.shuffleQuestions;
  const allowMcOptions = options.shuffleOptions;
  const allowTfStatements =
    options.shuffleTrueFalseStatements ?? options.shuffleOptions;
  const pinSummaryOptions = options.pinSummaryOptions !== false;
  const balanceAnswers = options.balanceAnswers === true;
  const preserveMediaChemistry = options.preserveMediaChemistry !== false;

  // Split into standard canonical sections
  const sections = splitQuestionsIntoStandardSections(questions);

  const finalQuestions: Question[] = [];
  const answerKey: AnswerKeyEntry[] = [];
  let questionCounter = 1;

  for (const section of sections) {
    const shouldShuffleSectionOrder =
      section.kind === "short_answer"
        ? allowShortAnswerOrder
        : allowGeneralQuestionOrder;

    let orderedSectionQuestions: Question[];
    if (!shouldShuffleSectionOrder) {
      orderedSectionQuestions = section.questions.slice();
    } else if (preserveMediaChemistry) {
      // Group linked questions sharing an image, experiment, or context into clusters
      const clusters = groupQuestionsIntoClusters(section.questions);
      const shuffledClusters = fisherYatesShuffle(clusters, rng);
      orderedSectionQuestions = shuffledClusters.flat();
    } else {
      orderedSectionQuestions = fisherYatesShuffle(section.questions, rng);
    }

    for (const q of orderedSectionQuestions) {
      const kind = classifyQuestion(q);
      const originalIndex = questions.findIndex((orig) => orig.id === q.id) + 1;
      const originalAnswer = formatQuestionAnswer(q, kind);

      const shouldShuffleOpts =
        kind === "true_false_multiple"
          ? allowTfStatements
          : kind === "multiple_choice"
            ? allowMcOptions
            : false;

      const shouldPreserveOpts =
        preserveMediaChemistry && shouldPreserveQuestionOptions(q);

      const processedQ =
        shouldShuffleOpts && !shouldPreserveOpts
          ? shuffleQuestionOptions(q, rng, { pinSummaryOptions, preserveMediaChemistry })
          : cloneQuestion(q);

      processedQ.sectionTitle = section.title;

      finalQuestions.push(processedQ);
      answerKey.push({
        questionIndex: questionCounter++,
        originalIndex: originalIndex > 0 ? originalIndex : questionCounter - 1,
        kind,
        sectionTitle: section.title,
        originalAnswer,
        shuffledAnswer: formatQuestionAnswer(processedQ, kind),
      });
    }
  }

  if (balanceAnswers && allowMcOptions) {
    rebalanceMultipleChoiceAnswers(
      finalQuestions,
      allowMcOptions,
      pinSummaryOptions,
      rng,
      preserveMediaChemistry,
    );
    // Refresh shuffledAnswer in answerKey after rebalance
    for (let i = 0; i < answerKey.length; i++) {
      answerKey[i].shuffledAnswer = formatQuestionAnswer(
        finalQuestions[i],
        answerKey[i].kind,
      );
    }
  }

  return {
    examCode,
    questions: finalQuestions,
    answerKey,
  };
}

export function generateExamCodes(
  count: number,
  startingCode: number = 101,
  digits: number = 3,
  randomCodes: boolean = false,
  rng: () => number = Math.random,
): string[] {
  const safeCount = Math.max(1, Math.min(count, MAX_SHUFFLE_VARIANTS));
  const safeStart = Math.max(0, Math.floor(startingCode));
  const safeDigits = Math.max(1, Math.min(digits, 6));

  if (!randomCodes) {
    const codes: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      codes.push(String(safeStart + i).padStart(safeDigits, "0"));
    }
    return codes;
  }

  let effectiveDigits = safeDigits;
  while (
    Math.pow(10, effectiveDigits) - Math.pow(10, effectiveDigits - 1) <
    safeCount * 1.2
  ) {
    effectiveDigits++;
  }

  const minVal = effectiveDigits === 1 ? 1 : Math.pow(10, effectiveDigits - 1);
  const maxVal = Math.pow(10, effectiveDigits) - 1;
  const span = maxVal - minVal + 1;

  const used = new Set<number>();
  const codes: string[] = [];

  if (safeCount > span * 0.4) {
    const pool: number[] = [];
    for (let n = minVal; n <= maxVal; n++) pool.push(n);
    const picked = fisherYatesShuffle(pool, rng).slice(0, safeCount);
    return picked.map((n) => String(n).padStart(effectiveDigits, "0"));
  }

  while (codes.length < safeCount) {
    const candidate = minVal + Math.floor(rng() * span);
    if (!used.has(candidate)) {
      used.add(candidate);
      codes.push(String(candidate).padStart(effectiveDigits, "0"));
    }
  }

  return codes;
}

function buildVariantOptions(config: ShuffleConfig): VariantShuffleOptions {
  return {
    shuffleQuestions: config.shuffleQuestions,
    shuffleOptions: config.shuffleOptions,
    shuffleTrueFalseStatements: config.shuffleTrueFalseStatements,
    shuffleShortAnswer: config.shuffleShortAnswer,
    pinSummaryOptions: config.pinSummaryOptions,
    balanceAnswers: config.balanceAnswers,
    groupBySection: config.groupBySection,
    preserveMediaChemistry: config.preserveMediaChemistry !== false,
  };
}

function isShufflingActive(config: ShuffleConfig): boolean {
  return Boolean(
    config.shuffleQuestions ||
      config.shuffleOptions ||
      config.shuffleTrueFalseStatements ||
      config.shuffleShortAnswer,
  );
}

function generateUniqueVariant(
  questions: readonly Question[],
  code: string,
  variantOpts: VariantShuffleOptions,
  ensureUnique: boolean,
  seenSignatures: Set<string>,
  rng: () => number,
): ExamVariant {
  const MAX_DEDUP_RETRIES = 24;
  let candidate = generateExamVariant(questions, code, variantOpts, rng);

  if (!ensureUnique) {
    return candidate;
  }

  let sig = getVariantSignature(candidate);
  let attempts = 0;
  while (seenSignatures.has(sig) && attempts < MAX_DEDUP_RETRIES) {
    attempts++;
    candidate = generateExamVariant(questions, code, variantOpts, rng);
    sig = getVariantSignature(candidate);
  }
  seenSignatures.add(sig);
  return candidate;
}

export function generateMultipleVariants(
  questions: readonly Question[],
  config: ShuffleConfig,
): ExamVariant[] {
  const seed = config.seed ?? createRandomSeed();
  const rng = createSeededRng(seed);
  const codes = generateExamCodes(
    config.variantCount,
    config.startingCode,
    config.codeDigits,
    config.randomCodes,
    rng,
  );

  const variantOpts = buildVariantOptions(config);
  const ensureUnique =
    config.ensureUniqueVariants !== false && isShufflingActive(config);

  const seenSignatures = new Set<string>();
  if (ensureUnique) {
    const baseline = generateExamVariant(
      questions,
      "__ORIGIN__",
      {
        shuffleQuestions: false,
        shuffleOptions: false,
        shuffleTrueFalseStatements: false,
        shuffleShortAnswer: false,
        balanceAnswers: false,
      },
      rng,
    );
    seenSignatures.add(getVariantSignature(baseline));
  }

  return codes.map((code) =>
    generateUniqueVariant(
      questions,
      code,
      variantOpts,
      ensureUnique,
      seenSignatures,
      rng,
    ),
  );
}

/**
 * Chunked async generator for thousands of variants so the browser stays responsive.
 */
export async function generateMultipleVariantsAsync(
  questions: readonly Question[],
  config: ShuffleConfig,
  onProgress?: (done: number, total: number) => void,
): Promise<ExamVariant[]> {
  const seed = config.seed ?? createRandomSeed();
  const rng = createSeededRng(seed);
  const codes = generateExamCodes(
    config.variantCount,
    config.startingCode,
    config.codeDigits,
    config.randomCodes,
    rng,
  );

  const total = codes.length;
  const variants: ExamVariant[] = [];
  const CHUNK_SIZE = 100;

  const variantOpts = buildVariantOptions(config);
  const ensureUnique =
    config.ensureUniqueVariants !== false && isShufflingActive(config);

  const seenSignatures = new Set<string>();
  if (ensureUnique) {
    const baseline = generateExamVariant(
      questions,
      "__ORIGIN__",
      {
        shuffleQuestions: false,
        shuffleOptions: false,
        shuffleTrueFalseStatements: false,
        shuffleShortAnswer: false,
        balanceAnswers: false,
      },
      rng,
    );
    seenSignatures.add(getVariantSignature(baseline));
  }

  for (let i = 0; i < total; i++) {
    variants.push(
      generateUniqueVariant(
        questions,
        codes[i],
        variantOpts,
        ensureUnique,
        seenSignatures,
        rng,
      ),
    );

    if ((i + 1) % CHUNK_SIZE === 0 || i === total - 1) {
      onProgress?.(i + 1, total);
      await yieldToMain();
    }
  }

  return variants;
}

export interface QuickAnswerParseResult {
  updates: Map<string, string[]>; // questionId -> new correctAnswer
  recognizedCount: number;
  totalParsedEntries: number;
  unmatchedNumbers: number[];
}

/**
 * Parses raw text input into answer updates for fast batch entry (e.g. "1A 2B 3C..." or "A B C D").
 */
export function parseQuickAnswerKeyString(
  rawInput: string,
  questions: readonly Question[],
): QuickAnswerParseResult {
  const updates = new Map<string, string[]>();
  const text = rawInput.trim();
  if (!text || questions.length === 0) {
    return { updates, recognizedCount: 0, totalParsedEntries: 0, unmatchedNumbers: [] };
  }

  // 1. Try numbered pattern: "1A 2B 3C..." or "Câu 1: A, Câu 2: B..." or "1.A 2.B"
  const numberedPattern = /(?:câu\s*)?(\d+)\s*[:.\-)]?\s*([A-Da-d])(?![a-zA-Z0-9])/gi;
  const numberedMatches = Array.from(text.matchAll(numberedPattern));

  if (numberedMatches.length >= 2) {
    const unmatchedNumbers: number[] = [];
    let recognized = 0;

    for (const match of numberedMatches) {
      const qNum = parseInt(match[1], 10);
      const chosenLetter = match[2].toUpperCase();
      const targetQ = questions[qNum - 1];

      if (!targetQ) {
        unmatchedNumbers.push(qNum);
        continue;
      }

      const targetOpt = (targetQ.options || []).find(
        (o) => o.label.toUpperCase() === chosenLetter,
      );
      if (targetOpt) {
        updates.set(targetQ.id, [targetOpt.id]);
        recognized++;
      } else {
        unmatchedNumbers.push(qNum);
      }
    }

    return {
      updates,
      recognizedCount: recognized,
      totalParsedEntries: numberedMatches.length,
      unmatchedNumbers,
    };
  }

  // 2. Try raw sequential letter pattern: "A B C D A B C D" or "A, B, C, D"
  const cleanTokens = text
    .replace(/[^A-Da-d\s,;\n]/g, " ")
    .split(/[\s,;\n]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length === 1 && /^[A-D]$/.test(s));

  if (cleanTokens.length > 0) {
    let recognized = 0;
    const count = Math.min(cleanTokens.length, questions.length);

    for (let i = 0; i < count; i++) {
      const letter = cleanTokens[i];
      const targetQ = questions[i];
      const targetOpt = (targetQ.options || []).find(
        (o) => o.label.toUpperCase() === letter,
      );
      if (targetOpt) {
        updates.set(targetQ.id, [targetOpt.id]);
        recognized++;
      }
    }

    return {
      updates,
      recognizedCount: recognized,
      totalParsedEntries: cleanTokens.length,
      unmatchedNumbers: [],
    };
  }

  return { updates, recognizedCount: 0, totalParsedEntries: 0, unmatchedNumbers: [] };
}
