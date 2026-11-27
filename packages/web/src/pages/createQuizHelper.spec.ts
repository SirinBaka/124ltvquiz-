import { describe, expect, it } from "vitest";
import type { Document } from "@ltvquiz/shared";
import {
  validateUploadFile,
  formatFileSize,
  filterExistingDocuments,
  updateRawTextOption,
  questionsToAzotaText,
} from "./createQuizHelper";

describe("createQuizHelper", () => {
  describe("validateUploadFile", () => {
    it("accepts valid PDF, DOCX, TXT, and Markdown files", () => {
      expect(
        validateUploadFile({
          name: "de_thi.pdf",
          size: 1024 * 500,
          type: "application/pdf",
        }),
      ).toEqual({ valid: true });

      expect(
        validateUploadFile({
          name: "tai_lieu.docx",
          size: 1024 * 100,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ).toEqual({ valid: true });

      expect(
        validateUploadFile({
          name: "ghi_chu.txt",
          size: 2048,
          type: "text/plain",
        }),
      ).toEqual({ valid: true });
    });

    it("rejects unsupported file extensions", () => {
      const result = validateUploadFile({
        name: "script.exe",
        size: 1024,
        type: "application/octet-stream",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Định dạng file không được hỗ trợ");
    });

    it("rejects files exceeding 25MB limit", () => {
      const result = validateUploadFile({
        name: "heavy.pdf",
        size: 26 * 1024 * 1024,
        type: "application/pdf",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("File quá lớn");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes into readable KB and MB", () => {
      expect(formatFileSize(2048)).toBe("2.0 KB");
      expect(formatFileSize(1024 * 1024 * 3.5)).toBe("3.5 MB");
      expect(formatFileSize(0)).toBe("0.0 KB");
    });
  });

  describe("filterExistingDocuments", () => {
    const sampleDocs: Document[] = [
      {
        id: "d1",
        name: "Đề thi Sinh học 12",
        originalFileName: "sinh12.pdf",
        mimeType: "application/pdf",
        size: 50000,
        status: "ready",
        sourceType: "pdf",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "d2",
        name: "Đề thi Hóa học 12",
        originalFileName: "hoa12.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 60000,
        status: "ready",
        sourceType: "docx",
        createdAt: "",
        updatedAt: "",
      },
    ];

    it("returns all documents when search query is empty", () => {
      expect(filterExistingDocuments(sampleDocs, "")).toEqual(sampleDocs);
      expect(filterExistingDocuments(sampleDocs, "   ")).toEqual(sampleDocs);
    });

    it("filters documents case-insensitively by name or originalFileName", () => {
      expect(filterExistingDocuments(sampleDocs, "sinh")).toEqual([
        sampleDocs[0],
      ]);
      expect(filterExistingDocuments(sampleDocs, "hoa12")).toEqual([
        sampleDocs[1],
      ]);
    });
  });

  describe("updateRawTextOption and questionsToAzotaText", () => {
    it("updates correct answer asterisk in raw text", () => {
      const raw = `Câu 1. Nội dung 1?
A. Một
*B. Hai
C. Ba
D. Bốn

Câu 2. Nội dung 2?
*A. Chó
B. Mèo
C. Chuột
D. Gà`;

      const updated = updateRawTextOption(raw, 0, "C");
      expect(updated).toContain("*C. Ba");
      expect(updated).not.toContain("*B. Hai");
      // Question 2 remains untouched
      expect(updated).toContain("*A. Chó");
    });

    it("serializes questions to Azota raw text", () => {
      const q = [
        {
          id: "q1",
          sectionTitle: "PHẦN I",
          question: [{ type: "text", content: "Câu hỏi 1?" }],
          options: [
            { id: "o1", label: "A", content: [{ type: "text", content: "A1" }] },
            { id: "o2", label: "B", content: [{ type: "text", content: "B1" }] }
          ],
          correctAnswer: ["o2"],
          points: 0.25,
          validation: { status: "valid", warnings: [] }
        }
      ];

      const text = questionsToAzotaText(q);
      expect(text).toContain("[!b:$PHẦN I$]");
      expect(text).toContain("Câu 1. [!b:$Câu hỏi 1?$]");
      expect(text).toContain("*B. B1");
    });

    it("preserves image blocks as markdown outside [!b:$...$] tags", () => {
      const q = [
        {
          id: "q_img",
          sectionTitle: "PHẦN I",
          question: [
            { type: "text", content: "Quan sát hình sau:" },
            { type: "image", content: "data:image/png;base64,abc+123==", alt: "Hinh 1" },
          ],
          options: [
            {
              id: "o1",
              label: "A",
              content: [{ type: "image", content: "data:image/png;base64,optA==", alt: "opt" }],
            },
            { id: "o2", label: "B", content: [{ type: "text", content: "Đáp án B" }] },
          ],
          correctAnswer: ["o2"],
          points: 0.25,
          validation: { status: "valid", warnings: [] },
        },
      ];

      const text = questionsToAzotaText(q);
      expect(text).toContain("[!b:$Quan sát hình sau:$]");
      expect(text).toContain("![Hinh 1](data:image/png;base64,abc+123==)");
      expect(text).not.toContain("[!b:$data:image");
      expect(text).toContain("A. ![opt](data:image/png;base64,optA==)");
    });
  });
});
