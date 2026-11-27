import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import type { Question } from "@ltvquiz/shared";
import { generateExamVariant, createSeededRng } from "./shuffleService";
import {
  renderExamHtml,
  renderMasterAnswerKeyHtml,
  generateAnswerKeyCsv,
  generateAllExamsZip,
} from "./examPdfService";

const mockQuestions: Question[] = [
  {
    id: "q1",
    type: "multiple_choice",
    sectionTitle: "PHẦN I. Trắc nghiệm",
    points: 0.25,
    question: [{ type: "text", content: "Giải phương trình $x^2 - 4 = 0$" }],
    options: [
      { id: "o1", label: "A", content: [{ type: "text", content: "x = 2" }] },
      { id: "o2", label: "B", content: [{ type: "text", content: "x = ±2" }] },
      { id: "o3", label: "C", content: [{ type: "text", content: "x = 4" }] },
      { id: "o4", label: "D", content: [{ type: "text", content: "Vô nghiệm" }] },
    ],
    correctAnswer: ["o2"],
    validation: { status: "valid", warnings: [] },
  },
  {
    id: "q2",
    type: "true_false_multiple",
    sectionTitle: "PHẦN II. Đúng/Sai",
    points: 1,
    question: [{ type: "text", content: "Phản ứng \\ce{2H2 + O2 ->[t^o] 2H2O}" }],
    options: [
      { id: "o2a", label: "a", content: [{ type: "text", content: "Là phản ứng tỏa nhiệt" }] },
      { id: "o2b", label: "b", content: [{ type: "text", content: "Không cần khơi mào" }] },
    ],
    correctAnswer: ["o2a"],
    validation: { status: "valid", warnings: [] },
  },
];

describe("examPdfService", () => {
  it("renders A4 printable HTML with exam code, KaTeX formulas, and Vietnamese text", () => {
    const variant = generateExamVariant(
      mockQuestions,
      "101",
      { shuffleQuestions: false, shuffleOptions: false },
      createSeededRng(1),
    );
    const html = renderExamHtml(variant, {
      baseName: "Đề kiểm tra Hóa",
      schoolName: "THPT Lê Quý Đôn",
      durationMinutes: 45,
      showAnswers: true,
    });

    expect(html).toContain("Mã đề: 101");
    expect(html).toContain("THPT Lê Quý Đôn");
    expect(html).toContain("Đề kiểm tra Hóa");
    expect(html).toContain("katex");
    expect(html).toContain("Đáp án Mã đề 101");
  });

  it("generates master answer key HTML and UTF-8 CSV", () => {
    const v1 = generateExamVariant(
      mockQuestions,
      "101",
      { shuffleQuestions: false, shuffleOptions: true },
      createSeededRng(10),
    );
    const v2 = generateExamVariant(
      mockQuestions,
      "102",
      { shuffleQuestions: false, shuffleOptions: true },
      createSeededRng(20),
    );

    const masterHtml = renderMasterAnswerKeyHtml([v1, v2], "Đề Toán");
    expect(masterHtml).toContain("BẢNG ĐÁP ÁN TỔNG HỢP");
    expect(masterHtml).toContain("Mã 101");
    expect(masterHtml).toContain("Mã 102");

    const csv = generateAnswerKeyCsv([v1, v2]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Mã đề 101"');
    expect(csv).toContain('"Câu 1"');
  });

  it("packages all shuffled variants and answer keys into a valid ZIP blob", async () => {
    const v1 = generateExamVariant(
      mockQuestions,
      "001",
      { shuffleQuestions: true, shuffleOptions: true },
      createSeededRng(1),
    );
    const v2 = generateExamVariant(
      mockQuestions,
      "002",
      { shuffleQuestions: true, shuffleOptions: true },
      createSeededRng(2),
    );

    const blob = await generateAllExamsZip([v1, v2], {
      baseName: "Đề Hóa 12",
      includeMasterAnswerKey: true,
      includeCsvAnswerKey: true,
      includeCombinedPrintFile: true,
    });

    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const filenames = Object.keys(zip.files);

    expect(filenames).toContain("Đề Hóa 12/Đề Hóa 12 - mã đề 001.html");
    expect(filenames).toContain("Đề Hóa 12/Đề Hóa 12 - mã đề 002.html");
    expect(filenames).toContain("Đề Hóa 12/Đề Hóa 12 - BẢNG ĐÁP ÁN.html");
    expect(filenames).toContain("Đề Hóa 12/Đề Hóa 12 - BẢNG ĐÁP ÁN.csv");
    expect(filenames).toContain("Đề Hóa 12/Đề Hóa 12 - IN TẤT CẢ (2 MÃ ĐỀ).html");
  });

  it("supports preview adjustments: fontSizePt, columnsMode, and interactiveEdit", () => {
    const v = generateExamVariant(
      mockQuestions,
      "999",
      { shuffleQuestions: false, shuffleOptions: false },
      createSeededRng(1),
    );

    const editableHtml = renderExamHtml(v, {
      baseName: "Đề Tùy Biến",
      fontSizePt: 14,
      columnsMode: "4",
      interactiveEdit: true,
      showAnswers: false,
    });

    expect(editableHtml).toContain("font-size: 14pt;");
    expect(editableHtml).toContain("cols-4");
    expect(editableHtml).toContain('contenteditable="true"');
    expect(editableHtml).toContain("data-header-field=");
    expect(editableHtml).toContain("data-q-prompt=");
    expect(editableHtml).toContain("PREVIEW_TOGGLE_CORRECT_ANSWER");
  });

  it("renders complex chemistry formulas and reactions with mhchem without errors", () => {
    const chemVariant = generateExamVariant(
      [
        {
          id: "chem_1",
          type: "multiple_choice",
          question: [
            { type: "text", content: "Cho phản ứng hóa học: $\\ce{Fe + 2HCl -> FeCl2 + H2 ^}$" },
          ],
          options: [
            { id: "o1", label: "A", content: [{ type: "text", content: "\\ce{Fe^{2+}}" }] },
            { id: "o2", label: "B", content: [{ type: "text", content: "\\ce{Fe^{3+}}" }] },
          ],
          correctAnswer: ["o1"],
          points: 0.25,
          validation: { status: "valid", warnings: [] },
        },
      ],
      "CHEM-01",
      { shuffleQuestions: false, shuffleOptions: false },
    );

    const html = renderExamHtml(chemVariant, {
      baseName: "Đề Hóa Học",
      showAnswers: true,
    });

    expect(html).toContain("katex");
    expect(html).toContain("FeCl");
    expect(html).not.toContain("Undefined control sequence: \\ce");
  });

  it("keeps question and option <img> elements outside contenteditable fields when interactiveEdit is enabled", () => {
    const imgVariant = generateExamVariant(
      [
        {
          id: "img_q",
          type: "multiple_choice",
          question: [
            { type: "text", content: "Quan sát hình:" },
            { type: "image", content: "data:image/png;base64,QIMG" },
          ],
          options: [
            { id: "o1", label: "A", content: [{ type: "text", content: "Hình A" }, { type: "image", content: "data:image/png;base64,OIMG" }] },
            { id: "o2", label: "B", content: [{ type: "text", content: "Hình B" }] },
          ],
          correctAnswer: ["o1"],
          points: 0.25,
          validation: { status: "valid", warnings: [] },
        },
      ],
      "IMG-01",
      { shuffleQuestions: false, shuffleOptions: false },
    );

    const html = renderExamHtml(imgVariant, {
      baseName: "Đề có hình",
      interactiveEdit: true,
    });

    expect(html).toContain("data:image/png;base64,QIMG");
    expect(html).toContain("data:image/png;base64,OIMG");
    // Images must not be nested inside contenteditable="true" spans where focus/textContent wipes them
    expect(html).not.toMatch(/contenteditable="true"[^>]*>[^<]*<div class="q-img-wrap">/);
  });

  it("renders mid-sentence and option images inline (.q-inline-img) while standalone figures stay block (.q-img-wrap)", () => {
    const mixedVariant = generateExamVariant(
      [
        {
          id: "inline_q",
          type: "multiple_choice",
          question: [
            { type: "text", content: "Bỏ qua lực cản không khí, tỉ số" },
            { type: "image", content: "data:image/png;base64,FRAC" },
            { type: "text", content: "bằng" },
          ],
          options: [
            { id: "o1", label: "A", content: [{ type: "image", content: "data:image/png;base64,OPT1" }, { type: "text", content: "." }] },
          ],
          correctAnswer: ["o1"],
          points: 0.25,
          validation: { status: "valid", warnings: [] },
        },
        {
          id: "block_q",
          type: "multiple_choice",
          question: [
            { type: "text", content: "Quan sát hình vẽ sau:" },
            { type: "image", content: "data:image/png;base64,FIG1" },
          ],
          options: [],
          correctAnswer: [],
          points: 0.25,
          validation: { status: "valid", warnings: [] },
        },
      ],
      "105",
      { shuffleQuestions: false, shuffleOptions: false },
    );

    const html = renderExamHtml(mixedVariant, { baseName: "Đề Lý" });
    expect(html).toContain('src="data:image/png;base64,FRAC" alt="Hình minh họa" class="q-inline-img"');
    expect(html).toContain('src="data:image/png;base64,OPT1" alt="Hình minh họa" class="q-inline-img"');
    expect(html).toContain('<div class="q-img-wrap"><img src="data:image/png;base64,FIG1"');
  });
});
