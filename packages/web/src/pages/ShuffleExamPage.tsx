import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Shuffle,
  UploadCloud,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  FileArchive,
  RefreshCw,
  FolderKanban,
  ArrowRight,
  AlertCircle,
  Pencil,
  Save,
  Code2,
} from "lucide-react";
import {
  AdvancedDocumentParser,
  type Question,
  type LibraryResource,
} from "@ltvquiz/shared";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { parseDocument } from "../services/parserService";
import { StorageService } from "../services/storageService";
import { LibraryStorageService } from "../services/libraryStorageService";
import { downloadBlob, generateDocxBlob } from "../services/exportService";
import {
  createRandomSeed,
  generateMultipleVariantsAsync,
  recomputeVariantAnswerKey,
  MAX_SHUFFLE_VARIANTS,
  type ExamVariant,
} from "../services/shuffleService";
import {
  renderExamHtml,
  generateAllExamsZip,
} from "../services/examPdfService";
import {
  validateUploadFile,
  formatFileSize,
  questionsToAzotaText,
} from "./createQuizHelper";
import {
  clampVariantCount,
  filterVariantsByCode,
  formatExamVariantFilename,
  sanitizeFilename,
  stripFileExtension,
} from "./shuffleExamHelper";
import { KahootLoader } from "../components/KahootLoader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  InlineExamEditor,
  updateBlocksTextPreservingImages,
} from "../components/shuffle/InlineExamEditor";
import {
  InteractiveAnswerKeyTable,
  type AnswerEditScope,
} from "../components/shuffle/InteractiveAnswerKeyTable";

type WizardStep = "upload" | "preview" | "export";

const PRESET_COUNTS = [4, 8, 24, 100, 500, 1000];
const LIST_PAGE_SIZE = 40;

export function ShuffleExamPage() {
  useDocumentTitle("12/4 LTVQuiz - Xáo mã đề");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragCounter = useRef(0);

  const outletContext = useOutletContext<{
    setFullscreenMode?: (val: boolean) => void;
  } | null>();

  const [step, setStep] = useState<WizardStep>("upload");
  const [sourceTab, setSourceTab] = useState<"upload" | "library">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang đọc tài liệu...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsed questions & metadata
  const [questions, setQuestions] = useState<Question[]>([]);
  const [baseName, setBaseName] = useState("Đề kiểm tra");
  const [schoolName, setSchoolName] = useState("TRƯỜNG THPT LÊ QUÝ ĐÔN");
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Shuffle config
  const [variantCount, setVariantCount] = useState(8);
  const [startingCode, setStartingCode] = useState(101);
  const [randomCodes, setRandomCodes] = useState(false);
  const [optShuffleQuestions, setOptShuffleQuestions] = useState(true);
  const [optShuffleOptions, setOptShuffleOptions] = useState(true);
  const [optShuffleTfStatements, setOptShuffleTfStatements] = useState(false);
  const [optShuffleShortAnswer, setOptShuffleShortAnswer] = useState(true);
  const [optPinSummaryOptions, setOptPinSummaryOptions] = useState(true);
  const [optBalanceAnswers, setOptBalanceAnswers] = useState(false);
  const [optGroupBySection, setOptGroupBySection] = useState(true);
  const [optPreserveMediaChemistry, setOptPreserveMediaChemistry] = useState(true);

  // Direct editor state (source exam & active variant)
  const [leftPaneMode, setLeftPaneMode] = useState<"config" | "source_editor">("config");
  const [mobilePaneTab, setMobilePaneTab] = useState<"list" | "preview">("preview");
  const [sourceEditorFormat, setSourceEditorFormat] = useState<"visual" | "raw">("visual");
  const [rawSourceText, setRawSourceText] = useState("");
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);

  // Generated variants & preview selection
  const [variants, setVariants] = useState<ExamVariant[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [codeSearchQuery, setCodeSearchQuery] = useState("");
  const [listPage, setListPage] = useState(0);
  const [previewTab, setPreviewTab] = useState<"pdf" | "answer_key" | "edit_variant">("pdf");
  const [showAnswersInPreview, setShowAnswersInPreview] = useState(false);
  const [previewFontSize, setPreviewFontSize] = useState<number>(12.5);
  const [previewColumnsMode, setPreviewColumnsMode] = useState<"auto" | "1" | "2" | "4">("auto");
  const [interactivePreviewEdit, setInteractivePreviewEdit] = useState(false);
  const [shuffleProgress, setShuffleProgress] = useState<{
    active: boolean;
    done: number;
    total: number;
  }>({ active: false, done: 0, total: 0 });

  // Export state
  const [includeMasterKey, setIncludeMasterKey] = useState(true);
  const [includeCsvKey, setIncludeCsvKey] = useState(true);
  const [includeCombinedPrint, setIncludeCombinedPrint] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    active: boolean;
    done: number;
    total: number;
  }>({ active: false, done: 0, total: 0 });
  const [zipCompleted, setZipCompleted] = useState(false);

  // Enter fullscreen split-screen layout in step 2 ("preview")
  useEffect(() => {
    outletContext?.setFullscreenMode?.(step === "preview");
    return () => {
      outletContext?.setFullscreenMode?.(false);
    };
  }, [step, outletContext]);

  const libraryResources = useMemo(() => {
    return LibraryStorageService.searchResources({
      query: "",
      includeDeleted: false,
    });
  }, []);

  const runShuffle = useCallback(
    async (
      sourceQuestions: Question[],
      countOverride?: number,
    ) => {
      if (sourceQuestions.length === 0) return;
      const safeCount = clampVariantCount(countOverride ?? variantCount);
      setShuffleProgress({ active: true, done: 0, total: safeCount });

      const result = await generateMultipleVariantsAsync(
        sourceQuestions,
        {
          baseName,
          variantCount: safeCount,
          shuffleQuestions: optShuffleQuestions,
          shuffleOptions: optShuffleOptions,
          shuffleTrueFalseStatements: optShuffleTfStatements,
          shuffleShortAnswer: optShuffleShortAnswer,
          pinSummaryOptions: optPinSummaryOptions,
          balanceAnswers: optBalanceAnswers,
          ensureUniqueVariants: true,
          groupBySection: optGroupBySection,
          preserveMediaChemistry: optPreserveMediaChemistry,
          startingCode,
          codeDigits: 3,
          randomCodes,
          seed: createRandomSeed(),
        },
        (done, total) => {
          setShuffleProgress({ active: true, done, total });
        },
      );

      setVariants(result);
      setSelectedCode(result[0]?.examCode || "");
      setListPage(0);
      setZipCompleted(false);
      setShuffleProgress({ active: false, done: 0, total: 0 });
    },
    [
      variantCount,
      baseName,
      optShuffleQuestions,
      optShuffleOptions,
      optShuffleTfStatements,
      optShuffleShortAnswer,
      optPinSummaryOptions,
      optBalanceAnswers,
      optGroupBySection,
      optPreserveMediaChemistry,
      startingCode,
      randomCodes,
    ],
  );

  const handleOpenSourceEditor = () => {
    setRawSourceText(questionsToAzotaText(questions));
    setSourceNotice(null);
    setLeftPaneMode("source_editor");
  };

  const handleSwitchSourceFormat = (fmt: "visual" | "raw") => {
    if (fmt === "raw") {
      setRawSourceText(questionsToAzotaText(questions));
    } else if (sourceEditorFormat === "raw") {
      const parser = new AdvancedDocumentParser({});
      const parsed = parser.parse(rawSourceText);
      if (parsed.length > 0) {
        setQuestions(parsed);
      }
    }
    setSourceEditorFormat(fmt);
  };

  const handleSourceQuestionsChange = (nextQuestions: Question[]) => {
    setQuestions(nextQuestions);
    setSourceNotice(null);
  };

  const handleApplySourceAndReshuffle = async () => {
    let latestQuestions = questions;
    if (sourceEditorFormat === "raw") {
      const parser = new AdvancedDocumentParser({});
      const parsed = parser.parse(rawSourceText);
      if (parsed.length === 0) {
        setSourceNotice("Không nhận diện được câu hỏi hợp lệ trong văn bản.");
        return;
      }
      latestQuestions = parsed;
      setQuestions(parsed);
    }

    await runShuffle(latestQuestions, variantCount);
    setSourceNotice(`Đã áp dụng & xáo lại ${variantCount} mã đề từ ${latestQuestions.length} câu hỏi.`);
  };

  const handleDownloadSourceDocx = async () => {
    let latestQuestions = questions;
    if (sourceEditorFormat === "raw") {
      const parser = new AdvancedDocumentParser({});
      const parsed = parser.parse(rawSourceText);
      if (parsed.length > 0) {
        latestQuestions = parsed;
        setQuestions(parsed);
      }
    }
    const blob = await generateDocxBlob(baseName || "De_kiem_tra", latestQuestions);
    const filename = `${sanitizeFilename(baseName) || "De_kiem_tra"}-de-goc.docx`;
    downloadBlob(blob, filename);
    setSourceNotice(`Đã tải xuống file nguồn ${filename}.`);
  };

  const handleEditActiveVariant = (nextQuestions: Question[]) => {
    if (!activeVariant) return;
    const targetCode = activeVariant.examCode;
    // Sync edited questions back to source questions state so reshuffling preserves edits
    setQuestions((prevQuestions) => {
      const nextMap = new Map(nextQuestions.map((q) => [q.id, q]));
      return prevQuestions.map((q) => nextMap.get(q.id) || q);
    });
    setVariants((prev) =>
      prev.map((v) =>
        v.examCode === targetCode
          ? {
              ...v,
              questions: nextQuestions,
              answerKey: recomputeVariantAnswerKey(
                nextQuestions,
                questions,
                v.answerKey,
              ),
            }
          : v,
      ),
    );
    setZipCompleted(false);
  };

  const handleUpdateAnswerFromTable = (
    questionId: string,
    newCorrectAnswer: string[],
    scope: AnswerEditScope,
  ) => {
    if (scope === "all_variants") {
      const nextSource = questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: newCorrectAnswer } : q,
      );
      setQuestions(nextSource);

      setVariants((prev) =>
        prev.map((v) => {
          const nextVariantQuestions = v.questions.map((q) =>
            q.id === questionId ? { ...q, correctAnswer: newCorrectAnswer } : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              nextSource,
              v.answerKey,
            ),
          };
        }),
      );
    } else {
      if (!activeVariant) return;
      const targetCode = activeVariant.examCode;
      setVariants((prev) =>
        prev.map((v) => {
          if (v.examCode !== targetCode) return v;
          const nextVariantQuestions = v.questions.map((q) =>
            q.id === questionId ? { ...q, correctAnswer: newCorrectAnswer } : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              questions,
              v.answerKey,
            ),
          };
        }),
      );
    }
    setZipCompleted(false);
  };

  const handleBatchApplyAnswers = (
    updates: Map<string, string[]>,
    scope: AnswerEditScope,
  ) => {
    if (scope === "all_variants") {
      const nextSource = questions.map((q) =>
        updates.has(q.id) ? { ...q, correctAnswer: updates.get(q.id)! } : q,
      );
      setQuestions(nextSource);

      setVariants((prev) =>
        prev.map((v) => {
          const nextVariantQuestions = v.questions.map((q) =>
            updates.has(q.id) ? { ...q, correctAnswer: updates.get(q.id)! } : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              nextSource,
              v.answerKey,
            ),
          };
        }),
      );
    } else {
      if (!activeVariant) return;
      const targetCode = activeVariant.examCode;
      setVariants((prev) =>
        prev.map((v) => {
          if (v.examCode !== targetCode) return v;
          const nextVariantQuestions = v.questions.map((q) =>
            updates.has(q.id) ? { ...q, correctAnswer: updates.get(q.id)! } : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              questions,
              v.answerKey,
            ),
          };
        }),
      );
    }
    setZipCompleted(false);
  };

  const handleUpdateQuestionTextFromTable = (
    questionId: string,
    nextQuestion: Question,
    scope: AnswerEditScope,
  ) => {
    if (scope === "all_variants") {
      const nextSource = questions.map((q) =>
        q.id === questionId ? nextQuestion : q,
      );
      setQuestions(nextSource);

      setVariants((prev) =>
        prev.map((v) => {
          const nextOptById = new Map(
            (nextQuestion.options || []).map((o) => [o.id, o.content]),
          );
          const nextVariantQuestions = v.questions.map((q) =>
            q.id === questionId
              ? {
                  ...nextQuestion,
                  options: (q.options || []).map((opt) => ({
                    ...opt,
                    content: nextOptById.get(opt.id) || opt.content,
                  })),
                }
              : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              nextSource,
              v.answerKey,
            ),
          };
        }),
      );
    } else {
      if (!activeVariant) return;
      const targetCode = activeVariant.examCode;
      setVariants((prev) =>
        prev.map((v) => {
          if (v.examCode !== targetCode) return v;
          const nextVariantQuestions = v.questions.map((q) =>
            q.id === questionId ? nextQuestion : q,
          );
          return {
            ...v,
            questions: nextVariantQuestions,
            answerKey: recomputeVariantAnswerKey(
              nextVariantQuestions,
              questions,
              v.answerKey,
            ),
          };
        }),
      );
    }
    setZipCompleted(false);
  };

  const handleMoveQuestionInVariant = (idx: number, direction: -1 | 1) => {
    if (!activeVariant) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= activeVariant.questions.length) return;
    const nextQ = activeVariant.questions.slice();
    const tmp = nextQ[idx];
    nextQ[idx] = nextQ[targetIdx];
    nextQ[targetIdx] = tmp;
    handleEditActiveVariant(nextQ);
  };

  const handleRemoveQuestionInVariant = (idx: number) => {
    if (!activeVariant || activeVariant.questions.length <= 1) return;
    const nextQ = activeVariant.questions.filter((_, i) => i !== idx);
    handleEditActiveVariant(nextQ);
  };

  const loadQuestionsIntoWorkspace = async (
    loadedQuestions: Question[],
    title: string,
  ) => {
    if (loadedQuestions.length === 0) {
      setErrorMsg("Không tìm thấy câu hỏi nào trong tài liệu. Vui lòng kiểm tra lại định dạng đề thi.");
      return;
    }
    setQuestions(loadedQuestions);
    setBaseName(title);
    setErrorMsg(null);
    await runShuffle(loadedQuestions, variantCount);
    setStep("preview");
  };

  const handleFile = async (file: File) => {
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Tệp không hợp lệ.");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText("Đang phân tích cấu trúc đề thi...");

    try {
      const parsed = await parseDocument(file, (msg) => setLoadingText(msg));
      await loadQuestionsIntoWorkspace(
        parsed.questions,
        stripFileExtension(file.name),
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể đọc nội dung tệp.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickLibraryResource = async (res: LibraryResource) => {
    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText(`Đang nạp "${res.displayName}"...`);
    try {
      if (
        res.resourceType === "document" ||
        res.resourceType === "source_document"
      ) {
        const docId =
          res.documentId ||
          res.sourceDocumentId ||
          res.id.replace("res_doc_", "");
        const file = await StorageService.getFile(docId);
        if (!file) {
          throw new Error("Không tìm thấy tệp gốc trong bộ nhớ trình duyệt.");
        }
        const parsed = await parseDocument(file, (msg) => setLoadingText(msg));
        await loadQuestionsIntoWorkspace(
          parsed.questions,
          stripFileExtension(res.displayName),
        );
      } else if (res.resourceType === "question_set") {
        const qs = res.metadata?.questions || res.questions || [];
        await loadQuestionsIntoWorkspace(qs, stripFileExtension(res.displayName));
      } else if (res.resourceType === "exam") {
        const quiz =
          res.metadata?.quiz ||
          (res.quizId ? StorageService.getQuiz(res.quizId) : null);
        if (!quiz) {
          throw new Error("Không tìm thấy dữ liệu bài thi.");
        }
        await loadQuestionsIntoWorkspace(
          quiz.questions,
          stripFileExtension(quiz.title),
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Lỗi khi tải tài nguyên từ Kho đề.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVariants = useMemo(
    () => filterVariantsByCode(variants, codeSearchQuery),
    [variants, codeSearchQuery],
  );

  const totalListPages = Math.max(
    1,
    Math.ceil(filteredVariants.length / LIST_PAGE_SIZE),
  );
  const clampedPage = Math.min(listPage, totalListPages - 1);
  const visibleVariants = useMemo(() => {
    const start = clampedPage * LIST_PAGE_SIZE;
    return filteredVariants.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredVariants, clampedPage]);

  const activeVariant = useMemo(() => {
    return (
      variants.find((v) => v.examCode === selectedCode) || variants[0] || null
    );
  }, [variants, selectedCode]);

  const previewHtml = useMemo(() => {
    if (!activeVariant) return "";
    return renderExamHtml(activeVariant, {
      baseName,
      schoolName,
      examTitle: baseName,
      durationMinutes,
      showAnswers: showAnswersInPreview,
      includePrintToolbar: false,
      fontSizePt: previewFontSize,
      columnsMode: previewColumnsMode,
      interactiveEdit: interactivePreviewEdit,
    });
  }, [
    activeVariant,
    baseName,
    schoolName,
    durationMinutes,
    showAnswersInPreview,
    previewFontSize,
    previewColumnsMode,
    interactivePreviewEdit,
  ]);

  const isIframeLocalEditRef = useRef(false);
  const [iframeSrcDoc, setIframeSrcDoc] = useState(() => previewHtml);

  const lastConfigRef = useRef({
    code: selectedCode,
    fontSize: previewFontSize,
    columns: previewColumnsMode,
    showAnswers: showAnswersInPreview,
    interactive: interactivePreviewEdit,
    tab: previewTab,
  });

  useEffect(() => {
    const configChanged =
      lastConfigRef.current.code !== selectedCode ||
      lastConfigRef.current.fontSize !== previewFontSize ||
      lastConfigRef.current.columns !== previewColumnsMode ||
      lastConfigRef.current.showAnswers !== showAnswersInPreview ||
      lastConfigRef.current.interactive !== interactivePreviewEdit ||
      lastConfigRef.current.tab !== previewTab;

    lastConfigRef.current = {
      code: selectedCode,
      fontSize: previewFontSize,
      columns: previewColumnsMode,
      showAnswers: showAnswersInPreview,
      interactive: interactivePreviewEdit,
      tab: previewTab,
    };

    if (configChanged) {
      // Toolbar or display config changed: reload iframe with fresh HTML
      setIframeSrcDoc(previewHtml);
    } else if (!isIframeLocalEditRef.current) {
      // External change (e.g. initial load or reshuffle)
      setIframeSrcDoc(previewHtml);
    } else {
      // Local in-iframe keystroke / edit: keep srcDoc untouched to avoid reload & scroll jump
      isIframeLocalEditRef.current = false;
    }
  }, [
    previewHtml,
    selectedCode,
    previewFontSize,
    previewColumnsMode,
    showAnswersInPreview,
    interactivePreviewEdit,
    previewTab,
  ]);

  const flushIframeEdits = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: "PREVIEW_FLUSH_EDITS" },
          "*",
        );
      } catch {
        // ignore cross-origin or unmounted iframe
      }
    }
  }, []);

  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const activeVariantRef = useRef(activeVariant);
  activeVariantRef.current = activeVariant;

  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      const currentActive = activeVariantRef.current;
      if (!currentActive) return;
      const { type, field, value, questionIndex, optId, isTf } = e.data;

      if (type === "PREVIEW_UPDATE_HEADER") {
        isIframeLocalEditRef.current = true;
        if (field === "schoolName" && typeof value === "string") setSchoolName(value);
        if (field === "examTitle" && typeof value === "string") setBaseName(value);
        if (field === "durationMinutes") {
          const d = parseInt(value, 10);
          if (!isNaN(d) && d > 0) setDurationMinutes(d);
        }
        return;
      }

      if (type === "PREVIEW_UPDATE_QUESTION_TEXT" && typeof questionIndex === "number") {
        const targetQ = currentActive.questions[questionIndex];
        if (!targetQ) return;
        const nextVal = value || "";
        isIframeLocalEditRef.current = true;

        // 1. Sync source questions state so reshuffles never reset the edit
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q.id === targetQ.id
              ? {
                  ...q,
                  question: updateBlocksTextPreservingImages(q.question, nextVal),
                }
              : q,
          ),
        );

        // 2. Sync active variant and other variants with this question
        setVariants((prevVariants) =>
          prevVariants.map((v) => {
            const hasQ = v.questions.some((q) => q.id === targetQ.id);
            if (!hasQ) return v;
            const updatedQuestions = v.questions.map((q) =>
              q.id === targetQ.id
                ? {
                    ...q,
                    question: updateBlocksTextPreservingImages(q.question, nextVal),
                  }
                : q,
            );
            return {
              ...v,
              questions: updatedQuestions,
            };
          }),
        );
        setZipCompleted(false);
        return;
      }

      if (
        type === "PREVIEW_UPDATE_OPTION_TEXT" &&
        typeof questionIndex === "number" &&
        typeof optId === "string"
      ) {
        const targetQ = currentActive.questions[questionIndex];
        if (!targetQ) return;
        const nextVal = value || "";
        isIframeLocalEditRef.current = true;

        // 1. Sync source questions state
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) => {
            if (q.id !== targetQ.id) return q;
            return {
              ...q,
              options: (q.options || []).map((opt) =>
                opt.id === optId
                  ? {
                      ...opt,
                      content: updateBlocksTextPreservingImages(opt.content, nextVal),
                    }
                  : opt,
              ),
            };
          }),
        );

        // 2. Sync variants
        setVariants((prevVariants) =>
          prevVariants.map((v) => {
            const hasQ = v.questions.some((q) => q.id === targetQ.id);
            if (!hasQ) return v;
            const updatedQuestions = v.questions.map((q) => {
              if (q.id !== targetQ.id) return q;
              return {
                ...q,
                options: (q.options || []).map((opt) =>
                  opt.id === optId
                    ? {
                        ...opt,
                        content: updateBlocksTextPreservingImages(opt.content, nextVal),
                      }
                    : opt,
                ),
              };
            });
            return {
              ...v,
              questions: updatedQuestions,
            };
          }),
        );
        setZipCompleted(false);
        return;
      }

      if (
        type === "PREVIEW_TOGGLE_CORRECT_ANSWER" &&
        typeof questionIndex === "number" &&
        typeof optId === "string"
      ) {
        const targetQ = currentActive.questions[questionIndex];
        if (!targetQ) return;
        isIframeLocalEditRef.current = true;

        let nextCorrect: string[];
        if (isTf) {
          const exists = (targetQ.correctAnswer || []).includes(optId);
          nextCorrect = exists
            ? (targetQ.correctAnswer || []).filter((id) => id !== optId)
            : [...(targetQ.correctAnswer || []), optId];
        } else {
          nextCorrect = [optId];
        }

        const nextSource = questionsRef.current.map((q) =>
          q.id === targetQ.id ? { ...q, correctAnswer: nextCorrect } : q,
        );
        setQuestions(nextSource);

        setVariants((prevVariants) =>
          prevVariants.map((v) => {
            const hasQ = v.questions.some((q) => q.id === targetQ.id);
            if (!hasQ) return v;
            const updatedQuestions = v.questions.map((q) =>
              q.id === targetQ.id ? { ...q, correctAnswer: nextCorrect } : q,
            );
            return {
              ...v,
              questions: updatedQuestions,
              answerKey: recomputeVariantAnswerKey(
                updatedQuestions,
                nextSource,
                v.answerKey,
              ),
            };
          }),
        );
        setZipCompleted(false);
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  const handlePrintActive = () => {
    flushIframeEdits();
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadZip = async () => {
    flushIframeEdits();
    if (variants.length === 0) return;
    setZipProgress({ active: true, done: 0, total: variants.length });
    try {
      const blob = await generateAllExamsZip(
        variants,
        {
          baseName,
          schoolName,
          examTitle: baseName,
          durationMinutes,
          includeMasterAnswerKey: includeMasterKey,
          includeCsvAnswerKey: includeCsvKey,
          includeCombinedPrintFile:
            includeCombinedPrint && variants.length <= 100,
        },
        (done, total) => setZipProgress({ active: true, done, total }),
      );
      const zipName = `${sanitizeFilename(baseName)} - ${variants.length} mã đề.zip`;
      downloadBlob(blob, zipName);
      setZipCompleted(true);
    } finally {
      setZipProgress({ active: false, done: 0, total: 0 });
    }
  };

  return (
    <>
      {isLoading && <KahootLoader text={loadingText} />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* ============================================================== */}
      {/* STEP 1: UPLOAD DOCUMENT                                        */}
      {/* ============================================================== */}
      {step === "upload" && (
        <div className="w-full flex flex-col gap-5 pb-10 animate-stage-enter">
          {/* Header */}
          <div className="pb-4 border-b border-[var(--color-border)]">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-2">
              <Shuffle size={22} aria-hidden="true" className="text-rose-500" />
              <span>Xáo mã đề tự động</span>
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Tải lên file PDF/DOCX để xáo đáp án A/B/C/D, thứ tự câu, Đúng/Sai và Trả lời ngắn thành nhiều mã đề
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium animate-notice-enter"
            >
              <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Source Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={sourceTab === "upload"}
              onClick={() => setSourceTab("upload")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                sourceTab === "upload"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <UploadCloud size={15} aria-hidden="true" />
              <span>Tải file PDF / DOCX mới</span>
            </button>

            <button
              type="button"
              aria-pressed={sourceTab === "library"}
              onClick={() => setSourceTab("library")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                sourceTab === "library"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              <FolderKanban size={15} aria-hidden="true" />
              <span>Chọn từ Kho đề ({libraryResources.length})</span>
            </button>
          </div>

          {sourceTab === "upload" ? (
            <Card
              role="button"
              tabIndex={0}
              aria-label="Chọn hoặc kéo thả file PDF, DOCX, TXT, MD để xáo mã đề"
              className={`p-8 sm:p-10 text-center border-dashed border-2 transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer w-full rounded-2xl ${
                isDragging
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.005]"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 bg-[var(--color-surface)]"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current++;
                setIsDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounter.current--;
                if (dragCounter.current <= 0) {
                  dragCounter.current = 0;
                  setIsDragging(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                dragCounter.current = 0;
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 transition-transform duration-200 ${
                  isDragging
                    ? "bg-[var(--color-primary)] text-white scale-105 shadow-md"
                    : "bg-[var(--color-background)] text-[var(--color-primary-text)] border border-[var(--color-border)]"
                }`}
              >
                <UploadCloud className="w-7 h-7" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-1">
                {isDragging
                  ? "Thả file đề thi vào đây"
                  : "Kéo thả file PDF hoặc Word (.docx) vào đây"}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5">
                Hỗ trợ tự động nhận diện Phần I (A/B/C/D), Phần II (Đúng/Sai a/b/c/d) và Phần III (Trả lời ngắn)
              </p>
              <span className="inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-semibold text-[var(--color-text)] shadow-2xs">
                Chọn file từ máy tính
              </span>
              <p className="text-xs text-[var(--color-text-secondary)] mt-5">
                Định dạng hỗ trợ: .pdf, .docx, .txt, .md • Tối đa 25MB
              </p>
            </Card>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)] animate-panel-enter">
              {libraryResources.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Kho đề chưa có tài liệu nào. Hãy tải lên file mới từ máy tính.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSourceTab("upload")}
                  >
                    Tải file mới lên
                  </Button>
                </div>
              ) : (
                libraryResources.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handlePickLibraryResource(res)}
                    className="w-full min-h-[56px] px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary-text)] flex items-center justify-center shrink-0">
                        <FileText size={18} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                          {res.displayName}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {res.resourceType === "exam"
                            ? "Đề kiểm tra"
                            : res.resourceType === "question_set"
                              ? "Bộ câu hỏi"
                              : "Tài liệu gốc"}
                          {res.fileSize ? ` • ${formatFileSize(res.fileSize)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-primary-text)] shrink-0">
                      Chọn để xáo
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: SPLIT-SCREEN CONFIG & PDF PREVIEW                      */}
      {/* ============================================================== */}
      {step === "preview" && (
        <div className="h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-text)] overflow-hidden animate-stage-enter">
          {/* Top Bar */}
          <header className="h-14 shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3 sm:px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setStep("upload")}
                aria-label="Quay lại chọn tài liệu khác"
                className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
                title="Chọn tài liệu khác"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <span className="font-bold text-sm truncate max-w-[180px] sm:max-w-[260px] block">
                  {baseName}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setStep("export")}
              disabled={variants.length === 0}
              className="text-xs px-3.5 sm:px-4 py-2 font-bold flex items-center gap-1.5 shrink-0"
            >
              <span>Xuất ZIP ({variants.length} đề)</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </header>

          {/* Mobile/Tablet Workspace Pane Switcher (< lg) */}
          <div className="lg:hidden shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3 py-2 flex items-center gap-2">
            <button
              type="button"
              aria-pressed={mobilePaneTab === "list"}
              onClick={() => setMobilePaneTab("list")}
              className={`flex-1 min-h-11 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobilePaneTab === "list"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              Cấu hình & Danh sách ({variants.length})
            </button>
            <button
              type="button"
              aria-pressed={mobilePaneTab === "preview"}
              onClick={() => setMobilePaneTab("preview")}
              className={`flex-1 min-h-11 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mobilePaneTab === "preview"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              Xem & Sửa Mã {activeVariant?.examCode || "---"}
            </button>
          </div>

          {/* Split-Screen Body */}
          <div className="flex-1 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT PANE (5 cols ~ 42%): Settings, Source Editor & Generated File List */}
            <aside
              className={`${
                mobilePaneTab === "list" ? "flex" : "hidden"
              } lg:flex lg:col-span-5 h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-0 min-w-0`}
            >
              {/* Left Pane Mode Tabs */}
              <div className="px-3 py-2 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 shrink-0 bg-[var(--color-background)]/40">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLeftPaneMode("config")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      leftPaneMode === "config"
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    Cấu hình & Xáo
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSourceEditor}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      leftPaneMode === "source_editor"
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Pencil size={12} />
                    <span>Sửa đề gốc</span>
                  </button>
                </div>

                {leftPaneMode === "source_editor" && (
                  <button
                    type="button"
                    onClick={handleDownloadSourceDocx}
                    title="Tải xuống đề gốc đã chỉnh sửa (.docx)"
                    className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[11px] font-semibold text-[var(--color-text)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Save size={12} />
                    <span>Lưu .docx</span>
                  </button>
                )}
              </div>

              {leftPaneMode === "source_editor" ? (
                <div key="left-source-editor" className="flex-1 min-h-0 flex flex-col animate-panel-enter">
                  {/* Source editor sub-toolbar */}
                  <div className="px-3 py-2 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-0.5 text-[11px]">
                      <button
                        type="button"
                        aria-pressed={sourceEditorFormat === "visual"}
                        onClick={() => handleSwitchSourceFormat("visual")}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          sourceEditorFormat === "visual"
                            ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        Dạng thẻ
                      </button>
                      <button
                        type="button"
                        aria-pressed={sourceEditorFormat === "raw"}
                        onClick={() => handleSwitchSourceFormat("raw")}
                        className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          sourceEditorFormat === "raw"
                            ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <Code2 size={11} aria-hidden="true" />
                        <span>Văn bản nguồn</span>
                      </button>
                    </div>

                    <Button
                      onClick={handleApplySourceAndReshuffle}
                      disabled={shuffleProgress.active}
                      className="px-3 py-1 text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw
                        size={12}
                        aria-hidden="true"
                        className={shuffleProgress.active ? "animate-spin" : ""}
                      />
                      <span>Áp dụng & Xáo lại</span>
                    </Button>
                  </div>

                  {sourceNotice && (
                    <div
                      role="status"
                      className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium shrink-0 animate-notice-enter"
                    >
                      {sourceNotice}
                    </div>
                  )}

                  {sourceEditorFormat === "visual" ? (
                    <div className="flex-1 min-h-0">
                      <InlineExamEditor
                        questions={questions}
                        onChangeQuestions={handleSourceQuestionsChange}
                        compact
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
                      <label htmlFor="raw-source-textarea" className="sr-only">
                        Văn bản nguồn đề thi chuẩn Azota
                      </label>
                      <textarea
                        id="raw-source-textarea"
                        value={rawSourceText}
                        onChange={(e) => setRawSourceText(e.target.value)}
                        spellCheck={false}
                        className="flex-1 w-full p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text)] leading-relaxed focus:border-[var(--color-primary)] resize-none"
                        placeholder="Chỉnh sửa trực tiếp nội dung file đề theo chuẩn Azota..."
                      />
                      <p className="text-[11px] text-[var(--color-text-secondary)] shrink-0">
                        Đánh dấu đáp án đúng bằng dấu <code className="px-1 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)]">*</code> trước chữ cái (VD: <code className="px-1 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)]">*A.</code>), sau đó bấm <strong>Áp dụng & Xáo lại</strong>.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Shuffle Controls */}
                  <div className="p-4 border-b border-[var(--color-border)] space-y-3 shrink-0 overflow-y-auto max-h-[54vh] custom-scrollbar animate-panel-enter">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="shuffle-base-name"
                      className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1"
                    >
                      Tên đề (tên file xuất)
                    </label>
                    <input
                      id="shuffle-base-name"
                      type="text"
                      value={baseName}
                      onChange={(e) => setBaseName(e.target.value)}
                      placeholder="VD: Kiểm tra Giữa kỳ 1"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shuffle-school-name"
                      className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1"
                    >
                      Đơn vị / Trường học
                    </label>
                    <input
                      id="shuffle-school-name"
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label
                      htmlFor="shuffle-variant-count"
                      className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1"
                    >
                      Số lượng mã đề
                    </label>
                    <input
                      id="shuffle-variant-count"
                      type="number"
                      min={1}
                      max={MAX_SHUFFLE_VARIANTS}
                      value={variantCount}
                      onChange={(e) =>
                        setVariantCount(
                          clampVariantCount(Number(e.target.value)),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold tabular-nums bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shuffle-start-code"
                      className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1"
                    >
                      Mã đề đầu
                    </label>
                    <input
                      id="shuffle-start-code"
                      type="number"
                      min={1}
                      max={9999}
                      disabled={randomCodes}
                      value={startingCode}
                      onChange={(e) =>
                        setStartingCode(Math.max(1, Number(e.target.value) || 101))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs tabular-nums bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-50 focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shuffle-duration"
                      className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1"
                    >
                      Thời gian (phút)
                    </label>
                    <input
                      id="shuffle-duration"
                      type="number"
                      min={5}
                      max={240}
                      value={durationMinutes}
                      onChange={(e) =>
                        setDurationMinutes(Math.max(5, Number(e.target.value) || 45))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs tabular-nums bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Preset variant count pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--color-text-muted)] mr-1">
                    Chọn nhanh:
                  </span>
                  {PRESET_COUNTS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setVariantCount(cnt)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                        variantCount === cnt
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                {/* Shuffle & Algorithm toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none col-span-1 sm:col-span-2 p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 font-semibold text-xs"
                    title="Tự động ghim các câu hỏi dùng chung hình/thí nghiệm hóa học đi liền nhau, và bảo toàn phương án A/B/C/D có hình hoặc kí hiệu hóa học liên quan"
                  >
                    <input
                      type="checkbox"
                      checked={optPreserveMediaChemistry}
                      onChange={(e) => setOptPreserveMediaChemistry(e.target.checked)}
                      className="accent-blue-500 rounded"
                    />
                    <span>Bảo toàn hình ảnh & kí hiệu hóa học liên quan (Ghim cụm hình/thí nghiệm)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optShuffleQuestions}
                      onChange={(e) => setOptShuffleQuestions(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Xáo thứ tự câu hỏi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optShuffleOptions}
                      onChange={(e) => setOptShuffleOptions(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Xáo đáp án A/B/C/D</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optShuffleTfStatements}
                      onChange={(e) => setOptShuffleTfStatements(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Xáo ý Đúng/Sai a/b/c/d</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optShuffleShortAnswer}
                      onChange={(e) => setOptShuffleShortAnswer(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Xáo câu Trả lời ngắn</span>
                  </label>
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none"
                    title="Giữ nguyên vị trí các phương án tổng hợp như 'Tất cả đều đúng', 'Cả A và B đều đúng'"
                  >
                    <input
                      type="checkbox"
                      checked={optPinSummaryOptions}
                      onChange={(e) => setOptPinSummaryOptions(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Ghim "Tất cả đều đúng"</span>
                  </label>
                  <label
                    className="flex items-center gap-2 cursor-pointer select-none"
                    title="Cân bằng tỷ lệ đáp án A/B/C/D và tránh lặp quá 2 đáp án giống nhau liên tiếp"
                  >
                    <input
                      type="checkbox"
                      checked={optBalanceAnswers}
                      onChange={(e) => setOptBalanceAnswers(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Cân bằng đáp án A/B/C/D</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optGroupBySection}
                      onChange={(e) => setOptGroupBySection(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Giữ thứ tự Phần I → II → III</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={randomCodes}
                      onChange={(e) => setRandomCodes(e.target.checked)}
                      className="accent-[var(--color-primary)] rounded"
                    />
                    <span>Sinh số mã đề ngẫu nhiên</span>
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-[var(--color-text-muted)] text-[10px]">Chế độ nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOptShuffleQuestions(true);
                      setOptShuffleOptions(false);
                      setOptShuffleTfStatements(false);
                      setOptPreserveMediaChemistry(true);
                    }}
                    className="px-2 py-0.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                    title="Chỉ đảo vị trí các câu hỏi, giữ nguyên tuyệt đối các phương án A/B/C/D và hình ảnh"
                  >
                    Chỉ xáo câu hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOptShuffleQuestions(true);
                      setOptShuffleOptions(true);
                      setOptPreserveMediaChemistry(true);
                    }}
                    className="px-2 py-0.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                    title="Xáo cả câu hỏi và đáp án, bảo vệ các câu có hình và công thức hóa học"
                  >
                    Xáo câu hỏi + Đáp án
                  </button>
                </div>

                {/* Action button: Continuous Random Shuffle */}
                <Button
                  onClick={() => runShuffle(questions, variantCount)}
                  disabled={shuffleProgress.active}
                  className="w-full py-2 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    size={14}
                    className={shuffleProgress.active ? "animate-spin" : ""}
                  />
                  <span>
                    {shuffleProgress.active
                      ? `Đang xáo ${shuffleProgress.done}/${shuffleProgress.total}...`
                      : `Xáo ngẫu nhiên liên tục (${variantCount} mã đề)`}
                  </span>
                </Button>
              </div>

              {/* Generated File List Header + Search */}
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between gap-2 shrink-0 bg-[var(--color-background)]/40">
                <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                  Danh sách mã đề ({filteredVariants.length})
                </span>
                <div className="relative w-40">
                  <label htmlFor="shuffle-code-search" className="sr-only">
                    Tìm mã đề
                  </label>
                  <Search
                    size={13}
                    aria-hidden="true"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <input
                    id="shuffle-code-search"
                    type="text"
                    value={codeSearchQuery}
                    onChange={(e) => {
                      setCodeSearchQuery(e.target.value);
                      setListPage(0);
                    }}
                    placeholder="Tìm mã đề..."
                    className="w-full pl-7 pr-2 py-1 rounded-lg text-[11px] bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Scrollable Paginated List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--color-border)]">
                {visibleVariants.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Không tìm thấy mã đề &ldquo;{codeSearchQuery}&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCodeSearchQuery("")}
                      className="px-3 py-1 rounded-md border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    >
                      Hiện tất cả mã đề
                    </button>
                  </div>
                ) : (
                  visibleVariants.map((v) => {
                    const isActive = activeVariant?.examCode === v.examCode;
                    const fileLabel = formatExamVariantFilename(
                      baseName,
                      v.examCode,
                      "pdf",
                    );
                    return (
                      <button
                        key={v.examCode}
                        type="button"
                        aria-current={isActive ? "true" : undefined}
                        onClick={() => {
                          flushIframeEdits();
                          setSelectedCode(v.examCode);
                          setMobilePaneTab("preview");
                        }}
                        className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[var(--color-primary)]/12 border-l-[3px] border-l-[var(--color-primary)]"
                            : "hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText
                            size={15}
                            aria-hidden="true"
                            className={
                              isActive
                                ? "text-[var(--color-primary-text)] shrink-0"
                                : "text-[var(--color-text-muted)] shrink-0"
                            }
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs truncate ${
                                isActive
                                  ? "font-bold text-[var(--color-primary-text)]"
                                  : "font-medium text-[var(--color-text)]"
                              }`}
                            >
                              {fileLabel}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-secondary)] tabular-nums">
                              Mã đề {v.examCode} • {v.questions.length} câu
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] flex items-center gap-1 shrink-0 ${
                            isActive
                              ? "text-[var(--color-primary-text)] font-semibold"
                              : "text-[var(--color-text-secondary)]"
                          }`}
                        >
                          <Eye size={13} aria-hidden="true" />
                          <span className="hidden sm:inline">Xem</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pagination Footer when > LIST_PAGE_SIZE */}
              {totalListPages > 1 && (
                <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] shrink-0">
                  <span className="tabular-nums">
                    Trang {clampedPage + 1} / {totalListPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={clampedPage === 0}
                      aria-label="Trang mã đề trước"
                      onClick={() => setListPage((p) => Math.max(0, p - 1))}
                      className="p-1.5 rounded border border-[var(--color-border)] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={clampedPage >= totalListPages - 1}
                      aria-label="Trang mã đề sau"
                      onClick={() =>
                        setListPage((p) => Math.min(totalListPages - 1, p + 1))
                      }
                      className="p-1.5 rounded border border-[var(--color-border)] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </aside>

            {/* RIGHT PANE (7 cols ~ 58%): PDF Viewer Preview */}
            <section
              className={`${
                mobilePaneTab === "preview" ? "flex" : "hidden"
              } lg:flex lg:col-span-7 h-full flex-col bg-[#525659] min-h-0`}
            >
              {/* Row 1: Preview Tabs & Actions */}
              <div className="h-12 shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3 sm:px-4 flex items-center justify-between gap-2 text-xs">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0">
                  <button
                    type="button"
                    aria-pressed={previewTab === "pdf"}
                    onClick={() => {
                      flushIframeEdits();
                      setPreviewTab("pdf");
                    }}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      previewTab === "pdf"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)]"
                    }`}
                  >
                    Xem trước PDF (A4)
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewTab === "answer_key"}
                    onClick={() => {
                      flushIframeEdits();
                      setPreviewTab("answer_key");
                    }}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      previewTab === "answer_key"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)]"
                    }`}
                  >
                    Bảng đáp án ({activeVariant?.examCode || "---"})
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewTab === "edit_variant"}
                    onClick={() => {
                      flushIframeEdits();
                      setPreviewTab("edit_variant");
                    }}
                    className={`min-h-[34px] px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      previewTab === "edit_variant"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)]"
                    }`}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    <span>Sửa mã đề ({activeVariant?.examCode || "---"})</span>
                  </button>
                </div>

                {/* Print button on Row 1 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrintActive}
                    className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs transition-colors"
                    title="In hoặc Lưu mã đề đang xem dưới dạng file PDF"
                  >
                    <Printer size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">In / Lưu PDF</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Secondary Formatting Controls (Only for PDF Preview Tab) */}
              {previewTab === "pdf" && (
                <div className="h-10 shrink-0 bg-[var(--color-background)] border-b border-[var(--color-border)] px-4 flex items-center justify-between gap-3 text-xs overflow-x-auto scrollbar-none">
                  {/* Left: Interactive inline edit toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        flushIframeEdits();
                        setInteractivePreviewEdit((v) => !v);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        interactivePreviewEdit
                          ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-400"
                          : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                      }`}
                      title="Bật/tắt chế độ gõ chữ và chọn đáp án trực tiếp trên tờ đề A4"
                    >
                      <Pencil size={12} />
                      <span>
                        {interactivePreviewEdit
                          ? "Đang sửa trực tiếp trên trang"
                          : "Sửa trực tiếp trên trang"}
                      </span>
                    </button>
                  </div>

                  {/* Right: Font size, Column mode & Show answers */}
                  <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--color-text-secondary)]">
                    {/* Font size */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="text-[11px] font-medium">Cỡ chữ:</span>
                      {[
                        { pt: 11, label: "11" },
                        { pt: 12.5, label: "12.5" },
                        { pt: 14, label: "14" },
                      ].map((f) => (
                        <button
                          key={f.pt}
                          type="button"
                          onClick={() => {
                            flushIframeEdits();
                            setPreviewFontSize(f.pt);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            previewFontSize === f.pt
                              ? "bg-[var(--color-primary)] text-white shadow-2xs"
                              : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Column mode */}
                    <div className="flex items-center gap-1 whitespace-nowrap border-l border-[var(--color-border)] pl-3">
                      <span className="text-[11px] font-medium">Cột:</span>
                      {[
                        { mode: "auto" as const, label: "Tự động" },
                        { mode: "2" as const, label: "2 cột" },
                        { mode: "4" as const, label: "4 cột" },
                      ].map((col) => (
                        <button
                          key={col.mode}
                          type="button"
                          onClick={() => {
                            flushIframeEdits();
                            setPreviewColumnsMode(col.mode);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            previewColumnsMode === col.mode
                              ? "bg-[var(--color-primary)] text-white shadow-2xs"
                              : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>

                    {/* Show answers checkbox */}
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none border-l border-[var(--color-border)] pl-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={showAnswersInPreview}
                        onChange={(e) => {
                          flushIframeEdits();
                          setShowAnswersInPreview(e.target.checked);
                        }}
                        className="accent-[var(--color-primary)] cursor-pointer"
                      />
                      <span>Hiện đáp án</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Body */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {previewTab === "pdf" ? (
                  <iframe
                    key={`pdf-${activeVariant?.examCode || "empty"}`}
                    ref={iframeRef}
                    srcDoc={iframeSrcDoc}
                    title={`Xem trước mã đề ${activeVariant?.examCode || ""}`}
                    className="w-full h-full border-0 bg-[#525659] animate-panel-enter"
                  />
                ) : previewTab === "edit_variant" && activeVariant ? (
                  <div key="tab-edit-variant" className="h-full flex flex-col bg-[var(--color-background)] animate-panel-enter">
                    <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 flex items-center justify-between text-xs shrink-0">
                      <span className="text-[var(--color-text-secondary)]">
                        Đang chỉnh sửa trực tiếp{" "}
                        <strong className="text-[var(--color-text)]">
                          Mã đề {activeVariant.examCode}
                        </strong>
                        : PDF, bảng đáp án và file ZIP sẽ cập nhật tức thì.
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <InlineExamEditor
                        questions={activeVariant.questions}
                        onChangeQuestions={handleEditActiveVariant}
                        allowAddDelete={true}
                      />
                    </div>
                  </div>
                ) : activeVariant ? (
                  <div key="tab-answer-key" className="h-full animate-panel-enter">
                    <InteractiveAnswerKeyTable
                      variant={activeVariant}
                      totalVariantsCount={variants.length}
                      sourceQuestions={questions}
                      onUpdateAnswer={handleUpdateAnswerFromTable}
                      onBatchApplyAnswers={handleBatchApplyAnswers}
                      onUpdateQuestionText={handleUpdateQuestionTextFromTable}
                      onMoveQuestion={handleMoveQuestionInVariant}
                      onRemoveQuestion={handleRemoveQuestionInVariant}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: ACCEPT & DOWNLOAD ZIP                                  */}
      {/* ============================================================== */}
      {step === "export" && (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 pb-12 animate-stage-enter">
          <div className="pb-4 border-b border-[var(--color-border)]">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-2">
              <FileArchive size={22} className="text-emerald-500" />
              <span>Đóng gói & Tải về file ZIP</span>
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Kiểm tra lại thông tin trước khi xuất toàn bộ {variants.length} mã đề
            </p>
          </div>

          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Số mã đề đã tạo
                </span>
                <p className="text-xl font-black text-[var(--color-primary)] mt-0.5">
                  {variants.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Số câu hỏi / đề
                </span>
                <p className="text-xl font-black text-[var(--color-text)] mt-0.5">
                  {questions.length}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Quy cách đặt tên
                </span>
                <p className="text-xs font-bold text-[var(--color-text)] mt-1.5 truncate">
                  {baseName} - mã đề {variants[0]?.examCode || "101"}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[var(--color-border)] text-xs">
              <p className="font-bold text-[var(--color-text)]">
                Tùy chọn tệp kèm theo trong file ZIP:
              </p>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMasterKey}
                  onChange={(e) => setIncludeMasterKey(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                <span>
                  Kèm <strong>BẢNG ĐÁP ÁN TỔNG HỢP (.html)</strong> để in/chấm nhanh toàn bộ mã đề
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCsvKey}
                  onChange={(e) => setIncludeCsvKey(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                <span>
                  Kèm <strong>BẢNG ĐÁP ÁN (.csv)</strong> mở trực tiếp bằng Excel
                </span>
              </label>
              <label
                className={`flex items-center gap-2.5 select-none ${
                  variants.length > 100
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={variants.length > 100}
                  checked={includeCombinedPrint && variants.length <= 100}
                  onChange={(e) => setIncludeCombinedPrint(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                <span>
                  Kèm 1 file <strong>IN TẤT CẢ ({variants.length} mã đề gộp)</strong> để Ctrl+P xuất PDF hàng loạt (tối đa 100 đề)
                </span>
              </label>
            </div>

            {zipProgress.active && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Đang đóng gói các mã đề...</span>
                  <span>
                    {zipProgress.done} / {zipProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-background)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] transition-all duration-150"
                    style={{
                      width: `${Math.round((zipProgress.done / Math.max(1, zipProgress.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {zipCompleted && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
                <CheckCircle2 size={16} />
                <span>
                  Đã tạo và tải xuống file ZIP thành công! Bạn có thể giải nén, mở từng đề và nhấn Ctrl+P (hoặc nút "In / Lưu thành PDF") để xuất PDF.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep("preview")}
                className="text-xs px-4 py-2 font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Quay lại xem trước & xáo lại</span>
              </Button>

              <Button
                onClick={handleDownloadZip}
                disabled={zipProgress.active}
                className="text-xs px-6 py-2.5 font-bold flex items-center gap-2"
              >
                <Download size={15} />
                <span>
                  {zipProgress.active
                    ? "Đang nén ZIP..."
                    : `Tải xuống ZIP (${variants.length} mã đề)`}
                </span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
