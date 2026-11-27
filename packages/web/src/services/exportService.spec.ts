import { describe, it, expect } from "vitest";
import type { Question } from "@ltvquiz/shared";
import JSZip from "jszip";
import {
  generateMarkdown,
  generateOfflineHtml,
  generateDocxBlob,
  generatePptxBlob,
} from "./exportService";

const mockQuestions: Question[] = [
  {
    id: "q1",
    type: "multiple_choice",
    points: 0.25,
    question: [
      { type: "text", content: "Câu hỏi kiểm tra 1: Khí nào nhẹ nhất?" },
    ],
    options: [
      {
        id: "opt1",
        label: "A",
        content: [{ type: "text", content: "Khí Hydro (H2)" }],
      },
      {
        id: "opt2",
        label: "B",
        content: [{ type: "text", content: "Khí Oxy (O2)" }],
      },
      {
        id: "opt3",
        label: "C",
        content: [{ type: "text", content: "Khí Nitơ (N2)" }],
      },
      {
        id: "opt4",
        label: "D",
        content: [{ type: "text", content: "Khí CO2" }],
      },
    ],
    correctAnswer: ["opt1"],
    validation: { status: "valid", warnings: [] },
  },
  {
    id: "q2",
    type: "true_false_multiple",
    points: 0.5,
    question: [
      { type: "text", content: "Câu hỏi kiểm tra 2: Mệnh đề đúng sai" },
    ],
    options: [
      {
        id: "opt2a",
        label: "a",
        content: [{ type: "text", content: "Nước sôi ở 100 độ C" }],
      },
      {
        id: "opt2b",
        label: "b",
        content: [
          { type: "text", content: "Nước đá có thể tích nhỏ hơn nước lỏng" },
        ],
      },
    ],
    correctAnswer: ["opt2a"],
    validation: { status: "valid", warnings: [] },
  },
];

describe("generateMarkdown", () => {
  it("generates clean markdown with title, questions and answer key", () => {
    const md = generateMarkdown("Đề thi thử", mockQuestions);
    expect(md).toContain("# Đề thi thử");
    expect(md).toContain("### Câu 1: Câu hỏi kiểm tra 1: Khí nào nhẹ nhất?");
    expect(md).toContain("- **A.** Khí Hydro (H2)");
    expect(md).toContain("- **B.** Khí Oxy (O2)");
    expect(md).toContain("## BẢNG ĐÁP ÁN");
    expect(md).toContain("- **Câu 1:** A");
  });

  it("generates markdown with fallback text when questions list is empty", () => {
    const md = generateMarkdown("Văn bản mẫu", [], "<p>Nội dung đoạn văn</p>");
    expect(md).toContain("# Văn bản mẫu");
    expect(md).toContain("Nội dung đoạn văn");
  });
});

describe("generateOfflineHtml", () => {
  it("generates standalone self-contained offline HTML", () => {
    const html = generateOfflineHtml("Đề thi thử", mockQuestions);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Đề thi thử");
    expect(html).toContain("Chế độ ngoại tuyến (Offline)");
    expect(html).toContain("Khí nào nhẹ nhất?");
    expect(html).toContain("opt1");
  });
});

describe("generateDocxBlob", () => {
  it("generates a valid DOCX zip containing word/document.xml", async () => {
    const blob = await generateDocxBlob("Đề thi thử", mockQuestions);
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    expect(zip.file("word/document.xml")).not.toBeNull();
    const docXml = await zip.file("word/document.xml")!.async("text");
    expect(docXml).toContain("Khí nào nhẹ nhất?");
    expect(docXml).toContain("Khí Hydro (H2)");
  });

  it("generates DOCX with fallback text when questions list is empty", async () => {
    const blob = await generateDocxBlob(
      "Tài liệu chữ",
      [],
      "Đoạn văn bản bài giảng",
    );
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file("word/document.xml")!.async("text");
    expect(docXml).toContain("Đoạn văn bản bài giảng");
  });

  it("embeds base64 question and option images into word/media inside generated DOCX", async () => {
    const samplePng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const withImg: Question[] = [
      {
        id: "qi",
        type: "multiple_choice",
        points: 0.25,
        question: [
          { type: "text", content: "Quan sát hình:" },
          { type: "image", content: `data:image/png;base64,${samplePng}` },
        ],
        options: [
          {
            id: "oi1",
            label: "A",
            content: [{ type: "image", content: `data:image/png;base64,${samplePng}` }],
          },
        ],
        correctAnswer: ["oi1"],
        validation: { status: "valid", warnings: [] },
      },
    ];

    const blob = await generateDocxBlob("Đề có hình", withImg);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(zip.file("word/media/image1.png")).not.toBeNull();
    expect(zip.file("word/media/image2.png")).not.toBeNull();
    const rels = await zip.file("word/_rels/document.xml.rels")!.async("text");
    expect(rels).toContain("media/image1.png");
    const docXml = await zip.file("word/document.xml")!.async("text");
    expect(docXml).toContain("<w:drawing>");
  });
});

describe("generatePptxBlob", () => {
  it("generates a valid PPTX zip containing slides for title and questions", async () => {
    const blob = await generatePptxBlob("Đề thi thử", mockQuestions);
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    expect(zip.file("ppt/presentation.xml")).not.toBeNull();
    expect(zip.file("ppt/slides/slide1.xml")).not.toBeNull(); // Title slide
    expect(zip.file("ppt/slides/slide2.xml")).not.toBeNull(); // Question 1
    expect(zip.file("ppt/slides/slide3.xml")).not.toBeNull(); // Question 2

    const slide2Xml = await zip.file("ppt/slides/slide2.xml")!.async("text");
    expect(slide2Xml).toContain("Khí nào nhẹ nhất?");
    expect(slide2Xml).toContain("Khí Hydro (H2)");
  });
});
