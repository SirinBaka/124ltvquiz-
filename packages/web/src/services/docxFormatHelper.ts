/**
 * Helpers for preserving DOCX math equations (OMML), subscripts/superscripts,
 * Symbol-font characters, and cleaning Mammoth's markdown punctuation escaping.
 */

const SUBSCRIPT_CHAR_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "−": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  o: "ₒ",
  x: "ₓ",
  h: "ₕ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  p: "ₚ",
  s: "ₛ",
  t: "ₜ",
  i: "ᵢ",
  r: "ᵣ",
  u: "ᵤ",
  v: "ᵥ",
};

const SUPERSCRIPT_CHAR_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "−": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
};

// Common Microsoft Word "Symbol" font PUA (F0xx) / standard mappings
const SYMBOL_FONT_MAP: Record<string, string> = {
  F020: " ",
  F022: "∀",
  F024: "∃",
  F027: "∋",
  F02A: "∗",
  F02B: "+",
  F02D: "−",
  F03D: "=",
  F040: "≅",
  F041: "Α",
  F042: "Β",
  F043: "Χ",
  F044: "Δ",
  F045: "Ε",
  F046: "Φ",
  F047: "Γ",
  F048: "Η",
  F049: "Ι",
  F04B: "Κ",
  F04C: "Λ",
  F04D: "Μ",
  F04E: "Ν",
  F04F: "Ο",
  F050: "Π",
  F051: "Θ",
  F052: "Ρ",
  F053: "Σ",
  F054: "Τ",
  F055: "Υ",
  F057: "Ω",
  F058: "Ξ",
  F059: "Ψ",
  F05A: "Ζ",
  F05C: "∴",
  F05E: "⊥",
  F061: "α",
  F062: "β",
  F063: "χ",
  F064: "δ",
  F065: "ε",
  F066: "φ",
  F067: "γ",
  F068: "η",
  F069: "ι",
  F06B: "κ",
  F06C: "λ",
  F06D: "μ",
  F06E: "ν",
  F06F: "ο",
  F070: "π",
  F071: "θ",
  F072: "ρ",
  F073: "σ",
  F074: "τ",
  F075: "υ",
  F076: "ϖ",
  F077: "ω",
  F078: "ξ",
  F079: "ψ",
  F07A: "ζ",
  F07E: "~",
  F0A3: "≤",
  F0A5: "∞",
  F0AB: "↔",
  F0AC: "←",
  F0AD: "↑",
  F0AE: "→",
  F0AF: "↓",
  F0B0: "°",
  F0B1: "±",
  F0B2: "″",
  F0B3: "≥",
  F0B4: "×",
  F0B5: "∝",
  F0B6: "∂",
  F0B7: "•",
  F0B8: "÷",
  F0B9: "≠",
  F0BA: "≡",
  F0BB: "≈",
  F0BC: "…",
  F0C4: "⊗",
  F0C5: "⊕",
  F0C6: "∅",
  F0C7: "∩",
  F0C8: "∪",
  F0C9: "⊃",
  F0CA: "⊇",
  F0CB: "⊄",
  F0CC: "⊂",
  F0CD: "⊆",
  F0CE: "∈",
  F0CF: "∉",
  F0D0: "∠",
  F0D1: "∇",
  F0D5: "∏",
  F0D6: "√",
  F0D7: "⋅",
  F0D8: "¬",
  F0D9: "∧",
  F0DA: "∨",
  F0DB: "⇔",
  F0DC: "⇐",
  F0DE: "⇒",
  F0E5: "∑",
  F0F2: "∫",
};

const MATH_UNICODE_TO_LATEX: Record<string, string> = {
  "≤": "\\le ",
  "≥": "\\ge ",
  "≠": "\\ne ",
  "≈": "\\approx ",
  "≡": "\\equiv ",
  "±": "\\pm ",
  "∓": "\\mp ",
  "×": "\\times ",
  "÷": "\\div ",
  "⋅": "\\cdot ",
  "·": "\\cdot ",
  "∞": "\\infty ",
  "π": "\\pi ",
  "α": "\\alpha ",
  "β": "\\beta ",
  "γ": "\\gamma ",
  "δ": "\\delta ",
  "Δ": "\\Delta ",
  "ε": "\\varepsilon ",
  "θ": "\\theta ",
  "λ": "\\lambda ",
  "μ": "\\mu ",
  "ρ": "\\rho ",
  "σ": "\\sigma ",
  "Σ": "\\Sigma ",
  "φ": "\\varphi ",
  "ϕ": "\\phi ",
  "ω": "\\omega ",
  "Ω": "\\Omega ",
  "→": "\\to ",
  "←": "\\leftarrow ",
  "↔": "\\leftrightarrow ",
  "⇒": "\\Rightarrow ",
  "⇔": "\\Leftrightarrow ",
  "∈": "\\in ",
  "∉": "\\notin ",
  "⊂": "\\subset ",
  "⊆": "\\subseteq ",
  "∪": "\\cup ",
  "∩": "\\cap ",
  "∅": "\\emptyset ",
  "∀": "\\forall ",
  "∃": "\\exists ",
  "∂": "\\partial ",
  "∇": "\\nabla ",
  "°": "^\\circ ",
  "ℝ": "\\mathbb{R}",
  "ℤ": "\\mathbb{Z}",
  "ℕ": "\\mathbb{N}",
  "ℚ": "\\mathbb{Q}",
  "−": "-",
};

const KNOWN_MATH_FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "arcsin",
  "arccos",
  "arctan",
  "sinh",
  "cosh",
  "tanh",
  "log",
  "ln",
  "lg",
  "lim",
  "max",
  "min",
  "sup",
  "inf",
  "det",
  "gcd",
  "exp",
]);

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function toUnicodeSubscript(text: string): string | null {
  if (!text) return null;
  let out = "";
  for (const ch of text) {
    if (ch === " ") continue;
    const mapped = SUBSCRIPT_CHAR_MAP[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out || null;
}

export function toUnicodeSuperscript(text: string): string | null {
  if (!text) return null;
  let out = "";
  for (const ch of text) {
    if (ch === " ") continue;
    const mapped = SUPERSCRIPT_CHAR_MAP[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out || null;
}

interface TinyXmlNode {
  name: string;
  attrs: Record<string, string>;
  children: TinyXmlNode[];
  text?: string;
}

function parseTinyXml(xml: string): TinyXmlNode {
  const root: TinyXmlNode = { name: "#root", attrs: {}, children: [] };
  const stack: TinyXmlNode[] = [root];
  const tokenRegex = /<(\/?)([\w:.-]+)([^>]*)>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(xml)) !== null) {
    const [, isClose, tagName, attrStr, rawText] = match;
    const current = stack[stack.length - 1];

    if (rawText !== undefined) {
      current.children.push({
        name: "#text",
        attrs: {},
        children: [],
        text: decodeXmlEntities(rawText),
      });
      continue;
    }

    if (isClose) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].name === tagName) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const selfClosing = attrStr.trimEnd().endsWith("/");
    const attrs: Record<string, string> = {};
    const attrRegex = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let am: RegExpExecArray | null;
    while ((am = attrRegex.exec(attrStr)) !== null) {
      attrs[am[1]] = decodeXmlEntities(am[2] ?? am[3] ?? "");
    }

    const node: TinyXmlNode = { name: tagName, attrs, children: [] };
    current.children.push(node);
    if (!selfClosing) {
      stack.push(node);
    }
  }

  return root;
}

function findChild(node: TinyXmlNode, name: string): TinyXmlNode | undefined {
  return node.children.find((c) => c.name === name);
}

function findChildren(node: TinyXmlNode, name: string): TinyXmlNode[] {
  return node.children.filter((c) => c.name === name);
}

function getAttrVal(
  prNode: TinyXmlNode | undefined,
  childName: string,
  attrName = "m:val",
): string | undefined {
  if (!prNode) return undefined;
  const child = findChild(prNode, childName);
  return child?.attrs[attrName];
}

function mapMathRunText(raw: string): string {
  let out = "";
  for (const ch of raw) {
    out += MATH_UNICODE_TO_LATEX[ch] ?? ch;
  }
  return out;
}

function escapeDelimiter(chr: string, fallback: string): string {
  if (chr === "") return ".";
  const c = chr || fallback;
  if (c === "{" || c === "}") return "\\" + c;
  if (c === "|") return "|";
  return c;
}

function wrapGroupIfNeeded(expr: string): string {
  const trimmed = expr.trim();
  if (!trimmed) return "{}";
  if (trimmed.length === 1 && /[A-Za-z0-9]/.test(trimmed)) return trimmed;
  return `{${trimmed}}`;
}

function ommlNodeToLatex(node: TinyXmlNode): string {
  if (node.name === "#text") return node.text || "";

  switch (node.name) {
    case "#root":
    case "m:e":
    case "m:num":
    case "m:den":
    case "m:sub":
    case "m:sup":
    case "m:deg":
    case "m:lim":
    case "m:fName":
    case "m:box":
    case "m:borderBox":
    case "m:groupChr":
    case "m:phant": {
      return node.children.map(ommlNodeToLatex).join("");
    }

    case "m:oMathPara": {
      const lines = findChildren(node, "m:oMath")
        .map((c) => ommlNodeToLatex(c).trim())
        .filter(Boolean);
      if (lines.length > 1) return lines.join(" \\\\ ");
      return lines[0] || node.children.map(ommlNodeToLatex).join("");
    }

    case "m:oMath": {
      return node.children.map(ommlNodeToLatex).join("");
    }

    case "m:r": {
      const tNodes = findChildren(node, "m:t");
      if (tNodes.length > 0) {
        return mapMathRunText(
          tNodes.map((t) => t.children.map(ommlNodeToLatex).join("")).join(""),
        );
      }
      return mapMathRunText(node.children.map(ommlNodeToLatex).join(""));
    }

    case "m:t":
      return node.children.map(ommlNodeToLatex).join("");

    case "m:f": {
      const num = ommlNodeToLatex(findChild(node, "m:num") || { name: "#root", attrs: {}, children: [] }).trim();
      const den = ommlNodeToLatex(findChild(node, "m:den") || { name: "#root", attrs: {}, children: [] }).trim();
      const fType = getAttrVal(findChild(node, "m:fPr"), "m:type");
      if (fType === "lin") return `${num}/${den}`;
      return `\\frac{${num}}{${den}}`;
    }

    case "m:sSup": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const sup = ommlNodeToLatex(findChild(node, "m:sup") || { name: "#root", attrs: {}, children: [] }).trim();
      return `${wrapGroupIfNeeded(base)}^{${sup}}`;
    }

    case "m:sSub": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const sub = ommlNodeToLatex(findChild(node, "m:sub") || { name: "#root", attrs: {}, children: [] }).trim();
      return `${wrapGroupIfNeeded(base)}_{${sub}}`;
    }

    case "m:sSubSup": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const sub = ommlNodeToLatex(findChild(node, "m:sub") || { name: "#root", attrs: {}, children: [] }).trim();
      const sup = ommlNodeToLatex(findChild(node, "m:sup") || { name: "#root", attrs: {}, children: [] }).trim();
      return `${wrapGroupIfNeeded(base)}_{${sub}}^{${sup}}`;
    }

    case "m:sPre": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const sub = ommlNodeToLatex(findChild(node, "m:sub") || { name: "#root", attrs: {}, children: [] }).trim();
      const sup = ommlNodeToLatex(findChild(node, "m:sup") || { name: "#root", attrs: {}, children: [] }).trim();
      return `{}_{${sub}}^{${sup}}${wrapGroupIfNeeded(base)}`;
    }

    case "m:rad": {
      const body = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const deg = ommlNodeToLatex(findChild(node, "m:deg") || { name: "#root", attrs: {}, children: [] }).trim();
      return deg ? `\\sqrt[${deg}]{${body}}` : `\\sqrt{${body}}`;
    }

    case "m:d": {
      const pr = findChild(node, "m:dPr");
      const begAttr = getAttrVal(pr, "m:begChr");
      const endAttr = getAttrVal(pr, "m:endChr");
      const sepAttr = getAttrVal(pr, "m:sepChr");
      const beg = escapeDelimiter(begAttr !== undefined ? begAttr : "(", "(");
      const end = escapeDelimiter(endAttr !== undefined ? endAttr : ")", ")");
      const sep = sepAttr !== undefined ? sepAttr : "|";
      const items = findChildren(node, "m:e").map((c) => ommlNodeToLatex(c));
      return `\\left${beg}${items.join(sep)}\\right${end}`;
    }

    case "m:nary": {
      const pr = findChild(node, "m:naryPr");
      const chr = getAttrVal(pr, "m:chr") || "∫";
      const opMap: Record<string, string> = {
        "∫": "\\int",
        "∬": "\\iint",
        "∭": "\\iiint",
        "∮": "\\oint",
        "∑": "\\sum",
        "∏": "\\prod",
        "⋃": "\\bigcup",
        "⋂": "\\bigcap",
      };
      const op = opMap[chr] || "\\int";
      const sub = ommlNodeToLatex(findChild(node, "m:sub") || { name: "#root", attrs: {}, children: [] }).trim();
      const sup = ommlNodeToLatex(findChild(node, "m:sup") || { name: "#root", attrs: {}, children: [] }).trim();
      const body = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const bounds = `${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""}`;
      return `${op}${bounds} ${body}`;
    }

    case "m:acc": {
      const pr = findChild(node, "m:accPr");
      const chr = getAttrVal(pr, "m:chr") || "\u20D7";
      const body = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      if (chr === "\u20D7" || chr === "→" || chr === "\u2192") return `\\vec{${body}}`;
      if (chr === "\u0302" || chr === "^") return `\\widehat{${body}}`;
      if (chr === "\u0304" || chr === "¯") return `\\overline{${body}}`;
      if (chr === "\u0303" || chr === "~") return `\\widetilde{${body}}`;
      if (chr === "\u0307") return `\\dot{${body}}`;
      return `\\vec{${body}}`;
    }

    case "m:bar": {
      const pr = findChild(node, "m:barPr");
      const pos = getAttrVal(pr, "m:pos");
      const body = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      return pos === "bot" ? `\\underline{${body}}` : `\\overline{${body}}`;
    }

    case "m:func": {
      const fNameRaw = ommlNodeToLatex(findChild(node, "m:fName") || { name: "#root", attrs: {}, children: [] }).trim();
      const body = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const fnName = KNOWN_MATH_FUNCTIONS.has(fNameRaw) ? `\\${fNameRaw}` : fNameRaw;
      return `${fnName} ${body}`;
    }

    case "m:limLow": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const lim = ommlNodeToLatex(findChild(node, "m:lim") || { name: "#root", attrs: {}, children: [] }).trim();
      const fn = KNOWN_MATH_FUNCTIONS.has(base) ? `\\${base}` : base;
      return `${fn}_{${lim}}`;
    }

    case "m:limUpp": {
      const base = ommlNodeToLatex(findChild(node, "m:e") || { name: "#root", attrs: {}, children: [] }).trim();
      const lim = ommlNodeToLatex(findChild(node, "m:lim") || { name: "#root", attrs: {}, children: [] }).trim();
      return `${base}^{${lim}}`;
    }

    case "m:eqArr": {
      const rows = findChildren(node, "m:e")
        .map((c) => ommlNodeToLatex(c).trim())
        .filter(Boolean);
      if (rows.length <= 1) return rows[0] || "";
      return `\\begin{aligned}${rows.join(" \\\\ ")}\\end{aligned}`;
    }

    case "m:m": {
      const rows = findChildren(node, "m:mr").map((row) =>
        findChildren(row, "m:e")
          .map((cell) => ommlNodeToLatex(cell).trim())
          .join(" & "),
      );
      return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`;
    }

    default:
      return node.children.map(ommlNodeToLatex).join("");
  }
}

export function convertOmmlToLatex(ommlXml: string): string {
  const tree = parseTinyXml(ommlXml);
  return ommlNodeToLatex(tree).replace(/\s{2,}/g, " ").trim();
}

/**
 * Replaces Word OMML (<m:oMathPara>, <m:oMath>), Symbol-font <w:sym>,
 * vertical align (sub/superscript), and red/underline answer cues inside word/document.xml.
 */
export function preprocessDocxXml(xml: string): string {
  let processed = xml;

  // 1. Convert Word Equation blocks (<m:oMathPara> then standalone <m:oMath>) into inline $...$
  if (processed.includes("<m:oMath")) {
    processed = processed.replace(
      /<m:oMathPara\b[^>]*>[\s\S]*?<\/m:oMathPara>/g,
      (block) => {
        const latex = convertOmmlToLatex(block);
        if (!latex) return "";
        return `<w:r><w:t xml:space="preserve"> $${escapeXmlText(latex)}$ </w:t></w:r>`;
      },
    );

    processed = processed.replace(
      /<m:oMath\b[^>]*>[\s\S]*?<\/m:oMath>/g,
      (block) => {
        const latex = convertOmmlToLatex(block);
        if (!latex) return "";
        return `<w:r><w:t xml:space="preserve">$${escapeXmlText(latex)}$</w:t></w:r>`;
      },
    );
  }

  // 2. Convert <w:sym w:font="Symbol" w:char="F0xx"/> into standard Unicode characters
  if (processed.includes("<w:sym")) {
    processed = processed.replace(
      /<w:sym\b[^>]*w:char="([0-9a-fA-F]+)"[^>]*\/?>/g,
      (full, hex) => {
        const key = hex.toUpperCase().padStart(4, "0");
        const mapped = SYMBOL_FONT_MAP[key];
        if (mapped) {
          return `<w:t>${escapeXmlText(mapped)}</w:t>`;
        }
        return full;
      },
    );
  }

  // 2.5 Keep inline <w:pict> containing <v:imagedata> (without textboxes) inline by rewriting to <w:object>,
  // because Mammoth moves <w:pict> to paragraph end (.toExtra()) while <w:object> stays inline.
  if (processed.includes("v:imagedata")) {
    processed = processed.replace(
      /<v:imagedata\b([^>]*)>/gi,
      (full, attrs) => {
        if (/\br:id\s*=/i.test(attrs)) return full;
        const oRelMatch = /\bo:relid\s*=\s*"([^"]+)"/i.exec(attrs);
        return oRelMatch ? `<v:imagedata${attrs} r:id="${oRelMatch[1]}">` : full;
      },
    );
  }
  if (processed.includes("<w:pict") && processed.includes("v:imagedata")) {
    processed = processed.replace(
      /<w:pict\b([^>]*)>([\s\S]*?)<\/w:pict>/g,
      (full, attrs, inner) => {
        if (/<w:txbxContent\b|<v:textbox\b/i.test(inner)) {
          return full;
        }
        if (/<v:imagedata\b/i.test(inner)) {
          return `<w:object${attrs}>${inner}</w:object>`;
        }
        return full;
      },
    );
  }

  // 3. Process <w:r> styling: sub/superscript + red/underline answer highlighting
  processed = processed.replace(/<w:r(?:[\s>][\s\S]*?<\/w:r>)/g, (runXml) => {
    const vertMatch = /<w:vertAlign\s+[^>]*w:val="(subscript|superscript)"/i.exec(
      runXml,
    );
    const colorMatch =
      /<w:color\s+[^>]*w:val="([0-9a-fA-F]{6}|red|darkred)"/i.exec(runXml);
    const highlightMatch = /<w:highlight\s+[^>]*w:val="(red)"/i.exec(runXml);
    const underlineMatch =
      /<w:u\s+[^>]*w:val="(?:single|words|double|thick|wave)"|<w:u\s*\/>/i.exec(
        runXml,
      );

    let isRed = false;
    if (colorMatch) {
      const val = colorMatch[1].toLowerCase();
      if (val === "red" || val === "darkred") {
        isRed = true;
      } else if (/^[0-9a-f]{6}$/.test(val)) {
        const r = parseInt(val.substring(0, 2), 16);
        const g = parseInt(val.substring(2, 4), 16);
        const b = parseInt(val.substring(4, 6), 16);
        if (r > 160 && g < 110 && b < 110) {
          isRed = true;
        }
      }
    } else if (highlightMatch) {
      isRed = true;
    }

    const isUnderline = Boolean(underlineMatch);
    let result = runXml;

    if (vertMatch) {
      const mode = vertMatch[1].toLowerCase();
      result = result.replace(
        /<w:t(\s*[^>]*)>([\s\S]*?)<\/w:t>/g,
        (_m, attrs, inner) => {
          const decoded = decodeXmlEntities(inner);
          const unicodeVal =
            mode === "subscript"
              ? toUnicodeSubscript(decoded)
              : toUnicodeSuperscript(decoded);
          if (unicodeVal) {
            return `<w:t${attrs}>${escapeXmlText(unicodeVal)}</w:t>`;
          }
          const openTok = mode === "subscript" ? "LTVSUBOPEN" : "LTVSUPOPEN";
          const closeTok = mode === "subscript" ? "LTVSUBCLOSE" : "LTVSUPCLOSE";
          return `<w:t${attrs}>${openTok}${inner}${closeTok}</w:t>`;
        },
      );
    }

    if (isRed) {
      result = result.replace(
        /<w:t(\s*[^>]*)>([\s\S]*?)<\/w:t>/g,
        "<w:t$1>[RED]$2[/RED]</w:t>",
      );
    }
    if (isUnderline) {
      result = result.replace(
        /<w:t(\s*[^>]*)>([\s\S]*?)<\/w:t>/g,
        "<w:t$1>[UNDERLINE]$2[/UNDERLINE]</w:t>",
      );
    }

    return result;
  });

  return processed;
}

/**
 * Unescapes Mammoth's Markdown backslash escapes (e.g. `\+`, `\-`, `\(`, `\[`, `\\frac\{a\}\{b\}`)
 * while restoring sub/sup tokens, images, and normalizing question/option markers.
 */
export function cleanExtractedDocxMarkdown(md: string): string {
  // 1. Protect markdown image syntax (including optional "title") before unescaping so URLs/tokens are preserved
  const imgPlaceholders: string[] = [];
  let text = md.replace(
    /!\[((?:\\[\s\S]|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_m, alt, src) => {
      const cleanAlt = String(alt)
        .replace(/\\([\\`*_#+.!()[\]{}<>~|=-])/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
      const idx = imgPlaceholders.length;
      imgPlaceholders.push(`![${cleanAlt || "image"}](${src})`);
      return `LTVMDIMG${idx}END`;
    },
  );

  // 2. Single-pass reverse of Mammoth Markdown escaping
  text = text.replace(/\\([\\`*_#+.!()[\]{}<>~|=-])/g, "$1");

  // 3. Remove BOLD noise markers from Word styles
  text = text.replace(/\[\/?BOLD\]/gi, "");

  // 4. Restore <sub> / <sup> tags from non-Unicode sub/superscripts
  text = text
    .replace(/LTVSUBOPEN/g, "<sub>")
    .replace(/LTVSUBCLOSE/g, "</sub>")
    .replace(/LTVSUPOPEN/g, "<sup>")
    .replace(/LTVSUPCLOSE/g, "</sup>");

  // 5. Clean markdown bold wrappers around question headers and option markers
  text = text.replace(
    /(^|\n)\s*[_*]+((?:Câu|Question|Bài)\s*\d+)[_*]+/gi,
    "$1$2",
  );
  text = text.replace(
    /(^|\n)\s*[_*]+(\*?[A-Da-d][.:)\-])[_*]+/gi,
    "$1$2",
  );

  // 6. Normalize Unicode NFC & zero-width characters
  text = text.normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // 7. Restore images & sanitize any residual escaped data URIs
  text = text.replace(
    /LTVMDIMG(\d+)END/g,
    (_m, idxStr) => imgPlaceholders[Number(idxStr)] || "",
  );
  text = text.replace(
    /data:image\/[a-zA-Z0-9+.\-]+;base64,[A-Za-z0-9+/=\\]+/g,
    (uri) => uri.replace(/\\([+_\/\-=])/g, "$1"),
  );

  return text;
}

/**
 * Normalizes PDF extracted text: NFC normalization, ligatures, zero-width cleanup.
 */
export function normalizePdfExtractedText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl");
}
