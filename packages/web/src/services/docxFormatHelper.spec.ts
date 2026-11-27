import { describe, it, expect } from "vitest";
import {
  convertOmmlToLatex,
  preprocessDocxXml,
  cleanExtractedDocxMarkdown,
  normalizePdfExtractedText,
  toUnicodeSubscript,
  toUnicodeSuperscript,
} from "./docxFormatHelper";

describe("docxFormatHelper", () => {
  it("converts OMML fractions, roots, integrals, and subscripts/superscripts to LaTeX", () => {
    const omml = `<m:oMath>
      <m:nary>
        <m:naryPr><m:chr m:val="∫"/></m:naryPr>
        <m:sub><m:r><m:t>0</m:t></m:r></m:sub>
        <m:sup><m:r><m:t>1</m:t></m:r></m:sup>
        <m:e>
          <m:f>
            <m:num><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:num>
            <m:den><m:rad><m:e><m:r><m:t>x+1</m:t></m:r></m:e></m:rad></m:den>
          </m:f>
        </m:e>
      </m:nary>
    </m:oMath>`;

    const latex = convertOmmlToLatex(omml);
    expect(latex).toContain("\\int_{0}^{1}");
    expect(latex).toContain("\\frac{x^{2}}{\\sqrt{x+1}}");
  });

  it("converts OMML vectors, delimiters, and Greek/comparison symbols", () => {
    const omml = `<m:oMath>
      <m:acc>
        <m:accPr><m:chr m:val="⃗"/></m:accPr>
        <m:e><m:r><m:t>AB</m:t></m:r></m:e>
      </m:acc>
      <m:r><m:t>≤</m:t></m:r>
      <m:d>
        <m:dPr><m:begChr m:val="["/><m:endChr m:val=")"/></m:dPr>
        <m:e><m:r><m:t>0; +∞</m:t></m:r></m:e>
      </m:d>
    </m:oMath>`;

    const latex = convertOmmlToLatex(omml);
    expect(latex).toContain("\\vec{AB}");
    expect(latex).toContain("\\le");
    expect(latex).toContain("\\left[0; +\\infty \\right)");
  });

  it("maps subscript/superscript characters and falls back cleanly on complex strings", () => {
    expect(toUnicodeSubscript("24")).toBe("₂₄");
    expect(toUnicodeSuperscript("2-")).toBe("²⁻");
    expect(toUnicodeSuperscript("2y")).toBeNull();
  });

  it("preprocesses Word subscripts, superscripts, Symbol font chars, and OMML in document.xml", () => {
    const xml = `<w:p>
      <w:r><w:t>H</w:t></w:r>
      <w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>2</w:t></w:r>
      <w:r><w:t>SO</w:t></w:r>
      <w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>4</w:t></w:r>
      <w:r><w:t>, </w:t></w:r>
      <w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2x</w:t></w:r>
      <w:r><w:sym w:font="Symbol" w:char="F044"/></w:r>
      <m:oMath><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath>
    </w:p>`;

    const out = preprocessDocxXml(xml);
    expect(out).toContain("H");
    expect(out).toContain("₂");
    expect(out).toContain("₄");
    expect(out).toContain("LTVSUPOPEN2xLTVSUPCLOSE");
    expect(out).toContain("<w:t>Δ</w:t>");
    expect(out).toContain("$\\frac{1}{2}$");
  });

  it("unescapes Mammoth markdown backslashes cleanly while preserving LaTeX and images", () => {
    const raw =
      "Câu 1\\. $y = f\\(x\\)$, \\(\\-∞; \\+∞\\), \\[0; 1\\], $\\\\frac\\{a\\}\\{b\\}$, \\\\ce\\{2H2 \\+ O2 \\-> 2H2O\\}, \\[RED\\]LTVSUPOPEN2xLTVSUPCLOSE\\[/RED\\] ![h\\(1\\)](LTVQUIZIMG0END)";
    const cleaned = cleanExtractedDocxMarkdown(raw);

    expect(cleaned).toContain("Câu 1. $y = f(x)$, (-∞; +∞), [0; 1]");
    expect(cleaned).toContain("$\\frac{a}{b}$");
    expect(cleaned).toContain("\\ce{2H2 + O2 -> 2H2O}");
    expect(cleaned).toContain("[RED]<sup>2x</sup>[/RED]");
    expect(cleaned).toContain("![h(1)](LTVQUIZIMG0END)");
  });

  it("normalizes PDF ligatures and zero-width characters", () => {
    expect(normalizePdfExtractedText("ﬁle\u00A0ﬂow\u200B")).toBe("file flow");
  });
});
