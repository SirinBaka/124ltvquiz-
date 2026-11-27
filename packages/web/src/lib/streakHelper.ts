import type { Question } from '@ltvquiz/shared';

export type StreakStats = {
  currentStreak: number;
  maxStreak: number;
  isStreakActive: boolean;
  hasReachedStreakThreshold: boolean;
};

export const STREAK_THRESHOLD = 3;

export function isAnswerCorrect(question: Question, answer: any): boolean {
  if (answer === undefined || answer === null || answer === '') {
    return false;
  }

  if (question.type === 'true_false_multiple') {
    if (typeof answer !== 'object') return false;
    const ansMap = answer as Record<string, boolean>;
    const optionIds = question.options.map(opt => opt.id);
    const hasAnsweredAll = optionIds.every(id => id in ansMap);
    if (!hasAnsweredAll) return false;

    return question.options.every(opt => {
      const isExpectedTrue = question.correctAnswer.includes(opt.id);
      return Boolean(ansMap[opt.id]) === isExpectedTrue;
    });
  }

  if (!question.correctAnswer || question.correctAnswer.length === 0) {
    return false;
  }

  return answer === question.correctAnswer[0];
}

export function calculateStreakStats(
  questions: Question[],
  answers: Record<string, any>,
  answeredOrder?: string[]
): StreakStats {
  const questionMap = new Map<string, Question>();
  questions.forEach(q => questionMap.set(q.id, q));

  const sequence = answeredOrder && answeredOrder.length > 0
    ? answeredOrder
    : questions.map(q => q.id);

  let currentStreak = 0;
  let maxStreak = 0;

  for (const qId of sequence) {
    const q = questionMap.get(qId);
    if (!q) continue;

    const ans = answers[qId];
    if (ans === undefined || ans === null || ans === '') {
      continue;
    }

    if (isAnswerCorrect(q, ans)) {
      currentStreak += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    maxStreak,
    isStreakActive: currentStreak >= STREAK_THRESHOLD,
    hasReachedStreakThreshold: maxStreak >= STREAK_THRESHOLD,
  };
}

export function getStreakMilestoneMessage(streak: number): string {
  if (streak >= 10) {
    return `Chuỗi ${streak} câu đúng liên tiếp. Nhịp làm bài rất ổn định.`;
  }
  if (streak >= 5) {
    return `Chuỗi ${streak} câu đúng liên tiếp. Tiếp tục giữ sự tập trung.`;
  }
  return `Chuỗi ${streak} câu đúng liên tiếp. Khởi đầu thuận lợi.`;
}

export function playStreakCelebrationSound(enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumphant chord
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.35);
    });
  } catch {
    // Audio might fail if user has not interacted with page or permissions disabled
  }
}
