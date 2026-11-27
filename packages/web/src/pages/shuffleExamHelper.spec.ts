import { describe, it, expect } from "vitest";
import type { Question } from "@ltvquiz/shared";
import {
  sanitizeFilename,
  stripFileExtension,
  formatExamVariantFilename,
  clampVariantCount,
  summarizeQuestions,
  filterVariantsByCode,
} from "./shuffleExamHelper";

describe("shuffleExamHelper", () => {
  it("sanitizes illegal characters while keeping Vietnamese diacritics", () => {
    expect(sanitizeFilename('Đề kiểm tra: Toán 12 / HK1*?"<>|')).toBe(
      "Đề kiểm tra- Toán 12 - HK1------",
    );
    expect(sanitizeFilename("   ")).toBe("De_thi");
  });

  it("strips file extension cleanly", () => {
    expect(stripFileExtension("De_Toan_Giua_Ky_1.docx")).toBe(
      "De_Toan_Giua_Ky_1",
    );
    expect(stripFileExtension("vat.ly.12.pdf")).toBe("vat.ly.12");
  });

  it("formats exam variant filenames accurately", () => {
    expect(formatExamVariantFilename("Kiểm tra Toán 12", "101", "pdf")).toBe(
      "Kiểm tra Toán 12 - mã đề 101.pdf",
    );
    expect(formatExamVariantFilename("Kiểm tra Toán 12", "005", "html")).toBe(
      "Kiểm tra Toán 12 - mã đề 005.html",
    );
  });

  it("clamps variant count between 1 and max", () => {
    expect(clampVariantCount(-5)).toBe(1);
    expect(clampVariantCount(NaN)).toBe(1);
    expect(clampVariantCount(25.8)).toBe(25);
    expect(clampVariantCount(99999, 2000)).toBe(2000);
  });

  it("summarizes breakdown by question kind", () => {
    const qs: Question[] = [
      {
        id: "1",
        type: "multiple_choice",
        points: 0.25,
        question: [{ type: "text", content: "Q1" }],
        options: [
          { id: "a", label: "A", content: [{ type: "text", content: "1" }] },
        ],
        correctAnswer: ["a"],
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "2",
        type: "true_false_multiple",
        points: 1,
        question: [{ type: "text", content: "Q2" }],
        options: [
          { id: "a", label: "a", content: [{ type: "text", content: "1" }] },
        ],
        correctAnswer: ["a"],
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "3",
        type: "multiple_choice",
        sectionTitle: "PHẦN III",
        points: 0.5,
        question: [{ type: "text", content: "Q3" }],
        options: [],
        correctAnswer: [],
        validation: { status: "warning", warnings: [] },
      },
    ];

    expect(summarizeQuestions(qs)).toEqual({
      total: 3,
      multipleChoice: 1,
      trueFalseMulti: 1,
      trueFalse: 0,
      shortAnswer: 1,
      withAnswers: 2,
    });
  });

  it("filters variants by exam code", () => {
    const mock = [
      { examCode: "101", questions: [], answerKey: [] },
      { examCode: "102", questions: [], answerKey: [] },
      { examCode: "205", questions: [], answerKey: [] },
    ];
    expect(filterVariantsByCode(mock, "10")).toHaveLength(2);
    expect(filterVariantsByCode(mock, "205")).toHaveLength(1);
    expect(filterVariantsByCode(mock, "")).toHaveLength(3);
  });
});
