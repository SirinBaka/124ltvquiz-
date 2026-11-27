import type { Question, Quiz } from '@ltvquiz/shared';

const STANDARD_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Fisher-Yates immutable array shuffle
 */
export function shuffleArray<T>(array: readonly T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random 3-digit exam code (e.g., "101", "102", "204")
 */
export function generateExamCode(existingCodes?: string[], rng: () => number = Math.random): string {
  // Common Vietnamese school exam codes: 101-108, 201-208, 301-308, 401-408
  const basePool = [
    '101', '102', '103', '104', '105', '106', '107', '108',
    '201', '202', '203', '204', '205', '206', '207', '208',
    '301', '302', '303', '304', '305', '306', '307', '308',
    '401', '402', '403', '404', '405', '406', '407', '408'
  ];

  if (existingCodes && existingCodes.length > 0) {
    const available = basePool.filter(c => !existingCodes.includes(c));
    if (available.length > 0) {
      const idx = Math.floor(rng() * available.length);
      return available[idx];
    }
  }

  // Fallback to random 3-digit code
  const randomNum = Math.floor(101 + rng() * 898);
  return randomNum.toString();
}

/**
 * Shuffle options of a single question while re-labeling A, B, C, D
 */
export function shuffleQuestionOptions(
  question: Question,
  rng: () => number = Math.random
): Question {
  if (!question.options || question.options.length <= 1) {
    return question;
  }

  // Shuffle options
  const shuffled = shuffleArray(question.options, rng);

  // Assign clean labels A, B, C, D according to their new order
  const relabeled = shuffled.map((opt, index) => ({
    ...opt,
    label: STANDARD_LABELS[index] || String.fromCharCode(65 + index)
  }));

  return {
    ...question,
    options: relabeled
  };
}

/**
 * Prepares questions for a student session according to quiz settings
 */
export function prepareStudentQuizQuestions(
  questions: readonly Question[],
  settings: {
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  },
  rng: () => number = Math.random
): Question[] {
  let result = [...questions];

  // 1. Shuffle question order if enabled
  if (settings.shuffleQuestions) {
    result = shuffleArray(result, rng);
  }

  // 2. Shuffle options inside questions if enabled
  if (settings.shuffleOptions) {
    result = result.map(q => shuffleQuestionOptions(q, rng));
  }

  return result;
}

/**
 * Checks if quiz has reached its student participants capacity
 */
export function isQuizCapacityReached(
  quiz: Pick<Quiz, 'settings'>,
  currentAttemptsCount: number
): boolean {
  const limit = quiz.settings?.maxStudentsLimit;
  if (limit === undefined || limit === null || limit <= 0) {
    return false;
  }
  return currentAttemptsCount >= limit;
}
