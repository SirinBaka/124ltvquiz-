import type { Document } from "@ltvquiz/shared";

export type DocumentTypeFilter = "all" | "pdf" | "docx" | "txt";

export function filterDocuments(
  docs: Document[],
  query: string,
  typeFilter: DocumentTypeFilter = "all",
): Document[] {
  const q = query.trim().toLowerCase();

  return docs.filter((doc) => {
    const matchesQuery =
      !q ||
      doc.name.toLowerCase().includes(q) ||
      (doc.originalFileName && doc.originalFileName.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "pdf" && doc.sourceType === "pdf") ||
      (typeFilter === "docx" && doc.sourceType === "docx") ||
      (typeFilter === "txt" &&
        (doc.sourceType === "txt" || doc.sourceType === "markdown"));

    return matchesQuery && matchesType;
  });
}

export function formatDocumentDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function getDocumentBadgeInfo(doc: Document): {
  label: string;
  colorClass: string;
} {
  switch (doc.sourceType) {
    case "pdf":
      return {
        label: "PDF",
        colorClass:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    case "docx":
      return {
        label: "WORD",
        colorClass:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "markdown":
      return {
        label: "MD",
        colorClass:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      };
    default:
      return {
        label: "TXT",
        colorClass:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
  }
}

export function createShareTokenRecord(documentId: string) {
  return {
    id: "share_" + Math.random().toString(36).slice(2, 9),
    documentId,
    token: Math.random().toString(36).slice(2, 12),
    type: "public" as const,
    status: "active" as const,
    createdAt: new Date().toISOString(),
  };
}

export function toggleDocumentSelection(
  currentSelected: string[],
  id: string,
): string[] {
  if (currentSelected.includes(id)) {
    return currentSelected.filter((item) => item !== id);
  }
  return [...currentSelected, id];
}

export function selectAllDocumentIds(docs: Document[]): string[] {
  return docs.map((d) => d.id);
}

export function calculateSelectedDocumentsSize(
  docs: Document[],
  selectedIds: string[],
): number {
  const set = new Set(selectedIds);
  return docs
    .filter((d) => set.has(d.id))
    .reduce((sum, d) => sum + (d.size || 0), 0);
}
