import type { Question, Option, ContentBlock } from '../types';

export interface AutoRepairResult {
  question: Question;
  fixedIssues: string[];
}

export interface BatchAutoRepairResult {
  questions: Question[];
  repairedCount: number;
  totalIssuesFixed: number;
  details: { questionId: string; issues: string[] }[];
}

const STANDARD_MC_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const STANDARD_TF_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Automatically repairs common issues in quiz questions:
 * 1. Strips redundant option prefixes (e.g. "A. Hà Nội" -> "Hà Nội")
 * 2. Standardizes option labels (A, B, C, D or a, b, c, d)
 * 3. Identifies missing correct answer via question/option hints or defaults
 * 4. Normalizes points (default 0.25 if <= 0)
 * 5. Cleans and re-evaluates validation status
 */
export function autoRepairQuestion(original: Question): AutoRepairResult {
  const q: Question = JSON.parse(JSON.stringify(original));
  const fixedIssues: string[] = [];

  const isTrueFalse = q.type === 'true_false_multiple';
  const standardLabels = isTrueFalse ? STANDARD_TF_LABELS : STANDARD_MC_LABELS;

  // 1. Normalize points
  if (!q.points || typeof q.points !== 'number' || q.points <= 0 || isNaN(q.points)) {
    q.points = 0.25;
    fixedIssues.push('Gán điểm số tiêu chuẩn 0.25 điểm');
  }

  // 2. Standardize Option Labels & Strip Redundant Prefix Tags
  let labelFixed = false;
  let asteriskFoundId: string | null = null;

  q.options = q.options.map((opt: Option, idx: number) => {
    const expectedLabel = standardLabels[idx] || (isTrueFalse ? String.fromCharCode(97 + idx) : String.fromCharCode(65 + idx));
    if (opt.label !== expectedLabel) {
      opt.label = expectedLabel;
      labelFixed = true;
    }

    // Clean option content
    opt.content = opt.content.map((block: ContentBlock) => {
      if (block.type !== 'text') return block;

      let text = block.content.trim();

      // Check for asterisk indicating correct answer (* Đông, *A. Đông)
      if (text.startsWith('*') || text.startsWith('●') || /^\[[xX*]\]/.test(text) || /^\([xX*]\)/.test(text)) {
        asteriskFoundId = opt.id;
        text = text.replace(/^[\*●]\s*/, '').replace(/^\[[xX*]\]\s*/, '').replace(/^\([xX*]\)\s*/, '').trim();
      }

      // Strip redundant leading option markers like "A. ", "A) ", "(A) ", "A - ", "A: "
      const prefixRegex = new RegExp(`^(?:\\(?${opt.label}[.:)．*]|\\[${opt.label}\\]|\\(${opt.label}\\)|${opt.label}\\s*[-–—:]|${opt.label}\\s*\\.)\\s*`, 'i');
      if (prefixRegex.test(text)) {
        text = text.replace(prefixRegex, '').trim();
        fixedIssues.push(`Loại bỏ tiền tố "${opt.label}." thừa trong nội dung đáp án ${opt.label}`);
      }

      // Also general any letter prefix if it accidentally carried e.g. "B. " or "B - "
      const anyPrefixRegex = /^(?:[A-D]|[a-d])[.:)．*]\s*|^(?:[A-D]|[a-d])\s*[-–—:]\s*/i;
      if (anyPrefixRegex.test(text)) {
        text = text.replace(anyPrefixRegex, '').trim();
      }

      return { ...block, content: text };
    });

    return opt;
  });

  if (labelFixed) {
    fixedIssues.push('Chuẩn hóa nhãn các lựa chọn (A, B, C, D)');
  }

  // 3. Fix Missing Correct Answer
  if (!q.correctAnswer || q.correctAnswer.length === 0) {
    let resolvedOptionId: string | null = null;

    // Hint A: Did any option have an asterisk/star?
    if (asteriskFoundId) {
      resolvedOptionId = asteriskFoundId;
      const opt = q.options.find(o => o.id === asteriskFoundId);
      fixedIssues.push(`Xác định đáp án đúng (${opt?.label || ''}) từ dấu đánh dấu sao (*)`);
    } else {
      // Hint B: Does question text contain inline answer?
      const qFullText = q.question.map(b => b.type === 'text' ? b.content : '').join(' ');
      const ansMatch = /(?:Đáp\s*án(?:\s*đúng)?\s*[:]?|Answer\s*[:]?|Chọn\s*[:]?|=>|->)\s*([A-D])\b/i.exec(qFullText);
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        const found = q.options.find(o => o.label.toUpperCase() === letter);
        if (found) {
          resolvedOptionId = found.id;
          fixedIssues.push(`Xác định đáp án đúng (${letter}) từ gợi ý trong nội dung câu hỏi`);
        }
      }
    }

    // Hint C: Fallback default if still not found
    if (!resolvedOptionId && q.options.length > 0) {
      resolvedOptionId = q.options[0].id;
      fixedIssues.push(`Gán mặc định đáp án đúng là ${q.options[0].label} (có thể chỉnh lại nếu cần)`);
    }

    if (resolvedOptionId) {
      q.correctAnswer = [resolvedOptionId];
    }
  }

  // 4. Update Validation Status
  const hasContent = q.question.some(b => b.type === 'text' && b.content.trim().length > 0);
  const allOptsHaveContent = q.options.length >= 2 && q.options.every(o => o.content.some(b => b.type === 'text' && b.content.trim().length > 0));
  const hasAnswer = q.correctAnswer.length > 0;

  if (hasContent && allOptsHaveContent && hasAnswer) {
    q.validation = {
      status: 'valid',
      warnings: [],
    };
  } else {
    const warnings: string[] = [];
    if (!hasAnswer) warnings.push('Chưa xác định được đáp án đúng');
    if (!allOptsHaveContent) warnings.push('Có đáp án còn để trống nội dung');
    q.validation = {
      status: 'warning',
      warnings,
    };
  }

  return {
    question: q,
    fixedIssues,
  };
}

/**
 * Automatically repairs an array of quiz questions in batch.
 */
export function autoRepairAllQuestions(questions: Question[]): BatchAutoRepairResult {
  let totalIssuesFixed = 0;
  let repairedCount = 0;
  const details: { questionId: string; issues: string[] }[] = [];

  const repairedQuestions = questions.map((q) => {
    const result = autoRepairQuestion(q);
    if (result.fixedIssues.length > 0) {
      repairedCount++;
      totalIssuesFixed += result.fixedIssues.length;
      details.push({
        questionId: q.id,
        issues: result.fixedIssues,
      });
    }
    return result.question;
  });

  return {
    questions: repairedQuestions,
    repairedCount,
    totalIssuesFixed,
    details,
  };
}
