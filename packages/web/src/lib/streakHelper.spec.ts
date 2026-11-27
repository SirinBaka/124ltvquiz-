import { describe, expect, it } from 'vitest';
import type { Question } from '@ltvquiz/shared';
import {
  isAnswerCorrect,
  calculateStreakStats,
  getStreakMilestoneMessage,
  STREAK_THRESHOLD,
} from './streakHelper';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: [{ type: 'text', content: 'Câu hỏi 1' }],
    options: [
      { id: 'opt1_a', label: 'A', content: [{ type: 'text', content: 'A' }] },
      { id: 'opt1_b', label: 'B', content: [{ type: 'text', content: 'B' }] },
    ],
    correctAnswer: ['opt1_a'],
    points: 1,
    validation: { status: 'valid', warnings: [] },
  },
  {
    id: 'q2',
    type: 'multiple_choice',
    question: [{ type: 'text', content: 'Câu hỏi 2' }],
    options: [
      { id: 'opt2_a', label: 'A', content: [{ type: 'text', content: 'A' }] },
      { id: 'opt2_b', label: 'B', content: [{ type: 'text', content: 'B' }] },
    ],
    correctAnswer: ['opt2_b'],
    points: 1,
    validation: { status: 'valid', warnings: [] },
  },
  {
    id: 'q3',
    type: 'multiple_choice',
    question: [{ type: 'text', content: 'Câu hỏi 3' }],
    options: [
      { id: 'opt3_a', label: 'A', content: [{ type: 'text', content: 'A' }] },
      { id: 'opt3_b', label: 'B', content: [{ type: 'text', content: 'B' }] },
    ],
    correctAnswer: ['opt3_a'],
    points: 1,
    validation: { status: 'valid', warnings: [] },
  },
  {
    id: 'q4',
    type: 'true_false_multiple',
    question: [{ type: 'text', content: 'Câu hỏi 4' }],
    options: [
      { id: 'opt4_a', label: 'a', content: [{ type: 'text', content: 'Ý 1' }] },
      { id: 'opt4_b', label: 'b', content: [{ type: 'text', content: 'Ý 2' }] },
    ],
    correctAnswer: ['opt4_a'], // opt4_a is true, opt4_b is false
    points: 1,
    validation: { status: 'valid', warnings: [] },
  },
];

describe('isAnswerCorrect', () => {
  it('identifies correct single choice answer', () => {
    expect(isAnswerCorrect(mockQuestions[0], 'opt1_a')).toBe(true);
    expect(isAnswerCorrect(mockQuestions[0], 'opt1_b')).toBe(false);
    expect(isAnswerCorrect(mockQuestions[0], undefined)).toBe(false);
  });

  it('identifies correct true_false_multiple answers', () => {
    expect(
      isAnswerCorrect(mockQuestions[3], { opt4_a: true, opt4_b: false })
    ).toBe(true);
    expect(
      isAnswerCorrect(mockQuestions[3], { opt4_a: true, opt4_b: true })
    ).toBe(false);
  });
});

describe('calculateStreakStats', () => {
  it('returns zeros for empty answers', () => {
    const stats = calculateStreakStats(mockQuestions, {});
    expect(stats).toEqual({
      currentStreak: 0,
      maxStreak: 0,
      isStreakActive: false,
      hasReachedStreakThreshold: false,
    });
  });

  it('calculates 2 consecutive correct answers without reaching threshold 3', () => {
    const answers = {
      q1: 'opt1_a',
      q2: 'opt2_b',
    };
    const stats = calculateStreakStats(mockQuestions, answers);
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(2);
    expect(stats.hasReachedStreakThreshold).toBe(false);
    expect(stats.isStreakActive).toBe(false);
  });

  it('triggers streak threshold when 3 consecutive answers are correct', () => {
    const answers = {
      q1: 'opt1_a',
      q2: 'opt2_b',
      q3: 'opt3_a',
    };
    const stats = calculateStreakStats(mockQuestions, answers);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
    expect(stats.hasReachedStreakThreshold).toBe(true);
    expect(stats.isStreakActive).toBe(true);
  });

  it('resets current streak after a wrong answer while keeping maxStreak', () => {
    const answers = {
      q1: 'opt1_a',
      q2: 'opt2_b',
      q3: 'opt3_a',
      q4: { opt4_a: false, opt4_b: true }, // wrong
    };
    const stats = calculateStreakStats(mockQuestions, answers, ['q1', 'q2', 'q3', 'q4']);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(3);
    expect(stats.hasReachedStreakThreshold).toBe(true);
    expect(stats.isStreakActive).toBe(false);
  });
});

describe('getStreakMilestoneMessage', () => {
  it('returns motivating streak celebration message for streak >= 3', () => {
    const msg3 = getStreakMilestoneMessage(STREAK_THRESHOLD);
    expect(msg3).toContain('3');
    expect(msg3.length).toBeGreaterThan(0);
  });
});
