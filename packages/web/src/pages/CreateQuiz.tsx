import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ChevronLeft,
  UploadCloud,
  FileText,
  FolderKanban,
  Calculator,
  Info,
  Wand2,
  ArrowRight,
  Search,
  HelpCircle,
  Award,
  FileUp,
  AlertCircle,
  Columns2,
  Eye,
  Code2,
  X,
} from "lucide-react";
import { AdvancedDocumentParser, autoRepairAllQuestions } from "@ltvquiz/shared";
import type { Question, LibraryResource } from "@ltvquiz/shared";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { StorageService } from "../services/storageService";
import { LibraryStorageService } from "../services/libraryStorageService";
import { parseDocument } from "../services/parserService";
import { KahootLoader } from "../components/KahootLoader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { SelectFromLibraryModal } from "../components/library/SelectFromLibraryModal";
import { ScoreDistributionModal } from "../components/editor/ScoreDistributionModal";
import { QuizInfoModal } from "../components/editor/QuizInfoModal";
import { AzotaCodeEditor } from "../components/editor/AzotaCodeEditor";
import { AzotaQuestionCards } from "../components/editor/AzotaQuestionCards";
import {
  DevicePreviewWrapper,
  type ViewportMode,
} from "../components/editor/DevicePreviewWrapper";
import {
  validateUploadFile,
  formatFileSize,
  updateRawTextOption,
  questionsToAzotaText,
} from "./createQuizHelper";
import { EXAM_TEMPLATES } from "../data/examTemplates";

export function CreateQuiz() {
  useDocumentTitle("12/4 LTVQuiz - Tạo bài kiểm tra");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Workflow Stage: "upload" (Stage 1) -> "workspace" (Stage 2: Azota Editor)
  const [creationStage, setCreationStage] = useState<"upload" | "workspace">(
    "upload",
  );
  const outletContext = useOutletContext<{
    setFullscreenMode?: (val: boolean) => void;
  } | null>();

  useEffect(() => {
    outletContext?.setFullscreenMode?.(creationStage === "workspace");
    return () => {
      outletContext?.setFullscreenMode?.(false);
    };
  }, [creationStage, outletContext]);

  // Upload Screen State
  const [docSourceType, setDocSourceType] = useState<"upload" | "library">(
    "upload",
  );
  const [isDragging, setIsDragging] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");

  const libraryResources = useMemo(() => {
    return LibraryStorageService.searchResources({
      query: docSearchQuery,
      includeDeleted: false,
    });
  }, [docSearchQuery]);

  // Exam Meta State
  const [examTitle, setExamTitle] = useState(
    "CÂU HỎI ÔN TẬP GIỮA KỲ 1 MÔN CÔNG NGHỆ ĐIỆN 12.docx",
  );
  const [timeLimit, setTimeLimit] = useState(45);
  const [description, setDescription] = useState("");

  // Editor & Parsing State
  const [rawText, setRawText] = useState(EXAM_TEMPLATES[5].content);
  const [questions, setQuestions] = useState<Question[]>(() => {
    const parser = new AdvancedDocumentParser({});
    return parser.parse(EXAM_TEMPLATES[5].content);
  });

  // UI Modals & Navigation
  const [viewportMode, setViewportMode] = useState<ViewportMode>("split");
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<"preview" | "editor">("preview");
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [jumpQuestionNum, setJumpQuestionNum] = useState<string>("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("Đang xử lý tài liệu...");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isCancelConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCancelConfirmOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCancelConfirmOpen]);

  // Debounced parsing when rawText is modified directly
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromCardRef = useRef(false);

  const handleRawTextChange = useCallback((newText: string) => {
    setRawText(newText);

    if (isUpdatingFromCardRef.current) {
      isUpdatingFromCardRef.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const parser = new AdvancedDocumentParser({});
        const parsed = parser.parse(newText);
        setQuestions(parsed);
      } catch (err) {
        console.warn("Parse error:", err);
      }
    }, 250);
  }, []);

  // When clicking an option in Question Cards, toggle correct answer with two-way sync
  const handleSelectOptionAsCorrect = useCallback(
    (questionIndex: number, optionId: string) => {
      const q = questions[questionIndex];
      if (!q) return;

      const opt = q.options.find((o) => o.id === optionId);
      if (!opt) return;

      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...q,
        correctAnswer: [optionId],
        validation: {
          ...q.validation,
          status: "valid",
          warnings: [],
        },
      };
      setQuestions(updatedQuestions);

      // Update asterisk in rawText
      isUpdatingFromCardRef.current = true;
      const updatedText = updateRawTextOption(
        rawText,
        questionIndex,
        opt.label,
      );
      setRawText(updatedText);
    },
    [questions, rawText],
  );

  // Update Points per question
  const handleUpdateQuestionPoints = useCallback(
    (questionIndex: number, points: number) => {
      setQuestions((prev) => {
        const next = [...prev];
        if (next[questionIndex]) {
          next[questionIndex] = {
            ...next[questionIndex],
            points,
          };
        }
        return next;
      });
    },
    [],
  );

  // Delete question
  const handleDeleteQuestion = useCallback(
    (questionIndex: number) => {
      if (!window.confirm(`Bạn có chắc muốn xóa Câu ${questionIndex + 1}?`))
        return;
      const nextQuestions = questions.filter((_, idx) => idx !== questionIndex);
      setQuestions(nextQuestions);
      setRawText(questionsToAzotaText(nextQuestions));
    },
    [questions],
  );

  // Duplicate question
  const handleDuplicateQuestion = useCallback(
    (questionIndex: number) => {
      const target = questions[questionIndex];
      if (!target) return;

      const newId = "q_" + Math.random().toString(36).substr(2, 6);
      const duplicated: Question = {
        ...target,
        id: newId,
        options: target.options.map((opt) => ({
          ...opt,
          id: "opt_" + Math.random().toString(36).substr(2, 6),
        })),
      };

      const nextQuestions = [...questions];
      nextQuestions.splice(questionIndex + 1, 0, duplicated);
      setQuestions(nextQuestions);
      setRawText(questionsToAzotaText(nextQuestions));
    },
    [questions],
  );

  // Apply Score Distribution (Chia điểm)
  const handleApplyPoints = useCallback((pointsPerQuestion: number) => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        points: pointsPerQuestion,
      })),
    );
    setNotice(`Đã chia đều ${pointsPerQuestion} điểm cho mỗi câu hỏi!`);
    setTimeout(() => setNotice(null), 3000);
  }, []);

  // Jump to question
  const handleJumpToQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(jumpQuestionNum, 10);
    if (isNaN(num) || num < 1 || num > questions.length) {
      setNotice(`Vui lòng nhập số câu từ 1 đến ${questions.length}.`);
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    setMobileWorkspaceTab("preview");
    const el = document.getElementById(`question-card-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[var(--color-primary)]");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[var(--color-primary)]");
      }, 1500);
    }
  };

  // Auto repair all questions
  const handleAutoRepair = () => {
    if (questions.length === 0) return;
    const result = autoRepairAllQuestions(questions);
    setQuestions(result.questions);
    setRawText(questionsToAzotaText(result.questions));
    setNotice(
      `Tự động sửa hoàn tất: ${result.repairedCount} câu (${result.totalIssuesFixed} vấn đề được khắc phục).`,
    );
    setTimeout(() => setNotice(null), 3500);
  };

  // Upload file handler
  const processUploadedFile = async (file: File) => {
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorBanner(validation.error || "Tệp không hợp lệ.");
      return;
    }

    setErrorBanner(null);
    setIsProcessing(true);
    setProcessingText("Đang bóc tách đề thi từ tệp...");
    try {
      const result = await parseDocument(file, (msg) => setProcessingText(msg));
      setQuestions(result.questions);
      setRawText(questionsToAzotaText(result.questions));
      setExamTitle(file.name);
      // Advance to Workspace
      setCreationStage("workspace");
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể đọc nội dung tài liệu.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        setErrorBanner("Chỉ hỗ trợ tải lên một tài liệu mỗi lần.");
        return;
      }
      processUploadedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Select resource from Library Kho đề
  const handleSelectLibraryResource = async (resource: LibraryResource) => {
    setErrorBanner(null);
    setIsProcessing(true);
    setProcessingText("Đang tải dữ liệu từ Kho đề...");
    try {
      if (
        resource.resourceType === "source_document" ||
        resource.resourceType === "document"
      ) {
        const docId =
          resource.documentId ||
          resource.sourceDocumentId ||
          resource.id.replace("res_doc_", "");
        const file = await StorageService.getFile(docId);
        if (file) {
          await processUploadedFile(file);
        } else {
          setErrorBanner("Không tìm thấy tệp nhị phân của tài liệu.");
        }
      } else if (resource.resourceType === "question_set") {
        const loadedQuestions =
          resource.metadata?.questions || resource.questions || [];
        setQuestions(loadedQuestions);
        setRawText(questionsToAzotaText(loadedQuestions));
        setExamTitle(resource.displayName);
        setCreationStage("workspace");
      } else if (resource.resourceType === "exam") {
        const quiz =
          resource.metadata?.quiz ||
          (resource.quizId ? StorageService.getQuiz(resource.quizId) : null);
        if (quiz) {
          setQuestions(quiz.questions);
          setRawText(questionsToAzotaText(quiz.questions));
          setExamTitle(quiz.title);
          setTimeLimit(quiz.settings.timeLimit || 45);
          setCreationStage("workspace");
        }
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể nạp tài nguyên từ Kho đề.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Proceed / Continue to publish/full editor
  const handleProceed = () => {
    if (questions.length === 0) {
      setNotice("Đề thi chưa có câu hỏi nào. Vui lòng nhập hoặc nạp câu hỏi.");
      setTimeout(() => setNotice(null), 3500);
      return;
    }

    const quiz = StorageService.createDraftQuiz(
      examTitle.trim() || "Bài kiểm tra mới",
      questions,
    );
    quiz.description = description;
    quiz.settings = {
      ...quiz.settings,
      timeLimit: timeLimit > 0 ? timeLimit : 45,
    };
    StorageService.saveQuiz(quiz);

    navigate(`/editor/${quiz.id}`);
  };

  // Cancel / Return to upload screen
  const handleCancelWorkspace = () => {
    setIsCancelConfirmOpen(true);
  };

  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [questions]);

  return (
    <>
      {isProcessing && <KahootLoader text={processingText} />}

      {/* Hidden File Input for Native File Browser */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 1: THẢ FILE / CHỌN TÀI LIỆU VÀO TRƯỚC               */}
      {/* ============================================================== */}
      {creationStage === "upload" && (
        <div className="w-full flex flex-col h-full animate-stage-enter">
          {/* Header */}
          <div className="pb-3 border-b border-[var(--color-border)] shrink-0 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight">
                Tạo bài kiểm tra từ tài liệu
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Chuyển đổi tài liệu bài giảng Word/PDF/TXT thành đề thi trắc nghiệm tự động
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreationStage("workspace")}
              className="min-h-[38px] text-xs font-semibold"
            >
              <Code2 size={14} aria-hidden="true" />
              <span>Soạn thảo đề trực tiếp</span>
            </Button>
          </div>

          {errorBanner && (
            <div
              role="alert"
              className="mb-4 flex items-center justify-between gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium animate-notice-enter"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
                <span>{errorBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                aria-label="Đóng thông báo lỗi"
                className="p-1 rounded hover:bg-rose-500/15 cursor-pointer"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Source Switcher: Upload new file vs Pick from library */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                aria-pressed={docSourceType === "upload"}
                onClick={() => setDocSourceType("upload")}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                  docSourceType === "upload"
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <UploadCloud size={15} aria-hidden="true" />
                <span>Tải tài liệu mới lên</span>
              </button>

              <button
                type="button"
                aria-pressed={docSourceType === "library"}
                onClick={() => setDocSourceType("library")}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                  docSourceType === "library"
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                <FolderKanban size={15} aria-hidden="true" />
                <span>Chọn từ Kho đề ({libraryResources.length})</span>
              </button>
            </div>

            {/* Upload Zone (Drag & Drop) */}
            {docSourceType === "upload" && (
              <Card
                role="button"
                aria-label="Chọn hoặc kéo thả file PDF, DOCX, TXT, MD để tạo bài kiểm tra"
                className={`p-8 sm:p-10 text-center border-dashed border-2 transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer w-full rounded-2xl
                  ${
                    isDragging
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.005]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 bg-[var(--color-surface)]"
                  }
                `}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 transition-transform duration-200
                  ${
                    isDragging
                      ? "bg-[var(--color-primary)] text-white scale-105 shadow-md"
                      : "bg-[var(--color-background)] text-[var(--color-primary-text)] border border-[var(--color-border)]"
                  }
                `}
                >
                  <UploadCloud className="w-7 h-7" aria-hidden="true" />
                </div>

                <h2 className="text-lg font-bold text-[var(--color-text)] mb-1">
                  {isDragging
                    ? "Thả file để tải lên"
                    : "Tải tài liệu đề thi lên"}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mb-6">
                  Kéo thả file PDF, DOCX, TXT vào đây hoặc nhấn để duyệt từ máy tính
                </p>

                <span className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-semibold text-[var(--color-text)] shadow-2xs">
                  Chọn tài liệu từ máy tính
                </span>

                <p className="text-xs text-[var(--color-text-secondary)] mt-6">
                  Hỗ trợ định dạng PDF, Word (.docx), Văn bản (.txt, .md) • Tối đa 25MB
                </p>
              </Card>
            )}

            {/* Kho đề Library Integration */}
            {docSourceType === "library" && (
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 animate-panel-enter">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <label htmlFor="create-doc-search" className="sr-only">
                      Tìm tài liệu trong Kho đề
                    </label>
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
                    />
                    <input
                      id="create-doc-search"
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder="Tìm tài liệu gốc, câu hỏi, đề thi trong Kho đề..."
                      className="w-full text-xs h-10 pl-9 pr-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => setIsLibraryModalOpen(true)}
                    className="text-xs h-10 px-3.5 gap-1.5 shrink-0 shadow-2xs font-semibold"
                  >
                    <FolderKanban size={14} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                    <span>Duyệt cây thư mục Kho đề</span>
                  </Button>
                </div>

                {libraryResources.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--color-text-secondary)] space-y-3">
                    <p>Chưa tìm thấy tài nguyên nào trong Kho đề.</p>
                    <Button
                      variant="primary"
                      onClick={() => setDocSourceType("upload")}
                      className="text-xs h-9 px-3"
                    >
                      Tải tài liệu mới lên
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/40 divide-y divide-[var(--color-border)] max-h-[420px] overflow-y-auto custom-scrollbar">
                    {libraryResources.map((res) => (
                      <div
                        key={res.id}
                        className="px-4 py-3 hover:bg-[var(--color-background)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            aria-hidden="true"
                            className={`shrink-0 ${
                              res.resourceType === "source_document"
                                ? "text-[var(--color-primary-text)]"
                                : res.resourceType === "question_set"
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            {res.resourceType === "source_document" ? (
                              <FileText size={18} />
                            ) : res.resourceType === "question_set" ? (
                              <HelpCircle size={18} />
                            ) : (
                              <Award size={18} />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-semibold text-sm text-[var(--color-text)] truncate"
                              title={res.displayName}
                            >
                              {res.displayName}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-0.5 flex-wrap">
                              <span className="font-medium text-[var(--color-text-secondary)]">
                                {res.resourceType === "source_document"
                                  ? `Tài liệu (${res.fileExtension?.toUpperCase() || "FILE"})`
                                  : res.resourceType === "question_set"
                                  ? `Bộ ${res.metadata?.questions?.length || 0} câu`
                                  : "Đề kiểm tra"}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(res.updatedAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                              {res.fileSize ? (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(res.fileSize)}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectLibraryResource(res)}
                          className="min-h-[38px] py-1.5 px-3.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.98] shrink-0 whitespace-nowrap"
                        >
                          <span>Bóc tách đề thi từ tệp này</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 2: GIAO DIỆN BIÊN TẬP & XEM TRƯỚC CHUẨN AZOTA       */}
      {/* ============================================================== */}
      {creationStage === "workspace" && (
        <div className="flex flex-col h-full bg-[var(--color-background)] overflow-hidden animate-stage-enter">
          {/* 1. Top Navigation Header */}
          <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-3 md:px-5 shrink-0 z-20 shadow-xs">
            {/* Left: Back + Exam Title Input */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 mr-2">
              <button
                type="button"
                onClick={handleCancelWorkspace}
                aria-label="Quay lại màn hình chọn tệp"
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
                title="Quay lại chọn tệp khác"
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>

              <label htmlFor="create-exam-title" className="sr-only">
                Tên đề kiểm tra
              </label>
              <input
                id="create-exam-title"
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="Nhập tên đề kiểm tra..."
                className="min-w-0 w-full text-xs md:text-sm font-semibold text-[var(--color-text)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-2.5 sm:px-3 py-1.5 focus:border-[var(--color-primary)] flex-1 max-w-xl transition-colors truncate"
                title="Nhấn để đổi tên đề thi"
              />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hidden sm:flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                title="Tải tệp khác để thay thế đề thi hiện tại"
              >
                <FileUp size={13} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                <span>Đổi file khác</span>
              </button>

              <button
                type="button"
                onClick={handleCancelWorkspace}
                className="min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleProceed}
                className="min-h-[36px] px-4 py-1.5 text-xs font-bold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>Tiếp tục</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* 2. Sub-Header Toolbar */}
          <div className="min-h-[48px] py-1.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 px-3 md:px-5 shrink-0">
            {/* Left Sub-toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScoreModalOpen(true)}
                className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-2xs transition-colors cursor-pointer active:scale-[0.98]"
                title="Tự động tính và chia điểm đều cho tất cả các câu hỏi"
              >
                <Calculator size={14} aria-hidden="true" />
                <span>Chia điểm</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors cursor-pointer"
                title="Xem và chỉnh sửa thông tin đề thi"
              >
                <Info size={14} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                <span>Thông tin đề</span>
              </button>

              {/* Jump to Question */}
              <form
                onSubmit={handleJumpToQuestion}
                className="flex items-center gap-1.5 text-xs"
              >
                <label
                  htmlFor="jump-question-input"
                  className="text-[var(--color-text-secondary)] font-medium hidden sm:inline"
                >
                  Đi đến câu
                </label>
                <input
                  id="jump-question-input"
                  type="number"
                  min="1"
                  max={questions.length}
                  value={jumpQuestionNum}
                  onChange={(e) => setJumpQuestionNum(e.target.value)}
                  className="w-12 h-8 text-xs font-bold tabular-nums text-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  className="h-8 px-2.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors cursor-pointer"
                >
                  Đến
                </button>
              </form>

              {/* Auto repair helper button */}
              <button
                type="button"
                onClick={handleAutoRepair}
                className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                title="Tự động chuẩn hóa câu hỏi và sửa các lỗi định dạng"
              >
                <Wand2 size={13} aria-hidden="true" className="text-amber-500" />
                <span className="hidden md:inline">Tự động sửa</span>
              </button>
            </div>

            {/* Right Info: Viewport switcher + Question Counter */}
            <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] shrink-0">
              {/* Desktop Viewport Mode Switcher (lg+) */}
              <div className="hidden lg:inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-0.5">
                {(
                  [
                    { id: "split" as const, label: "Chia đôi", icon: <Columns2 size={12} aria-hidden="true" /> },
                    { id: "desktop" as const, label: "Xem thẻ", icon: <Eye size={12} aria-hidden="true" /> },
                    { id: "editor" as const, label: "Mã nguồn", icon: <Code2 size={12} aria-hidden="true" /> },
                  ]
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={viewportMode === v.id}
                    onClick={() => setViewportMode(v.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      viewportMode === v.id
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--color-background)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] tabular-nums">
                <span className="font-bold text-[var(--color-text)]">
                  {questions.length}
                </span>
                <span>câu</span>
                <span>•</span>
                <span className="font-bold text-[var(--color-primary-text)]">
                  {totalPoints.toFixed(2)}đ
                </span>
              </div>
            </div>
          </div>

          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="px-4 py-2 bg-emerald-500/12 border-b border-emerald-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2 shrink-0 animate-notice-enter"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Đóng thông báo"
                className="p-1 rounded hover:bg-emerald-500/15 cursor-pointer"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Mobile/Tablet Workspace Tab Switcher (< lg) */}
          <div className="lg:hidden px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-pressed={mobileWorkspaceTab === "preview"}
              onClick={() => setMobileWorkspaceTab("preview")}
              className={`flex-1 min-h-11 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mobileWorkspaceTab === "preview"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              <Eye size={13} aria-hidden="true" />
              <span>Thẻ câu hỏi ({questions.length})</span>
            </button>
            <button
              type="button"
              aria-pressed={mobileWorkspaceTab === "editor"}
              onClick={() => setMobileWorkspaceTab("editor")}
              className={`flex-1 min-h-11 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mobileWorkspaceTab === "editor"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              <Code2 size={13} aria-hidden="true" />
              <span>Văn bản nguồn</span>
            </button>
          </div>

          {/* 3. Main Workspace */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="hidden lg:flex flex-1 min-h-0 flex-col">
              <DevicePreviewWrapper
                mode={viewportMode}
                onChangeMode={setViewportMode}
                previewContent={
                  <AzotaQuestionCards
                    questions={questions}
                    onSelectOptionAsCorrect={handleSelectOptionAsCorrect}
                    onUpdateQuestionPoints={handleUpdateQuestionPoints}
                    onDeleteQuestion={handleDeleteQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                  />
                }
                editorContent={
                  <AzotaCodeEditor
                    value={rawText}
                    onChange={handleRawTextChange}
                  />
                }
              />
            </div>

            <div className="lg:hidden flex-1 min-h-0 flex flex-col">
              {mobileWorkspaceTab === "preview" ? (
                <AzotaQuestionCards
                  questions={questions}
                  onSelectOptionAsCorrect={handleSelectOptionAsCorrect}
                  onUpdateQuestionPoints={handleUpdateQuestionPoints}
                  onDeleteQuestion={handleDeleteQuestion}
                  onDuplicateQuestion={handleDuplicateQuestion}
                />
              ) : (
                <AzotaCodeEditor
                  value={rawText}
                  onChange={handleRawTextChange}
                />
              )}
            </div>
          </div>

          {/* Cancel Confirmation Modal */}
          {isCancelConfirmOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-create-title"
              className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in"
            >
              <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xl space-y-4 animate-scale-up">
                <div>
                  <h2 id="cancel-create-title" className="text-base font-bold text-[var(--color-text)]">
                    Quay lại màn hình chọn tài liệu?
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    Các thay đổi chưa lưu trong trình soạn thảo hiện tại có thể bị mất nếu bạn quay lại.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                  >
                    Tiếp tục soạn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCancelConfirmOpen(false);
                      setCreationStage("upload");
                    }}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Modals */}
          <ScoreDistributionModal
            isOpen={isScoreModalOpen}
            onClose={() => setIsScoreModalOpen(false)}
            questionCount={questions.length}
            currentPoints={questions.map((q) => q.points || 0.25)}
            onApply={handleApplyPoints}
          />

          <QuizInfoModal
            isOpen={isInfoModalOpen}
            onClose={() => setIsInfoModalOpen(false)}
            title={examTitle}
            timeLimit={timeLimit}
            description={description}
            onSave={({ title, timeLimit: tl, description: desc }) => {
              setExamTitle(title);
              setTimeLimit(tl);
              setDescription(desc);
            }}
          />
        </div>
      )}

      {/* Select from Kho đề Library Modal */}
      <SelectFromLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectResource={handleSelectLibraryResource}
      />
    </>
  );
}
