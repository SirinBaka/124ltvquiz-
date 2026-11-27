import { describe, it, expect } from "vitest";
import {
  detectMetafileFormat,
  inspectWmfBounds,
  inspectEmfBounds,
  mapMetafileText,
} from "./wmfEmfConverter";

function buildMinimalPlaceableWmf(): Uint8Array {
  // 22-byte Aldus Placeable Header + 18-byte WMF header + 6-byte EOF record = 46 bytes
  const buf = new Uint8Array(46);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 0x9ac6cdd7, true); // magic
  view.setInt16(6, 0, true); // left
  view.setInt16(8, 0, true); // top
  view.setInt16(10, 720, true); // right (0.5 inch at 1440 twips/inch)
  view.setInt16(12, 360, true); // bottom (0.25 inch)
  view.setUint16(14, 1440, true); // inch

  // Standard header at offset 22
  view.setUint16(22, 1, true); // memory metafile
  view.setUint16(24, 9, true); // header size = 9 words
  view.setUint16(26, 0x0300, true); // version

  // META_EOF at offset 40
  view.setUint32(40, 3, true); // 3 words
  view.setUint16(44, 0, true); // META_EOF
  return buf;
}

function buildMinimalEmf(): Uint8Array {
  const buf = new Uint8Array(96);
  const view = new DataView(buf.buffer);
  view.setUint32(0, 1, true); // EMR_HEADER
  view.setUint32(4, 88, true); // header size
  // rclBounds: 0,0,120,60
  view.setInt32(8, 0, true);
  view.setInt32(12, 0, true);
  view.setInt32(16, 120, true);
  view.setInt32(20, 60, true);
  // rclFrame: 0,0,2540,1270 (1 inch x 0.5 inch)
  view.setInt32(24, 0, true);
  view.setInt32(28, 0, true);
  view.setInt32(32, 2540, true);
  view.setInt32(36, 1270, true);
  view.setUint32(40, 0x464d4520, true); // " EMF"
  // EMR_EOF at 88
  view.setUint32(88, 14, true);
  view.setUint32(92, 8, true);
  return buf;
}

describe("wmfEmfConverter", () => {
  it("detects Placeable WMF, standard EMF, and rejects unknown binaries", () => {
    expect(detectMetafileFormat(buildMinimalPlaceableWmf())).toBe("wmf");
    expect(detectMetafileFormat(buildMinimalEmf())).toBe("emf");
    expect(detectMetafileFormat(new Uint8Array([1, 2, 3, 4]))).toBe("unknown");
  });

  it("inspects WMF and EMF logical bounds accurately", () => {
    const wmfBounds = inspectWmfBounds(buildMinimalPlaceableWmf());
    expect(wmfBounds).not.toBeNull();
    expect(wmfBounds!.width).toBe(96);
    expect(wmfBounds!.height).toBe(48);

    const emfBounds = inspectEmfBounds(buildMinimalEmf());
    expect(emfBounds).not.toBeNull();
    expect(emfBounds!.width).toBe(192);
    expect(emfBounds!.height).toBe(96);
  });

  it("maps Symbol and MT Extra font characters to Unicode math & Greek glyphs", () => {
    const symbolFont = {
      kind: "font" as const,
      height: -16,
      weight: 400,
      italic: false,
      underline: false,
      faceName: "Symbol",
      charSet: 2,
    };
    expect(mapMetafileText("a+b=p", symbolFont)).toBe("α+β=π");
    expect(mapMetafileText("\xB1\xD6", symbolFont)).toBe("±√");
  });
});
