import { describe, it, expect } from "vitest";
import {
  validateAccessPassword,
  extractQuestionPlainText,
  escapeCsvCell,
  evaluateQuestionAnswer,
  generateStudentResultCsv,
} from "./studentExportHelper";
import type { Quiz, Attempt, Question } from "@ltvquiz/shared";

describe("studentExportHelper", () => {
  describe("validateAccessPassword", () => {
    it("should allow access when no password is required", () => {
      expect(validateAccessPassword("", undefined)).toBe(true);
      expect(validateAccessPassword("anything", "")).toBe(true);
      expect(validateAccessPassword("", "   ")).toBe(true);
    });

    it("should correctly validate password when required", () => {
      expect(validateAccessPassword("123456", "123456")).toBe(true);
      expect(validateAccessPassword(" 123456 ", "123456")).toBe(true); // handles whitespace trimming
      expect(validateAccessPassword("wrongPass", "123456")).toBe(false);
      expect(validateAccessPassword("", "123456")).toBe(false);
    });
  });

  describe("escapeCsvCell", () => {
    it("should wrap values in double quotes and escape internal quotes", () => {
      expect(escapeCsvCell("Hello World")).toBe('"Hello World"');
      expect(escapeCsvCell('He said "Hi"')).toBe('"He said ""Hi"""');
      expect(escapeCsvCell(10)).toBe('"10"');
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });
  });

  describe("extractQuestionPlainText", () => {
    it("should extract text content from question items", () => {
      const q: Question = {
        id: "q1",
        type: "multiple_choice",
        points: 2,
        question: [
          { type: "text", content: "Đâu là thủ đô" },
          { type: "image", content: "http://example.com/map.png" },
          { type: "text", content: "của Việt Nam?" },
        ],
        options: [],
        correctAnswer: ["opt1"],
        validation: { status: "valid", warnings: [] },
      };
      expect(extractQuestionPlainText(q)).toBe("Đâu là thủ đô của Việt Nam?");
    });
  });

  describe("evaluateQuestionAnswer", () => {
    const sampleQuestion: Question = {
      id: "q_eval_1",
      type: "multiple_choice",
      points: 2,
      question: [{ type: "text", content: "Nước sôi ở bao nhiêu độ C?" }],
      options: [
        { id: "opt_a", label: "A", content: [{ type: "text", content: "50" }] },
        { id: "opt_b", label: "B", content: [{ type: "text", content: "100" }] },
      ],
      correctAnswer: ["opt_b"],
      validation: { status: "valid", warnings: [] },
    };

    it("should evaluate correct answer properly", () => {
      const result = evaluateQuestionAnswer(sampleQuestion, "opt_b");
      expect(result.isCorrect).toBe(true);
      expect(result.earnedPoints).toBe(2);
      expect(result.studentAnswerText).toContain("B. 100");
    });

    it("should evaluate incorrect answer properly", () => {
      const result = evaluateQuestionAnswer(sampleQuestion, "opt_a");
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
      expect(result.studentAnswerText).toContain("A. 50");
    });

    it("should handle unanswered questions", () => {
      const result = evaluateQuestionAnswer(sampleQuestion, undefined);
      expect(result.isCorrect).toBe(false);
      expect(result.earnedPoints).toBe(0);
      expect(result.studentAnswerText).toBe("Chưa trả lời");
    });

    it("should evaluate true_false_multiple questions", () => {
      const tfQuestion: Question = {
        id: "q_tf_1",
        type: "true_false_multiple",
        points: 4,
        question: [{ type: "text", content: "Các khẳng định sau đúng hay sai:" }],
        options: [
          { id: "opt_1", label: "a", content: [{ type: "text", content: "Mệnh đề 1" }] },
          { id: "opt_2", label: "b", content: [{ type: "text", content: "Mệnh đề 2" }] },
        ],
        correctAnswer: ["opt_1"], // opt_1 is true, opt_2 is false
        validation: { status: "valid", warnings: [] },
      };

      // Student answers opt_1 true, opt_2 false -> 100% correct
      const fullCorrect = evaluateQuestionAnswer(tfQuestion, { opt_1: true, opt_2: false });
      expect(fullCorrect.isCorrect).toBe(true);
      expect(fullCorrect.earnedPoints).toBe(4);

      // Student answers opt_1 true, opt_2 true -> 1 of 2 correct (50% = 2 points)
      const halfCorrect = evaluateQuestionAnswer(tfQuestion, { opt_1: true, opt_2: true });
      expect(halfCorrect.isCorrect).toBe(false);
      expect(halfCorrect.earnedPoints).toBe(2);
    });
  });

  describe("generateStudentResultCsv", () => {
    it("should generate CSV with UTF-8 BOM, student details, and questions breakdown", () => {
      const quiz: Quiz = {
        id: "quiz_test_1",
        title: "Kiểm tra 15 phút Toán 12",
        description: "Đề kiểm tra đại số",
        status: "published",
        createdAt: "2026-10-15T10:00:00.000Z",
        updatedAt: "2026-10-15T10:00:00.000Z",
        settings: {
          timeLimit: 15,
          shuffleQuestions: false,
          shuffleOptions: false,
          showResults: "immediately",
          allowReview: true,
          maxAttempts: 1,
        },
        questions: [
          {
            id: "q1",
            type: "multiple_choice",
            points: 5,
            question: [{ type: "text", content: "1 + 1 = ?" }],
            options: [
              { id: "o1", label: "A", content: [{ type: "text", content: "2" }] },
              { id: "o2", label: "B", content: [{ type: "text", content: "3" }] },
            ],
            correctAnswer: ["o1"],
            validation: { status: "valid", warnings: [] },
          },
        ],
      };

      const attempt: Attempt = {
        id: "att_1",
        quizId: "quiz_test_1",
        studentName: "Nguyễn Văn A",
        studentClass: "12A4",
        score: 5,
        totalPoints: 5,
        timeSpent: 125,
        maxStreak: 1,
        violationCount: 0,
        createdAt: "2026-10-15T10:15:00.000Z",
        answers: {
          q1: "o1",
        },
      };

      const csv = generateStudentResultCsv(attempt, quiz);

      // Starts with UTF-8 BOM
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Contains header and student information
      expect(csv).toContain("BÁO CÁO KẾT QUẢ BÀI THI CHI TIẾT");
      expect(csv).toContain("Nguyễn Văn A");
      expect(csv).toContain("12A4");
      expect(csv).toContain("Kiểm tra 15 phút Toán 12");
      expect(csv).toContain("5.0 / 5");
      expect(csv).toContain("100.0%");
      expect(csv).toContain("Hợp lệ - Không phát hiện gian lận");

      // Contains question breakdown
      expect(csv).toContain("1 + 1 = ?");
      expect(csv).toContain("A. 2");
      expect(csv).toContain("ĐÚNG");
    });
  });
});
