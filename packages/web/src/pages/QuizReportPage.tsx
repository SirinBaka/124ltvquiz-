import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StorageService } from "../services/storageService";
import type { Quiz, Attempt } from "@ltvquiz/shared";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ArrowLeft, Users, Clock, Award, FileSpreadsheet } from "lucide-react";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { exportStudentResultToCsv } from "../services/studentExportHelper";
import { downloadBlob } from "../services/exportService";

export function QuizReportPage() {
  useDocumentTitle("12/4 LTVQuiz - Báo cáo");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (id) {
      const loadedQuiz = StorageService.getQuiz(id);
      if (loadedQuiz) {
        setQuiz(loadedQuiz);
        setAttempts(StorageService.getAttemptsForQuiz(id));
      }
    }
  }, [id]);

  if (!quiz) {
    return <div className="p-8">Không tìm thấy bài kiểm tra.</div>;
  }

  const averageScore =
    attempts.length > 0
      ? (
          attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length
        ).toFixed(1)
      : 0;

  const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);

  const handleExportAll = () => {
    if (attempts.length === 0) return;
    const headers = [
      "Họ và tên thí sinh",
      "Lớp",
      "Mã đề",
      "Bài kiểm tra",
      "Điểm",
      "Tổng điểm",
      "Chuỗi Streak",
      "Số lần vi phạm",
      "Thời gian làm (giây)",
      "Ngày nộp",
    ];
    const rows = attempts.map((att) => [
      `"${att.studentName.replace(/"/g, '""')}"`,
      `"${(att.studentClass || "").replace(/"/g, '""')}"`,
      `"${(att.examCode || "—").replace(/"/g, '""')}"`,
      `"${quiz.title.replace(/"/g, '""')}"`,
      att.score.toFixed(1),
      att.totalPoints,
      att.maxStreak || 0,
      att.violationCount || 0,
      att.timeSpent,
      `"${new Date(att.createdAt).toLocaleString("vi-VN")}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const cleanTitle = quiz.title.replace(/[^a-zA-Z0-9]/g, "_");
    downloadBlob(blob, `Bao_cao_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="min-h-dvh bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Quay lại bảng điều khiển"
            className="grid size-11 shrink-0 place-items-center hover:bg-[var(--color-background)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-[var(--color-text)] wrap-anywhere">
              {quiz.title} - Báo cáo
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Tạo ngày {new Date(quiz.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-[var(--color-text-secondary)]">
              <Users size={20} />{" "}
              <span className="font-medium">Lượt làm bài</span>
            </div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {attempts.length}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-[var(--color-text-secondary)]">
              <Award size={20} />{" "}
              <span className="font-medium">Điểm trung bình</span>
            </div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {averageScore} / {totalPoints}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-[var(--color-text-secondary)]">
              <Clock size={20} />{" "}
              <span className="font-medium">Trạng thái</span>
            </div>
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {quiz.status === "published" ? "Đang mở" : "Đã đóng"}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="px-3.5 sm:px-6 py-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-lg text-[var(--color-text)]">
              Danh sách học sinh
            </h2>
            {attempts.length > 0 && (
              <button
                onClick={handleExportAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)] transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Xuất Excel toàn bộ</span>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table role="table" aria-label="Danh sách học sinh" className="responsive-table w-full text-left text-sm text-[var(--color-text)] md:min-w-[650px]">
              <thead role="rowgroup" className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <tr role="row">
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                    Học sinh
                  </th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">Lớp</th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">Mã đề</th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                    Điểm số
                  </th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                    Chuỗi Streak
                  </th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                    Thời gian làm
                  </th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                    Ngày nộp
                  </th>
                  <th role="columnheader" scope="col" className="px-6 py-3 font-medium whitespace-nowrap text-center">
                    Phiếu kết quả
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-[var(--color-border)]">
                {attempts.length === 0 ? (
                  <tr role="row">
                    <td role="cell"
                      colSpan={8}
                      className="px-6 py-8 text-center text-[var(--color-text-secondary)]"
                    >
                      Chưa có lượt làm bài nào.
                    </td>
                  </tr>
                ) : (
                  attempts.map((attempt) => (
                    <tr role="row"
                      key={attempt.id}
                      className="hover:bg-[var(--color-background)]"
                    >
                      <td role="cell" data-wide className="px-6 py-4 font-medium text-[var(--color-text)] whitespace-nowrap">
                        {attempt.studentName}
                      </td>
                      <td role="cell" data-label="Lớp" className="px-6 py-4 whitespace-nowrap">
                        {attempt.studentClass ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                            {attempt.studentClass}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">
                            —
                          </span>
                        )}
                      </td>
                      <td role="cell" data-label="Mã đề" className="px-6 py-4 whitespace-nowrap">
                        {attempt.examCode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                            {attempt.examCode}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">
                            —
                          </span>
                        )}
                      </td>
                      <td role="cell" data-label="Điểm số" className="px-6 py-4 font-bold text-[var(--color-primary)] whitespace-nowrap">
                        {attempt.score} / {attempt.totalPoints}
                      </td>
                      <td role="cell" data-label="Chuỗi Streak" className="px-6 py-4 whitespace-nowrap">
                        {attempt.maxStreak ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                            🔥 {attempt.maxStreak} câu
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            0
                          </span>
                        )}
                      </td>
                      <td role="cell" data-label="Thời gian làm" className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {Math.floor(attempt.timeSpent / 60)} phút{" "}
                        {attempt.timeSpent % 60} giây
                      </td>
                      <td role="cell" data-label="Ngày nộp" className="px-6 py-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                        {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td role="cell" data-wide data-actions className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => exportStudentResultToCsv(attempt, quiz)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
                          title={`Xuất kết quả bài thi dạng Excel của ${attempt.studentName}`}
                        >
                          <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Xuất Excel</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
