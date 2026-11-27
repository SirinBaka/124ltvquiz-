import { describe, it, expect } from "vitest";
import {
  computeImageBoundsFromCtm,
  multiplyPdfCtm,
  shouldFilterPdfImage,
  detectTwoColumnLayout,
  buildPageElementsWithSpatialImages,
  type PdfExtractedImage,
  type PdfLayoutLine,
  type PdfLayoutTextRun,
} from "./pdfLayoutHelper";

describe("pdfLayoutHelper", () => {
  it("computes accurate bounding box from CTM including Form XObject transforms", () => {
    const formMatrix = [1, 0, 0, 1, 100, 500];
    const imgMatrix = [180, 0, 0, 120, 10, 20];
    const ctm = multiplyPdfCtm(formMatrix as [number, number, number, number, number, number], imgMatrix);
    const bounds = computeImageBoundsFromCtm(ctm);

    expect(bounds.minX).toBe(110);
    expect(bounds.maxX).toBe(290);
    expect(bounds.minY).toBe(520);
    expect(bounds.maxY).toBe(640);
    expect(bounds.width).toBe(180);
    expect(bounds.height).toBe(120);
  });

  it("filters spacer pixels and full-page watermarks while keeping normal diagrams", () => {
    const normal = computeImageBoundsFromCtm([150, 0, 0, 100, 50, 400]);
    expect(shouldFilterPdfImage(normal, 300, 200, 595, 842, true)).toBe(false);

    const tiny = computeImageBoundsFromCtm([2, 0, 0, 2, 50, 400]);
    expect(shouldFilterPdfImage(tiny, 2, 2, 595, 842, true)).toBe(true);

    const fullPageBg = computeImageBoundsFromCtm([580, 0, 0, 820, 5, 10]);
    expect(shouldFilterPdfImage(fullPageBg, 1000, 1400, 595, 842, true)).toBe(true);
  });

  it("does not misclassify 1-column exam with horizontal A/B/C/D options as 2-column", () => {
    const runs: PdfLayoutTextRun[] = [
      { str: "Câu 1. Tìm giá trị cực đại của hàm số sau trên đoạn đã cho:", x: 50, y: 750, width: 420, height: 12 },
      { str: "A. 1", x: 50, y: 730, width: 35, height: 12 },
      { str: "B. 2", x: 180, y: 730, width: 35, height: 12 },
      { str: "C. 3", x: 320, y: 730, width: 35, height: 12 },
      { str: "D. 4", x: 450, y: 730, width: 35, height: 12 },
      { str: "Câu 2. Giá trị của tích phân bằng bao nhiêu?", x: 50, y: 700, width: 380, height: 12 },
      { str: "A. 5", x: 50, y: 680, width: 35, height: 12 },
      { str: "B. 6", x: 180, y: 680, width: 35, height: 12 },
      { str: "C. 7", x: 320, y: 680, width: 35, height: 12 },
      { str: "D. 8", x: 450, y: 680, width: 35, height: 12 },
      { str: "C. 9", x: 320, y: 650, width: 35, height: 12 },
      { str: "D. 10", x: 450, y: 650, width: 35, height: 12 },
      { str: "C. 11", x: 320, y: 620, width: 35, height: 12 },
      { str: "D. 12", x: 450, y: 620, width: 35, height: 12 },
      { str: "A. 9", x: 50, y: 650, width: 35, height: 12 },
      { str: "B. 10", x: 180, y: 650, width: 35, height: 12 },
    ];
    const lines: PdfLayoutLine[] = [
      { y: 750, text: "Câu 1. Tìm giá trị cực đại của hàm số sau trên đoạn đã cho:" },
      { y: 730, text: "A. 1 B. 2 C. 3 D. 4" },
      { y: 700, text: "Câu 2. Giá trị của tích phân bằng bao nhiêu?" },
      { y: 680, text: "A. 5 B. 6 C. 7 D. 8" },
    ];

    expect(detectTwoColumnLayout(runs, lines, 595)).toBe(false);
  });

  it("anchors side-by-side diagram AFTER 'Câu 2.' even when image top edge is higher than text baseline", () => {
    const lines: PdfLayoutLine[] = [
      { y: 720, text: "Câu 1. Nội dung câu 1.", fontSize: 12 },
      { y: 680, text: "A. 1   B. 2   C. 3   D. 4", fontSize: 12 },
      { y: 600, text: "Câu 2. Cho hình vẽ bên:", fontSize: 12 },
      { y: 560, text: "A. Đúng   B. Sai", fontSize: 12 },
    ];
    // Side-by-side diagram has top edge at 610 (higher than Câu 2 baseline 600!)
    const images: PdfExtractedImage[] = [
      {
        bounds: computeImageBoundsFromCtm([140, 0, 0, 100, 350, 510]), // minY=510, maxY=610
        dataUrl: "data:image/png;base64,SIDEBYSIDE",
      },
    ];

    const md = buildPageElementsWithSpatialImages(lines, images);
    const idxQ2 = md.indexOf("Câu 2.");
    const idxImg = md.indexOf("data:image/png;base64,SIDEBYSIDE");
    const idxOpt = md.indexOf("A. Đúng");

    expect(idxQ2).toBeGreaterThan(-1);
    expect(idxImg).toBeGreaterThan(idxQ2);
    expect(idxOpt).toBeGreaterThan(idxImg);
  });

  it("pairs horizontal A/B/C/D option images cleanly to their respective option labels", () => {
    const lines: PdfLayoutLine[] = [
      { y: 700, text: "Câu 3. Đồ thị nào đúng?", fontSize: 12 },
      { y: 660, text: "A.      B.      C.      D.", fontSize: 12 },
      { y: 520, text: "Câu 4. Câu tiếp theo?", fontSize: 12 },
    ];
    const runs: PdfLayoutTextRun[] = [
      { str: "Câu 3. Đồ thị nào đúng?", x: 50, y: 700, height: 12 },
      { str: "A.", x: 60, y: 660, height: 12 },
      { str: "B.", x: 180, y: 660, height: 12 },
      { str: "C.", x: 300, y: 660, height: 12 },
      { str: "D.", x: 420, y: 660, height: 12 },
      { str: "Câu 4. Câu tiếp theo?", x: 50, y: 520, height: 12 },
    ];
    const images: PdfExtractedImage[] = [
      { bounds: computeImageBoundsFromCtm([80, 0, 0, 70, 55, 570]), dataUrl: "data:image/png;base64,IMG_A" },
      { bounds: computeImageBoundsFromCtm([80, 0, 0, 70, 175, 570]), dataUrl: "data:image/png;base64,IMG_B" },
      { bounds: computeImageBoundsFromCtm([80, 0, 0, 70, 295, 570]), dataUrl: "data:image/png;base64,IMG_C" },
      { bounds: computeImageBoundsFromCtm([80, 0, 0, 70, 415, 570]), dataUrl: "data:image/png;base64,IMG_D" },
    ];

    const md = buildPageElementsWithSpatialImages(lines, images, runs);
    expect(md).toContain("A. ![image](data:image/png;base64,IMG_A)");
    expect(md).toContain("B. ![image](data:image/png;base64,IMG_B)");
    expect(md).toContain("C. ![image](data:image/png;base64,IMG_C)");
    expect(md).toContain("D. ![image](data:image/png;base64,IMG_D)");
  });
});
