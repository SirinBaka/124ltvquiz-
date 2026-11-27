import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Quiz, QuizSettings } from "@ltvquiz/shared";
import { StorageService } from "../services/storageService";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Button } from "../components/Button";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { OnOffSwitch } from "../components/OnOffSwitch";
import { KahootLoader } from "../components/KahootLoader";
import { QrCodeView } from "../components/QrCodeView";
import { ShareLinkBanner } from "../components/ShareLinkBanner";
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  BarChart3,
  Check,
  Lock,
} from "lucide-react";

export function PublishQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [settings, setSettings] = useState<QuizSettings>({
    timeLimit: 45,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: "immediately",
    allowReview: true,
    maxAttempts: 1,
    requireStudentInfo: false,
    enableAntiCheat: true,
    maxViolations: 3,
    accessPassword: "",
    assignExamCode: false,
    maxStudentsLimit: null,
  });

  const [attemptsCount, setAttemptsCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  useDocumentTitle(quiz ? `Xuất bản: ${quiz.title}` : "Xuất bản đề thi - A4 LTVQuiz");

  useEffect(() => {
    if (!id) {
      navigate("/dashboard/quizzes");
      return;
    }
    const loaded = StorageService.getQuiz(id);
    if (!loaded) {
      navigate("/dashboard/quizzes");
      return;
    }
    setQuiz(loaded);
    setSettings({
      timeLimit: loaded.settings.timeLimit ?? 45,
      shuffleQuestions: loaded.settings.shuffleQuestions ?? true,
      shuffleOptions: loaded.settings.shuffleOptions ?? true,
      showResults: loaded.settings.showResults ?? "immediately",
      allowReview: loaded.settings.allowReview ?? true,
      maxAttempts: loaded.settings.maxAttempts ?? 1,
      requireStudentInfo: loaded.settings.requireStudentInfo ?? false,
      enableAntiCheat: loaded.settings.enableAntiCheat !== false,
      maxViolations: loaded.settings.maxViolations ?? 3,
      accessPassword: loaded.settings.accessPassword ?? "",
      assignExamCode: loaded.settings.assignExamCode ?? false,
      maxStudentsLimit: loaded.settings.maxStudentsLimit ?? null,
    });
    setAttemptsCount(StorageService.getAttemptsForQuiz(loaded.id).length);
  }, [id, navigate]);

  const updateSettings = (patch: Partial<QuizSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (quiz) {
        const updatedQuiz: Quiz = {
          ...quiz,
          settings: next,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveQuiz(updatedQuiz);
        setQuiz(updatedQuiz);
      }
      return next;
    });
  };

  if (!quiz) {
    return <KahootLoader text="Đang tải cấu hình đề thi..." />;
  }

  const questions = quiz.questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const errors = questions.filter((q) => q.validation?.status === "error").length;
  const warnings = questions.filter((q) => q.validation?.status === "warning").length;
  const canPublish = errors === 0 && questions.length > 0;
  const isPublished = quiz.status === "published";
  const publicLink = `${window.location.origin}/test/${quiz.id}`;

  const handlePublish = () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setTimeout(() => {
      const updatedQuiz: Quiz = {
        ...quiz,
        settings,
        status: "published",
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveQuiz(updatedQuiz);
      setQuiz(updatedQuiz);
      setIsPublishing(false);
    }, 450);
  };

  const handleUnpublish = () => {
    const updatedQuiz: Quiz = {
      ...quiz,
      settings,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveQuiz(updatedQuiz);
    setQuiz(updatedQuiz);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFullInfo = () => {
    const pass = settings.accessPassword?.trim();
    const fullText = pass
      ? `${quiz.title || "Bài kiểm tra"}\n🔗 Link làm bài: ${publicLink}\n🔑 Mật mã phòng thi: ${pass}`
      : `${quiz.title || "Bài kiểm tra"}\n🔗 Link làm bài: ${publicLink}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const isTimeLimited = settings.timeLimit !== null && settings.timeLimit > 0;
  const isAntiCheatOn = settings.enableAntiCheat !== false;
  const isPasscodeOn = Boolean(settings.accessPassword);
  const isStudentLimitOn =
    settings.maxStudentsLimit !== null &&
    settings.maxStudentsLimit !== undefined &&
    settings.maxStudentsLimit > 0;
  const isImmediateResult = settings.showResults === "immediately";

  return (
    <div className="min-h-dvh bg-[var(--color-background)] flex flex-col">
      {isPublishing && <KahootLoader text="Đang xuất bản bài kiểm tra..." />}

      {/* Top Navigation Bar */}
      <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/editor/${quiz.id}`)}
            aria-label="Quay lại soạn đề"
            className="inline-flex min-h-11 min-w-11 md:min-h-0 md:min-w-0 items-center justify-center gap-1.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--color-background)] text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Quay lại soạn đề</span>
          </button>

          <div className="h-4 w-[1px] bg-[var(--color-border)] hidden sm:block" />

          <h1 className="text-sm md:text-base font-bold text-[var(--color-text)] truncate">
            {quiz.title || "Bài kiểm tra mới"}
          </h1>
          <span
            className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isPublished
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-gray-500/10 text-[var(--color-text-secondary)]"
            }`}
          >
            {isPublished ? "Đã xuất bản" : "Bản nháp"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/quizzes")}
            className="text-xs h-9 px-3 hidden sm:inline-flex"
          >
            Quản lý đề thi
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            Cấu hình & Xuất bản đề thi
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Bật hoặc tắt các tùy chọn bên dưới trước khi phát hành đề thi cho học sinh.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
          {/* LEFT COLUMN: Clean flat toggle list without unnecessary boxes */}
          <div className="lg:col-span-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
            {/* 1. Time Limit */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    Giới hạn thời gian làm bài
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Đếm ngược và tự động nộp bài khi hết giờ.
                  </p>
                </div>
                <OnOffSwitch
                  checked={isTimeLimited}
                  ariaLabel="Bật hoặc tắt giới hạn thời gian làm bài"
                  onChange={(on) =>
                    updateSettings({
                      timeLimit: on
                        ? settings.timeLimit && settings.timeLimit > 0
                          ? settings.timeLimit
                          : 45
                        : null,
                    })
                  }
                />
              </div>

              {isTimeLimited && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">Thời lượng:</span>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={settings.timeLimit ?? 45}
                    onChange={(e) =>
                      updateSettings({
                        timeLimit: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 w-20 px-2.5 text-xs font-mono font-bold bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">phút</span>
                </div>
              )}
            </div>

            {/* 2. Shuffle Questions */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Xáo trộn câu hỏi
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Đảo ngẫu nhiên thứ tự câu hỏi cho mỗi học sinh.
                </p>
              </div>
              <OnOffSwitch
                checked={settings.shuffleQuestions}
                ariaLabel="Bật hoặc tắt xáo trộn câu hỏi"
                onChange={(on) => updateSettings({ shuffleQuestions: on })}
              />
            </div>

            {/* 3. Shuffle Options */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Xáo trộn đáp án (A, B, C, D)
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Đảo ngẫu nhiên vị trí các phương án trả lời trong từng câu trắc nghiệm.
                </p>
              </div>
              <OnOffSwitch
                checked={settings.shuffleOptions}
                ariaLabel="Bật hoặc tắt xáo trộn đáp án"
                onChange={(on) => updateSettings({ shuffleOptions: on })}
              />
            </div>

            {/* 4. Assign Exam Code */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Thêm mã đề cho mỗi học sinh
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Tự động cấp mã đề riêng (101, 102...) và lưu vào kết quả nộp bài.
                </p>
              </div>
              <OnOffSwitch
                checked={Boolean(settings.assignExamCode)}
                ariaLabel="Bật hoặc tắt thêm mã đề cho mỗi học sinh"
                onChange={(on) => updateSettings({ assignExamCode: on })}
              />
            </div>

            {/* 5. Max Students Limit */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    Giới hạn lượng thí sinh làm đề
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Tự động khóa phòng thi khi đủ số lượng thí sinh nộp bài.
                  </p>
                </div>
                <OnOffSwitch
                  checked={isStudentLimitOn}
                  ariaLabel="Bật hoặc tắt giới hạn lượng thí sinh làm đề"
                  onChange={(on) =>
                    updateSettings({
                      maxStudentsLimit: on
                        ? settings.maxStudentsLimit && settings.maxStudentsLimit > 0
                          ? settings.maxStudentsLimit
                          : 40
                        : null,
                    })
                  }
                />
              </div>

              {isStudentLimitOn && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">Tối đa:</span>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={settings.maxStudentsLimit ?? 40}
                    onChange={(e) =>
                      updateSettings({
                        maxStudentsLimit: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 w-20 px-2.5 text-xs font-mono font-bold bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">thí sinh</span>
                </div>
              )}
            </div>

            {/* 6. Require Student Info */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Yêu cầu nhập Họ tên & Lớp
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Học sinh bắt buộc điền tên và lớp trước khi bắt đầu làm bài.
                </p>
              </div>
              <OnOffSwitch
                checked={Boolean(settings.requireStudentInfo)}
                ariaLabel="Bật hoặc tắt yêu cầu nhập họ tên và lớp"
                onChange={(on) => updateSettings({ requireStudentInfo: on })}
              />
            </div>

            {/* 7. Anti-Cheat */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    Chống gian lận (Anti-cheat)
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Cảnh báo khi chuyển tab hoặc rời màn hình thi và tự nộp khi quá giới hạn.
                  </p>
                </div>
                <OnOffSwitch
                  checked={isAntiCheatOn}
                  ariaLabel="Bật hoặc tắt chống gian lận"
                  onChange={(on) => updateSettings({ enableAntiCheat: on })}
                />
              </div>

              {isAntiCheatOn && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Tự nộp nếu vi phạm quá:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.maxViolations ?? 3}
                    onChange={(e) =>
                      updateSettings({
                        maxViolations: Math.max(1, parseInt(e.target.value, 10) || 3),
                      })
                    }
                    className="h-8 w-16 px-2.5 text-xs font-mono font-bold bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
                  />
                  <span className="text-xs text-[var(--color-text-secondary)]">lần</span>
                </div>
              )}
            </div>

            {/* 8. Passcode */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    Mật mã phòng thi (Passcode)
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Yêu cầu học sinh nhập đúng mật khẩu mới được mở đề thi.
                  </p>
                </div>
                <OnOffSwitch
                  checked={isPasscodeOn}
                  ariaLabel="Bật hoặc tắt mật mã phòng thi"
                  onChange={(on) =>
                    updateSettings({
                      accessPassword: on ? settings.accessPassword || "123456" : "",
                    })
                  }
                />
              </div>

              {isPasscodeOn && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">Mật mã:</span>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={settings.accessPassword || ""}
                      onChange={(e) => updateSettings({ accessPassword: e.target.value })}
                      placeholder="Nhập mật mã..."
                      className="h-8 w-44 pl-2.5 pr-8 text-xs font-mono font-bold bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-0.5 cursor-pointer"
                      title={showPassword ? "Ẩn mật mã" : "Hiện mật mã"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 9. Show Score Immediately */}
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Hiển thị điểm ngay sau khi nộp bài
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Cho phép học sinh xem điểm số vừa đạt được sau khi hoàn thành.
                </p>
              </div>
              <OnOffSwitch
                checked={isImmediateResult}
                ariaLabel="Bật hoặc tắt hiển thị điểm ngay sau khi nộp bài"
                onChange={(on) =>
                  updateSettings({ showResults: on ? "immediately" : "never" })
                }
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Summary & Publish / Share */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Only show alert if errors or warnings exist */}
            {questions.length === 0 ? (
              <div className="text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <XCircle size={16} className="shrink-0 mt-0.5" />
                <span>Chưa có câu hỏi nào. Vui lòng quay lại trình soạn thảo để thêm câu hỏi.</span>
              </div>
            ) : errors > 0 ? (
              <div className="text-red-600 dark:text-red-400 text-xs space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <XCircle size={15} /> Không thể xuất bản: còn {errors} lỗi cần sửa.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/editor/${quiz.id}`)}
                  className="text-xs h-8"
                >
                  Quay lại kiểm tra lỗi
                </Button>
              </div>
            ) : warnings > 0 ? (
              <div className="text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1.5">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Có {warnings} cảnh báo nhẹ. Bạn vẫn có thể xuất bản đề thi.</span>
              </div>
            ) : null}

            {/* Clean summary line & Publish / Share */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Số lượng câu hỏi</span>
                  <span className="font-bold text-[var(--color-text)]">{questions.length} câu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Tổng thang điểm</span>
                  <span className="font-bold text-[var(--color-text)]">{totalPoints} điểm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Thời gian</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {isTimeLimited ? `${settings.timeLimit} phút` : "Không giới hạn"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Đã nộp bài</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {isStudentLimitOn
                      ? `${attemptsCount} / ${settings.maxStudentsLimit} thí sinh`
                      : `${attemptsCount} lượt`}
                  </span>
                </div>
              </div>

              {!isPublished ? (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  disabled={!canPublish || isPublishing}
                  className={`w-full h-11 text-sm font-bold rounded-xl ${
                    !canPublish || isPublishing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {warnings > 0 ? "Vẫn xuất bản đề thi" : "Xuất bản đề thi ngay"}
                </Button>
              ) : (
                <div className="space-y-4 pt-3 border-t border-[var(--color-border)]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                      Link làm bài thi
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 flex items-center text-xs font-mono text-[var(--color-text)] truncate">
                        <LinkIcon size={13} className="mr-2 shrink-0 text-[var(--color-primary)]" />
                        <span className="truncate">{publicLink}</span>
                      </div>
                      <Button
                        variant="secondary"
                        className="px-3 text-xs shrink-0 gap-1"
                        onClick={handleCopyLink}
                      >
                        {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedLink ? "Đã chép" : "Chép"}</span>
                      </Button>
                    </div>
                  </div>

                  {isPasscodeOn && settings.accessPassword && (
                    <div className="flex items-center justify-between gap-2 text-xs py-1">
                      <div className="flex items-center gap-1.5 text-[var(--color-text)] min-w-0">
                        <Lock size={13} className="text-amber-500 shrink-0" />
                        <span className="text-[var(--color-text-secondary)]">Mật mã:</span>
                        <span className="font-mono font-bold truncate">{settings.accessPassword}</span>
                      </div>
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1 text-xs shrink-0"
                        onClick={handleCopyFullInfo}
                      >
                        <Copy size={12} />
                        <span>{copiedAll ? "Đã chép" : "Chép link & mã"}</span>
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(`/test/${quiz.id}`, "_blank")}
                      className="h-9 text-xs gap-1.5"
                    >
                      <ExternalLink size={14} />
                      <span>Mở đề thi thử</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/report/${quiz.id}`)}
                      className="h-9 text-xs gap-1.5"
                    >
                      <BarChart3 size={14} />
                      <span>Xem báo cáo</span>
                    </Button>
                  </div>

                  <ShareLinkBanner
                    url={publicLink}
                    title={quiz.title || "Bài kiểm tra trực tuyến"}
                    subtitle="Bài kiểm tra trắc nghiệm trực tuyến"
                  />

                  <QrCodeView
                    url={publicLink}
                    title={quiz.title || "Bài kiểm tra"}
                    defaultFileName="bai-thi"
                    description="Quét mã QR hoặc tải ảnh về máy để gửi cho học sinh"
                  />

                  <div className="pt-2 border-t border-[var(--color-border)] text-center">
                    <button
                      type="button"
                      onClick={handleUnpublish}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer underline-offset-2 hover:underline"
                    >
                      Tạm đóng bài thi (Chuyển về bản nháp)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
