import { useState, useEffect } from "react";
import type { Question, QuizSettings, Quiz } from "@ltvquiz/shared";
import { QuestionNavigator } from "../components/editor/QuestionNavigator";
import { LivePreview } from "../components/editor/LivePreview";
import { QuestionForm } from "../components/editor/QuestionForm";
import { QuizSettingsDrawer } from "../components/editor/QuizSettingsDrawer";
import { Button } from "../components/Button";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Settings,
  PlusCircle,
  Eye,
  EyeOff,
  BookmarkPlus,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { StorageService } from "../services/storageService";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { SaveToLibraryModal } from "../components/library/SaveToLibraryModal";

function generateEmptyQuestion(): Question {
  const id = "q_" + Math.random().toString(36).substr(2, 6);
  return {
    id,
    type: "multiple_choice",
    points: 0.25,
    question: [{ type: "text", content: "" }],
    options: [
      { id: "opt_1", label: "A", content: [{ type: "text", content: "" }] },
      { id: "opt_2", label: "B", content: [{ type: "text", content: "" }] },
      { id: "opt_3", label: "C", content: [{ type: "text", content: "" }] },
      { id: "opt_4", label: "D", content: [{ type: "text", content: "" }] },
    ],
    correctAnswer: [],
    validation: {
      status: "warning",
      warnings: ["Vui lòng nhập nội dung câu hỏi và chọn đáp án đúng"],
    },
  };
}

export function EditorPage() {
  useDocumentTitle("12/4 LTVQuiz - Editor");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizTitle, setQuizTitle] = useState("Bài kiểm tra mới");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaveToLibraryOpen, setIsSaveToLibraryOpen] = useState(false);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    timeLimit: 45,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: "immediately",
    allowReview: true,
    maxAttempts: 1,
  });

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  // Load from StorageService
  useEffect(() => {
    if (id) {
      const loadedQuiz = StorageService.getQuiz(id);
      if (loadedQuiz) {
        setQuiz(loadedQuiz);
        setQuizTitle(loadedQuiz.title);
        setQuestions(loadedQuiz.questions);
        setQuizSettings(loadedQuiz.settings);
        if (loadedQuiz.questions.length > 0) {
          setActiveId(loadedQuiz.questions[0].id);
        }
      } else {
        navigate("/dashboard");
      }
    }
  }, [id, navigate]);

  // Autosave
  useEffect(() => {
    if (!quiz) return;

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        const updatedQuiz = {
          ...quiz,
          title: quizTitle,
          questions,
          settings: quizSettings,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveQuiz(updatedQuiz);
        setQuiz(updatedQuiz);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [questions, quizTitle, quizSettings]);

  const activeIndex = questions.findIndex((q) => q.id === activeId);
  const activeQuestion = questions[activeIndex];

  const handleUpdateQuestion = (updatedQ: Question) => {
    const isTextEmpty = !updatedQ.question
      .find((c) => c.type === "text")
      ?.content?.trim();
    const isAnsMissing = updatedQ.correctAnswer.length === 0;
    const newStatus =
      updatedQ.options.length < 4 || isAnsMissing || isTextEmpty
        ? "warning"
        : "valid";
    updatedQ.validation.status = newStatus;

    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)),
    );
  };

  const handleAddQuestion = () => {
    const newQ = generateEmptyQuestion();
    setQuestions((prev) => [...prev, newQ]);
    setActiveId(newQ.id);
  };

  const handleDeleteQuestion = () => {
    if (!activeId) return;
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === activeId);
      const newQuestions = prev.filter((q) => q.id !== activeId);
      if (newQuestions.length > 0) {
        setActiveId(newQuestions[Math.min(idx, newQuestions.length - 1)].id);
      } else {
        setActiveId(null);
      }
      return newQuestions;
    });
  };

  const handleDuplicateQuestion = () => {
    if (!activeQuestion) return;
    const newId = "q_" + Math.random().toString(36).substr(2, 6);
    const idMap: Record<string, string> = {};
    const newOptions = activeQuestion.options.map((opt) => {
      const newOptId = "opt_" + Math.random().toString(36).substr(2, 6);
      idMap[opt.id] = newOptId;
      return {
        ...opt,
        id: newOptId,
      };
    });
    const newCorrectAnswer = activeQuestion.correctAnswer.map(
      (ansId) => idMap[ansId] || ansId,
    );

    const duplicated: Question = {
      ...activeQuestion,
      id: newId,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    };

    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === activeId);
      const newQuestions = [...prev];
      newQuestions.splice(idx + 1, 0, duplicated);
      return newQuestions;
    });
    setActiveId(newId);
  };

  const handleMoveUp = () => {
    if (activeIndex <= 0) return;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const temp = newQuestions[activeIndex - 1];
      newQuestions[activeIndex - 1] = newQuestions[activeIndex];
      newQuestions[activeIndex] = temp;
      return newQuestions;
    });
  };

  const handleMoveDown = () => {
    if (activeIndex >= questions.length - 1) return;
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const temp = newQuestions[activeIndex + 1];
      newQuestions[activeIndex + 1] = newQuestions[activeIndex];
      newQuestions[activeIndex] = temp;
      return newQuestions;
    });
  };

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)] overflow-hidden">
      {/* Editor Top Navigation Bar */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] flex flex-col gap-2 px-3 py-2 md:h-13 md:flex-row md:items-center md:justify-between md:px-5 shrink-0 z-20">
        <div className="flex flex-1 items-center gap-2.5 md:gap-3 min-w-0">
          <Link
            to="/"
            aria-label="Về trang chủ LTVQuiz"
            className="grid size-11 place-items-center sm:inline sm:size-auto rounded-xl font-bold text-sm md:text-base text-[var(--color-primary-text)] hover:opacity-90 transition-opacity shrink-0"
          >
            <ArrowLeft size={20} className="sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">12/4 LTVQuiz</span>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-[var(--color-border)] shrink-0" />
          <input
            type="text"
            aria-label="Tên bài kiểm tra"
            className="flex-1 w-full min-w-0 md:max-w-sm min-h-11 md:min-h-8 text-base md:text-sm font-semibold text-[var(--color-text)] bg-[var(--color-background)] md:bg-transparent hover:bg-[var(--color-background)] focus:bg-[var(--color-background)] border border-[var(--color-border)] md:border-transparent focus:border-[var(--color-border)] rounded-lg px-2.5 outline-none truncate transition-colors"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Nhập tên bài kiểm tra..."
          />
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
          {/* Save status text */}
          <span className="text-xs text-[var(--color-text-secondary)] hidden lg:flex items-center gap-1 mr-1">
            {saveStatus === "saved" ? (
              <>
                <CheckCircle size={13} className="text-emerald-500" /> Đã lưu
              </>
            ) : saveStatus === "saving" ? (
              <span className="animate-pulse text-[var(--color-primary)]">
                Đang lưu...
              </span>
            ) : (
              <span className="text-rose-500">Lưu thất bại</span>
            )}
          </span>

          {/* Preview Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            aria-pressed={showPreview}
            className={`hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showPreview
                ? "bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)]"
                : "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border-transparent hover:bg-[var(--color-background)]"
            }`}
            title={
              showPreview
                ? "Ẩn màn hình xem trước"
                : "Bật màn hình xem trước"
            }
          >
            {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden md:inline">Xem trước</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            aria-pressed={mobilePane === "preview"}
            className="min-h-11 min-w-11 gap-1.5 text-xs lg:hidden"
            onClick={() => setMobilePane(mobilePane === "preview" ? "editor" : "preview")}
          >
            <Eye size={15} />
            {mobilePane === "preview" ? "Soạn thảo" : "Xem trước"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs min-h-11 min-w-11 md:min-h-8 px-2.5"
            aria-label="Cài đặt"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Cài đặt</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs min-h-11 min-w-11 md:min-h-8 px-2.5"
            aria-label="Lưu vào Kho đề"
            onClick={() => setIsSaveToLibraryOpen(true)}
            title="Lưu vào Kho đề theo thư mục"
          >
            <BookmarkPlus size={14} />
            <span className="hidden sm:inline">Lưu Kho đề</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs min-h-11 md:min-h-8 px-2.5 sm:px-3 font-semibold"
            onClick={() => {
              if (quiz) {
                const updatedQuiz: Quiz = {
                  ...quiz,
                  title: quizTitle,
                  questions,
                  settings: quizSettings,
                  updatedAt: new Date().toISOString(),
                };
                StorageService.saveQuiz(updatedQuiz);
                navigate(`/publish/${quiz.id}`);
              }
            }}
          >
            <Save size={14} /> <span>Xuất bản</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left Navigator Sidebar */}
        <aside className="w-full md:w-48 xl:w-56 shrink-0 bg-[var(--color-surface)] shadow-xs z-10 flex items-center md:items-stretch md:flex-col border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <QuestionNavigator
            questions={questions}
            activeId={activeId || ""}
            onSelect={setActiveId}
          />
          <div className="p-2 md:p-2.5 md:border-t border-[var(--color-border)] md:mt-auto bg-[var(--color-surface)] shrink-0">
            <button
              onClick={handleAddQuestion}
              aria-label="Thêm câu hỏi"
              className="group w-full min-w-11 min-h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-xl py-2 px-2.5 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <PlusCircle size={15} className="group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300" />
              <span className="hidden md:inline">Thêm câu hỏi</span>
            </button>
          </div>
        </aside>

        {/* Workspace: Live Preview (Optional) + Editor Form */}
        <main className="min-h-0 min-w-0 flex-1 flex overflow-hidden">
          {(showPreview || mobilePane === "preview") && (
            <div className={`min-w-0 w-full lg:w-[34%] xl:w-[410px] shrink-0 lg:border-r border-[var(--color-border)] flex-col bg-[var(--color-background)] animate-fade-in ${mobilePane === "preview" ? "flex" : "hidden"} ${showPreview ? "lg:flex" : "lg:hidden"}`}>
              {activeQuestion ? (
                <LivePreview
                  question={activeQuestion}
                  index={activeIndex >= 0 ? activeIndex : 0}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
                  Không có câu hỏi nào.
                </div>
              )}
            </div>
          )}

          {/* Editor Form Panel */}
          <div className={`flex-1 min-w-0 flex-col bg-[var(--color-surface)] overflow-hidden lg:flex ${mobilePane === "editor" ? "flex" : "hidden"}`}>
            {/* Editor Sub-Header */}
            <div className="h-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text)] tracking-wider">
                  SOẠN THẢO
                </span>
                {activeQuestion && (
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    • Câu {activeIndex + 1} / {questions.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!showPreview && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline font-medium cursor-pointer"
                  >
                    <Eye size={13} /> Mở xem trước
                  </button>
                )}
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-hidden">
              {activeQuestion ? (
                <QuestionForm
                  question={activeQuestion}
                  onChange={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onDuplicate={handleDuplicateQuestion}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  canMoveUp={activeIndex > 0}
                  canMoveDown={activeIndex < questions.length - 1}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
                  Chọn hoặc thêm câu hỏi để chỉnh sửa.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <QuizSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={quizSettings}
        onUpdate={setQuizSettings}
      />

      <SaveToLibraryModal
        isOpen={isSaveToLibraryOpen}
        onClose={() => setIsSaveToLibraryOpen(false)}
        defaultTitle={quizTitle}
        questions={questions}
        quiz={quiz || undefined}
      />
    </div>
  );
}
