export type PdfCtm = [number, number, number, number, number, number];

export interface PdfImageBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface PdfExtractedImage {
  bounds: PdfImageBounds;
  dataUrl: string;
}

export interface PdfLayoutTextRun {
  str: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface PdfLayoutLine {
  y: number;
  text: string;
  minX?: number;
  maxX?: number;
  fontSize?: number;
}

export type PdfPageElement =
  | { kind: "line"; y: number; text: string }
  | { kind: "image"; y: number; dataUrl: string };

/**
 * Multiplies two 2D affine PDF transformation matrices [a, b, c, d, e, f].
 */
export function multiplyPdfCtm(m1: PdfCtm, m2: readonly number[]): PdfCtm {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Computes exact bounding box in PDF page user-space from the 4 corners of the unit square.
 */
export function computeImageBoundsFromCtm(ctm: PdfCtm): PdfImageBounds {
  const [a, b, c, d, e, f] = ctm;
  const xs = [e, a + e, c + e, a + c + e];
  const ys = [f, b + f, d + f, b + d + f];

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Filters out tiny spacer/rule artifacts and full-page background/watermark images.
 */
export function shouldFilterPdfImage(
  bounds: PdfImageBounds,
  pixelWidth: number,
  pixelHeight: number,
  pageWidth: number,
  pageHeight: number,
  hasTextOnPage: boolean,
): boolean {
  if (pixelWidth <= 4 || pixelHeight <= 4) return true;
  if (bounds.width <= 1 || bounds.height <= 1) return true;

  // Ignore thin horizontal/vertical decorative border lines
  const minDim = Math.min(bounds.width, bounds.height);
  const maxDim = Math.max(bounds.width, bounds.height);
  if (minDim < 3 && maxDim / Math.max(minDim, 0.1) > 25) {
    return true;
  }

  // Ignore full-page background / watermark layer when page actually contains selectable text
  if (
    hasTextOnPage &&
    pageWidth > 0 &&
    pageHeight > 0 &&
    bounds.width > pageWidth * 0.9 &&
    bounds.height > pageHeight * 0.85
  ) {
    return true;
  }

  return false;
}

const QUESTION_START_LINE_RE = /^\s*(?:Câu|Question|Bài)\s*\d+\b/i;

/**
 * Detects genuine 2-column exam layouts while avoiding false positives on 1-column
 * exams that simply lay out options A/B/C/D horizontally across the page.
 */
export function detectTwoColumnLayout(
  runs: readonly PdfLayoutTextRun[],
  fullLines: readonly PdfLayoutLine[],
  pageWidth: number,
): boolean {
  if (runs.length < 16 || pageWidth <= 0) return false;
  const midX = pageWidth / 2;

  // 1. If significant lines span across the center gutter, it is single-column
  let crossingRuns = 0;
  for (const r of runs) {
    const w =
      r.width && r.width > 0
        ? r.width
        : r.str.length * (r.height || 11) * 0.45;
    if (r.x < midX - 18 && r.x + w > midX + 18 && r.str.trim().length > 4) {
      crossingRuns++;
    }
  }
  if (crossingRuns >= 3) return false;

  const leftRuns = runs.filter((r) => r.x < midX - 15 && r.str.trim().length > 0);
  const rightRuns = runs.filter((r) => r.x > midX + 15 && r.str.trim().length > 0);
  if (leftRuns.length < 8 || rightRuns.length < 8) return false;

  // 2. Check if fullLines start questions on BOTH left and right, or if right side is mostly horizontal options (B/C/D)
  const leftText = leftRuns.map((r) => r.str).join(" ");
  const rightText = rightRuns.map((r) => r.str).join(" ");
  const hasQuestionOnLeft = /(?:Câu|Question|Bài)\s*\d+/i.test(leftText);
  const hasQuestionOnRight = /(?:Câu|Question|Bài)\s*\d+/i.test(rightText);

  if (hasQuestionOnLeft && hasQuestionOnRight) {
    return true;
  }

  // If fullLines exist that start with a question and extend past midX, or options sit on same Y
  const horizontalOptionRows = fullLines.filter((l) =>
    /\bA\s*[.):\-][\s\S]*\b[BC]\s*[.):\-]/i.test(l.text),
  );
  if (horizontalOptionRows.length >= 2) {
    return false;
  }

  return false;
}

interface OptionMarkerPos {
  label: string;
  x: number;
  y: number;
}

/**
 * Extracts spatial coordinates of option markers (A., B., C., D.) from raw PDF runs
 * so multi-column / 2x2 grid option images can be paired directly to their option label.
 */
export function extractPdfOptionMarkers(
  runs: readonly PdfLayoutTextRun[],
): OptionMarkerPos[] {
  const markers: OptionMarkerPos[] = [];
  const markerRegex = /^\s*([A-D])\s*[.):\-]\s*$/i;
  const inlineStartRegex = /^\s*([A-D])\s*[.):\-]\s+/i;

  for (const r of runs) {
    const trimmed = r.str.trim();
    if (!trimmed) continue;
    const m = markerRegex.exec(trimmed) || inlineStartRegex.exec(trimmed);
    if (m) {
      markers.push({
        label: m[1].toUpperCase(),
        x: r.x,
        y: r.y,
      });
    }
  }

  return markers;
}

interface OptionBand {
  y: number;
  markers: OptionMarkerPos[];
}

function groupOptionMarkerBands(markers: readonly OptionMarkerPos[]): OptionBand[] {
  if (markers.length < 2) return [];
  const sorted = [...markers].sort((a, b) => b.y - a.y || a.x - b.x);
  const bands: OptionBand[] = [];

  for (const m of sorted) {
    const existing = bands.find((b) => Math.abs(b.y - m.y) <= 6);
    if (existing) {
      if (!existing.markers.some((em) => em.label === m.label)) {
        existing.markers.push(m);
      }
    } else {
      bands.push({ y: m.y, markers: [m] });
    }
  }

  return bands
    .map((b) => ({
      ...b,
      markers: b.markers.sort((a, c) => a.x - c.x),
    }))
    .filter((b) => b.markers.length >= 2);
}

/**
 * Interleaves text lines and extracted PDF images into accurate reading order:
 * 1. Pairs grid/row option images (`A. [img] B. [img]`) directly to each option label.
 * 2. Anchors side-by-side diagrams right after their question prompt (never before "Câu X.").
 * 3. Orders remaining standalone images cleanly between lines.
 */
export function buildPageElementsWithSpatialImages(
  lines: readonly PdfLayoutLine[],
  images: readonly PdfExtractedImage[],
  rawRuns: readonly PdfLayoutTextRun[] = [],
): string {
  const sortedLines = [...lines].sort((a, b) => b.y - a.y);
  const remainingImages = [...images];

  // Step 1: Handle horizontal/grid option rows containing >= 2 option markers (e.g., A.  B.  C.  D.)
  const optionMarkers = extractPdfOptionMarkers(rawRuns);
  const optionBands = groupOptionMarkerBands(optionMarkers);
  const linePairedReplacements = new Map<number, string>();
  const consumedImageIndices = new Set<number>();

  for (let li = 0; li < sortedLines.length; li++) {
    const line = sortedLines[li];
    const nextLineY = li + 1 < sortedLines.length ? sortedLines[li + 1].y : -Infinity;

    // Find a multi-marker band on this line's Y
    const band = optionBands.find((b) => Math.abs(b.y - line.y) <= 6);
    if (!band) continue;

    // Check if the line text mostly consists of option labels with minimal text (e.g. "A.    B.    C.    D.")
    const strippedLabels = line.text
      .replace(/\b[A-D]\s*[.):\-]\s*/gi, "")
      .trim();
    if (strippedLabels.length > 24) continue;

    // Find images sitting inside or right below this option band before the next text line
    const candidateImgIndices: number[] = [];
    for (let ii = 0; ii < remainingImages.length; ii++) {
      if (consumedImageIndices.has(ii)) continue;
      const img = remainingImages[ii];
      const belowOrAligned = img.bounds.maxY <= line.y + 18 && img.bounds.centerY >= nextLineY - 4;
      const aboveNextLine = img.bounds.maxY > nextLineY;
      if (belowOrAligned && (nextLineY === -Infinity || aboveNextLine)) {
        candidateImgIndices.push(ii);
      }
    }

    if (candidateImgIndices.length >= 2) {
      const markerToImages = new Map<string, string[]>();
      for (const m of band.markers) {
        markerToImages.set(m.label, []);
      }

      for (const ii of candidateImgIndices) {
        const img = remainingImages[ii];
        // Pick the marker closest in horizontal X (preferring markers to the left of or centered over the image)
        let bestMarker = band.markers[0];
        let bestDist = Infinity;
        for (const m of band.markers) {
          const dist = Math.abs(img.bounds.centerX - (m.x + 35));
          if (dist < bestDist) {
            bestDist = dist;
            bestMarker = m;
          }
        }
        markerToImages.get(bestMarker.label)?.push(img.dataUrl);
        consumedImageIndices.add(ii);
      }

      const pairedLines = band.markers.map((m) => {
        const imgs = markerToImages.get(m.label) || [];
        if (imgs.length === 0) return `${m.label}.`;
        return `${m.label}. ${imgs.map((u) => `![image](${u})`).join(" ")}`;
      });
      linePairedReplacements.set(li, pairedLines.join("\n"));
    }
  }

  // Step 2: Anchor remaining images using smart vertical/side-by-side rules
  type OrderedItem = { y: number; order: number; text?: string; image?: string };
  const items: OrderedItem[] = [];

  for (let li = 0; li < sortedLines.length; li++) {
    const line = sortedLines[li];
    const replacement = linePairedReplacements.get(li);
    items.push({
      y: line.y,
      order: 0,
      text: replacement !== undefined ? replacement : line.text,
    });
  }

  for (let ii = 0; ii < remainingImages.length; ii++) {
    if (consumedImageIndices.has(ii)) continue;
    const img = remainingImages[ii];
    let anchorY = img.bounds.maxY;

    // Check if this image sits beside a question-start line or overlaps a line vertically.
    // Because PDF text Y is the baseline while image maxY is the top edge, a side-by-side
    // diagram aligned with "Câu X." often has maxY slightly higher than line.y.
    let matchedQuestionLine: PdfLayoutLine | null = null;
    let matchedOverlappingLine: PdfLayoutLine | null = null;

    for (const line of sortedLines) {
      const lineHeight = line.fontSize || 12;
      const topOverlap = img.bounds.maxY >= line.y - 6 && img.bounds.maxY <= line.y + lineHeight + 8;
      const verticalSpanOverlap =
        img.bounds.minY <= line.y + 4 && img.bounds.maxY >= line.y - lineHeight;

      if (QUESTION_START_LINE_RE.test(line.text) && (topOverlap || verticalSpanOverlap)) {
        matchedQuestionLine = line;
        break;
      }
      if (!matchedOverlappingLine && topOverlap && img.bounds.centerY <= line.y + 4) {
        matchedOverlappingLine = line;
      }
    }

    if (matchedQuestionLine) {
      anchorY = matchedQuestionLine.y - 0.5;
    } else if (matchedOverlappingLine) {
      anchorY = matchedOverlappingLine.y - 0.5;
    }

    items.push({
      y: anchorY,
      order: 1,
      image: img.dataUrl,
    });
  }

  items.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 0.01) return b.y - a.y;
    return a.order - b.order;
  });

  let pageMarkdown = "";
  let prevY: number | null = null;
  for (const el of items) {
    if (el.text !== undefined) {
      if (prevY !== null && Math.abs(prevY - el.y) > 24) {
        pageMarkdown += "\n";
      }
      pageMarkdown += el.text + "\n";
      prevY = el.y;
    } else if (el.image !== undefined) {
      pageMarkdown += `\n![image](${el.image})\n`;
      prevY = el.y;
    }
  }

  return pageMarkdown;
}
