import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  generateExamCode,
  shuffleQuestionOptions,
  prepareStudentQuizQuestions,
  isQuizCapacityReached,
} from './examSessionHelper';
import type { Question } from '@ltvquiz/shared';

describe('examSessionHelper', () => {
  describe('shuffleArray', () => {
    it('should keep elements unchanged for empty or 1-element arrays', () => {
      expect(shuffleArray([])).toEqual([]);
      expect(shuffleArray([1])).toEqual([1]);
    });

    it('should shuffle elements predictably with deterministic RNG', () => {
      const mockRng = () => 0.1;
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original, mockRng);
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });

  describe('generateExamCode', () => {
    it('should generate a 3-digit exam code from standard pool', () => {
      const code = generateExamCode([], () => 0);
      expect(code).toBe('101');
    });

    it('should pick non-colliding exam codes when available', () => {
      const existing = ['101', '102'];
      const code = generateExamCode(existing, () => 0);
      expect(code).toBe('103');
    });
  });

  describe('shuffleQuestionOptions', () => {
    const mockQuestion: Question = {
      id: 'q1',
      type: 'multiple_choice',
      question: [{ type: 'text', content: 'Câu hỏi 1' }],
      options: [
        { id: 'opt_1', label: 'A', content: [{ type: 'text', content: 'Đáp án 1' }] },
        { id: 'opt_2', label: 'B', content: [{ type: 'text', content: 'Đáp án 2' }] },
        { id: 'opt_3', label: 'C', content: [{ type: 'text', content: 'Đáp án 3' }] },
        { id: 'opt_4', label: 'D', content: [{ type: 'text', content: 'Đáp án 4' }] },
      ],
      correctAnswer: ['opt_2'],
      points: 1,
      validation: { status: 'valid', warnings: [] },
    };

    it('should reassign labels A, B, C, D in order after shuffling', () => {
      // Deterministic reverse shuffle
      let counter = 0;
      const reverseRng = () => {
        counter++;
        return 0; // always swaps with 0
      };

      const result = shuffleQuestionOptions(mockQuestion, reverseRng);
      expect(result.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
      // IDs should be preserved
      expect(result.options.map(o => o.id).sort()).toEqual(['opt_1', 'opt_2', 'opt_3', 'opt_4'].sort());
    });
  });

  describe('prepareStudentQuizQuestions', () => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: [{ type: 'text', content: 'Câu 1' }],
        options: [
          { id: 'o1', label: 'A', content: [{ type: 'text', content: 'A' }] },
          { id: 'o2', label: 'B', content: [{ type: 'text', content: 'B' }] },
        ],
        correctAnswer: ['o1'],
        points: 1,
        validation: { status: 'valid', warnings: [] },
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: [{ type: 'text', content: 'Câu 2' }],
        options: [
          { id: 'o3', label: 'A', content: [{ type: 'text', content: 'A' }] },
          { id: 'o4', label: 'B', content: [{ type: 'text', content: 'B' }] },
        ],
        correctAnswer: ['o3'],
        points: 1,
        validation: { status: 'valid', warnings: [] },
      },
    ];

    it('should return unchanged list if shuffle flags are false', () => {
      const prepared = prepareStudentQuizQuestions(mockQuestions, {
        shuffleQuestions: false,
        shuffleOptions: false,
      });
      expect(prepared).toEqual(mockQuestions);
    });

    it('should shuffle questions when shuffleQuestions is true', () => {
      const prepared = prepareStudentQuizQuestions(
        mockQuestions,
        { shuffleQuestions: true, shuffleOptions: false },
        () => 0
      );
      expect(prepared.map(q => q.id)).toEqual(['q2', 'q1']);
    });
  });

  describe('isQuizCapacityReached', () => {
    it('should return false if limit is null or undefined or 0', () => {
      expect(isQuizCapacityReached({ settings: { maxStudentsLimit: null } as any }, 50)).toBe(false);
      expect(isQuizCapacityReached({ settings: { maxStudentsLimit: 0 } as any }, 50)).toBe(false);
      expect(isQuizCapacityReached({ settings: {} as any }, 50)).toBe(false);
    });

    it('should return true when attempts reach or exceed limit', () => {
      expect(isQuizCapacityReached({ settings: { maxStudentsLimit: 40 } as any }, 39)).toBe(false);
      expect(isQuizCapacityReached({ settings: { maxStudentsLimit: 40 } as any }, 40)).toBe(true);
      expect(isQuizCapacityReached({ settings: { maxStudentsLimit: 40 } as any }, 45)).toBe(true);
    });
  });
});
