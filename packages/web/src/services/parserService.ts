import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import JSZip from "jszip";
import type { Question } from "@ltvquiz/shared";
import { AdvancedDocumentParser } from "@ltvquiz/shared";
import {
  preprocessDocxXml,
  cleanExtractedDocxMarkdown,
  normalizePdfExtractedText,
  toUnicodeSubscript,
  toUnicodeSuperscript,
} from "./docxFormatHelper";
import {
  buildPageElementsWithSpatialImages,
  computeImageBoundsFromCtm,
  detectTwoColumnLayout,
  multiplyPdfCtm,
  shouldFilterPdfImage,
  type PdfCtm,
  type PdfExtractedImage,
} from "./pdfLayoutHelper";
import {
  convertWmfOrEmfBase64ToPngDataUrl,
  decodeBase64ToBytes,
  detectMetafileFormat,
} from "./wmfEmfConverter";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ParseResult = {
  questions: Question[];
  warnings: number;
  errors: number;
};

export const yieldToMain = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });
};

export const resolvePdfImage = async (
  page: any,
  objId: string,
  timeoutMs = 300,
): Promise<any> => {
  try {
    if (page?.objs?.has?.(objId)) {
      return page.objs.get(objId);
    }
    if (page?.commonObjs?.has?.(objId)) {
      return page.commonObjs.get(objId);
    }
  } catch {
    // Proceed to fallback
  }

  return new Promise<any>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    const onData = (data: any) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(data);
      }
    };

    try {
      if (objId.startsWith("g_") && page?.commonObjs?.get) {
        page.commonObjs.get(objId, onData);
      } else if (page?.objs?.get) {
        page.objs.get(objId, onData);
      } else {
        clearTimeout(timer);
        resolve(null);
      }
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
};

/**
 * Converts pdf.js decoded image buffers (RGBA 32bpp, RGB 24bpp, Grayscale 8bpp/1bpp)
 * into a standard 4-channel RGBA buffer accepted by browser ImageData.
 */
export const normalizePdfImageDataToRgba = (
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  kind?: number,
): Uint8ClampedArray<ArrayBuffer> | null => {
  const pixelCount = width * height;
  if (!data || pixelCount <= 0) return null;

  // RGBA (32 bpp)
  if (data.length === pixelCount * 4) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    rgba.set(data);
    return rgba;
  }

  // RGB (24 bpp) — most JPEG / RGB PDF XObjects
  if (data.length === pixelCount * 3 || kind === 2) {
    if (data.length < pixelCount * 3) return null;
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0, j = 0; i < pixelCount; i++, j += 3) {
      const out = i * 4;
      rgba[out] = data[j];
      rgba[out + 1] = data[j + 1];
      rgba[out + 2] = data[j + 2];
      rgba[out + 3] = 255;
    }
    return rgba;
  }

  // Grayscale (8 bpp)
  if (data.length === pixelCount) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      const out = i * 4;
      const v = data[i];
      rgba[out] = v;
      rgba[out + 1] = v;
      rgba[out + 2] = v;
      rgba[out + 3] = 255;
    }
    return rgba;
  }

  // Grayscale / Monochrome Mask (1 bpp, MSB-first, byte-aligned rows)
  const bytesPerRow = Math.ceil(width / 8);
  if (kind === 1 || data.length === bytesPerRow * height) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let y = 0; y < height; y++) {
      const rowOffset = y * bytesPerRow;
      for (let x = 0; x < width; x++) {
        const byte = data[rowOffset + (x >> 3)] ?? 0;
        const bit = (byte >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0;
        const out = (y * width + x) * 4;
        rgba[out] = v;
        rgba[out + 1] = v;
        rgba[out + 2] = v;
        rgba[out + 3] = 255;
      }
    }
    return rgba;
  }

  return null;
};

export const convertPdfImageToDataUrl = (img: any): string | null => {
  if (!img) return null;

  const bitmap =
    typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap
      ? img
      : typeof ImageBitmap !== "undefined" && img?.bitmap instanceof ImageBitmap
        ? img.bitmap
        : null;

  const width = bitmap?.width ?? img?.width;
  const height = bitmap?.height ?? img?.height;

  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const MAX_DIMENSION = 1200;
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const ratio = Math.min(
      MAX_DIMENSION / targetWidth,
      MAX_DIMENSION / targetHeight,
    );
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Composite transparent figures onto white so JPEG never renders black backgrounds
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    if (bitmap) {
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    } else if (img.data) {
      const rgba = normalizePdfImageDataToRgba(
        img.data,
        width,
        height,
        img.kind,
      );
      if (!rgba) return null;

      const offCanvas = document.createElement("canvas");
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext("2d");
      if (!offCtx) return null;

      const offImgData = new ImageData(rgba, width, height);
      offCtx.putImageData(offImgData, 0, 0);
      ctx.drawImage(offCanvas, 0, 0, targetWidth, targetHeight);
    } else {
      return null;
    }

    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  }
};

export interface PdfTextRun {
  str: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Reconstructs visual lines from pdf.js text runs while preserving sub/superscripts
 * and avoiding spurious spaces inside formulas, intervals, and words.
 */
export function groupPdfTextItemsIntoLines(
  items: PdfTextRun[],
): Array<{ y: number; text: string }> {
  type PositionedRun = PdfTextRun & { fontSize: number };
  type TextLine = {
    y: number;
    baseFontSize: number;
    items: PositionedRun[];
  };

  const runs: PositionedRun[] = items
    .filter((it) => it.str.length > 0)
    .map((it) => ({
      ...it,
      fontSize: it.height && it.height > 0 ? it.height : 11,
    }));

  // Sort normal-sized runs first to establish stable baseline lines before attaching sub/superscripts
  const sortedRuns = [...runs].sort((a, b) => {
    const aIsNormal = a.fontSize >= 9.5 ? 1 : 0;
    const bIsNormal = b.fontSize >= 9.5 ? 1 : 0;
    if (bIsNormal !== aIsNormal) return bIsNormal - aIsNormal;
    if (Math.abs(b.y - a.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const colLines: TextLine[] = [];
  const BASELINE_Y_TOLERANCE = 3.5;

  for (const item of sortedRuns) {
    let foundLine = colLines.find(
      (l) => Math.abs(l.y - item.y) <= BASELINE_Y_TOLERANCE,
    );

    // Check if smaller run is a superscript/subscript shifted relative to an existing baseline
    if (!foundLine) {
      foundLine = colLines.find((l) => {
        const dy = item.y - l.y;
        const isSmaller = item.fontSize <= l.baseFontSize * 0.85;
        const maxOffset = Math.max(6.5, l.baseFontSize * 0.78);
        if (!isSmaller || Math.abs(dy) > maxOffset) return false;
        return l.items.some(
          (existing) =>
            item.x >= existing.x - 4 &&
            item.x <= existing.x + (existing.width || existing.str.length * l.baseFontSize * 0.5) + l.baseFontSize * 1.5,
        );
      });
    }

    if (foundLine) {
      foundLine.items.push(item);
      if (item.fontSize > foundLine.baseFontSize) {
        foundLine.baseFontSize = item.fontSize;
        foundLine.y = item.y;
      }
    } else {
      colLines.push({
        y: item.y,
        baseFontSize: item.fontSize,
        items: [item],
      });
    }
  }

  colLines.sort((a, b) => b.y - a.y);

  return colLines
    .map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      let lineText = "";
      let prevEndX = 0;

      for (let idx = 0; idx < line.items.length; idx++) {
        const it = line.items[idx];
        let segment = normalizePdfExtractedText(it.str);
        const dy = it.y - line.y;
        const isSmaller = it.fontSize <= line.baseFontSize * 0.85;

        if (isSmaller && Math.abs(dy) >= 1.4 && segment.trim().length > 0) {
          const trimmedSeg = segment.trim();
          if (dy > 0) {
            segment =
              toUnicodeSuperscript(trimmedSeg) ?? `<sup>${trimmedSeg}</sup>`;
          } else {
            segment =
              toUnicodeSubscript(trimmedSeg) ?? `<sub>${trimmedSeg}</sub>`;
          }
        }

        if (idx === 0) {
          lineText += segment;
        } else {
          const gap = it.x - prevEndX;
          const isSupOrSub =
            isSmaller && Math.abs(dy) >= 1.4;
          const spaceThreshold = line.baseFontSize * 0.18;

          if (
            !isSupOrSub &&
            gap > spaceThreshold &&
            !lineText.endsWith(" ") &&
            !segment.startsWith(" ")
          ) {
            lineText += " " + segment;
          } else {
            lineText += segment;
          }
        }

        const estWidth =
          it.width && it.width > 0
            ? it.width
            : it.str.length * it.fontSize * 0.45;
        prevEndX = Math.max(prevEndX, it.x + estWidth);
      }

      return { y: line.y, text: lineText.trim() };
    })
    .filter((l) => l.text.length > 0);
}

export async function parseDocument(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<ParseResult> {
  onProgress?.("Đang đọc tài liệu...");
  await yieldToMain();

  let text = "";
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    text = (await file.text()).normalize("NFC");
  } else if (ext === "docx") {
    let arrayBuffer = await file.arrayBuffer();
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (docXmlFile) {
        const xml = await docXmlFile.async("text");
        const modifiedXml = preprocessDocxXml(xml);
        if (modifiedXml !== xml) {
          zip.file("word/document.xml", modifiedXml);
          arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
        }
      }
    } catch (e) {
      console.warn("Could not pre-process DOCX XML for styling", e);
    }

    // Map pure alphanumeric tokens so Mammoth's markdown escaper cannot corrupt base64 (+) or alt text
    const docxImageMap = new Map<string, string>();
    const options = {
      convertImage: (mammoth as any).images?.imgElement((image: any) => {
        return image.read("base64").then((imageBuffer: string) => {
          const mime = (image.contentType || "image/png").toLowerCase();
          const token = `LTVQUIZIMG${docxImageMap.size}END`;
          const isMetafileMime =
            mime.includes("wmf") ||
            mime.includes("emf") ||
            mime === "application/octet-stream";

          let dataUrl: string | null = null;
          if (isMetafileMime || detectMetafileFormat(decodeBase64ToBytes(imageBuffer)) !== "unknown") {
            dataUrl = convertWmfOrEmfBase64ToPngDataUrl(imageBuffer);
          }
          if (!dataUrl) {
            dataUrl = `data:${mime};base64,${imageBuffer}`;
          }

          docxImageMap.set(token, dataUrl);
          const safeAlt =
            typeof image.altText === "string"
              ? image.altText.replace(/[\r\n[\]()\\"`*_]+/g, " ").trim()
              : "image";
          return {
            src: token,
            alt: safeAlt || "image",
          };
        });
      }),
    };
    const nodeBuffer =
      typeof window === "undefined" ? (globalThis as any).Buffer : undefined;
    const mammothInput = nodeBuffer
      ? { buffer: nodeBuffer.from(arrayBuffer) }
      : { arrayBuffer };
    const result = await (mammoth as any).convertToMarkdown(
      mammothInput,
      options,
    );
    text = cleanExtractedDocxMarkdown(result.value);
    for (const [token, dataUrl] of docxImageMap.entries()) {
      text = text.split(token).join(dataUrl);
    }
  } else if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        onProgress?.(`Đang đọc trang ${i}/${pdf.numPages}...`);
        await yieldToMain();

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const rawTextItems: PdfTextRun[] = [];
        for (const item of content.items as any[]) {
          if ("str" in item && typeof item.str === "string") {
            const scaleHeight = Math.hypot(
              item.transform?.[2] || 0,
              item.transform?.[3] || 0,
            );
            rawTextItems.push({
              str: item.str,
              x: item.transform[4],
              y: item.transform[5],
              width: typeof item.width === "number" ? item.width : undefined,
              height:
                scaleHeight > 0
                  ? scaleHeight
                  : typeof item.height === "number"
                    ? item.height
                    : undefined,
            });
          }
        }

        const midX = viewport.width / 2;
        const fullLines = groupPdfTextItemsIntoLines(rawTextItems);
        const isTwoColumn = detectTwoColumnLayout(
          rawTextItems,
          fullLines,
          viewport.width,
        );

        let leftLines: Array<{ y: number; text: string }> = [];
        let rightLines: Array<{ y: number; text: string }> = [];
        let renderedLines: Array<{ y: number; text: string }> = [];

        if (isTwoColumn) {
          const leftItems = rawTextItems.filter((it) => it.x < midX);
          const rightItems = rawTextItems.filter((it) => it.x >= midX);
          leftLines = groupPdfTextItemsIntoLines(leftItems);
          rightLines = groupPdfTextItemsIntoLines(rightItems);
          renderedLines = [...leftLines, ...rightLines];
        } else {
          renderedLines = fullLines;
        }

        const images: PdfExtractedImage[] = [];
        const hasTextOnPage = renderedLines.length > 0;
        try {
          const ops = await page.getOperatorList();
          const OPS = pdfjsLib.OPS as any;
          let ctm: PdfCtm = [1, 0, 0, 1, 0, 0];
          const ctmStack: PdfCtm[] = [];

          const recordImageWithCtm = (img: any, targetCtm: PdfCtm) => {
            if (!img) return;
            const w = img?.bitmap?.width ?? img?.width ?? 0;
            const h = img?.bitmap?.height ?? img?.height ?? 0;
            const bounds = computeImageBoundsFromCtm(targetCtm);
            if (
              shouldFilterPdfImage(
                bounds,
                w,
                h,
                viewport.width,
                viewport.height,
                hasTextOnPage,
              )
            ) {
              return;
            }
            const dataUrl = convertPdfImageToDataUrl(img);
            if (dataUrl) {
              images.push({ bounds, dataUrl });
            }
          };

          for (let j = 0; j < ops.fnArray.length; j++) {
            const fn = ops.fnArray[j];
            const args = ops.argsArray[j];

            if (fn === OPS.save || fn === OPS.beginGroup) {
              ctmStack.push([...ctm] as PdfCtm);
            } else if (
              fn === OPS.restore ||
              fn === OPS.endGroup ||
              fn === OPS.paintFormXObjectEnd
            ) {
              ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
            } else if (fn === OPS.paintFormXObjectBegin) {
              ctmStack.push([...ctm] as PdfCtm);
              const matrix = args?.[0];
              if (Array.isArray(matrix) && matrix.length >= 6) {
                ctm = multiplyPdfCtm(ctm, matrix);
              }
            } else if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
              ctm = multiplyPdfCtm(ctm, args);
            } else if (
              fn === OPS.paintImageXObjectRepeat &&
              typeof args?.[0] === "string" &&
              Array.isArray(args?.[3])
            ) {
              const img = await resolvePdfImage(page, args[0], 300);
              const scaleX = typeof args[1] === "number" ? args[1] : 1;
              const scaleY = typeof args[2] === "number" ? args[2] : 1;
              const positions = args[3] as number[];
              for (let p = 0; p + 1 < positions.length; p += 2) {
                const repCtm = multiplyPdfCtm(ctm, [
                  scaleX,
                  0,
                  0,
                  scaleY,
                  positions[p],
                  positions[p + 1],
                ]);
                recordImageWithCtm(img, repCtm);
              }
            } else if (
              fn === OPS.paintImageXObject ||
              (OPS.paintJpegXObject !== undefined && fn === OPS.paintJpegXObject) ||
              fn === OPS.paintInlineImageXObject ||
              fn === OPS.paintImageMaskXObject
            ) {
              const arg0 = args?.[0];
              let img: any = null;
              if (typeof arg0 === "string") {
                img = await resolvePdfImage(page, arg0, 300);
              } else if (arg0 && typeof arg0 === "object") {
                if (typeof arg0.data === "string") {
                  const resolved = await resolvePdfImage(page, arg0.data, 300);
                  img = resolved || arg0;
                } else {
                  img = arg0;
                }
              }
              recordImageWithCtm(img, ctm);
            }
          }
        } catch (e) {
          console.warn("Could not extract images from PDF page", i, e);
        }

        const pageMarkdown = isTwoColumn
          ? buildPageElementsWithSpatialImages(
              leftLines,
              images.filter((im) => im.bounds.centerX < midX),
              rawTextItems.filter((it) => it.x < midX),
            ) +
            "\n" +
            buildPageElementsWithSpatialImages(
              rightLines,
              images.filter((im) => im.bounds.centerX >= midX),
              rawTextItems.filter((it) => it.x >= midX),
            )
          : buildPageElementsWithSpatialImages(
              renderedLines,
              images,
              rawTextItems,
            );

        fullText += pageMarkdown + "\n";
        page.cleanup?.();
        await yieldToMain();
      }
    } finally {
      pdf.cleanup?.();
      (pdf as any).loadingTask?.destroy?.();
    }
    text = fullText;
  } else {
    throw new Error("Định dạng không được hỗ trợ");
  }

  onProgress?.("Đang trích xuất nội dung...");
  await yieldToMain();
  return extractQuestionsFromText(text);
}

function extractQuestionsFromText(text: string): ParseResult {
  const parser = new AdvancedDocumentParser({});
  const questions = parser.parse(text);

  if (questions.length === 0 && text.trim().length > 0) {
    questions.push({
      id: "q_" + Math.random().toString(36).substr(2, 6),
      type: "multiple_choice",
      points: 0.25,
      question: [{ type: "text", content: text.substring(0, 1000) }],
      options: [
        { id: "opt_1", label: "A", content: [{ type: "text", content: "" }] },
        { id: "opt_2", label: "B", content: [{ type: "text", content: "" }] },
        { id: "opt_3", label: "C", content: [{ type: "text", content: "" }] },
        { id: "opt_4", label: "D", content: [{ type: "text", content: "" }] },
      ],
      correctAnswer: [],
      validation: {
        status: "warning",
        warnings: [
          "Không nhận diện được cấu trúc câu hỏi. Đã tạo câu hỏi tạm thời.",
        ],
      },
    });
  }

  const result: ParseResult = {
    questions,
    warnings: questions.filter((q) => q.validation.status === "warning").length,
    errors: questions.filter((q) => q.validation.status === "error").length,
  };

  return result;
}
