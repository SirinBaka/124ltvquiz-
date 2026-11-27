import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Share2,
  Trash2,
  Eye,
  Download,
  WifiOff,
  Search,
  UploadCloud,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Document } from "@ltvquiz/shared";
import { StorageService } from "../services/storageService";
import { parseDocument } from "../services/parserService";
import { ShareModal } from "../components/document/ShareModal";
import { ExportDocumentModal } from "../components/document/ExportDocumentModal";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  filterDocuments,
  formatDocumentDate,
  getDocumentBadgeInfo,
  createShareTokenRecord,
  toggleDocumentSelection,
  calculateSelectedDocumentsSize,
} from "./documentManagementHelper";
import type { DocumentTypeFilter } from "./documentManagementHelper";
import { formatFileSize } from "./createQuizHelper";

export const DocumentManagementPage: React.FC = () => {
  useDocumentTitle("12/4 LTVQuiz - Quản lý Tài liệu");
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      return (
        (localStorage.getItem("ltvquiz_doc_view_mode") as "grid" | "list") ||
        "list"
      );
    } catch {
      return "list";
    }
  });

  const [documents, setDocuments] = useState<Document[]>(() =>
    StorageService.getDocuments().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [shareModalData, setShareModalData] = useState<{
    doc: Document;
    url: string;
  } | null>(null);
  const [selectedExportDoc, setSelectedExportDoc] = useState<Document | null>(
    null,
  );
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadData = () => {
    setDocuments(
      StorageService.getDocuments().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  };

  const filteredDocs = useMemo(
    () => filterDocuments(documents, searchQuery, typeFilter),
    [documents, searchQuery, typeFilter],
  );

  const selectedStorageBytes = useMemo(
    () => calculateSelectedDocumentsSize(documents, selectedDocIds),
    [documents, selectedDocIds],
  );

  const isAllFilteredSelected =
    filteredDocs.length > 0 &&
    filteredDocs.every((doc) => selectedDocIds.includes(doc.id));

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgressMsg("Đang lưu tài liệu...");

    const docId = "doc_" + Math.random().toString(36).slice(2, 9);
    const newDoc: Document = {
      id: docId,
      name: file.name,
      originalFileName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "uploading",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType: file.name.endsWith(".pdf")
        ? "pdf"
        : file.name.endsWith(".docx")
          ? "docx"
          : "txt",
    };

    StorageService.saveDocument(newDoc);
    await StorageService.saveFile(newDoc.id, file);

    setUploadProgressMsg("Đang phân tích định dạng...");
    try {
      await parseDocument(file, (msg) => setUploadProgressMsg(msg));
      newDoc.status = "ready";
    } catch {
      newDoc.status = "warning";
    }

    StorageService.saveDocument(newDoc);
    reloadData();
    setIsUploading(false);
    setUploadProgressMsg("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      StorageService.deleteDocument(id);
      setSelectedDocIds((prev) => prev.filter((item) => item !== id));
      reloadData();
    }
  };

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => toggleDocumentSelection(prev, id));
  };

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filteredDocs.map((d) => d.id));
      setSelectedDocIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([
        ...selectedDocIds,
        ...filteredDocs.map((d) => d.id),
      ]);
      setSelectedDocIds(Array.from(newIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocIds.length === 0) return;
    const count = selectedDocIds.length;
    if (
      confirm(
        `Bạn có chắc muốn xóa ${count} tài liệu đã chọn cùng toàn bộ tệp tin đính kèm?`,
      )
    ) {
      setIsDeletingBatch(true);
      try {
        await StorageService.deleteDocuments(selectedDocIds);
        setSelectedDocIds([]);
        reloadData();
      } catch (e: any) {
        alert("Lỗi khi xóa hàng loạt: " + e.message);
      } finally {
        setIsDeletingBatch(false);
      }
    }
  };

  const getOrCreateShareToken = (id: string): string => {
    let shares = StorageService.getShareLinksForDocument(id);
    if (shares.length === 0) {
      const share = createShareTokenRecord(id);
      StorageService.saveShareLink(share);
      shares = [share];
    }
    return shares[0].token;
  };

  const handleView = (doc: Document) => {
    const token = getOrCreateShareToken(doc.id);
    navigate(`/share/document/${token}`);
  };

  const handleShare = (doc: Document) => {
    const token = getOrCreateShareToken(doc.id);
    const url = `${window.location.origin}/share/document/${token}`;
    setShareModalData({ doc, url });
  };

  const handleCreateExam = (doc: Document) => {
    const allQuizzes = StorageService.getQuizzes();
    const existing = allQuizzes.find(
      (q) =>
        q.title === doc.name ||
        (q.questions.length > 0 &&
          q.questions[0].source?.documentId === doc.id),
    );
    if (existing) {
      navigate(`/editor/${existing.id}`);
    } else {
      navigate("/dashboard/create");
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Offline Status Notice */}
      {!isOnline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <WifiOff
              size={18}
              className="text-amber-600 dark:text-amber-400 shrink-0"
            />
            <div className="text-xs sm:text-sm">
              <strong className="font-semibold">
                Chế độ ngoại tuyến (Offline):
              </strong>{" "}
              Bạn đang không có kết nối mạng. Tất cả tài liệu đã lưu trên trình
              duyệt vẫn có thể xem và in ấn bình thường.
            </div>
          </div>
          <span className="text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full shrink-0">
            Cục bộ
          </span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Quản lý Tài liệu & Thư viện câu hỏi
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Lưu trữ tài liệu bài giảng Word/PDF, trích xuất câu hỏi trắc nghiệm và biên soạn đề thi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="px-3.5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UploadCloud size={16} />
            <span>
              {isUploading
                ? uploadProgressMsg || "Đang xử lý..."
                : "Tải tài liệu lên"}
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
          />
        </div>
      </div>

      {/* Search, Filter & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên tài liệu..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs"
          />
        </div>

        {/* Type filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)] text-xs">
            {(["all", "pdf", "docx", "txt"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md font-semibold uppercase text-[11px] transition-colors cursor-pointer ${
                  typeFilter === type
                    ? "bg-[var(--color-primary)] text-white shadow-2xs"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {type === "all" ? "Tất cả" : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                try {
                  localStorage.setItem("ltvquiz_doc_view_mode", "grid");
                } catch {}
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[var(--color-background)] text-[var(--color-primary)] shadow-2xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
              title="Chế độ xem lưới"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                try {
                  localStorage.setItem("ltvquiz_doc_view_mode", "list");
                } catch {}
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-[var(--color-background)] text-[var(--color-primary)] shadow-2xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
              title="Chế độ xem danh sách"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedDocIds.length > 0 && (
        <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              {isAllFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Đã chọn:{" "}
              <strong className="text-[var(--color-text)]">
                {selectedDocIds.length}
              </strong>{" "}
              tài liệu ({formatFileSize(selectedStorageBytes)})
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isDeletingBatch}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>Xóa tài liệu đã chọn</span>
          </button>
        </div>
      )}

      {/* Documents Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <FileText className="w-10 h-10 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            Không tìm thấy tài liệu nào
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all"
              ? "Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc định dạng."
              : "Tải lên tệp PDF, DOCX, TXT để bắt đầu quản lý và trích xuất câu hỏi."}
          </p>
          {!searchQuery && typeFilter === "all" && (
            <button
              type="button"
              onClick={handleUploadClick}
              className="mt-4 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <UploadCloud size={15} />
              <span>Tải tài liệu ngay</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const badge = getDocumentBadgeInfo(doc);
                const isSelected = selectedDocIds.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-2xs hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between gap-3 group ${
                      isSelected
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.02]"
                        : ""
                    }`}
                  >
                    <div>
                      {/* Checkbox & Badge row */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectDoc(doc.id)}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                            title={isSelected ? "Bỏ chọn" : "Chọn tài liệu"}
                          />
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            doc.status === "ready"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : doc.status === "processing" ||
                                  doc.status === "uploading"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {doc.status === "ready" ? (
                            <>
                              <CheckCircle2 size={11} /> Sẵn sàng
                            </>
                          ) : doc.status === "processing" ? (
                            doc.processing?.stage || "Đang xử lý"
                          ) : (
                            <AlertCircle size={11} />
                          )}
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <h3
                        onClick={() => handleView(doc)}
                        className="font-semibold text-xs sm:text-sm text-[var(--color-text)] line-clamp-2 hover:text-[var(--color-primary)] transition-colors cursor-pointer leading-snug"
                        title={doc.name}
                      >
                        {doc.name}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-2">
                        <span className="tabular-nums">
                          {formatFileSize(doc.size)}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {formatDocumentDate(doc.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2.5 border-t border-[var(--color-border)]">
                      <button
                        type="button"
                        onClick={() => handleCreateExam(doc)}
                        className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <FileText size={13} />
                        <span>Tạo đề thi từ tài liệu</span>
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(doc)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="Xem chi tiết tài liệu"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedExportDoc(doc)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Xuất file Word, PDF, PowerPoint"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare(doc)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="Chia sẻ liên kết tài liệu"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa tài liệu này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-2xs overflow-hidden">
              <div className="divide-y divide-[var(--color-border)]">
                {filteredDocs.map((doc) => {
                  const badge = getDocumentBadgeInfo(doc);
                  const isSelected = selectedDocIds.includes(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 hover:bg-[var(--color-surface-hover)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected ? "bg-[var(--color-primary)]/[0.03]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectDoc(doc.id)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer shrink-0"
                          title={isSelected ? "Bỏ chọn" : "Chọn tài liệu"}
                        />
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${badge.colorClass}`}
                        >
                          {badge.label}
                        </span>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleView(doc)}
                            className="font-semibold text-xs sm:text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate block text-left"
                          >
                            {doc.name}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                            <span className="tabular-nums">
                              {formatFileSize(doc.size)}
                            </span>
                            <span>•</span>
                            <span className="tabular-nums">
                              {formatDocumentDate(doc.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateExam(doc)}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>Tạo đề</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedExportDoc(doc)}
                          className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Xuất file Word, PDF, PowerPoint"
                        >
                          <Download size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(doc)}
                          className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                          title="Chia sẻ liên kết"
                        >
                          <Share2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa tài liệu"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {shareModalData && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareModalData(null)}
          documentName={shareModalData.doc.name}
          shareUrl={shareModalData.url}
          sourceType={shareModalData.doc.sourceType}
        />
      )}

      {selectedExportDoc && (
        <ExportDocumentModal
          isOpen={true}
          onClose={() => setSelectedExportDoc(null)}
          document={selectedExportDoc}
        />
      )}
    </div>
  );
};
