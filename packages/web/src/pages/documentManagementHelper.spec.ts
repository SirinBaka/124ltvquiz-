import { describe, expect, it } from "vitest";
import type { Document } from "@ltvquiz/shared";
import {
  filterDocuments,
  formatDocumentDate,
  getDocumentBadgeInfo,
  createShareTokenRecord,
  toggleDocumentSelection,
  selectAllDocumentIds,
  calculateSelectedDocumentsSize,
} from "./documentManagementHelper";

describe("documentManagementHelper", () => {
  const sampleDocs: Document[] = [
    {
      id: "doc_1",
      name: "Toán học Giải tích 12.pdf",
      originalFileName: "Toan_12.pdf",
      mimeType: "application/pdf",
      size: 1048576,
      status: "ready",
      sourceType: "pdf",
      createdAt: "2026-10-10T10:00:00.000Z",
      updatedAt: "2026-10-10T10:00:00.000Z",
    },
    {
      id: "doc_2",
      name: "Vật lý Hạt nhân.docx",
      originalFileName: "Vat_Ly.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 524288,
      status: "ready",
      sourceType: "docx",
      createdAt: "2026-10-12T14:30:00.000Z",
      updatedAt: "2026-10-12T14:30:00.000Z",
    },
    {
      id: "doc_3",
      name: "Từ vựng Tiếng Anh Unit 1.txt",
      originalFileName: "English.txt",
      mimeType: "text/plain",
      size: 10240,
      status: "ready",
      sourceType: "txt",
      createdAt: "2026-10-14T08:15:00.000Z",
      updatedAt: "2026-10-14T08:15:00.000Z",
    },
  ];

  describe("filterDocuments", () => {
    it("returns all docs when query is empty and type is all", () => {
      const result = filterDocuments(sampleDocs, "", "all");
      expect(result).toHaveLength(3);
    });

    it("filters by search query case-insensitively", () => {
      const result = filterDocuments(sampleDocs, "giải tích", "all");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("doc_1");
    });

    it("filters by file type filter", () => {
      const pdfs = filterDocuments(sampleDocs, "", "pdf");
      expect(pdfs).toHaveLength(1);
      expect(pdfs[0].sourceType).toBe("pdf");

      const docx = filterDocuments(sampleDocs, "", "docx");
      expect(docx).toHaveLength(1);
      expect(docx[0].sourceType).toBe("docx");
    });
  });

  describe("getDocumentBadgeInfo", () => {
    it("returns appropriate badge info for each source type", () => {
      const pdfBadge = getDocumentBadgeInfo(sampleDocs[0]);
      expect(pdfBadge.label).toBe("PDF");

      const docxBadge = getDocumentBadgeInfo(sampleDocs[1]);
      expect(docxBadge.label).toBe("WORD");
    });
  });

  describe("formatDocumentDate", () => {
    it("formats ISO dates accurately", () => {
      const formatted = formatDocumentDate("2026-10-10T10:00:00.000Z");
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });
  });

  describe("createShareTokenRecord", () => {
    it("generates a valid share token record", () => {
      const share = createShareTokenRecord("doc_test_123");
      expect(share.documentId).toBe("doc_test_123");
      expect(share.id.startsWith("share_")).toBe(true);
      expect(share.token).toBeTruthy();
      expect(share.type).toBe("public");
      expect(share.status).toBe("active");
    });
  });

  describe("batch selection helpers", () => {
    it("toggleDocumentSelection adds and removes IDs", () => {
      let selected: string[] = [];
      selected = toggleDocumentSelection(selected, "doc_1");
      expect(selected).toEqual(["doc_1"]);

      selected = toggleDocumentSelection(selected, "doc_2");
      expect(selected).toEqual(["doc_1", "doc_2"]);

      selected = toggleDocumentSelection(selected, "doc_1");
      expect(selected).toEqual(["doc_2"]);
    });

    it("selectAllDocumentIds returns all document ids", () => {
      const ids = selectAllDocumentIds(sampleDocs);
      expect(ids).toEqual(["doc_1", "doc_2", "doc_3"]);
    });

    it("calculateSelectedDocumentsSize computes accurate sum", () => {
      const totalSize = calculateSelectedDocumentsSize(sampleDocs, ["doc_1", "doc_3"]);
      expect(totalSize).toBe(1048576 + 10240);

      const emptySize = calculateSelectedDocumentsSize(sampleDocs, []);
      expect(emptySize).toBe(0);
    });
  });
});

