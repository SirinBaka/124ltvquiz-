import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Document, Question } from "@ltvquiz/shared";
import { StorageService } from "../services/storageService";
import mammoth from "mammoth";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { ShareModal } from "../components/document/ShareModal";
import { ExportDocumentModal } from "../components/document/ExportDocumentModal";
import { KahootLoader } from "../components/KahootLoader";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { RichText } from "../components/RichText";
import {
  ArrowLeft,
  Share2,
  Download,
  Maximize2,
  FileText,
  Columns,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
} from "lucide-react";

const documentViews = [
  { id: "doc", label: "Tài liệu", icon: FileText },
  { id: "split", label: "Song song", icon: Columns },
  { id: "questions", label: "Câu hỏi", icon: ListChecks },
] as const;

export const DocumentViewerPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const [doc, setDoc] = useState<Document | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState("");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"doc" | "split" | "questions">(
    "doc",
  );
  const fileUrlRef = React.useRef<string>("");

  const loadDocument = React.useCallback(async (tokenStr: string) => {
    try {
      const shareData = StorageService.getShareLink(tokenStr);
      if (!shareData || shareData.status === "revoked") {
        setError("Liên kết không tồn tại hoặc đã bị thu hồi.");
        return;
      }

      const docData = StorageService.getDocument(shareData.documentId);
      if (!docData) {
        setError("Không tìm thấy tài liệu.");
        return;
      }
      setDoc(docData);

      // Load associated questions if an exam draft exists for this document
      const allQuizzes = StorageService.getQuizzes();
      const matchedQuiz = allQuizzes.find(
        (q) =>
          q.title === docData.name ||
          (q.questions.length > 0 &&
            q.questions[0].source?.documentId === docData.id),
      );
      if (matchedQuiz && matchedQuiz.questions.length > 0) {
        setQuestions(matchedQuiz.questions);
      }

      const file = await StorageService.getFile(docData.id);
      if (!file) {
        setError("Không thể tải file đính kèm.");
        return;
      }
      setRawFile(file);

      if (docData.sourceType === "pdf") {
        const url = URL.createObjectURL(file);
        setFileUrl(url);
      } else if (docData.sourceType === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await (mammoth as any).convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } else if (
        docData.sourceType === "txt" ||
        docData.sourceType === "markdown"
      ) {
        const text = await file.text();
        setHtmlContent(
          `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${text}</pre>`,
        );
      }
    } catch (err: any) {
      setError(err.message || "Lỗi đọc tệp tài liệu");
    }
  }, []);

  useEffect(() => {
    fileUrlRef.current = fileUrl;
  }, [fileUrl]);

  useEffect(() => {
    if (token) {
      loadDocument(token);
    }
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, [token, loadDocument]);

  const handleDownload = () => {
    if (!rawFile || !doc) return;
    const url = URL.createObjectURL(rawFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard/documents");
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-background)] p-4">
        <div className="p-8 bg-[var(--color-surface)] rounded-2xl shadow-xl max-w-md w-full text-center border border-[var(--color-border)] animate-fade-in-up">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
            Lỗi truy cập tài liệu
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {error}
          </p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!doc) {
    return <KahootLoader text="Đang tải và chuẩn bị tài liệu..." />;
  }

  const shareUrl = `${window.location.origin}/share/document/${token}`;

  const renderDocumentView = () => (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--color-surface)]">
      {doc.sourceType === "pdf" && fileUrl ? (
        <>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex shrink-0 min-h-11 items-center justify-center gap-1.5 border-b border-[var(--color-border)] text-sm font-semibold text-[var(--color-primary-text)]"
          >
            <FileText size={15} aria-hidden="true" />
            Mở PDF trong tab mới
          </a>
          <iframe
            src={fileUrl}
            className="w-full min-h-0 flex-1 border-0 block"
            title={`PDF - ${doc.name}`}
          />
        </>
      ) : htmlContent ? (
        <div className="w-full h-full overflow-auto overscroll-contain p-2.5 sm:p-4 md:p-8 bg-[var(--color-background)]">
          <div className="max-w-4xl mx-auto p-3.5 sm:p-6 md:p-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm text-[var(--color-text)] leading-relaxed wrap-anywhere">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            Không thể xem trực tiếp định dạng này trên trình duyệt.
          </p>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-primary-hover)]"
          >
            Tải tệp xuống để xem
          </button>
        </div>
      )}
    </div>
  );

  const renderQuestionsList = () => (
    <div className="w-full h-full overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6 bg-[var(--color-background)] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
        <div>
          <h3 className="font-bold text-base text-[var(--color-text)]">
            Danh sách câu hỏi đã nhận diện
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Tổng số {questions.length} câu hỏi trích xuất từ tài liệu
          </p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="p-8 text-center bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          Chưa có câu hỏi nào được bóc tách từ tài liệu này.
        </div>
      ) : (
        questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-3.5 sm:p-5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm text-[var(--color-primary)]">
                Câu {idx + 1}{" "}
                {q.type === "true_false_multiple"
                  ? "(Đúng/Sai nhiều ý)"
                  : "(Trắc nghiệm)"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] font-medium text-[var(--color-text-secondary)]">
                {q.points || 0.25} điểm
              </span>
            </div>

            <div className="text-sm text-[var(--color-text)] font-medium leading-relaxed">
              {q.question.map((block, bi) => (
                <div key={bi}>
                  {block.type === "text" && (
                    <RichText content={block.content} />
                  )}
                  {block.type === "image" && (
                    <img
                      src={block.content}
                      alt={block.alt || "Ảnh"}
                      className="max-h-48 my-2 rounded-lg border border-[var(--color-border)]"
                    />
                  )}
                </div>
              ))}
            </div>

            {q.options && q.options.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                {q.options.map((opt) => {
                  const isCorrect = q.correctAnswer?.includes(opt.id);
                  const optText =
                    opt.content.find((c) => c.type === "text")?.content || "";
                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        isCorrect
                          ? "border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-300 font-medium"
                          : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)]"
                      }`}
                    >
                      <span className="font-bold shrink-0">{opt.label}.</span>
                      <div className="flex-1">
                        <RichText content={optText} />
                        {opt.content.some((c) => c.type === "image") && (
                          <div className="mt-1">
                            {opt.content.map(
                              (c, ci) =>
                                c.type === "image" && (
                                  <img
                                    key={ci}
                                    src={c.content}
                                    alt={c.alt || "Option img"}
                                    className="max-h-24 rounded border border-[var(--color-border)]"
                                  />
                                ),
                            )}
                          </div>
                        )}
                      </div>
                      {isCorrect && (
                        <CheckCircle2
                          size={14}
                          className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-background)] overflow-hidden z-30 pb-[env(safe-area-inset-bottom)]">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff
              size={15}
              className="text-amber-600 dark:text-amber-400 shrink-0"
            />
            <span>
              <strong>Chế độ ngoại tuyến (Offline):</strong> Bạn đang mất kết
              nối mạng. Tài liệu này vẫn đang hoạt động bình thường từ bộ nhớ
              máy tính cục bộ.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-semibold bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
            Đã lưu offline
          </span>
        </div>
      )}

      {/* Top Navbar Toolbar */}
      <header className="shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-2.5 sm:px-4 md:px-6 py-1.5 flex flex-wrap lg:flex-nowrap items-center justify-between z-20 shadow-sm gap-1.5 sm:gap-3">
        {/* Left: Back & Doc Title */}
        <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="grid place-items-center min-h-11 min-w-11 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors shrink-0"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0 flex items-center gap-2.5">
            <h1 className="text-sm md:text-base font-bold text-[var(--color-text)] truncate max-w-xs md:max-w-md">
              {doc.name}
            </h1>
            <span className="hidden sm:inline shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-md uppercase bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              {doc.sourceType}
            </span>
          </div>
        </div>

        {/* Center: View Mode Switcher (Full doc, Split, Questions) */}
        {questions.length > 0 && (
          <div role="group" aria-label="Chế độ xem tài liệu" className="order-last w-full lg:order-0 lg:w-auto flex items-center p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] gap-1 shrink-0">
            {documentViews.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={viewMode === id}
                onClick={() => setViewMode(id)}
                className={`flex flex-1 lg:flex-none items-center justify-center gap-1.5 px-1 sm:px-3 min-h-11 lg:min-h-8 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === id
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] font-bold shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon size={14} className="shrink-0" aria-hidden="true" />
                {label}{id === "questions" ? ` (${questions.length})` : ""}
              </button>
            ))}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            aria-label="Chuyển đổi và lưu tài liệu"
            className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 sm:px-3 text-xs font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-background)] rounded-xl transition-colors shadow-xs"
            title="Chuyển đổi thành PowerPoint, PDF, Word, HTML Offline"
          >
            <Download size={14} className="text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Chuyển đổi & Lưu</span>
            <span className="sm:hidden">Lưu</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            aria-label="Chia sẻ tài liệu"
            className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 sm:px-3 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs"
          >
            <Share2 size={14} />{" "}
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] border border-[var(--color-border)] transition-colors hidden sm:block"
            title="Chế độ toàn màn hình"
          >
            <Maximize2 size={16} />
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main View Area: 100% height and width without collapse */}
      <main className="flex-1 min-h-0 w-full h-full flex overflow-hidden relative">
        {viewMode === "doc" ? (
          renderDocumentView()
        ) : viewMode === "questions" ? (
          renderQuestionsList()
        ) : (
          <div className="flex-1 min-h-0 w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
              {renderDocumentView()}
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
              {renderQuestionsList()}
            </div>
          </div>
        )}
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentName={doc.name}
        shareUrl={shareUrl}
        sourceType={doc.sourceType}
      />

      {/* Export & Offline Conversion Modal Dialog */}
      <ExportDocumentModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={doc}
        questions={questions}
        rawFile={rawFile}
        htmlContent={htmlContent}
      />
    </div>
  );
};
