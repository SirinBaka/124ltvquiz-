import { describe, it, expect } from "vitest";
import type { Question } from "@ltvquiz/shared";
import { checkQuestionEvaluation } from "./StudentQuizPage";

describe("StudentQuizPage - checkQuestionEvaluation", () => {
  const mcQuestion: Question = {
    id: "q1",
    type: "multiple_choice",
    question: [{ type: "text", content: "2 + 2 = ?" }],
    options: [
      { id: "opt_a", label: "A", content: [{ type: "text", content: "3" }] },
      { id: "opt_b", label: "B", content: [{ type: "text", content: "4" }] },
      { id: "opt_c", label: "C", content: [{ type: "text", content: "5" }] },
    ],
    correctAnswer: ["opt_b"],
    points: 0.25,
    validation: { status: "valid", warnings: [] },
  };

  const tfQuestion: Question = {
    id: "q2",
    type: "true_false_multiple",
    question: [{ type: "text", content: "Xét tính đúng sai của các mệnh đề:" }],
    options: [
      { id: "opt_2a", label: "a", content: [{ type: "text", content: "Mệnh đề 1" }] },
      { id: "opt_2b", label: "b", content: [{ type: "text", content: "Mệnh đề 2" }] },
      { id: "opt_2c", label: "c", content: [{ type: "text", content: "Mệnh đề 3" }] },
      { id: "opt_2d", label: "d", content: [{ type: "text", content: "Mệnh đề 4" }] },
    ],
    // Only 2a and 2c are True
    correctAnswer: ["opt_2a", "opt_2c"],
    points: 1.0,
    validation: { status: "valid", warnings: [] },
  };

  it("evaluates multiple choice correctly when student selects correct option", () => {
    const res = checkQuestionEvaluation(mcQuestion, "opt_b");
    expect(res.isAnswered).toBe(true);
    expect(res.isCorrect).toBe(true);
    expect(res.earnedPoints).toBe(0.25);
  });

  it("evaluates multiple choice as wrong when student selects wrong option", () => {
    const res = checkQuestionEvaluation(mcQuestion, "opt_a");
    expect(res.isAnswered).toBe(true);
    expect(res.isCorrect).toBe(false);
    expect(res.earnedPoints).toBe(0);
  });

  it("evaluates multiple choice as unanswered when empty", () => {
    const res = checkQuestionEvaluation(mcQuestion, "");
    expect(res.isAnswered).toBe(false);
    expect(res.isCorrect).toBe(false);
    expect(res.earnedPoints).toBe(0);
  });

  it("evaluates true/false multiple question when 100% correct", () => {
    const studentAns = {
      opt_2a: true,
      opt_2b: false,
      opt_2c: true,
      opt_2d: false,
    };
    const res = checkQuestionEvaluation(tfQuestion, studentAns);
    expect(res.isAnswered).toBe(true);
    expect(res.isCorrect).toBe(true);
    expect(res.earnedPoints).toBe(1.0);
  });

  it("evaluates true/false multiple question when partially correct (2/4 = 0.5 points)", () => {
    const studentAns = {
      opt_2a: true, // correct
      opt_2b: true, // wrong (expected false)
      opt_2c: true, // correct
      opt_2d: true, // wrong (expected false)
    };
    const res = checkQuestionEvaluation(tfQuestion, studentAns);
    expect(res.isAnswered).toBe(true);
    expect(res.isCorrect).toBe(false);
    expect(res.isPartial).toBe(true);
    expect(res.earnedPoints).toBe(0.5);
  });

  it("evaluates true/false multiple question as unanswered when object is empty", () => {
    const res = checkQuestionEvaluation(tfQuestion, {});
    expect(res.isAnswered).toBe(false);
    expect(res.isCorrect).toBe(false);
    expect(res.earnedPoints).toBe(0);
  });
});
