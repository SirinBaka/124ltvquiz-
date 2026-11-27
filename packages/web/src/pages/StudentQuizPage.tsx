import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Question, Quiz } from "@ltvquiz/shared";
import { Button } from "../components/Button";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  GraduationCap,
  User,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Hash,
  Users,
  ArrowLeft,
  Check,
  X,
  FileText,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { StorageService } from "../services/storageService";
import { RichText } from "../components/RichText";
import { KahootLoader } from "../components/KahootLoader";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import {
  calculateStreakStats,
  playStreakCelebrationSound,
  STREAK_THRESHOLD,
} from "../lib/streakHelper";
import {
  StreakBadge,
  StreakCelebrationPopup,
  StreakResultCard,
} from "../components/StreakCelebration";
import { useAntiCheat } from "../hooks/useAntiCheat";
import { AntiCheatWarningModal } from "../components/quiz/AntiCheatWarningModal";
import { validateAccessPassword } from "../services/studentExportHelper";
import {
  prepareStudentQuizQuestions,
  generateExamCode,
  isQuizCapacityReached,
} from "../lib/examSessionHelper";

export interface QuestionEvaluation {
  isCorrect: boolean;
  isPartial: boolean;
  earnedPoints: number;
  isAnswered: boolean;
}

export function checkQuestionEvaluation(
  q: Question,
  studentAnswer: any
): QuestionEvaluation {
  const points = q.points || 1;

  if (q.type === "true_false_multiple") {
    const ansMap =
      typeof studentAnswer === "object" && studentAnswer !== null
        ? studentAnswer
        : {};
    const answeredKeys = Object.keys(ansMap);
    const isAnswered = answeredKeys.length > 0;
    if (!isAnswered) {
      return {
        isCorrect: false,
        isPartial: false,
        earnedPoints: 0,
        isAnswered: false,
      };
    }
    let correctCount = 0;
    const totalOptions = q.options.length || 1;
    q.options.forEach((opt) => {
      const isExpected = q.correctAnswer.includes(opt.id);
      if (!!ansMap[opt.id] === isExpected) {
        correctCount++;
      }
    });
    const earned = Number(((correctCount / totalOptions) * points).toFixed(2));
    const isCorrect = correctCount === totalOptions;
    return {
      isCorrect,
      isPartial: !isCorrect && correctCount > 0,
      earnedPoints: earned,
      isAnswered: true,
    };
  }

  // multiple_choice or true_false single
  const ansId = typeof studentAnswer === "string" ? studentAnswer : "";
  const isAnswered = Boolean(ansId);
  const correctId = q.correctAnswer?.[0] || "";
  const isCorrect = isAnswered && ansId === correctId;
  return {
    isCorrect,
    isPartial: false,
    earnedPoints: isCorrect ? points : 0,
    isAnswered,
  };
}

export function StudentQuizPage() {
  useDocumentTitle("12/4 LTVQuiz - Test");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); // questionId -> optionId or Record<string, boolean>
  const [answeredOrder, setAnsweredOrder] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [streakPopup, setStreakPopup] = useState<{
    isOpen: boolean;
    count: number;
  }>({
    isOpen: false,
    count: 0,
  });
  const [lastCelebratedStreak, setLastCelebratedStreak] = useState(0);

  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    className: string;
  } | null>(null);
  const [inputName, setInputName] = useState("");
  const [inputClass, setInputClass] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [examCode, setExamCode] = useState<string>("");
  const [isCapacityFull, setIsCapacityFull] = useState(false);

  // Review mode & mobile/confirm states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect" | "correct">("all");
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (window.matchMedia("(width < 64rem)").matches) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentIdx, hasStarted, isSubmitted, isReviewMode]);

  useEffect(() => {
    if (id) {
      const loadedQuiz = StorageService.getQuiz(id);
      if (loadedQuiz && loadedQuiz.status === "published") {
        // Check capacity limit
        const existingAttempts = StorageService.getAttemptsForQuiz(loadedQuiz.id);
        if (isQuizCapacityReached(loadedQuiz, existingAttempts.length)) {
          setIsCapacityFull(true);
          setErrorMsg(
            `Phòng thi đã đạt giới hạn tối đa thí sinh (${existingAttempts.length}/${loadedQuiz.settings.maxStudentsLimit} bài làm). Vui lòng liên hệ giáo viên để được hỗ trợ.`
          );
          return;
        }

        setQuiz(loadedQuiz);

        // Prepare or restore shuffled questions for this session
        const sessionSig = `${loadedQuiz.updatedAt}_${!!loadedQuiz.settings.shuffleQuestions}_${!!loadedQuiz.settings.shuffleOptions}`;
        const savedSig = sessionStorage.getItem(`exam_sig_${id}`);
        const savedSessionQuestions = sessionStorage.getItem(`exam_questions_${id}`);

        let activeQuestions: Question[] = [];
        if (savedSessionQuestions && savedSig === sessionSig) {
          try {
            activeQuestions = JSON.parse(savedSessionQuestions);
          } catch {
            activeQuestions = [];
          }
        }

        if (activeQuestions.length === 0) {
          activeQuestions = prepareStudentQuizQuestions(loadedQuiz.questions, {
            shuffleQuestions: loadedQuiz.settings.shuffleQuestions,
            shuffleOptions: loadedQuiz.settings.shuffleOptions,
          });
          sessionStorage.setItem(`exam_questions_${id}`, JSON.stringify(activeQuestions));
          sessionStorage.setItem(`exam_sig_${id}`, sessionSig);
        }
        setQuestions(activeQuestions);

        // Assign exam code if enabled
        if (loadedQuiz.settings.assignExamCode) {
          const savedCode = sessionStorage.getItem(`exam_code_${id}`);
          if (savedCode) {
            setExamCode(savedCode);
          } else {
            const existingCodes = existingAttempts
              .map((a: any) => a.examCode)
              .filter(Boolean);
            const newCode = generateExamCode(existingCodes);
            sessionStorage.setItem(`exam_code_${id}`, newCode);
            setExamCode(newCode);
          }
        } else {
          setExamCode("");
          sessionStorage.removeItem(`exam_code_${id}`);
        }

        // Restore autosaved answers if any
        const savedAnswers = localStorage.getItem(`answers_${id}`);
        if (savedAnswers) {
          try {
            const parsed = JSON.parse(savedAnswers);
            setAnswers(parsed);
            setAnsweredOrder(Object.keys(parsed));
          } catch (e) {}
        }

        // Check password requirement
        const expectedPass = loadedQuiz.settings.accessPassword?.trim();
        const sessionUnlocked = sessionStorage.getItem(`quiz_unlocked_${id}`) === "true";
        const passUnlocked = !expectedPass || sessionUnlocked;
        setIsPasswordUnlocked(passUnlocked);

        // Restore saved student info
        const savedInfo = localStorage.getItem(`student_info_${id}`);
        if (savedInfo) {
          try {
            const parsed = JSON.parse(savedInfo);
            if (parsed.name) setInputName(parsed.name);
            if (parsed.className) setInputClass(parsed.className);
            setStudentInfo(parsed);
          } catch {}
        }

        // Check ongoing session in case student reloads page during exam
        const isSessionRunning = sessionStorage.getItem(`exam_started_${id}`) === "true";
        if (isSessionRunning && passUnlocked) {
          setHasStarted(true);
        } else {
          // Always show exam information board first
          setHasStarted(false);
        }

        // Timer
        if (loadedQuiz.settings.timeLimit) {
          setTimeLeft(loadedQuiz.settings.timeLimit * 60);
        } else {
          setTimeLeft(-1); // unlimited
        }
      } else {
        setErrorMsg("Bài kiểm tra không tồn tại hoặc chưa được xuất bản.");
      }
    }
  }, [id]);

  useEffect(() => {
    if (isSubmitted || timeLeft < 0 || !hasStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft, hasStarted]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotalScore = (questionsList: Question[], answerMap: Record<string, any>) => {
    let score = 0;
    questionsList.forEach((q) => {
      const evaluation = checkQuestionEvaluation(q, answerMap[q.id]);
      score += evaluation.earnedPoints;
    });
    const totalPoints = questionsList.reduce((acc, q) => acc + (q.points || 1), 0);
    return { score, totalPoints };
  };

  const submitAttempt = (violationOverride?: number) => {
    if (!quiz) return;
    setIsSubmitting(true);
    const recordedViolations =
      typeof violationOverride === "number"
        ? violationOverride
        : violationCount;

    // Fake delay to show finish quote
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
      const { score, totalPoints } = calculateTotalScore(questions, answers);

      StorageService.saveAttempt({
        id: "atm_" + Math.random().toString(36).substr(2, 9),
        quizId: quiz.id,
        studentName: studentInfo?.name || "Học sinh Ẩn danh",
        studentClass: studentInfo?.className || "",
        answers,
        score,
        totalPoints,
        timeSpent:
          (quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : 0) -
          timeLeft,
        createdAt: new Date().toISOString(),
        maxStreak: streakStats.maxStreak,
        violationCount: recordedViolations,
        examCode: examCode || undefined,
      });

      // Clear autosave & session
      localStorage.removeItem(`answers_${quiz.id}`);
      sessionStorage.removeItem(`exam_questions_${quiz.id}`);
      sessionStorage.removeItem(`exam_sig_${quiz.id}`);
      sessionStorage.removeItem(`exam_started_${quiz.id}`);
    }, 1800);
  };

  const {
    enabled: isAntiCheatOn,
    maxViolations,
    violationCount,
    isWarningOpen,
    dismissWarning,
  } = useAntiCheat({
    settings: quiz?.settings,
    onAutoSubmit: (count: number) => {
      submitAttempt(count);
    },
    isActive: hasStarted && !isSubmitted && !isSubmitting,
  });

  useEffect(() => {
    if (isWarningOpen) {
      setStreakPopup((prev) => ({ ...prev, isOpen: false }));
      setIsSubmitConfirmOpen(false);
    }
  }, [isWarningOpen]);

  useEffect(() => {
    if (!isSubmitConfirmOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSubmitConfirmOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSubmitConfirmOpen]);

  useEffect(() => {
    if (!hasStarted || isSubmitted || isSubmitting || isWarningOpen || isSubmitConfirmOpen) {
      return;
    }
    const handleArrowNav = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleArrowNav);
    return () => window.removeEventListener("keydown", handleArrowNav);
  }, [hasStarted, isSubmitted, isSubmitting, isWarningOpen, isSubmitConfirmOpen, questions.length]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    setFormError("");

    // Check capacity limit
    const currentAttempts = StorageService.getAttemptsForQuiz(quiz.id);
    if (isQuizCapacityReached(quiz, currentAttempts.length)) {
      setIsCapacityFull(true);
      setErrorMsg(
        `Phòng thi đã đạt giới hạn tối đa thí sinh (${currentAttempts.length}/${quiz.settings.maxStudentsLimit} bài làm). Không thể bắt đầu lượt thi mới.`
      );
      return;
    }

    // Check passcode if required
    const expectedPass = quiz.settings.accessPassword?.trim();
    if (expectedPass && !isPasswordUnlocked) {
      if (!validateAccessPassword(inputPassword, expectedPass)) {
        setPasswordError("Mật mã bài kiểm tra không chính xác. Vui lòng kiểm tra lại với giáo viên!");
        return;
      }
      setIsPasswordUnlocked(true);
      if (id) {
        sessionStorage.setItem(`quiz_unlocked_${id}`, "true");
      }
      setPasswordError("");
    }

    // Check student info if required
    if (quiz.settings.requireStudentInfo) {
      if (!inputName.trim() || !inputClass.trim()) {
        setFormError("Vui lòng nhập đầy đủ Họ và tên và Lớp trước khi bắt đầu làm bài.");
        return;
      }
    }

    const cleanName = inputName.trim() || "Thí sinh tự do";
    const cleanClass = inputClass.trim() || "";
    const info = { name: cleanName, className: cleanClass };
    setStudentInfo(info);
    if (id) {
      localStorage.setItem(`student_info_${id}`, JSON.stringify(info));
      sessionStorage.setItem(`exam_started_${id}`, "true");
    }

    setHasStarted(true);
  };

  const streakStats = calculateStreakStats(questions, answers, answeredOrder);

  const isSoundEnabled = () => {
    try {
      const saved = localStorage.getItem("ltvquiz_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.soundEnabled !== undefined)
          return Boolean(parsed.soundEnabled);
      }
    } catch {}
    return true;
  };

  const handleAnswerChange = (questionId: string, answerValue: any) => {
    const newAnswers = { ...answers, [questionId]: answerValue };
    setAnswers(newAnswers);
    if (id) {
      localStorage.setItem(`answers_${id}`, JSON.stringify(newAnswers));
    }

    const nextOrder = answeredOrder.includes(questionId)
      ? answeredOrder
      : [...answeredOrder, questionId];
    setAnsweredOrder(nextOrder);

    const stats = calculateStreakStats(questions, newAnswers, nextOrder);
    if (
      stats.currentStreak >= STREAK_THRESHOLD &&
      stats.currentStreak > lastCelebratedStreak
    ) {
      setStreakPopup({ isOpen: true, count: stats.currentStreak });
      setLastCelebratedStreak(stats.currentStreak);
      playStreakCelebrationSound(isSoundEnabled());
    } else if (stats.currentStreak === 0) {
      setLastCelebratedStreak(0);
    }
  };

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const isFirst = currentIdx === 0;

  const handleSelect = (optId: string) => {
    if (!currentQ) return;
    handleAnswerChange(currentQ.id, optId);
  };

  const formatTime = (secs: number) => {
    if (secs < 0) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Pre-calculated stats
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const ev = checkQuestionEvaluation(q, answers[q.id]);
      return ev.isAnswered;
    }).length;
  }, [questions, answers]);

  if (errorMsg) {
    return (
      <div className="min-h-dvh bg-[var(--color-background)] flex flex-col">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <main className="flex-1 flex items-center justify-center p-4 pb-12">
          <div className="max-w-md w-full bg-[var(--color-surface)] rounded-2xl shadow-lg border border-[var(--color-border)] p-6 sm:p-8 text-center animate-stage-enter">
            <div className="w-14 h-14 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              {isCapacityFull ? <Users size={28} aria-hidden="true" /> : <AlertTriangle size={28} aria-hidden="true" />}
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
              {isCapacityFull ? "Phòng thi đã đầy" : "Không thể mở bài thi"}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              {errorMsg}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button variant="secondary" onClick={() => window.location.reload()} className="min-h-[44px]">
                Tải lại trang
              </Button>
              <Button variant="primary" onClick={() => navigate("/")} className="min-h-[44px]">
                Về trang chủ
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return <KahootLoader type="start" text="Đang tải đề thi..." />;
  }

  // REVIEW MODE SCREEN
  if (isSubmitted && isReviewMode) {
    const { score, totalPoints } = calculateTotalScore(questions, answers);
    const evaluations = questions.map((q, idx) => ({
      q,
      idx,
      eval: checkQuestionEvaluation(q, answers[q.id]),
    }));

    const correctCount = evaluations.filter((e) => e.eval.isCorrect).length;
    const wrongCount = evaluations.filter((e) => !e.eval.isCorrect).length;

    const filteredEvaluations = evaluations.filter((e) => {
      if (reviewFilter === "incorrect") return !e.eval.isCorrect;
      if (reviewFilter === "correct") return e.eval.isCorrect;
      return true;
    });

    return (
      <div className="min-h-dvh bg-[var(--color-background)] flex flex-col font-sans pb-16 animate-stage-enter">
        {/* Sticky Review Header */}
        <header className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-8 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReviewMode(false)}
              className="min-h-[38px] flex items-center gap-1.5 text-xs font-semibold rounded-xl cursor-pointer shrink-0"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Bảng điểm</span>
            </Button>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-[var(--color-text)] flex flex-wrap items-center gap-1.5">
                <span>Xem lại bài làm:</span>
                <span className="text-[var(--color-primary-text)] truncate max-w-[200px] sm:max-w-md">
                  {quiz.title}
                </span>
              </h1>
              {studentInfo && (
                <span className="text-xs text-[var(--color-text-secondary)] block truncate">
                  Thí sinh: {studentInfo.name}
                  {studentInfo.className ? ` • Lớp ${studentInfo.className}` : ""}
                  {examCode && ` • Mã đề: ${examCode}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary-text)] border border-[var(--color-primary)]/30 text-sm font-black tabular-nums">
              Điểm: {score.toFixed(2)} / {totalPoints.toFixed(2)}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">
          {/* Filter Navigation Bar */}
          <div className="max-w-4xl w-full mx-auto px-4 pt-5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={reviewFilter === "all"}
                  onClick={() => setReviewFilter("all")}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reviewFilter === "all"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)]"
                  }`}
                >
                  <FileText size={14} aria-hidden="true" />
                  <span>Tất cả ({questions.length})</span>
                </button>

                <button
                  type="button"
                  aria-pressed={reviewFilter === "incorrect"}
                  onClick={() => setReviewFilter("incorrect")}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reviewFilter === "incorrect"
                      ? "bg-red-700 text-white shadow-xs"
                      : "text-red-700 dark:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <XCircle size={14} aria-hidden="true" />
                  <span>Chưa đúng ({wrongCount})</span>
                </button>

                <button
                  type="button"
                  aria-pressed={reviewFilter === "correct"}
                  onClick={() => setReviewFilter("correct")}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    reviewFilter === "correct"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
                  }`}
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>Làm đúng ({correctCount})</span>
                </button>
              </div>

              <span className="text-xs text-[var(--color-text-secondary)] px-2 tabular-nums">
                Hiển thị {filteredEvaluations.length} / {questions.length} câu
              </span>
            </div>
          </div>

          {/* Question Cards List */}
          <div key={reviewFilter} className="max-w-4xl w-full mx-auto px-4 space-y-5 animate-panel-enter">
            {filteredEvaluations.length === 0 ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-10 text-center">
                <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={28} aria-hidden="true" />
                </div>
                <h2 className="font-bold text-base text-[var(--color-text)] mb-1">
                  {reviewFilter === "incorrect"
                    ? "Không có câu nào bị sai"
                    : "Không có câu hỏi nào phù hợp bộ lọc"}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                  {reviewFilter === "incorrect"
                    ? "Bạn đã trả lời chính xác toàn bộ các câu hỏi trong bài kiểm tra này."
                    : "Hãy chọn bộ lọc khác để xem lại toàn bộ bài làm."}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReviewFilter("all")}
                  className="min-h-[40px] rounded-xl"
                >
                  Xem lại tất cả câu hỏi
                </Button>
              </div>
            ) : (
              filteredEvaluations.map(({ q, idx, eval: evalRes }) => {
                const studentAnswerVal = answers[q.id];

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border bg-[var(--color-surface)] shadow-xs overflow-hidden ${
                      evalRes.isCorrect
                        ? "border-emerald-500/35"
                        : "border-red-500/40"
                    }`}
                  >
                    {/* Card Header Banner */}
                    <div
                      className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                        evalRes.isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                          : "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tabular-nums">Câu {idx + 1}</span>
                        {q.sectionTitle && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                            {q.sectionTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold tabular-nums">
                          {evalRes.earnedPoints} / {q.points || 1} điểm
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                            evalRes.isCorrect
                              ? "bg-emerald-700 text-white"
                              : evalRes.isAnswered
                                ? "bg-red-700 text-white"
                                : "bg-amber-700 text-white"
                          }`}
                        >
                          {evalRes.isCorrect ? (
                            <>
                              <Check size={12} aria-hidden="true" />
                              <span>Đúng</span>
                            </>
                          ) : evalRes.isAnswered ? (
                            <>
                              <X size={12} aria-hidden="true" />
                              <span>Sai</span>
                            </>
                          ) : (
                            <span>Chưa trả lời</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <RichText
                        content={
                          q.question
                            .filter((c) => c.type === "text" || c.type === "math")
                            .map((c) => c.content)
                            .join("\n")
                        }
                        className="text-base text-[var(--color-text)] leading-relaxed"
                      />

                      {q.question.some((c) => c.type === "image") && (
                        <div className="flex flex-col gap-4 my-3">
                          {q.question.map(
                            (c, i) =>
                              c.type === "image" && (
                                <img
                                  key={i}
                                  src={c.content}
                                  alt={c.alt || `Hình minh họa câu ${idx + 1}`}
                                  className="max-w-full rounded-lg border border-[var(--color-border)] shadow-sm"
                                />
                              )
                          )}
                        </div>
                      )}

                      {/* Multiple Choice Options */}
                      {q.type === "multiple_choice" && (
                        <div className="space-y-2.5 mt-2">
                          {q.options.map((opt) => {
                            const optText = opt.content
                              .filter((c) => c.type === "text" || c.type === "math")
                              .map((c) => c.content)
                              .join(" ");
                            const isStudentSelected = studentAnswerVal === opt.id;
                            const isCorrectOpt = q.correctAnswer?.includes(opt.id);

                            let borderBgStyle =
                              "border-[var(--color-border)] bg-[var(--color-background)]";
                            if (isCorrectOpt) {
                              borderBgStyle =
                                "border-emerald-500 bg-emerald-500/10 text-[var(--color-text)]";
                            } else if (isStudentSelected && !isCorrectOpt) {
                              borderBgStyle =
                                "border-red-500 bg-red-500/10 text-[var(--color-text)]";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3.5 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${borderBgStyle}`}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <span className="font-bold text-sm shrink-0">
                                    {opt.label}.
                                  </span>
                                  <RichText content={optText} className="text-sm" />
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5 text-xs">
                                  {isCorrectOpt && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-700 text-white flex items-center gap-1">
                                      <Check size={11} aria-hidden="true" />
                                      <span>{isStudentSelected ? "Bạn chọn đúng" : "Đáp án đúng"}</span>
                                    </span>
                                  )}
                                  {isStudentSelected && !isCorrectOpt && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-700 text-white flex items-center gap-1">
                                      <X size={11} aria-hidden="true" />
                                      <span>Lựa chọn của bạn</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {/* True/False Multiple Options */}
                    {q.type === "true_false_multiple" && (
                      <div className="space-y-2 mt-2">
                        {q.options.map((opt) => {
                          const ansMap =
                            typeof studentAnswerVal === "object" && studentAnswerVal !== null
                              ? studentAnswerVal
                              : {};
                          const studentChoice = ansMap[opt.id];
                          const isExpectedTrue = q.correctAnswer.includes(opt.id);
                          const isSubCorrect = studentChoice === isExpectedTrue;
                          const optText = opt.content
                            .filter((c) => c.type === "text" || c.type === "math")
                            .map((c) => c.content)
                            .join(" ");

                          return (
                            <div
                              key={opt.id}
                              className={`p-3.5 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                                isSubCorrect
                                  ? "border-emerald-500/40 bg-emerald-500/5"
                                  : "border-red-500/40 bg-red-500/5"
                              }`}
                            >
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="font-bold shrink-0">{opt.label}.</span>
                                <RichText content={optText} className="flex-1" />
                              </div>

                              <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                                <div>
                                  <span className="text-[var(--color-text-secondary)]">Bạn chọn: </span>
                                  <span
                                    className={`font-bold ${
                                      studentChoice === undefined
                                        ? "text-amber-500"
                                        : isSubCorrect
                                          ? "text-emerald-600"
                                          : "text-red-500"
                                    }`}
                                  >
                                    {studentChoice === true
                                      ? "Đúng"
                                      : studentChoice === false
                                        ? "Sai"
                                        : "Chưa chọn"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[var(--color-text-secondary)]">Đáp án: </span>
                                  <span className="font-bold text-emerald-600">
                                    {isExpectedTrue ? "Đúng" : "Sai"}
                                  </span>
                                </div>
                                {isSubCorrect ? (
                                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <XCircle size={16} className="text-red-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation if present */}
                    {(q as any).explanation && (
                      <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                        <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-bold mb-1">Lời giải chi tiết:</div>
                          <RichText content={(q as any).explanation} className="leading-relaxed" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </main>
      </div>
    );
  }

  // RESULT SCREEN (When quiz submitted, but not in review mode)
  if (isSubmitted) {
    const { score, totalPoints } = calculateTotalScore(questions, answers);
    const evaluations = questions.map((q) => checkQuestionEvaluation(q, answers[q.id]));
    const correctCount = evaluations.filter((e) => e.isCorrect).length;
    const wrongCount = evaluations.filter((e) => !e.isCorrect).length;
    const elapsedSecs = Math.max(
      0,
      (quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : 0) - Math.max(0, timeLeft),
    );

    return (
      <div className="min-h-dvh bg-[var(--color-background)] flex flex-col font-sans">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <main className="flex-1 flex items-center justify-center p-4 pb-12">
          <div className="max-w-md w-full bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-lg border border-[var(--color-border)] p-6 md:p-8 text-center animate-stage-enter">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={36} aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Đã nộp bài thành công
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {studentInfo && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)]">
                  <User size={13} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                  <span>
                    {studentInfo.name}
                    {studentInfo.className ? ` • Lớp ${studentInfo.className}` : ""}
                  </span>
                </div>
              )}
              {examCode && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25 text-xs font-mono font-bold">
                  <Hash size={13} aria-hidden="true" />
                  <span>Mã đề: {examCode}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] mb-5">
              Kết quả bài làm đã được lưu vào hệ thống.
            </p>

            <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-5 mb-4">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                Tổng điểm đạt được
              </div>
              <div className="text-4xl font-black text-[var(--color-primary-text)] tabular-nums">
                {score.toFixed(2)}{" "}
                <span className="text-base text-[var(--color-text-secondary)] font-normal">
                  / {totalPoints.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)] text-xs font-semibold tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} aria-hidden="true" /> {correctCount} câu đúng
                </span>
                <span className="text-red-700 dark:text-red-400 flex items-center gap-1">
                  <XCircle size={13} aria-hidden="true" /> {wrongCount} chưa đúng
                </span>
                {quiz.settings.timeLimit ? (
                  <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Clock size={13} aria-hidden="true" /> {formatTime(elapsedSecs)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mb-4">
              <StreakResultCard maxStreak={streakStats.maxStreak} />
            </div>

            {isAntiCheatOn && (
              <div
                className={`p-3.5 rounded-xl border mb-5 text-left flex items-start gap-2.5 ${
                  violationCount > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                }`}
              >
                {violationCount > 0 ? (
                  <ShieldAlert
                    size={18}
                    aria-hidden="true"
                    className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                  />
                ) : (
                  <ShieldCheck
                    size={18}
                    aria-hidden="true"
                    className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                  />
                )}
                <div className="text-xs">
                  <div className="font-bold">
                    {violationCount > 0
                      ? `Ghi nhận ${violationCount} lần rời màn hình thi`
                      : "Giám sát phòng thi: Hợp lệ"}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                    {violationCount > 0
                      ? `Hệ thống đã lưu ${violationCount} lần cảnh báo vi phạm vào hồ sơ bài làm.`
                      : "Không phát hiện chuyển tab hoặc rời màn hình trong quá trình làm bài."}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5">
              <Button
                variant="primary"
                onClick={() => {
                  setReviewFilter("all");
                  setIsReviewMode(true);
                }}
                className="w-full min-h-[44px] h-12 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={18} aria-hidden="true" />
                <span>Xem lại chi tiết bài làm</span>
              </Button>

              {wrongCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewFilter("incorrect");
                    setIsReviewMode(true);
                  }}
                  className="w-full min-h-[44px] h-11 px-4 rounded-xl text-xs font-bold border border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-950/85 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <XCircle size={15} aria-hidden="true" />
                  <span>Xem ngay {wrongCount} câu chưa đúng</span>
                </button>
              )}

              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="w-full min-h-[40px] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isWarningTime = timeLeft >= 0 && timeLeft < 300; // less than 5 mins

  if (isSubmitting) {
    return <KahootLoader type="finish" text="Đang nộp bài..." />;
  }

  const requiresPass = Boolean(quiz.settings.accessPassword?.trim());
  const requiresInfo = Boolean(quiz.settings.requireStudentInfo);

  // PRE-QUIZ INFORMATION BOARD (When quiz not yet started)
  if (!hasStarted) {
    return (
      <div className="min-h-dvh bg-[var(--color-background)] flex flex-col font-sans">
        <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <GraduationCap className="text-[var(--color-primary-text)]" size={20} aria-hidden="true" />
            <span>12/4 LTVQuiz</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 shadow-lg animate-stage-enter">
            {/* Header Title */}
            <div className="text-center pb-5 mb-5 border-b border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-primary-text)] mb-1">
                Phòng thi trực tuyến
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                  {quiz.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-[var(--color-text-secondary)] mt-3 tabular-nums">
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] font-medium">
                  {quiz.settings.timeLimit ? `${quiz.settings.timeLimit} phút` : "Không giới hạn"}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] font-medium">
                  {questions.length} câu hỏi
                </span>
                {examCode && (
                  <span className="px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/25 font-mono font-bold text-teal-700 dark:text-teal-300">
                    Mã đề: {examCode}
                  </span>
                )}
              </div>
              {isAntiCheatOn && (
                <p className="mt-3 text-[11px] text-[var(--color-text-secondary)] flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} aria-hidden="true" className="text-emerald-500 shrink-0" />
                  <span>Phòng thi bật chế độ giám sát chuyển tab (tối đa {maxViolations} lần nhắc nhở)</span>
                </p>
              )}
            </div>

            {(passwordError || formError) && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-500/10 text-red-700 dark:text-red-300 rounded-xl border border-red-500/30 text-xs flex items-center gap-2 animate-notice-enter"
              >
                <AlertTriangle size={16} aria-hidden="true" className="shrink-0" />
                <span>{passwordError || formError}</span>
              </div>
            )}

            {/* Student Form & Action */}
            <form onSubmit={handleStartQuiz} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-name-input"
                    className="block text-xs font-semibold text-[var(--color-text)] mb-1.5"
                  >
                    Họ và tên thí sinh {requiresInfo && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="student-name-input"
                    type="text"
                    required={requiresInfo}
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      if (formError) setFormError("");
                    }}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="student-class-input"
                    className="block text-xs font-semibold text-[var(--color-text)] mb-1.5"
                  >
                    Lớp / Phòng thi {requiresInfo && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="student-class-input"
                    type="text"
                    required={requiresInfo}
                    value={inputClass}
                    onChange={(e) => {
                      setInputClass(e.target.value);
                      if (formError) setFormError("");
                    }}
                    placeholder="Ví dụ: 12A4"
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
              </div>

              {requiresPass && !isPasswordUnlocked && (
                <div>
                  <label
                    htmlFor="student-passcode-input"
                    className="block text-xs font-semibold text-[var(--color-text)] mb-1.5 flex items-center justify-between"
                  >
                    <span>Mật mã phòng thi <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-normal">
                      Yêu cầu từ giáo viên
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="student-passcode-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={inputPassword}
                      onChange={(e) => {
                        setInputPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      placeholder="Nhập mã truy cập..."
                      className="w-full min-h-[44px] pr-12 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-amber-500 transition-colors tracking-wider font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật mã" : "Hiện mật mã"}
                      className="absolute right-1.5 w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
                      title={showPassword ? "Ẩn mật mã" : "Hiện mật mã"}
                    >
                      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full min-h-[44px] h-12 rounded-xl text-base font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu làm bài</span>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const progressPct = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // ACTIVE QUIZ TAKING SCREEN
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-background)] font-sans selection:bg-blue-500/20 selection:text-[var(--color-primary-text)]">
      {/* Top Header */}
      <header className="min-h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-3 sm:px-4 md:px-8 shrink-0 sticky top-0 z-40 shadow-xs gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <GraduationCap className="hidden sm:block text-[var(--color-primary-text)] shrink-0" size={22} aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="font-bold text-sm md:text-base text-[var(--color-text)] truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {quiz.title}
            </h1>
            {studentInfo && (
              <span className="hidden sm:inline-block text-[11px] text-[var(--color-text-secondary)] truncate">
                {studentInfo.name}
                {studentInfo.className ? ` (${studentInfo.className})` : ""}
                {examCode && ` • Mã đề: ${examCode}`}
              </span>
            )}
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {timeLeft >= 0 && (
            <div
              title={isWarningTime ? "Thời gian làm bài còn dưới 5 phút" : "Thời gian còn lại"}
              className={`flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold tabular-nums px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors ${
                isWarningTime
                  ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40"
                  : "bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)]"
              }`}
            >
              <Clock size={15} aria-hidden="true" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          <div className="hidden sm:block">
            <StreakBadge currentStreak={streakStats.currentStreak} maxStreak={streakStats.maxStreak} />
          </div>

          <ThemeToggle />

          <Button
            variant="primary"
            onClick={() => setIsSubmitConfirmOpen(true)}
            className="rounded-xl min-h-[38px] h-9 px-3 sm:px-5 shadow-xs text-xs font-bold cursor-pointer"
          >
            <span>Nộp bài</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <main
        className={`flex-1 min-w-0 flex pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 transition-opacity ${
          isWarningOpen
            ? "pointer-events-none select-none filter blur-sm opacity-30"
            : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-5 md:p-6 lg:p-8">
          {/* MOBILE/TABLET COMPACT PALETTE BAR (< lg) */}
          <div className="lg:hidden bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-[var(--color-text)] tabular-nums">
                  Câu {currentIdx + 1}/{questions.length}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-primary)]/12 text-[var(--color-primary-text)] tabular-nums">
                  Đã làm {answeredCount}/{questions.length}
                </span>
              </div>

              <button
                type="button"
                aria-expanded={isMobilePaletteOpen}
                onClick={() => setIsMobilePaletteOpen((prev) => !prev)}
                className="min-h-11 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-xs font-semibold text-[var(--color-text)] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Bảng câu hỏi</span>
                {isMobilePaletteOpen ? (
                  <ChevronUp size={14} aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} aria-hidden="true" />
                )}
              </button>
            </div>

            <div
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến độ hoàn thành bài thi"
              className="w-full bg-[var(--color-background)] rounded-full h-1.5 overflow-hidden border border-[var(--color-border)]"
            >
              <div
                className="bg-[var(--color-primary)] h-full rounded-full transition-[width] duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {isMobilePaletteOpen ? (
              <div className="pt-2 border-t border-[var(--color-border)] grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-52 overflow-y-auto animate-panel-enter">
                {questions.map((q, idx) => {
                  const evalRes = checkQuestionEvaluation(q, answers[q.id]);
                  const answered = evalRes.isAnswered;
                  const isActive = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => {
                        setCurrentIdx(idx);
                        setIsMobilePaletteOpen(false);
                      }}
                      className={`min-h-11 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white"
                          : answered
                            ? "bg-emerald-500/15 border border-emerald-500/45 text-emerald-700 dark:text-emerald-300"
                            : "bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                {questions.map((q, idx) => {
                  const evalRes = checkQuestionEvaluation(q, answers[q.id]);
                  const answered = evalRes.isAnswered;
                  const isActive = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => setCurrentIdx(idx)}
                      className={`shrink-0 min-w-11 min-h-11 px-2 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white"
                          : answered
                            ? "bg-emerald-500/15 border border-emerald-500/45 text-emerald-700 dark:text-emerald-300"
                            : "bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP LEFT SIDEBAR: Question Palette & Progress (lg+) */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 shadow-xs sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <h2 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                  <CheckCircle2 size={16} aria-hidden="true" className="text-[var(--color-primary-text)]" />
                  <span>Bảng số câu</span>
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--color-primary)]/12 text-[var(--color-primary-text)] tabular-nums">
                  {answeredCount}/{questions.length} đã làm
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Tiến độ bài thi"
                  className="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden border border-[var(--color-border)]"
                >
                  <div
                    className="bg-[var(--color-primary)] h-2 rounded-full transition-[width] duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[var(--color-text-secondary)] mt-1.5">
                  <span>Tiến độ bài thi</span>
                  <span className="font-semibold text-[var(--color-text)] tabular-nums">
                    {progressPct}%
                  </span>
                </div>
              </div>

              {/* Question Number Buttons Grid */}
              <div className="mt-4 max-h-[54vh] overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const evalRes = checkQuestionEvaluation(q, answers[q.id]);
                    const answered = evalRes.isAnswered;
                    const isActive = idx === currentIdx;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums transition-colors cursor-pointer relative ${
                          isActive
                            ? "bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary-text)]/40"
                            : answered
                              ? "bg-emerald-500/15 border border-emerald-500/45 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/25"
                              : "bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text)]"
                        }`}
                        title={`Câu ${idx + 1}: ${
                          answered ? "Đã trả lời" : "Chưa trả lời"
                        }`}
                      >
                        <span>{idx + 1}</span>
                        {answered && !isActive && (
                          <span aria-hidden="true" className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette Legend */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-around text-[11px] text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]" />
                  <span>Đang làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-background)]" />
                  <span>Chưa làm</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-[var(--color-text-muted)] text-center">
                Mẹo: Dùng phím mũi tên trái/phải để chuyển câu
              </p>
            </div>
          </aside>

          {/* RIGHT / MAIN CONTENT: Current Question Card */}
          <div className="flex-1 min-w-0">
            <div
              key={currentQ.id}
              className="bg-[var(--color-surface)] rounded-2xl shadow-xs border border-[var(--color-border)] overflow-hidden animate-question-enter"
            >
              {/* Question Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-background)] flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-primary-text)] tabular-nums">
                    Câu {currentIdx + 1}
                  </h2>
                  <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                    / {questions.length}
                  </span>
                  {currentQ.sectionTitle && (
                    <span className="hidden sm:inline-block text-[11px] px-2.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {currentQ.sectionTitle}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--color-primary)]/12 text-[var(--color-primary-text)] tabular-nums">
                  {currentQ.points || 1} điểm
                </span>
              </div>

              {/* Question Content */}
              <div className="p-4 sm:p-6 md:p-8">
                <RichText
                  content={
                    currentQ.question
                      .filter((c) => c.type === "text" || c.type === "math")
                      .map((c) => c.content)
                      .join("\n")
                  }
                  className="text-base md:text-lg text-[var(--color-text)] leading-relaxed mb-5"
                />

                {currentQ.question.some((c) => c.type === "image") && (
                  <div className="flex flex-col gap-4 mb-6">
                    {currentQ.question.map(
                      (c, i) =>
                        c.type === "image" && (
                          <img
                            key={i}
                            src={c.content}
                            alt={c.alt || `Hình minh họa câu ${currentIdx + 1}`}
                            className="max-w-full rounded-lg border border-[var(--color-border)] shadow-sm"
                          />
                        )
                    )}
                  </div>
                )}

                {/* Question Options */}
                <div className="space-y-3">
                  {currentQ.type === "true_false_multiple" ? (
                    currentQ.options.map((opt) => {
                      const optContent = opt.content
                        .filter((c) => c.type === "text" || c.type === "math")
                        .map((c) => c.content)
                        .join(" ");
                      const hasImages = opt.content.some((c) => c.type === "image");
                      const ansMap = answers[currentQ.id] || {};
                      const isTrue = ansMap[opt.id] === true;
                      const isFalse = ansMap[opt.id] === false;

                      return (
                        <div
                          key={opt.id}
                          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left p-3.5 sm:p-4 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-[var(--color-background)]/40"
                        >
                          <div className="flex-1 text-sm sm:text-base text-[var(--color-text)] flex flex-col gap-2 min-w-0">
                            <div className="flex gap-2">
                              <span className="font-bold shrink-0">
                                {opt.label}.
                              </span>
                              <RichText content={optContent} className="w-full" />
                            </div>
                            {hasImages && (
                              <div className="flex flex-wrap gap-2 pl-6 mt-1">
                                {opt.content.map(
                                  (c, i) =>
                                    c.type === "image" && (
                                      <img
                                        key={i}
                                        src={c.content}
                                        alt={c.alt || `Hình ý ${opt.label}`}
                                        className="max-h-32 rounded border border-[var(--color-border)] shadow-sm"
                                      />
                                    )
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <button
                              type="button"
                              aria-pressed={isTrue}
                              onClick={() => {
                                const newAnsMap = { ...ansMap, [opt.id]: true };
                                handleAnswerChange(currentQ.id, newAnsMap);
                              }}
                              className={`flex-1 sm:flex-none min-w-[72px] min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                isTrue
                                  ? "bg-emerald-700 border-emerald-600 text-white"
                                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-emerald-500/50"
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              aria-pressed={isFalse}
                              onClick={() => {
                                const newAnsMap = { ...ansMap, [opt.id]: false };
                                handleAnswerChange(currentQ.id, newAnsMap);
                              }}
                              className={`flex-1 sm:flex-none min-w-[72px] min-h-11 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                isFalse
                                  ? "bg-red-700 border-red-600 text-white"
                                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-red-500/50"
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    currentQ.options.map((opt) => {
                      const optContent = opt.content
                        .filter((c) => c.type === "text" || c.type === "math")
                        .map((c) => c.content)
                        .join(" ");
                      const hasImages = opt.content.some((c) => c.type === "image");
                      const isSelected = answers[currentQ.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelect(opt.id)}
                          className={`w-full min-h-[52px] flex items-start text-left p-3.5 sm:p-4 rounded-[var(--radius-lg)] border-2 transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                            isSelected
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12"
                              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-background)]"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 transition-colors duration-[var(--duration-fast)] ${
                              isSelected
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                : "border-[var(--color-border)] bg-[var(--color-background)]"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1 text-sm sm:text-base text-[var(--color-text)] flex flex-col gap-2 min-w-0">
                            <div className="flex gap-2">
                              <span className="font-bold shrink-0">
                                {opt.label}.
                              </span>
                              <RichText content={optContent} className="w-full" />
                            </div>
                            {hasImages && (
                              <div className="flex flex-wrap gap-2 pl-6 mt-1">
                                {opt.content.map(
                                  (c, i) =>
                                    c.type === "image" && (
                                      <img
                                        key={i}
                                        src={c.content}
                                        alt={c.alt || `Hình phương án ${opt.label}`}
                                        className="max-h-32 rounded border border-[var(--color-border)] shadow-sm"
                                      />
                                    )
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Desktop Card Navigation Footer */}
                <div className="hidden lg:flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[var(--color-border)]">
                  <Button
                    variant="secondary"
                    className="flex items-center gap-1.5 min-h-[42px] px-4 rounded-xl disabled:opacity-40 cursor-pointer"
                    disabled={isFirst}
                    onClick={() => setCurrentIdx((prev) => prev - 1)}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                    <span>Câu trước</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={isLast ? "primary" : "secondary"}
                      className="flex items-center gap-1.5 min-h-[42px] px-5 rounded-xl cursor-pointer"
                      onClick={() => {
                        if (isLast) setIsSubmitConfirmOpen(true);
                        else setCurrentIdx((prev) => prev + 1);
                      }}
                    >
                      <span>{isLast ? "Hoàn thành bài thi" : "Câu tiếp theo"}</span>
                      {isLast ? <CheckCircle2 size={16} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Điều hướng câu hỏi"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-2.5 shadow-lg"
      >
        <Button
          variant="secondary"
          disabled={isFirst}
          onClick={() => setCurrentIdx((prev) => prev - 1)}
          className="flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Câu trước</span>
        </Button>

        <Button
          variant={isLast ? "primary" : "secondary"}
          onClick={() => {
            if (isLast) setIsSubmitConfirmOpen(true);
            else setCurrentIdx((prev) => prev + 1);
          }}
          className="flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <span>{isLast ? "Nộp bài" : "Câu tiếp"}</span>
          {isLast ? <Send size={15} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </Button>
      </nav>

      {/* Submit Confirmation Modal */}
      {isSubmitConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-confirm-title"
          className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 animate-scale-up">
            <div className="space-y-1.5">
              <h2 id="submit-confirm-title" className="text-base sm:text-lg font-bold text-[var(--color-text)]">
                Xác nhận nộp bài?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed tabular-nums">
                Bạn đã trả lời{" "}
                <strong className="text-[var(--color-text)]">
                  {answeredCount}/{questions.length}
                </strong>{" "}
                câu hỏi.
                {unansweredCount > 0
                  ? ` Vẫn còn ${unansweredCount} câu chưa chọn đáp án.`
                  : " Tất cả các câu hỏi đã có đáp án."}
              </p>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle size={15} aria-hidden="true" className="shrink-0" />
                <span>Sau khi nộp bài, bạn không thể chỉnh sửa lại câu trả lời.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                variant="secondary"
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="min-h-[44px] px-4 rounded-xl text-xs font-semibold"
              >
                Quay lại làm tiếp
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsSubmitConfirmOpen(false);
                  submitAttempt();
                }}
                className="min-h-[44px] px-4 rounded-xl text-xs font-bold"
              >
                Xác nhận nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}

      <StreakCelebrationPopup
        isOpen={streakPopup.isOpen}
        streakCount={streakPopup.count}
        onClose={() => setStreakPopup((prev) => ({ ...prev, isOpen: false }))}
      />

      <AntiCheatWarningModal
        isOpen={isWarningOpen && !isSubmitted}
        violationCount={violationCount}
        maxViolations={maxViolations}
        onDismiss={dismissWarning}
      />
    </div>
  );
}
