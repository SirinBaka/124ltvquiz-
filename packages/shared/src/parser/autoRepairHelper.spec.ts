import { describe, it, expect } from 'vitest';
import { autoRepairQuestion, autoRepairAllQuestions } from './autoRepairHelper';
import type { Question } from '../types';

describe('autoRepairHelper', () => {
  it('strips redundant leading prefixes from options (e.g. A. text -> text)', () => {
    const rawQuestion: Question = {
      id: 'q1',
      type: 'multiple_choice',
      points: 0.25,
      question: [{ type: 'text', content: 'Thủ đô của Việt Nam là gì?' }],
      options: [
        { id: 'opt1', label: 'A', content: [{ type: 'text', content: 'A. Hà Nội' }] },
        { id: 'opt2', label: 'B', content: [{ type: 'text', content: 'B) TP.HCM' }] },
        { id: 'opt3', label: 'C', content: [{ type: 'text', content: 'C: Đà Nẵng' }] },
        { id: 'opt4', label: 'D', content: [{ type: 'text', content: 'D - Hải Phòng' }] },
      ],
      correctAnswer: ['opt1'],
      validation: { status: 'valid', warnings: [] },
    };

    const result = autoRepairQuestion(rawQuestion);
    expect(result.question.options[0].content[0].content).toBe('Hà Nội');
    expect(result.question.options[1].content[0].content).toBe('TP.HCM');
    expect(result.question.options[2].content[0].content).toBe('Đà Nẵng');
    expect(result.question.options[3].content[0].content).toBe('Hải Phòng');
    expect(result.fixedIssues.length).toBeGreaterThan(0);
  });

  it('detects correct answer from question content hint (e.g. Đáp án: C)', () => {
    const rawQuestion: Question = {
      id: 'q2',
      type: 'multiple_choice',
      points: 0.25,
      question: [{ type: 'text', content: '1 + 1 = ? Đáp án: B' }],
      options: [
        { id: 'opt1', label: 'A', content: [{ type: 'text', content: '1' }] },
        { id: 'opt2', label: 'B', content: [{ type: 'text', content: '2' }] },
        { id: 'opt3', label: 'C', content: [{ type: 'text', content: '3' }] },
        { id: 'opt4', label: 'D', content: [{ type: 'text', content: '4' }] },
      ],
      correctAnswer: [], // Missing!
      validation: { status: 'warning', warnings: ['Chưa xác định được đáp án đúng'] },
    };

    const result = autoRepairQuestion(rawQuestion);
    expect(result.question.correctAnswer).toEqual(['opt2']);
    expect(result.question.validation.status).toBe('valid');
    expect(result.question.validation.warnings).toHaveLength(0);
  });

  it('detects correct answer from asterisk in option (*C. ...)', () => {
    const rawQuestion: Question = {
      id: 'q3',
      type: 'multiple_choice',
      points: 0.25,
      question: [{ type: 'text', content: 'Mặt trời mọc ở hướng nào?' }],
      options: [
        { id: 'opt1', label: 'A', content: [{ type: 'text', content: 'Tây' }] },
        { id: 'opt2', label: 'B', content: [{ type: 'text', content: 'Nam' }] },
        { id: 'opt3', label: 'C', content: [{ type: 'text', content: '* Đông' }] },
        { id: 'opt4', label: 'D', content: [{ type: 'text', content: 'Bắc' }] },
      ],
      correctAnswer: [],
      validation: { status: 'warning', warnings: ['Chưa xác định được đáp án đúng'] },
    };

    const result = autoRepairQuestion(rawQuestion);
    expect(result.question.correctAnswer).toEqual(['opt3']);
    expect(result.question.options[2].content[0].content).toBe('Đông');
    expect(result.question.validation.status).toBe('valid');
  });

  it('fixes empty/invalid points and missing labels', () => {
    const rawQuestion: Question = {
      id: 'q4',
      type: 'multiple_choice',
      points: 0,
      question: [{ type: 'text', content: 'Câu hỏi test' }],
      options: [
        { id: 'opt1', label: '', content: [{ type: 'text', content: 'Op 1' }] },
        { id: 'opt2', label: '', content: [{ type: 'text', content: 'Op 2' }] },
      ],
      correctAnswer: [],
      validation: { status: 'warning', warnings: [] },
    };

    const result = autoRepairQuestion(rawQuestion);
    expect(result.question.points).toBe(0.25);
    expect(result.question.options[0].label).toBe('A');
    expect(result.question.options[1].label).toBe('B');
  });

  it('autoRepairAllQuestions repairs multiple questions and returns summary', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        type: 'multiple_choice',
        points: 0.25,
        question: [{ type: 'text', content: 'Câu 1' }],
        options: [
          { id: 'opt1', label: 'A', content: [{ type: 'text', content: 'A. Đúng' }] },
          { id: 'opt2', label: 'B', content: [{ type: 'text', content: 'B. Sai' }] },
        ],
        correctAnswer: ['opt1'],
        validation: { status: 'valid', warnings: [] },
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        points: 0,
        question: [{ type: 'text', content: 'Câu 2' }],
        options: [
          { id: 'opt3', label: 'A', content: [{ type: 'text', content: 'X' }] },
          { id: 'opt4', label: 'B', content: [{ type: 'text', content: 'Y' }] },
        ],
        correctAnswer: [],
        validation: { status: 'warning', warnings: ['Chưa có đáp án'] },
      },
    ];

    const batch = autoRepairAllQuestions(questions);
    expect(batch.repairedCount).toBe(2);
    expect(batch.totalIssuesFixed).toBeGreaterThanOrEqual(2);
    expect(batch.questions[0].options[0].content[0].content).toBe('Đúng');
    expect(batch.questions[1].correctAnswer).toHaveLength(1);
    expect(batch.questions[1].points).toBe(0.25);
  });
});
