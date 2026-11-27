import { describe, it, expect } from "vitest";
import { renderRichTextToHtml } from "./RichText";

describe("renderRichTextToHtml", () => {
  it("renders [!b:$...$] with inner math formulas and bracket intervals [0; 1] cleanly", () => {
    const html = renderRichTextToHtml(
      "[!b:$Tìm giá trị lớn nhất của $f(x) = x^2$ trên đoạn $[0; 1]$$]",
    );
    expect(html).toContain("<strong");
    expect(html).toContain("katex");
    expect(html).not.toContain("[!b:");
    expect(html).not.toContain("$$]");
  });

  it("renders \\[...\\] display math without stripping backslashes before KaTeX", () => {
    const html = renderRichTextToHtml("Tính tích phân \\[ \\int_0^1 x^2 dx \\]");
    expect(html).toContain("katex-display");
    expect(html).toContain("∫");
    expect(html).not.toContain("\\[");
  });

  it("escapes stray comparison operators like x < 5 without dropping text or <sub>/<sup>", () => {
    const html = renderRichTextToHtml("Cho x < 5 và H<sub>2</sub>SO<sub>4</sub>");
    expect(html).toContain("x &lt; 5");
    expect(html).toContain("<sub>2</sub>");
    expect(html).toContain("<sub>4</sub>");
  });
});
