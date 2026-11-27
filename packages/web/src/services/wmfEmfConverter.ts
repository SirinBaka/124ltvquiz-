/**
 * Pure TypeScript Windows Metafile (WMF) and Enhanced Metafile (EMF) parser
 * and HTML5 Canvas rasterizer. Converts MathType, Word, ChemDraw, and legacy
 * WMF/EMF graphics embedded in .docx files into browser-compatible PNG data URLs.
 */

export type MetafileFormat = "wmf" | "emf" | "unknown";

interface Point {
  x: number;
  y: number;
}

interface PenObj {
  kind: "pen";
  style: number;
  width: number;
  color: string;
}

interface BrushObj {
  kind: "brush";
  style: number;
  color: string;
}

interface FontObj {
  kind: "font";
  height: number;
  weight: number;
  italic: boolean;
  underline: boolean;
  faceName: string;
  charSet: number;
}

type GdiObject = PenObj | BrushObj | FontObj | { kind: "other" };

export interface MetafileBounds {
  width: number;
  height: number;
  winOrgX: number;
  winOrgY: number;
  winExtX: number;
  winExtY: number;
}

const DEFAULT_PEN: PenObj = { kind: "pen", style: 0, width: 1, color: "#000000" };
const DEFAULT_BRUSH: BrushObj = { kind: "brush", style: 0, color: "#ffffff" };
const NULL_BRUSH: BrushObj = { kind: "brush", style: 1, color: "transparent" };
const NULL_PEN: PenObj = { kind: "pen", style: 5, width: 0, color: "transparent" };
const DEFAULT_FONT: FontObj = {
  kind: "font",
  height: 16,
  weight: 400,
  italic: false,
  underline: false,
  faceName: "Times New Roman",
  charSet: 0,
};

// Symbol font (CharSet 2 / "Symbol") byte 0x20..0xFF -> Unicode math & Greek glyphs
const SYMBOL_CHAR_MAP: Record<number, string> = {
  0x20: " ",
  0x21: "!",
  0x22: "∀",
  0x24: "∃",
  0x27: "∋",
  0x2a: "∗",
  0x2b: "+",
  0x2d: "−",
  0x3d: "=",
  0x40: "≅",
  0x41: "Α",
  0x42: "Β",
  0x43: "Χ",
  0x44: "Δ",
  0x45: "Ε",
  0x46: "Φ",
  0x47: "Γ",
  0x48: "Η",
  0x49: "Ι",
  0x4a: "ϑ",
  0x4b: "Κ",
  0x4c: "Λ",
  0x4d: "Μ",
  0x4e: "Ν",
  0x4f: "Ο",
  0x50: "Π",
  0x51: "Θ",
  0x52: "Ρ",
  0x53: "Σ",
  0x54: "Τ",
  0x55: "Υ",
  0x56: "ς",
  0x57: "Ω",
  0x58: "Ξ",
  0x59: "Ψ",
  0x5a: "Ζ",
  0x5c: "∴",
  0x5e: "⊥",
  0x61: "α",
  0x62: "β",
  0x63: "χ",
  0x64: "δ",
  0x65: "ε",
  0x66: "φ",
  0x67: "γ",
  0x68: "η",
  0x69: "ι",
  0x6a: "ϕ",
  0x6b: "κ",
  0x6c: "λ",
  0x6d: "μ",
  0x6e: "ν",
  0x6f: "ο",
  0x70: "π",
  0x71: "θ",
  0x72: "ρ",
  0x73: "σ",
  0x74: "τ",
  0x75: "υ",
  0x76: "ϖ",
  0x77: "ω",
  0x78: "ξ",
  0x79: "ψ",
  0x7a: "ζ",
  0x7e: "~",
  0xa3: "≤",
  0xa4: "⁄",
  0xa5: "∞",
  0xa6: "ƒ",
  0xab: "↔",
  0xac: "←",
  0xad: "↑",
  0xae: "→",
  0xaf: "↓",
  0xb0: "°",
  0xb1: "±",
  0xb2: "″",
  0xb3: "≥",
  0xb4: "×",
  0xb5: "∝",
  0xb6: "∂",
  0xb7: "•",
  0xb8: "÷",
  0xb9: "≠",
  0xba: "≡",
  0xbb: "≈",
  0xbc: "…",
  0xc4: "⊗",
  0xc5: "⊕",
  0xc6: "∅",
  0xc7: "∩",
  0xc8: "∪",
  0xc9: "⊃",
  0xca: "⊇",
  0xcb: "⊄",
  0xcc: "⊂",
  0xcd: "⊆",
  0xce: "∈",
  0xcf: "∉",
  0xd0: "∠",
  0xd1: "∇",
  0xd5: "∏",
  0xd6: "√",
  0xd7: "⋅",
  0xd8: "¬",
  0xd9: "∧",
  0xda: "∨",
  0xdb: "⇔",
  0xdc: "⇐",
  0xdd: "⇑",
  0xde: "⇒",
  0xdf: "⇓",
  0xe0: "◊",
  0xe1: "⟨",
  0xe5: "∑",
  0xf1: "⟩",
  0xf2: "∫",
};

const MT_EXTRA_CHAR_MAP: Record<number, string> = {
  0x21: "′",
  0x22: "″",
  0x23: "‴",
  0x26: "−",
  0x2b: "+",
  0x31: "⋯",
  0x32: "⋮",
  0x33: "⋱",
  0x40: "⌢",
  0x61: "→",
  0x62: "←",
  0x63: "↔",
  0x68: "ℏ",
  0x6c: "ℓ",
};

export function mapMetafileText(raw: string, font: FontObj): string {
  const face = font.faceName.toLowerCase();
  const isSymbol = face === "symbol" || font.charSet === 2;
  const isMtExtra = face.includes("mt extra");

  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    const lowByte = code >= 0xf000 && code <= 0xf0ff ? code - 0xf000 : code;
    if (isSymbol && SYMBOL_CHAR_MAP[lowByte] !== undefined) {
      out += SYMBOL_CHAR_MAP[lowByte];
    } else if (isMtExtra && MT_EXTRA_CHAR_MAP[lowByte] !== undefined) {
      out += MT_EXTRA_CHAR_MAP[lowByte];
    } else if (code >= 0xf020 && code <= 0xf0ff && SYMBOL_CHAR_MAP[lowByte] !== undefined) {
      out += SYMBOL_CHAR_MAP[lowByte];
    } else {
      out += raw[i];
    }
  }
  return out;
}

function colorRefToCss(colorRef: number): string {
  const r = colorRef & 0xff;
  const g = (colorRef >> 8) & 0xff;
  const b = (colorRef >> 16) & 0xff;
  return `rgb(${r},${g},${b})`;
}

export function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s+/g, "");
  if (typeof atob === "function") {
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(clean, "base64"));
  }
  return new Uint8Array(0);
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  return "";
}

export function detectMetafileFormat(bytes: Uint8Array): MetafileFormat {
  if (bytes.length < 18) return "unknown";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Placeable WMF magic: 0x9AC6CDD7
  if (view.getUint32(0, true) === 0x9ac6cdd7 && bytes.length >= 40) {
    return "wmf";
  }

  // EMF magic: type == 1 and signature == 0x464D4520 (" EMF") at offset 40
  if (bytes.length >= 44) {
    const recType = view.getUint32(0, true);
    const sig = view.getUint32(40, true);
    if (recType === 1 && sig === 0x464d4520) {
      return "emf";
    }
  }

  // Standard WMF header: type (1 or 2), headerSize == 9 words (18 bytes)
  const wmfType = view.getUint16(0, true);
  const wmfHeaderWords = view.getUint16(2, true);
  if ((wmfType === 1 || wmfType === 2) && wmfHeaderWords === 9) {
    return "wmf";
  }

  return "unknown";
}

function readAsciiString(bytes: Uint8Array, offset: number, maxLen: number): string {
  let end = offset;
  const limit = Math.min(bytes.length, offset + maxLen);
  while (end < limit && bytes[end] !== 0) {
    end++;
  }
  let out = "";
  for (let i = offset; i < end; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function readUtf16String(bytes: Uint8Array, offset: number, charCount: number): string {
  const limit = Math.min(bytes.length, offset + charCount * 2);
  let out = "";
  for (let i = offset; i + 1 < limit; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out;
}

function readWindows1252String(bytes: Uint8Array, offset: number, charCount: number): string {
  const limit = Math.min(bytes.length, offset + charCount);
  let out = "";
  for (let i = offset; i < limit; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function getStockObject(idx: number): GdiObject {
  switch (idx) {
    case 0: // WHITE_BRUSH
      return { kind: "brush", style: 0, color: "#ffffff" };
    case 1: // LTGRAY_BRUSH
      return { kind: "brush", style: 0, color: "#c0c0c0" };
    case 2: // GRAY_BRUSH
      return { kind: "brush", style: 0, color: "#808080" };
    case 3: // DKGRAY_BRUSH
      return { kind: "brush", style: 0, color: "#404040" };
    case 4: // BLACK_BRUSH
      return { kind: "brush", style: 0, color: "#000000" };
    case 5: // NULL_BRUSH / HOLLOW_BRUSH
      return NULL_BRUSH;
    case 6: // WHITE_PEN
      return { kind: "pen", style: 0, width: 1, color: "#ffffff" };
    case 7: // BLACK_PEN
      return DEFAULT_PEN;
    case 8: // NULL_PEN
      return NULL_PEN;
    default:
      return DEFAULT_FONT;
  }
}

interface RenderState {
  winOrgX: number;
  winOrgY: number;
  winExtX: number;
  winExtY: number;
  vpOrgX: number;
  vpOrgY: number;
  vpExtX: number;
  vpExtY: number;
  pen: PenObj;
  brush: BrushObj;
  font: FontObj;
  textColor: string;
  bkColor: string;
  bkMode: number;
  textAlign: number;
  polyFillMode: number;
  curX: number;
  curY: number;
  worldM: [number, number, number, number, number, number];
}

function cloneState(s: RenderState): RenderState {
  return {
    ...s,
    pen: { ...s.pen },
    brush: { ...s.brush },
    font: { ...s.font },
    worldM: [...s.worldM] as [number, number, number, number, number, number],
  };
}

function buildFontCss(font: FontObj, scaleY: number): string {
  const px = Math.max(6, Math.abs(font.height) * scaleY * (font.height > 0 ? 0.85 : 1));
  const italic = font.italic ? "italic " : "";
  const weight = font.weight >= 600 ? "bold " : "";
  const face = font.faceName || "Times New Roman";
  // Map Symbol / MT Extra to standard Unicode-capable serif/sans fallback
  const mappedFace =
    face.toLowerCase() === "symbol" || face.toLowerCase().includes("mt extra")
      ? '"Times New Roman", "Cambria Math", serif'
      : `"${face}", "Times New Roman", serif`;
  return `${italic}${weight}${px.toFixed(2)}px ${mappedFace}`;
}

function applyTextAlignment(ctx: CanvasRenderingContext2D, textAlign: number) {
  const horiz = textAlign & 0x06;
  if (horiz === 0x06) ctx.textAlign = "center";
  else if (horiz === 0x02) ctx.textAlign = "right";
  else ctx.textAlign = "left";

  const vert = textAlign & 0x18;
  if (vert === 0x18) ctx.textBaseline = "alphabetic";
  else if (vert === 0x08) ctx.textBaseline = "bottom";
  else ctx.textBaseline = "top";
}

function dibToDataUrl(dibBytes: Uint8Array): string | null {
  if (dibBytes.length < 40) return null;
  const view = new DataView(dibBytes.buffer, dibBytes.byteOffset, dibBytes.byteLength);
  const biSize = view.getUint32(0, true);
  if (biSize < 12) return null;

  let colorTableSize = 0;
  if (biSize >= 40) {
    const bitCount = view.getUint16(14, true);
    const clrUsed = view.getUint32(32, true);
    if (bitCount <= 8) {
      colorTableSize = (clrUsed || 1 << bitCount) * 4;
    }
  }
  const pixelOffset = 14 + biSize + colorTableSize;
  const totalSize = 14 + dibBytes.length;
  const bmp = new Uint8Array(totalSize);
  const bmpView = new DataView(bmp.buffer);
  bmp[0] = 0x42; // 'B'
  bmp[1] = 0x4d; // 'M'
  bmpView.setUint32(2, totalSize, true);
  bmpView.setUint32(10, pixelOffset, true);
  bmp.set(dibBytes, 14);
  return `data:image/bmp;base64,${encodeBytesToBase64(bmp)}`;
}

/**
 * Inspects WMF logical bounds & target pixel size without requiring DOM canvas.
 */
export function inspectWmfBounds(bytes: Uint8Array): MetafileBounds | null {
  if (bytes.length < 18) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  let bboxLeft = 0;
  let bboxTop = 0;
  let bboxRight = 0;
  let bboxBottom = 0;
  let inch = 1440;
  let hasPlaceable = false;

  if (view.getUint32(0, true) === 0x9ac6cdd7 && bytes.length >= 40) {
    hasPlaceable = true;
    bboxLeft = view.getInt16(6, true);
    bboxTop = view.getInt16(8, true);
    bboxRight = view.getInt16(10, true);
    bboxBottom = view.getInt16(12, true);
    inch = view.getUint16(14, true) || 1440;
    offset = 22;
  }

  const headerWords = view.getUint16(offset + 2, true);
  offset += headerWords * 2;

  let winOrgX = bboxLeft;
  let winOrgY = bboxTop;
  let winExtX = bboxRight - bboxLeft;
  let winExtY = bboxBottom - bboxTop;
  let foundExt = false;
  let foundOrg = false;

  while (offset + 6 <= bytes.length) {
    const sizeWords = view.getUint32(offset, true);
    const funcId = view.getUint16(offset + 4, true);
    if (sizeWords < 3 || offset + sizeWords * 2 > bytes.length) break;
    if (funcId === 0x0000) break;

    if (funcId === 0x020b && sizeWords >= 5 && !foundOrg) {
      winOrgY = view.getInt16(offset + 6, true);
      winOrgX = view.getInt16(offset + 8, true);
      foundOrg = true;
    } else if (funcId === 0x020c && sizeWords >= 5 && !foundExt) {
      winExtY = view.getInt16(offset + 6, true);
      winExtX = view.getInt16(offset + 8, true);
      foundExt = true;
    }
    offset += sizeWords * 2;
  }

  if (!winExtX || !winExtY) {
    if (hasPlaceable && bboxRight !== bboxLeft && bboxBottom !== bboxTop) {
      winOrgX = bboxLeft;
      winOrgY = bboxTop;
      winExtX = bboxRight - bboxLeft;
      winExtY = bboxBottom - bboxTop;
    } else {
      return null;
    }
  }

  // Convert logical units to 2x HiDPI CSS pixels (192 DPI)
  const scale = hasPlaceable ? 192 / Math.max(96, inch) : 1;
  const rawW = Math.abs(winExtX) * scale;
  const rawH = Math.abs(winExtY) * scale;
  const maxDim = Math.max(rawW, rawH);
  const clampRatio = maxDim > 1400 ? 1400 / maxDim : maxDim < 18 ? 18 / Math.max(maxDim, 1) : 1;

  return {
    width: Math.max(8, Math.round(rawW * clampRatio)),
    height: Math.max(8, Math.round(rawH * clampRatio)),
    winOrgX,
    winOrgY,
    winExtX,
    winExtY,
  };
}

/**
 * Inspects EMF logical bounds & target pixel size without requiring DOM canvas.
 */
export function inspectEmfBounds(bytes: Uint8Array): MetafileBounds | null {
  if (bytes.length < 88) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 1 || view.getUint32(40, true) !== 0x464d4520) {
    return null;
  }

  const bLeft = view.getInt32(8, true);
  const bTop = view.getInt32(12, true);
  const bRight = view.getInt32(16, true);
  const bBottom = view.getInt32(20, true);

  const fLeft = view.getInt32(24, true);
  const fTop = view.getInt32(28, true);
  const fRight = view.getInt32(32, true);
  const fBottom = view.getInt32(36, true);

  let width = 0;
  let height = 0;
  const frameW = Math.abs(fRight - fLeft);
  const frameH = Math.abs(fBottom - fTop);
  const boundsW = Math.abs(bRight - bLeft);
  const boundsH = Math.abs(bBottom - bTop);

  // rclFrame is in 0.01mm -> 2540 units = 1 inch = 192px at 2x DPI
  if (frameW > 0 && frameH > 0) {
    width = (frameW * 192) / 2540;
    height = (frameH * 192) / 2540;
  } else if (boundsW > 0 && boundsH > 0) {
    width = boundsW * 2;
    height = boundsH * 2;
  } else {
    return null;
  }

  const maxDim = Math.max(width, height);
  const clampRatio = maxDim > 1400 ? 1400 / maxDim : maxDim < 18 ? 18 / Math.max(maxDim, 1) : 1;

  return {
    width: Math.max(8, Math.round(width * clampRatio)),
    height: Math.max(8, Math.round(height * clampRatio)),
    winOrgX: bLeft,
    winOrgY: bTop,
    winExtX: bRight - bLeft || 1,
    winExtY: bBottom - bTop || 1,
  };
}

function renderWmfToCanvas(bytes: Uint8Array): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const bounds = inspectWmfBounds(bytes);
  if (!bounds) return null;

  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = view.getUint32(0, true) === 0x9ac6cdd7 ? 22 : 0;
  const headerWords = view.getUint16(offset + 2, true);
  offset += headerWords * 2;

  const objects: Array<GdiObject | null> = [];
  const addObj = (obj: GdiObject) => {
    const emptyIdx = objects.indexOf(null);
    if (emptyIdx !== -1) objects[emptyIdx] = obj;
    else objects.push(obj);
  };

  let state: RenderState = {
    winOrgX: bounds.winOrgX,
    winOrgY: bounds.winOrgY,
    winExtX: bounds.winExtX,
    winExtY: bounds.winExtY,
    vpOrgX: 0,
    vpOrgY: 0,
    vpExtX: canvas.width,
    vpExtY: canvas.height,
    pen: { ...DEFAULT_PEN },
    brush: { ...DEFAULT_BRUSH },
    font: { ...DEFAULT_FONT },
    textColor: "#000000",
    bkColor: "#ffffff",
    bkMode: 1,
    textAlign: 0,
    polyFillMode: 1,
    curX: 0,
    curY: 0,
    worldM: [1, 0, 0, 1, 0, 0],
  };
  const dcStack: RenderState[] = [];

  const mapX = (x: number) =>
    ((x - state.winOrgX) / (state.winExtX || 1)) * canvas.width;
  const mapY = (y: number) =>
    ((y - state.winOrgY) / (state.winExtY || 1)) * canvas.height;
  const scaleX = () => Math.abs(canvas.width / (state.winExtX || 1));
  const scaleY = () => Math.abs(canvas.height / (state.winExtY || 1));

  const applyStrokeAndFill = (doFill: boolean, doStroke: boolean) => {
    if (doFill && state.brush.style !== 1) {
      ctx.fillStyle = state.brush.color;
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    }
    if (doStroke && state.pen.style !== 5) {
      ctx.strokeStyle = state.pen.color;
      ctx.lineWidth = Math.max(1, state.pen.width * Math.min(scaleX(), scaleY()));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  };

  while (offset + 6 <= bytes.length) {
    const sizeWords = view.getUint32(offset, true);
    const funcId = view.getUint16(offset + 4, true);
    if (sizeWords < 3 || offset + sizeWords * 2 > bytes.length) break;
    if (funcId === 0x0000) break;

    const p = offset + 6;
    switch (funcId) {
      case 0x0102: // META_SETBKMODE
        state.bkMode = view.getUint16(p, true);
        break;
      case 0x0106: // META_SETPOLYFILLMODE
        state.polyFillMode = view.getUint16(p, true);
        break;
      case 0x0127: // META_SAVEDC
        dcStack.push(cloneState(state));
        break;
      case 0x0128: { // META_RESTOREDC
        const count = view.getInt16(p, true);
        const popSteps = count < 0 ? Math.abs(count) : 1;
        for (let k = 0; k < popSteps && dcStack.length > 0; k++) {
          state = dcStack.pop()!;
        }
        break;
      }
      case 0x012d: { // META_SELECTOBJECT
        const idx = view.getUint16(p, true);
        const obj = objects[idx];
        if (obj) {
          if (obj.kind === "pen") state.pen = obj;
          else if (obj.kind === "brush") state.brush = obj;
          else if (obj.kind === "font") state.font = obj;
        }
        break;
      }
      case 0x012e: // META_SETTEXTALIGN
        state.textAlign = view.getUint16(p, true);
        break;
      case 0x01f0: { // META_DELETEOBJECT
        const idx = view.getUint16(p, true);
        if (idx < objects.length) objects[idx] = null;
        break;
      }
      case 0x0201: // META_SETBKCOLOR
        state.bkColor = colorRefToCss(view.getUint32(p, true));
        break;
      case 0x0209: // META_SETTEXTCOLOR
        state.textColor = colorRefToCss(view.getUint32(p, true));
        break;
      case 0x020b: // META_SETWINDOWORG
        state.winOrgY = view.getInt16(p, true);
        state.winOrgX = view.getInt16(p + 2, true);
        break;
      case 0x020c: // META_SETWINDOWEXT
        state.winExtY = view.getInt16(p, true) || state.winExtY;
        state.winExtX = view.getInt16(p + 2, true) || state.winExtX;
        break;
      case 0x0214: // META_MOVETO
        state.curY = view.getInt16(p, true);
        state.curX = view.getInt16(p + 2, true);
        break;
      case 0x0213: { // META_LINETO
        const y = view.getInt16(p, true);
        const x = view.getInt16(p + 2, true);
        ctx.beginPath();
        ctx.moveTo(mapX(state.curX), mapY(state.curY));
        ctx.lineTo(mapX(x), mapY(y));
        applyStrokeAndFill(false, true);
        state.curX = x;
        state.curY = y;
        break;
      }
      case 0x02fa: { // META_CREATEPENINDIRECT
        const style = view.getUint16(p, true);
        const width = Math.abs(view.getInt16(p + 2, true)) || 1;
        const color = colorRefToCss(view.getUint32(p + 6, true));
        addObj({ kind: "pen", style, width, color });
        break;
      }
      case 0x02fc: { // META_CREATEBRUSHINDIRECT
        const style = view.getUint16(p, true);
        const color = colorRefToCss(view.getUint32(p + 2, true));
        addObj({ kind: "brush", style, color });
        break;
      }
      case 0x02fb: { // META_CREATEFONTINDIRECT
        const height = view.getInt16(p, true);
        const weight = view.getInt16(p + 8, true);
        const italic = bytes[p + 10] !== 0;
        const underline = bytes[p + 11] !== 0;
        const charSet = bytes[p + 13];
        const faceName = readAsciiString(bytes, p + 18, 32);
        addObj({
          kind: "font",
          height,
          weight,
          italic,
          underline,
          faceName,
          charSet,
        });
        break;
      }
      case 0x06fe: // META_CREATEBITMAP
      case 0x01f9: // META_CREATEPATTERNBRUSH
      case 0x06ff: // META_CREATEREGION
      case 0x00f7: // META_CREATEPALETTE
        addObj({ kind: "other" });
        break;
      case 0x0418: // META_ELLIPSE
      case 0x041b: { // META_RECTANGLE
        const bottom = mapY(view.getInt16(p, true));
        const right = mapX(view.getInt16(p + 2, true));
        const top = mapY(view.getInt16(p + 4, true));
        const left = mapX(view.getInt16(p + 6, true));
        ctx.beginPath();
        if (funcId === 0x0418) {
          ctx.ellipse(
            (left + right) / 2,
            (top + bottom) / 2,
            Math.abs(right - left) / 2,
            Math.abs(bottom - top) / 2,
            0,
            0,
            Math.PI * 2,
          );
        } else {
          ctx.rect(left, top, right - left, bottom - top);
        }
        applyStrokeAndFill(true, true);
        break;
      }
      case 0x0324: // META_POLYGON
      case 0x0325: { // META_POLYLINE
        const count = view.getUint16(p, true);
        if (count > 0 && p + 2 + count * 4 <= offset + sizeWords * 2) {
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const px = mapX(view.getInt16(p + 2 + i * 4, true));
            const py = mapY(view.getInt16(p + 4 + i * 4, true));
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          if (funcId === 0x0324) {
            ctx.closePath();
            applyStrokeAndFill(true, true);
          } else {
            applyStrokeAndFill(false, true);
          }
        }
        break;
      }
      case 0x0538: { // META_POLYPOLYGON
        const numPolys = view.getUint16(p, true);
        let ptr = p + 2 + numPolys * 2;
        ctx.beginPath();
        for (let pi = 0; pi < numPolys; pi++) {
          const cnt = view.getUint16(p + 2 + pi * 2, true);
          for (let i = 0; i < cnt; i++) {
            if (ptr + 4 > offset + sizeWords * 2) break;
            const px = mapX(view.getInt16(ptr, true));
            const py = mapY(view.getInt16(ptr + 2, true));
            ptr += 4;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
        applyStrokeAndFill(true, true);
        break;
      }
      case 0x0521: { // META_TEXTOUT
        const strLen = view.getUint16(p, true);
        const paddedLen = strLen + (strLen % 2);
        const rawText = readWindows1252String(bytes, p + 2, strLen);
        const y = mapY(view.getInt16(p + 2 + paddedLen, true));
        const x = mapX(view.getInt16(p + 4 + paddedLen, true));
        const text = mapMetafileText(rawText, state.font);
        ctx.font = buildFontCss(state.font, scaleY());
        ctx.fillStyle = state.textColor;
        applyTextAlignment(ctx, state.textAlign);
        ctx.fillText(text, x, y);
        break;
      }
      case 0x0a32: { // META_EXTTEXTOUT
        const y = mapY(view.getInt16(p, true));
        const x = mapX(view.getInt16(p + 2, true));
        const strLen = view.getUint16(p + 4, true);
        const options = view.getUint16(p + 6, true);
        const hasRect = (options & 0x06) !== 0;
        const strStart = p + 8 + (hasRect ? 8 : 0);
        const rawText = readWindows1252String(bytes, strStart, strLen);
        const text = mapMetafileText(rawText, state.font);
        ctx.font = buildFontCss(state.font, scaleY());
        ctx.fillStyle = state.textColor;
        applyTextAlignment(ctx, state.textAlign);
        ctx.fillText(text, x, y);
        break;
      }
      case 0x0b41: // META_DIBSTRETCHBLT
      case 0x0f43: { // META_STRETCHDIB
        const dibOffset = funcId === 0x0f43 ? p + 22 : p + 20;
        if (dibOffset < offset + sizeWords * 2) {
          const dstH = mapY(state.winOrgY + view.getInt16(funcId === 0x0f43 ? p + 12 : p + 10, true)) - mapY(state.winOrgY);
          const dstW = mapX(state.winOrgX + view.getInt16(funcId === 0x0f43 ? p + 14 : p + 12, true)) - mapX(state.winOrgX);
          const dstY = mapY(view.getInt16(funcId === 0x0f43 ? p + 16 : p + 14, true));
          const dstX = mapX(view.getInt16(funcId === 0x0f43 ? p + 18 : p + 16, true));
          const url = dibToDataUrl(bytes.subarray(dibOffset, offset + sizeWords * 2));
          if (url && typeof Image !== "undefined") {
            const img = new Image();
            img.src = url;
            if (img.complete) {
              ctx.drawImage(img, dstX, dstY, dstW, dstH);
            }
          }
        }
        break;
      }
    }

    offset += sizeWords * 2;
  }

  return canvas;
}

function renderEmfToCanvas(bytes: Uint8Array): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const bounds = inspectEmfBounds(bytes);
  if (!bounds) return null;

  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const objects = new Map<number, GdiObject>();

  const devOrgX = bounds.winOrgX;
  const devOrgY = bounds.winOrgY;
  const devExtX = bounds.winExtX || 1;
  const devExtY = bounds.winExtY || 1;

  let state: RenderState = {
    winOrgX: bounds.winOrgX,
    winOrgY: bounds.winOrgY,
    winExtX: bounds.winExtX,
    winExtY: bounds.winExtY,
    vpOrgX: bounds.winOrgX,
    vpOrgY: bounds.winOrgY,
    vpExtX: bounds.winExtX,
    vpExtY: bounds.winExtY,
    pen: { ...DEFAULT_PEN },
    brush: { ...DEFAULT_BRUSH },
    font: { ...DEFAULT_FONT },
    textColor: "#000000",
    bkColor: "#ffffff",
    bkMode: 1,
    textAlign: 0,
    polyFillMode: 1,
    curX: 0,
    curY: 0,
    worldM: [1, 0, 0, 1, 0, 0],
  };
  const dcStack: RenderState[] = [];
  let inPath = false;

  const transformPt = (lx: number, ly: number): Point => {
    const wx = state.worldM[0] * lx + state.worldM[2] * ly + state.worldM[4];
    const wy = state.worldM[1] * lx + state.worldM[3] * ly + state.worldM[5];
    const devX = ((wx - state.winOrgX) / (state.winExtX || 1)) * (state.vpExtX || 1) + state.vpOrgX;
    const devY = ((wy - state.winOrgY) / (state.winExtY || 1)) * (state.vpExtY || 1) + state.vpOrgY;
    return {
      x: ((devX - devOrgX) / devExtX) * canvas.width,
      y: ((devY - devOrgY) / devExtY) * canvas.height,
    };
  };

  const scaleX = () =>
    Math.abs(((state.vpExtX || 1) / (state.winExtX || 1)) * (canvas.width / devExtX));
  const scaleY = () =>
    Math.abs(((state.vpExtY || 1) / (state.winExtY || 1)) * (canvas.height / devExtY));

  const applyStrokeAndFill = (doFill: boolean, doStroke: boolean) => {
    if (inPath) return;
    if (doFill && state.brush.style !== 1) {
      ctx.fillStyle = state.brush.color;
      ctx.fill(state.polyFillMode === 2 ? "nonzero" : "evenodd");
    }
    if (doStroke && state.pen.style !== 5) {
      ctx.strokeStyle = state.pen.color;
      ctx.lineWidth = Math.max(1, state.pen.width * Math.min(scaleX(), scaleY()));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  };

  let offset = 0;
  while (offset + 8 <= bytes.length) {
    const recType = view.getUint32(offset, true);
    const recSize = view.getUint32(offset + 4, true);
    if (recSize < 8 || offset + recSize > bytes.length) break;
    if (recType === 14) break; // EMR_EOF

    const p = offset + 8;
    switch (recType) {
      case 9: // EMR_SETWINDOWEXTEX
        state.winExtX = view.getInt32(p, true) || state.winExtX;
        state.winExtY = view.getInt32(p + 4, true) || state.winExtY;
        break;
      case 10: // EMR_SETWINDOWORGEX
        state.winOrgX = view.getInt32(p, true);
        state.winOrgY = view.getInt32(p + 4, true);
        break;
      case 11: // EMR_SETVIEWPORTEXTEX
        state.vpExtX = view.getInt32(p, true) || state.vpExtX;
        state.vpExtY = view.getInt32(p + 4, true) || state.vpExtY;
        break;
      case 12: // EMR_SETVIEWPORTORGEX
        state.vpOrgX = view.getInt32(p, true);
        state.vpOrgY = view.getInt32(p + 4, true);
        break;
      case 18: // EMR_SETBKMODE
        state.bkMode = view.getUint32(p, true);
        break;
      case 19: // EMR_SETPOLYFILLMODE
        state.polyFillMode = view.getUint32(p, true);
        break;
      case 22: // EMR_SETTEXTALIGN
        state.textAlign = view.getUint32(p, true);
        break;
      case 24: // EMR_SETTEXTCOLOR
        state.textColor = colorRefToCss(view.getUint32(p, true));
        break;
      case 25: // EMR_SETBKCOLOR
        state.bkColor = colorRefToCss(view.getUint32(p, true));
        break;
      case 27: // EMR_MOVETOEX
        state.curX = view.getInt32(p, true);
        state.curY = view.getInt32(p + 4, true);
        if (inPath) {
          const pt = transformPt(state.curX, state.curY);
          ctx.moveTo(pt.x, pt.y);
        }
        break;
      case 54: { // EMR_LINETO
        const x = view.getInt32(p, true);
        const y = view.getInt32(p + 4, true);
        const p0 = transformPt(state.curX, state.curY);
        const p1 = transformPt(x, y);
        if (!inPath) {
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
        }
        ctx.lineTo(p1.x, p1.y);
        applyStrokeAndFill(false, true);
        state.curX = x;
        state.curY = y;
        break;
      }
      case 33: // EMR_SAVEDC
        dcStack.push(cloneState(state));
        break;
      case 34: { // EMR_RESTOREDC
        const rel = view.getInt32(p, true);
        const steps = rel < 0 ? Math.abs(rel) : 1;
        for (let k = 0; k < steps && dcStack.length > 0; k++) {
          state = dcStack.pop()!;
        }
        break;
      }
      case 35: // EMR_SETWORLDTRANSFORM
        state.worldM = [
          view.getFloat32(p, true),
          view.getFloat32(p + 4, true),
          view.getFloat32(p + 8, true),
          view.getFloat32(p + 12, true),
          view.getFloat32(p + 16, true),
          view.getFloat32(p + 20, true),
        ];
        break;
      case 36: { // EMR_MODIFYWORLDTRANSFORM
        const m2: [number, number, number, number, number, number] = [
          view.getFloat32(p, true),
          view.getFloat32(p + 4, true),
          view.getFloat32(p + 8, true),
          view.getFloat32(p + 12, true),
          view.getFloat32(p + 16, true),
          view.getFloat32(p + 20, true),
        ];
        const mode = view.getUint32(p + 24, true);
        if (mode === 1) state.worldM = [1, 0, 0, 1, 0, 0];
        else if (mode === 2) {
          const a = state.worldM;
          state.worldM = [
            m2[0] * a[0] + m2[1] * a[2],
            m2[0] * a[1] + m2[1] * a[3],
            m2[2] * a[0] + m2[3] * a[2],
            m2[2] * a[1] + m2[3] * a[3],
            m2[4] * a[0] + m2[5] * a[2] + a[4],
            m2[4] * a[1] + m2[5] * a[3] + a[5],
          ];
        } else if (mode === 3) {
          const a = state.worldM;
          state.worldM = [
            a[0] * m2[0] + a[1] * m2[2],
            a[0] * m2[1] + a[1] * m2[3],
            a[2] * m2[0] + a[3] * m2[2],
            a[2] * m2[1] + a[3] * m2[3],
            a[4] * m2[0] + a[5] * m2[2] + m2[4],
            a[4] * m2[1] + a[5] * m2[3] + m2[5],
          ];
        } else if (mode === 4) {
          state.worldM = m2;
        }
        break;
      }
      case 37: { // EMR_SELECTOBJECT
        const ih = view.getUint32(p, true);
        const obj = (ih & 0x80000000) !== 0 ? getStockObject(ih & 0x7fffffff) : objects.get(ih);
        if (obj) {
          if (obj.kind === "pen") state.pen = obj;
          else if (obj.kind === "brush") state.brush = obj;
          else if (obj.kind === "font") state.font = obj;
        }
        break;
      }
      case 38: { // EMR_CREATEPEN
        const ih = view.getUint32(p, true);
        const style = view.getUint32(p + 4, true) & 0xff;
        const width = Math.abs(view.getInt32(p + 8, true)) || 1;
        const color = colorRefToCss(view.getUint32(p + 16, true));
        objects.set(ih, { kind: "pen", style, width, color });
        break;
      }
      case 95: { // EMR_EXTCREATEPEN
        const ih = view.getUint32(p, true);
        const style = view.getUint32(p + 20, true) & 0xff;
        const width = Math.abs(view.getUint32(p + 24, true)) || 1;
        const color = colorRefToCss(view.getUint32(p + 32, true));
        objects.set(ih, { kind: "pen", style, width, color });
        break;
      }
      case 39: { // EMR_CREATEBRUSHINDIRECT
        const ih = view.getUint32(p, true);
        const style = view.getUint32(p + 4, true);
        const color = colorRefToCss(view.getUint32(p + 8, true));
        objects.set(ih, { kind: "brush", style, color });
        break;
      }
      case 40: { // EMR_DELETEOBJECT
        const ih = view.getUint32(p, true);
        objects.delete(ih);
        break;
      }
      case 82: { // EMR_EXTCREATEFONTINDIRECTW
        const ih = view.getUint32(p, true);
        const lf = p + 4;
        const height = view.getInt32(lf, true);
        const weight = view.getInt32(lf + 16, true);
        const italic = bytes[lf + 20] !== 0;
        const underline = bytes[lf + 21] !== 0;
        const charSet = bytes[lf + 23];
        const faceName = readUtf16String(bytes, lf + 28, 32);
        objects.set(ih, {
          kind: "font",
          height,
          weight,
          italic,
          underline,
          faceName,
          charSet,
        });
        break;
      }
      case 59: // EMR_BEGINPATH
        inPath = true;
        ctx.beginPath();
        break;
      case 60: // EMR_ENDPATH
        inPath = false;
        break;
      case 61: // EMR_CLOSEFIGURE
        ctx.closePath();
        break;
      case 62: // EMR_FILLPATH
        applyStrokeAndFill(true, false);
        break;
      case 63: // EMR_STROKEANDFILLPATH
        applyStrokeAndFill(true, true);
        break;
      case 64: // EMR_STROKEPATH
        applyStrokeAndFill(false, true);
        break;
      case 42: // EMR_ELLIPSE
      case 43: { // EMR_RECTANGLE
        const p1 = transformPt(view.getInt32(p, true), view.getInt32(p + 4, true));
        const p2 = transformPt(view.getInt32(p + 8, true), view.getInt32(p + 12, true));
        if (!inPath) ctx.beginPath();
        if (recType === 42) {
          ctx.ellipse(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2,
            Math.abs(p2.x - p1.x) / 2,
            Math.abs(p2.y - p1.y) / 2,
            0,
            0,
            Math.PI * 2,
          );
        } else {
          ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        }
        applyStrokeAndFill(true, true);
        break;
      }
      case 2: // EMR_POLYBEZIER
      case 3: // EMR_POLYGON
      case 4: // EMR_POLYLINE
      case 5: // EMR_POLYBEZIERTO
      case 6: // EMR_POLYLINETO
      case 85: // EMR_POLYBEZIER16
      case 86: // EMR_POLYGON16
      case 87: // EMR_POLYLINE16
      case 88: // EMR_POLYBEZIERTO16
      case 89: { // EMR_POLYLINETO16
        const is16 = recType >= 85;
        const count = view.getUint32(p + 16, true);
        const ptsStart = p + 20;
        const stride = is16 ? 4 : 8;
        if (count > 0 && ptsStart + count * stride <= offset + recSize) {
          const pts: Point[] = [];
          for (let i = 0; i < count; i++) {
            const lx = is16
              ? view.getInt16(ptsStart + i * 4, true)
              : view.getInt32(ptsStart + i * 8, true);
            const ly = is16
              ? view.getInt16(ptsStart + i * 4 + 2, true)
              : view.getInt32(ptsStart + i * 8 + 4, true);
            pts.push(transformPt(lx, ly));
          }
          const isTo = recType === 5 || recType === 6 || recType === 88 || recType === 89;
          const isBezier = recType === 2 || recType === 5 || recType === 85 || recType === 88;
          const isPoly = recType === 3 || recType === 86;

          if (!inPath && !isTo) ctx.beginPath();
          if (isBezier) {
            let idx = 0;
            if (!isTo && pts.length > 0) {
              ctx.moveTo(pts[0].x, pts[0].y);
              idx = 1;
            }
            while (idx + 2 < pts.length) {
              ctx.bezierCurveTo(
                pts[idx].x,
                pts[idx].y,
                pts[idx + 1].x,
                pts[idx + 1].y,
                pts[idx + 2].x,
                pts[idx + 2].y,
              );
              idx += 3;
            }
            applyStrokeAndFill(false, true);
          } else {
            pts.forEach((pt, i) => {
              if (i === 0 && !isTo) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            if (isPoly) {
              ctx.closePath();
              applyStrokeAndFill(true, true);
            } else {
              applyStrokeAndFill(false, true);
            }
          }
        }
        break;
      }
      case 90: // EMR_POLYPOLYLINE16
      case 91: { // EMR_POLYPOLYGON16
        const numPolys = view.getUint32(p + 16, true);
        const countsStart = p + 24;
        let ptsPtr = countsStart + numPolys * 4;
        if (!inPath) ctx.beginPath();
        for (let pi = 0; pi < numPolys; pi++) {
          const cnt = view.getUint32(countsStart + pi * 4, true);
          for (let i = 0; i < cnt; i++) {
            if (ptsPtr + 4 > offset + recSize) break;
            const pt = transformPt(
              view.getInt16(ptsPtr, true),
              view.getInt16(ptsPtr + 2, true),
            );
            ptsPtr += 4;
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          if (recType === 91) ctx.closePath();
        }
        applyStrokeAndFill(recType === 91, true);
        break;
      }
      case 83: // EMR_EXTTEXTOUTA
      case 84: { // EMR_EXTTEXTOUTW
        const refX = view.getInt32(offset + 36, true);
        const refY = view.getInt32(offset + 40, true);
        const nChars = view.getUint32(offset + 44, true);
        const offString = view.getUint32(offset + 48, true);
        if (nChars > 0 && offString > 0 && offset + offString < offset + recSize) {
          const rawText =
            recType === 84
              ? readUtf16String(bytes, offset + offString, nChars)
              : readWindows1252String(bytes, offset + offString, nChars);
          const text = mapMetafileText(rawText, state.font);
          const pt = transformPt(refX, refY);
          ctx.font = buildFontCss(state.font, scaleY());
          ctx.fillStyle = state.textColor;
          applyTextAlignment(ctx, state.textAlign);
          ctx.fillText(text, pt.x, pt.y);
        }
        break;
      }
    }

    offset += recSize;
  }

  return canvas;
}

/**
 * Converts a base64-encoded WMF or EMF binary into a browser-renderable PNG data URL.
 * Returns null if conversion is unavailable (e.g. non-DOM test environment or invalid bytes).
 */
export function convertWmfOrEmfBase64ToPngDataUrl(base64: string): string | null {
  try {
    const bytes = decodeBase64ToBytes(base64);
    const fmt = detectMetafileFormat(bytes);
    if (fmt === "unknown") return null;
    const canvas = fmt === "wmf" ? renderWmfToCanvas(bytes) : renderEmfToCanvas(bytes);
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
