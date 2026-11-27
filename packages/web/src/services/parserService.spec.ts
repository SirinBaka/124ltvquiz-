import { describe, it, expect, vi } from "vitest";
import JSZip from "jszip";
import {
  resolvePdfImage,
  convertPdfImageToDataUrl,
  normalizePdfImageDataToRgba,
  groupPdfTextItemsIntoLines,
  parseDocument,
  yieldToMain,
} from "./parserService";

describe("yieldToMain", () => {
  it("resolves asynchronously allowing event loop tick", async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 0);
    await yieldToMain();
    expect(flag).toBe(true);
  });
});

describe("resolvePdfImage", () => {
  it("returns immediately if page.objs has the object", async () => {
    const mockPage = {
      objs: {
        has: vi.fn().mockReturnValue(true),
        get: vi.fn().mockReturnValue({
          width: 100,
          height: 100,
          data: new Uint8Array([1, 2, 3, 4]),
        }),
      },
    };

    const res = await resolvePdfImage(mockPage, "img_1", 300);
    expect(res).toEqual({
      width: 100,
      height: 100,
      data: new Uint8Array([1, 2, 3, 4]),
    });
    expect(mockPage.objs.has).toHaveBeenCalledWith("img_1");
  });

  it("checks commonObjs if objId starts with g_", async () => {
    const mockPage = {
      objs: {
        has: vi.fn().mockReturnValue(false),
      },
      commonObjs: {
        has: vi.fn().mockReturnValue(true),
        get: vi.fn().mockReturnValue({
          width: 50,
          height: 50,
          data: new Uint8Array([5, 6, 7, 8]),
        }),
      },
    };

    const res = await resolvePdfImage(mockPage, "g_img_2", 300);
    expect(res).toEqual({
      width: 50,
      height: 50,
      data: new Uint8Array([5, 6, 7, 8]),
    });
  });

  it("resolves to null when timeout expires and callback never fires (preventing freeze)", async () => {
    const mockPage = {
      objs: {
        has: vi.fn().mockReturnValue(false),
        get: vi.fn(), // Does not invoke callback
      },
    };

    const startTime = Date.now();
    const res = await resolvePdfImage(mockPage, "img_hanging", 50);
    const duration = Date.now() - startTime;

    expect(res).toBeNull();
    expect(duration).toBeGreaterThanOrEqual(45);
  });

  it("resolves data when callback fires before timeout", async () => {
    const expectedData = {
      width: 80,
      height: 80,
      data: new Uint8Array([9, 10]),
    };
    const mockPage = {
      objs: {
        has: vi.fn().mockReturnValue(false),
        get: vi.fn((_id: string, cb: (data: any) => void) => {
          setTimeout(() => cb(expectedData), 20);
        }),
      },
    };

    const res = await resolvePdfImage(mockPage, "img_async", 200);
    expect(res).toEqual(expectedData);
  });
});

describe("convertPdfImageToDataUrl", () => {
  it("returns null for null or invalid image input", () => {
    expect(convertPdfImageToDataUrl(null)).toBeNull();
    expect(convertPdfImageToDataUrl({})).toBeNull();
    expect(convertPdfImageToDataUrl({ width: 0, height: 0 })).toBeNull();
  });
});

describe("normalizePdfImageDataToRgba", () => {
  it("expands 24bpp RGB pdf image data to 32bpp RGBA", () => {
    const rgb = new Uint8Array([10, 20, 30, 200, 150, 100]); // 2x1 RGB
    const rgba = normalizePdfImageDataToRgba(rgb, 2, 1, 2);
    expect(rgba).not.toBeNull();
    expect(Array.from(rgba!)).toEqual([10, 20, 30, 255, 200, 150, 100, 255]);
  });

  it("expands 8bpp grayscale and 1bpp monochrome pdf image data to RGBA", () => {
    const gray8 = new Uint8Array([50, 180]); // 2x1 grayscale
    expect(Array.from(normalizePdfImageDataToRgba(gray8, 2, 1)!)).toEqual([
      50, 50, 50, 255, 180, 180, 180, 255,
    ]);

    const mono1 = new Uint8Array([0b10000000]); // 2x1 1bpp (first pixel white, second black)
    expect(Array.from(normalizePdfImageDataToRgba(mono1, 2, 1, 1)!)).toEqual([
      255, 255, 255, 255, 0, 0, 0, 255,
    ]);
  });
});

describe("parseDocument docx image extraction", () => {
  it("extracts docx base64 images cleanly without corrupting + characters or multiline alt", async () => {
    // 1x1 PNG base64 containing '+'
    const sampleBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    zip.file(
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    );
    zip.file(
      "word/_rels/document.xml.rels",
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>',
    );
    zip.file("word/media/image1.png", sampleBase64, { base64: true });
    const drawXml =
      '<w:drawing><wp:inline><wp:docPr id="1" name="Picture 1" descr="Line 1&#10;Line 2"/><a:graphic><a:graphicData uri="u"><pic:pic><pic:blipFill><a:blip r:embed="rIdImg1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
    const optsXml =
      '<w:p><w:r><w:t>A. Ph\u01b0\u01a1ng \u00e1n A</w:t></w:r></w:p><w:p><w:r><w:t>*B. Ph\u01b0\u01a1ng \u00e1n B</w:t></w:r></w:p><w:p><w:r><w:t>C. Ph\u01b0\u01a1ng \u00e1n C</w:t></w:r></w:p><w:p><w:r><w:t>D. Ph\u01b0\u01a1ng \u00e1n D</w:t></w:r></w:p>';
    zip.file(
      "word/document.xml",
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body><w:p><w:r><w:t>C\u00e2u 1. Quan s\u00e1t h\u00ecnh sau:</w:t></w:r></w:p><w:p><w:r>${drawXml}</w:r></w:p>${optsXml}</w:body></w:document>`,
    );

    const arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const file = new File([arrayBuffer], "test-image.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const res = await parseDocument(file);
    expect(res.questions).toHaveLength(1);
    const imgBlock = res.questions[0].question.find((b) => b.type === "image");
    expect(imgBlock).toBeDefined();
    expect(imgBlock?.content).toBe(`data:image/png;base64,${sampleBase64}`);
    expect(imgBlock?.content).not.toContain("\\+");
  });

  it("preserves Word OMML equations, subscripts, superscripts, and math operators cleanly", async () => {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    );
    zip.file(
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    );
    zip.file(
      "word/document.xml",
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p><w:r><w:t>C\u00e2u 1. Ph\u1ea3n \u1ee9ng H</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t>SO</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>4</w:t></w:r><w:r><w:t> v\u00e0 gi\u00e1 tr\u1ecb </w:t></w:r><m:oMath><m:f><m:num><m:r><w:t>a</m:t></w:r></m:num><m:den><m:r><m:t>b</m:t></w:r></m:den></m:f></m:oMath><w:r><w:t> tr\u00ean (-&#x221E;; +&#x221E;):</w:t></w:r></w:p><w:p><w:r><w:t>A. [0; 1]</w:t></w:r></w:p><w:p><w:r><w:t>*B. x</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:t> + 1</w:t></w:r></w:p><w:p><w:r><w:t>C. 0</w:t></w:r></w:p><w:p><w:r><w:t>D. 1</w:t></w:r></w:p></w:body></w:document>`,
    );

    const ab = await zip.generateAsync({ type: "arraybuffer" });
    const file = new File([ab], "symbols.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const res = await parseDocument(file);
    expect(res.questions).toHaveLength(1);
    const qText = res.questions[0].question[0].content;
    expect(qText).toContain("H₂SO₄");
    expect(qText).toContain("$\\frac{a}{b}$");
    expect(qText).toContain("(-∞; +∞)");
    expect(qText).not.toContain("\\+");
    expect(qText).not.toContain("\\(");

    expect(res.questions[0].options[0].content[0].content).toBe("[0; 1]");
    expect(res.questions[0].options[1].content[0].content).toBe("x² + 1");
  });
});

describe("groupPdfTextItemsIntoLines", () => {
  it("merges adjacent PDF runs cleanly without extra spaces and preserves sub/superscripts", () => {
    const lines = groupPdfTextItemsIntoLines([
      { str: "H", x: 50, y: 700, width: 8, height: 12 },
      { str: "2", x: 58, y: 697, width: 5, height: 8 },
      { str: "SO", x: 63, y: 700, width: 16, height: 12 },
      { str: "4", x: 79, y: 697, width: 5, height: 8 },
      { str: "và", x: 92, y: 700, width: 12, height: 12 },
      { str: "x", x: 112, y: 700, width: 6, height: 12 },
      { str: "2", x: 118, y: 704.5, width: 5, height: 8 },
      { str: "+ 1", x: 126, y: 700, width: 16, height: 12 },
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("H₂SO₄ và x² + 1");
  });
});
