import { describe, expect, it } from "vitest";
import type { Quiz, Attempt, QuizSettings } from "@ltvquiz/shared";
import {
  formatAttemptTime,
  getScoreColorClass,
  filterQuizzesBySearch,
  filterAttemptsBySearch,
  calculateDashboardSummary,
  calculateScoreDistribution,
  calculateAntiCheatStats,
  calculateUniqueStudentsAndClasses,
} from "./dashboardHelper";

const defaultSettings: QuizSettings = {
  timeLimit: 15,
  shuffleQuestions: false,
  shuffleOptions: false,
  showResults: "immediately",
  allowReview: true,
  maxAttempts: 1,
};

describe("dashboardHelper", () => {
  describe("formatAttemptTime", () => {
    it("formats seconds into minutes and seconds accurately", () => {
      expect(formatAttemptTime(95)).toBe("1p 35s");
      expect(formatAttemptTime(45)).toBe("45s");
      expect(formatAttemptTime(120)).toBe("2p 0s");
      expect(formatAttemptTime(0)).toBe("0s");
    });
  });

  describe("getScoreColorClass", () => {
    it("returns appropriate color class based on score percentage", () => {
      expect(getScoreColorClass(9, 10)).toBe(
        "text-emerald-600 dark:text-emerald-400",
      );
      expect(getScoreColorClass(6.5, 10)).toBe(
        "text-blue-600 dark:text-blue-400",
      );
      expect(getScoreColorClass(4, 10)).toBe(
        "text-amber-600 dark:text-amber-400",
      );
      expect(getScoreColorClass(0, 0)).toBe("text-[var(--color-primary)]");
    });
  });

  describe("filterQuizzesBySearch", () => {
    const sampleQuizzes: Quiz[] = [
      {
        id: "q1",
        title: "Kiểm tra Toán 12",
        description: "",
        status: "published",
        questions: [],
        settings: defaultSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "q2",
        title: "Sinh học Đại cương",
        description: "",
        status: "draft",
        questions: [],
        settings: defaultSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it("returns all quizzes when query is empty or whitespace", () => {
      expect(filterQuizzesBySearch(sampleQuizzes, "")).toEqual(sampleQuizzes);
      expect(filterQuizzesBySearch(sampleQuizzes, "   ")).toEqual(
        sampleQuizzes,
      );
    });

    it("filters case-insensitively by title", () => {
      const result = filterQuizzesBySearch(sampleQuizzes, "toán");
      expect(result).toEqual([sampleQuizzes[0]]);
    });
  });

  describe("filterAttemptsBySearch", () => {
    const sampleAttempts: Attempt[] = [
      {
        id: "a1",
        quizId: "q1",
        studentName: "Nguyễn Văn An",
        studentClass: "12A4",
        score: 9,
        totalPoints: 10,
        timeSpent: 120,
        answers: {},
        createdAt: new Date().toISOString(),
      },
      {
        id: "a2",
        quizId: "q2",
        studentName: "Trần Thị Bình",
        studentClass: "12A5",
        score: 7,
        totalPoints: 10,
        timeSpent: 90,
        answers: {},
        createdAt: new Date().toISOString(),
      },
    ];

    const quizMap = new Map<string, string>([
      ["q1", "Toán 12"],
      ["q2", "Lý 12"],
    ]);

    it("filters by student name, class, or quiz title", () => {
      expect(filterAttemptsBySearch(sampleAttempts, quizMap, "bình")).toEqual([
        sampleAttempts[1],
      ]);
      expect(filterAttemptsBySearch(sampleAttempts, quizMap, "12a4")).toEqual([
        sampleAttempts[0],
      ]);
      expect(filterAttemptsBySearch(sampleAttempts, quizMap, "toán")).toEqual([
        sampleAttempts[0],
      ]);
    });

    it("returns all attempts if query is blank", () => {
      expect(filterAttemptsBySearch(sampleAttempts, quizMap, "")).toEqual(
        sampleAttempts,
      );
    });
  });

  describe("calculateDashboardSummary", () => {
    const createQuiz = (
      id: string,
      title: string,
      status: Quiz["status"],
    ): Quiz => ({
      id,
      title,
      description: "",
      status,
      questions: [],
      settings: defaultSettings,
      createdAt: "",
      updatedAt: "",
    });

    it("calculates counts and average score accurately", () => {
      const sampleQuizzes: Quiz[] = [
        createQuiz("q1", "Đề 1", "published"),
        createQuiz("q2", "Đề 2", "draft"),
        createQuiz("q3", "Đề 3", "published"),
      ];

      const sampleAttempts: Attempt[] = [
        {
          id: "a1",
          quizId: "q1",
          studentName: "An",
          score: 8,
          totalPoints: 10,
          timeSpent: 60,
          answers: {},
          createdAt: "",
        },
        {
          id: "a2",
          quizId: "q1",
          studentName: "Bình",
          score: 10,
          totalPoints: 10,
          timeSpent: 80,
          answers: {},
          createdAt: "",
        },
      ];

      expect(calculateDashboardSummary(sampleQuizzes, sampleAttempts)).toEqual({
        totalQuizzes: 3,
        publishedCount: 2,
        draftCount: 1,
        totalAttempts: 2,
        averageScore: 9,
      });
    });

    it("handles empty data without NaN", () => {
      expect(calculateDashboardSummary([], [])).toEqual({
        totalQuizzes: 0,
        publishedCount: 0,
        draftCount: 0,
        totalAttempts: 0,
        averageScore: 0,
      });
    });
  });

  describe("calculateScoreDistribution", () => {
    it("categorizes attempts into score tiers properly", () => {
      const attempts: Attempt[] = [
        { id: "1", quizId: "q", studentName: "A", score: 9, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
        { id: "2", quizId: "q", studentName: "B", score: 7, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
        { id: "3", quizId: "q", studentName: "C", score: 5.5, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
        { id: "4", quizId: "q", studentName: "D", score: 4, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
      ];

      const dist = calculateScoreDistribution(attempts);
      expect(dist.total).toBe(4);
      expect(dist.excellent).toBe(1);
      expect(dist.good).toBe(1);
      expect(dist.average).toBe(1);
      expect(dist.poor).toBe(1);
      expect(dist.percentages.excellent).toBe(25);
    });

    it("handles zero attempts gracefully", () => {
      const dist = calculateScoreDistribution([]);
      expect(dist.total).toBe(0);
      expect(dist.percentages.excellent).toBe(0);
    });
  });

  describe("calculateAntiCheatStats", () => {
    it("calculates clean vs violation attempts correctly", () => {
      const attempts: Attempt[] = [
        { id: "1", quizId: "q", studentName: "A", score: 8, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "", violationCount: 0 },
        { id: "2", quizId: "q", studentName: "B", score: 6, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "", violationCount: 2 },
      ];

      const stats = calculateAntiCheatStats(attempts);
      expect(stats.cleanAttempts).toBe(1);
      expect(stats.violationAttempts).toBe(1);
      expect(stats.honestPercent).toBe(50);
    });
  });

  describe("calculateUniqueStudentsAndClasses", () => {
    it("deduplicates student names and classes case-insensitively", () => {
      const attempts: Attempt[] = [
        { id: "1", quizId: "q", studentName: "An", studentClass: "12A1", score: 8, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
        { id: "2", quizId: "q", studentName: "an", studentClass: "12a1", score: 8, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
        { id: "3", quizId: "q", studentName: "Bình", studentClass: "12A2", score: 8, totalPoints: 10, timeSpent: 10, answers: {}, createdAt: "" },
      ];

      const res = calculateUniqueStudentsAndClasses(attempts);
      expect(res.studentCount).toBe(2);
      expect(res.classCount).toBe(2);
    });
  });
});
