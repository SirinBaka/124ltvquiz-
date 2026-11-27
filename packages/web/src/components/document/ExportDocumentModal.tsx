import React, { useState, useEffect } from "react";
import type { Document, Question } from "@ltvquiz/shared";
import { StorageService } from "../../services/storageService";
import mammoth from "mammoth";
import {
  generatePptxBlob,
  generateDocxBlob,
  generateMarkdown,
  generateOfflineHtml,
  downloadBlob,
  printExamPdf,
} from "../../services/exportService";
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  FileCode,
  HardDrive,
} from "lucide-react";

export interface ExportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  questions?: Question[];
  rawFile?: File | null;
  htmlContent?: string;
}

export const ExportDocumentModal: React.FC<ExportDocumentModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  questions: initialQuestions,
  rawFile: initialRawFile,
  htmlContent: initialHtmlContent,
}) => {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || [],
  );
  const [rawFile, setRawFile] = useState<File | null>(initialRawFile || null);
  const [htmlContent, setHtmlContent] = useState<string>(
    initialHtmlContent || "",
  );
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setExportingType(null);
      return;
    }

    // 1. Sync or fetch questions if not provided
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
    } else {
      const allQuizzes = StorageService.getQuizzes();
      const matched = allQuizzes.find(
        (q) =>
          q.title === doc.name ||
          (q.questions.length > 0 &&
            q.questions[0].source?.documentId === doc.id),
      );
      if (matched && matched.questions.length > 0) {
        setQuestions(matched.questions);
      }
    }

    // 2. Fetch raw file if not provided
    if (initialRawFile) {
      setRawFile(initialRawFile);
    } else {
      StorageService.getFile(doc.id).then(async (file) => {
        if (file) {
          setRawFile(file);
          if (!initialHtmlContent) {
            try {
              if (doc.sourceType === "docx") {
                const arrayBuffer = await file.arrayBuffer();
                const result = await (mammoth as any).convertToHtml({
                  arrayBuffer,
                });
                setHtmlContent(result.value);
              } else if (
                doc.sourceType === "txt" ||
                doc.sourceType === "markdown"
              ) {
                const text = await file.text();
                setHtmlContent(
                  `<pre style="white-space: pre-wrap; margin:0;">${text}</pre>`,
                );
              }
            } catch {
              // Ignore conversion error in background
            }
          }
        }
      });
    }

    if (initialHtmlContent) {
      setHtmlContent(initialHtmlContent);
    }
  }, [
    isOpen,
    doc.id,
    doc.name,
    doc.sourceType,
    initialQuestions,
    initialRawFile,
    initialHtmlContent,
  ]);

  if (!isOpen) return null;

  const baseFileName = doc.name.replace(/\.[^/.]+$/, "") || "tai-lieu";

  const handleExportPptx = async () => {
    try {
      setExportingType("pptx");
      setErrorMessage("");
      const blob = await generatePptxBlob(doc.name, questions);
      downloadBlob(blob, `${baseFileName}_trinh-chieu.pptx`);
      setSuccessMessage(
        "Đã tạo thành công file trình chiếu PowerPoint (.pptx)!",
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo file PowerPoint");
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPdf = () => {
    try {
      setErrorMessage("");
      printExamPdf(doc.name, questions, htmlContent);
      setSuccessMessage("Đã mở cửa sổ in ấn / xuất PDF!");
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi mở giao diện in PDF");
    }
  };

  const handleExportDocx = async () => {
    try {
      setExportingType("docx");
      setErrorMessage("");
      const blob = await generateDocxBlob(doc.name, questions, htmlContent);
      downloadBlob(blob, `${baseFileName}_de-thi.docx`);
      setSuccessMessage("Đã tạo thành công file Word (.docx)!");
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo file Word");
    } finally {
      setExportingType(null);
    }
  };

  const handleExportOfflineHtml = () => {
    try {
      setExportingType("html");
      setErrorMessage("");
      const htmlStr = generateOfflineHtml(doc.name, questions, htmlContent);
      const blob = new Blob([htmlStr], { type: "text/html;charset=utf-8" });
      downloadBlob(blob, `${baseFileName}_offline.html`);
      setSuccessMessage(
        "Đã tải gói HTML Offline độc lập (.html)! Mở được không cần mạng.",
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi đóng gói HTML Offline");
    } finally {
      setExportingType(null);
    }
  };

  const handleExportMarkdown = () => {
    try {
      setExportingType("md");
      setErrorMessage("");
      const mdStr = generateMarkdown(doc.name, questions, htmlContent);
      const blob = new Blob([mdStr], { type: "text/markdown;charset=utf-8" });
      downloadBlob(blob, `${baseFileName}.md`);
      setSuccessMessage("Đã tải thành công file Markdown (.md)!");
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi tạo file Markdown");
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadOriginal = () => {
    if (!rawFile) {
      setErrorMessage("Chưa tìm thấy tệp gốc trong bộ nhớ.");
      return;
    }
    downloadBlob(rawFile, doc.name);
    setSuccessMessage(`Đã tải xuống tệp gốc: ${doc.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-start justify-between bg-[var(--color-background)]/50">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
              <Download size={20} className="text-[var(--color-primary)]" />
              Chuyển đổi & Tải tài liệu
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {doc.name} •{" "}
              <span className="font-medium text-[var(--color-primary)]">
                {questions.length} câu hỏi nhận diện
              </span>{" "}
              • Đã lưu cục bộ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status alerts */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body / Export Options */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {/* PowerPoint Option */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] hover:border-orange-500/50 bg-[var(--color-surface)] hover:bg-orange-500/5 transition-all flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 font-black text-sm">
                PPT
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    Microsoft PowerPoint
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-500/10 text-orange-600">
                    .pptx
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                  Tạo slide trình chiếu 16:9 với slide tiêu đề và từng câu hỏi +
                  đáp án làm nổi bật cho bài giảng.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportPptx}
              disabled={exportingType !== null}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {exportingType === "pptx" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Download size={14} /> Tải PPTX
                </>
              )}
            </button>
          </div>

          {/* PDF Option */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] hover:border-red-500/50 bg-[var(--color-surface)] hover:bg-red-500/5 transition-all flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 font-black text-sm">
                PDF
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    In / Lưu PDF Chuẩn A4
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-600">
                    .pdf
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                  Bản in đề thi kèm bảng đáp án chi tiết, định dạng vector sắc
                  nét, có thể in ngay hoặc lưu thành file PDF.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={exportingType !== null}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              <FileText size={14} /> In / Lưu PDF
            </button>
          </div>

          {/* Word Option */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] hover:border-blue-500/50 bg-[var(--color-surface)] hover:bg-blue-500/5 transition-all flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 font-black text-sm">
                DOC
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    Microsoft Word
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600">
                    .docx
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                  Đề thi dạng văn bản Word chuẩn có kèm bảng đáp án cuối bài, dễ
                  dàng biên tập lại câu hỏi.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportDocx}
              disabled={exportingType !== null}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {exportingType === "docx" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Download size={14} /> Tải DOCX
                </>
              )}
            </button>
          </div>

          {/* Offline HTML Option */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Globe size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">
                    Gói mở Offline độc lập
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white">
                    100% Offline
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                  Gói HTML tự chứa CSS và logic: xem tài liệu, luyện tập câu
                  hỏi, bật/tắt đáp án offline trên mọi thiết bị.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportOfflineHtml}
              disabled={exportingType !== null}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {exportingType === "html" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Download size={14} /> Tải HTML
                </>
              )}
            </button>
          </div>

          {/* Markdown & Raw files grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Markdown */}
            <div className="p-3.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <FileCode size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--color-text)]">
                    Markdown (.md)
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    Văn bản thuần
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportMarkdown}
                disabled={exportingType !== null}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors shrink-0"
              >
                Tải .md
              </button>
            </div>

            {/* Original File */}
            <div className="p-3.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <HardDrive size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--color-text)]">
                    Tệp gốc
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] uppercase">
                    {doc.sourceType} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadOriginal}
                disabled={!rawFile || exportingType !== null}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors shrink-0 disabled:opacity-50"
              >
                Tải file gốc
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Note */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500">⚡</span>
            <span>
              Xử lý và tạo file hoàn toàn trên trình duyệt máy bạn, hoạt động cả
              khi mất mạng.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text)] transition-colors shrink-0 self-end sm:self-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
