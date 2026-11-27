import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { Quiz } from "@ltvquiz/shared";
import { StorageService } from "../services/storageService";
import {
  FileText,
  Edit,
  Copy,
  Archive,
  Trash2,
  Download,
  Share2,
  PlusCircle,
  Search,
  X,
  FilePlus,
  ChevronDown,
} from "lucide-react";
import { ShareQuizModal } from "../components/quiz/ShareQuizModal";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type StatusFilter = "all" | "published" | "draft" | "archived";

export const ExamManagementPage: React.FC = () => {
  useDocumentTitle("A4 LTVQuiz - Quản lý bài thi");
  const navigate = useNavigate();
  const [exams, setExams] = useState<Quiz[]>([]);
  const [sharingExam, setSharingExam] = useState<Quiz | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openDownloadMenuId, setOpenDownloadMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = () => {
    setExams(
      StorageService.getQuizzes().sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  };

  const handleDuplicate = (exam: Quiz) => {
    const newExam = {
      ...exam,
      id: "quiz_" + Math.random().toString(36).substr(2, 9),
      title: exam.title + " (Bản sao)",
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveQuiz(newExam);
    loadExams();
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài thi này? Dữ liệu câu hỏi sẽ bị xóa vĩnh viễn.")) {
      StorageService.deleteQuiz(id);
      loadExams();
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`);
  };

  const handleArchive = (exam: Quiz) => {
    if (confirm("Lưu trữ bài thi này? Bài thi sẽ được chuyển vào mục lưu trữ.")) {
      exam.status = "archived";
      StorageService.saveQuiz(exam);
      loadExams();
    }
  };

  const handleDownload = (exam: Quiz, format: "pdf" | "docx" | "pptx") => {
    setOpenDownloadMenuId(null);
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${exam.title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; padding: 20px; }
        .question { margin-bottom: 20px; font-weight: bold; }
        .options { margin-left: 20px; font-weight: normal; }
        .option { margin-bottom: 10px; }
        img { max-width: 100%; height: auto; }
      </style>
      </head><body>
      <h1 style="text-align: center;">${exam.title}</h1>
      <hr/>
    `;

    exam.questions.forEach((q, i) => {
      const qText = q.question
        .map((c) =>
          c.type === "text"
            ? c.content
            : `<br/><img src="${c.content}" alt="image"/><br/>`,
        )
        .join("");
      content += `<div class="question">Câu ${i + 1}: ${qText}</div><div class="options">`;
      q.options.forEach((opt) => {
        const optText = opt.content
          .map((c) =>
            c.type === "text"
              ? c.content
              : `<br/><img src="${c.content}" alt="image" height="100"/><br/>`,
          )
          .join("");
        content += `<div class="option"><strong>${opt.label}.</strong> ${optText}</div>`;
      });
      content += `</div>`;
    });

    content += `</body></html>`;

    if (format === "docx" || format === "pptx") {
      const mimeType =
        format === "docx"
          ? "application/msword"
          : "application/vnd.ms-powerpoint";
      const extension = format === "docx" ? "doc" : "ppt";
      const blob = new Blob(["\ufeff", content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exam.title || "De_Thi"}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && exam.status === "published") ||
        (statusFilter === "draft" && exam.status === "draft") ||
        (statusFilter === "archived" &&
          (exam.status === "archived" || exam.status === "closed"));

      return matchSearch && matchStatus;
    });
  }, [exams, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: exams.length,
      published: exams.filter((e) => e.status === "published").length,
      draft: exams.filter((e) => e.status === "draft").length,
      archived: exams.filter(
        (e) => e.status === "archived" || e.status === "closed",
      ).length,
    };
  }, [exams]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Quản lý bài thi & Đề kiểm tra
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Danh sách tất cả bài thi trắc nghiệm, quản lý trạng thái xuất bản và tải về file đề.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate("/dashboard/documents")}
          >
            <FilePlus size={15} />
            <span>Tạo từ tài liệu</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/dashboard/create")}
          >
            <PlusCircle size={15} />
            <span>Tạo bài thi mới</span>
          </Button>
        </div>
      </div>

      {/* Search & Status Filters */}
      <Card className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài thi theo tiêu đề..."
            className="w-full text-xs h-9 pl-9 pr-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs shrink-0 custom-scrollbar">
          {(
            [
              { key: "all", label: "Tất cả", count: counts.all },
              { key: "published", label: "Đã xuất bản", count: counts.published },
              { key: "draft", label: "Bản nháp", count: counts.draft },
              { key: "archived", label: "Lưu trữ", count: counts.archived },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === filter.key
                  ? "bg-[var(--color-primary)] text-white shadow-2xs font-semibold"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <span>{filter.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  statusFilter === filter.key
                    ? "bg-white/20 text-white"
                    : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Exams Data Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table role="table" aria-label="Danh sách bài thi" className="responsive-table w-full text-left text-xs md:min-w-[760px]">
            <thead role="rowgroup" className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] select-none">
              <tr role="row">
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[240px]">
                  Tên bài thi
                </th>
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Số câu hỏi
                </th>
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Trạng thái
                </th>
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Lượt nộp bài
                </th>
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  Cập nhật
                </th>
                <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="divide-y divide-[var(--color-border)]">
              {filteredExams.length === 0 ? (
                <tr role="row">
                  <td role="cell" colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
                        <FileText size={18} />
                      </div>
                      <p className="text-xs font-medium text-[var(--color-text)]">
                        {searchQuery || statusFilter !== "all"
                          ? "Không tìm thấy bài thi nào phù hợp với bộ lọc."
                          : "Chưa có bài thi nào được tạo."}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 mb-3">
                        Tạo bài thi mới hoặc nhập từ file tài liệu để bắt đầu.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/dashboard/create")}
                      >
                        <PlusCircle size={14} />
                        <span>Tạo bài thi ngay</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const attemptsCount = StorageService.getAttemptsForQuiz(exam.id).length;
                  const isMenuOpen = openDownloadMenuId === exam.id;

                  return (
                    <tr role="row"
                      key={exam.id}
                      className="hover:bg-[var(--color-surface-hover)] transition-colors group"
                    >
                      {/* Title & info */}
                      <td role="cell" data-wide className="px-4 py-3.5">
                        <Link
                          to={`/editor/${exam.id}`}
                          className="font-semibold text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors block max-w-full wrap-anywhere md:max-w-md md:truncate"
                          title={exam.title}
                        >
                          {exam.title || "(Chưa đặt tên bài thi)"}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-[var(--color-text-secondary)]">
                            ID: <span className="font-mono text-[10px]">{exam.id}</span>
                          </span>
                          {exam.settings?.shuffleQuestions && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-medium">
                              Xáo câu
                            </span>
                          )}
                          {exam.settings?.shuffleOptions && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium">
                              Xáo đáp án
                            </span>
                          )}
                          {exam.settings?.assignExamCode && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-medium">
                              Mã đề
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Question count */}
                      <td role="cell" data-label="Số câu hỏi" className="px-4 py-3.5 font-medium text-[var(--color-text)] tabular-nums whitespace-nowrap">
                        {exam.questions.length} câu
                      </td>

                      {/* Status */}
                      <td role="cell" data-label="Trạng thái" className="px-4 py-3.5 whitespace-nowrap">
                        {exam.status === "published" ? (
                          <Badge status="success">Đã xuất bản</Badge>
                        ) : exam.status === "draft" ? (
                          <Badge status="default">Bản nháp</Badge>
                        ) : exam.status === "review" ? (
                          <Badge status="warning">Chờ duyệt</Badge>
                        ) : (
                          <Badge status="danger">Lưu trữ</Badge>
                        )}
                      </td>

                      {/* Attempts */}
                      <td role="cell" data-label="Lượt nộp bài" className="px-4 py-3.5 text-[var(--color-text)] tabular-nums whitespace-nowrap">
                        {exam.settings?.maxStudentsLimit && exam.settings.maxStudentsLimit > 0 ? (
                          <span
                            className={`font-semibold ${
                              attemptsCount >= exam.settings.maxStudentsLimit
                                ? "text-rose-600 dark:text-rose-400"
                                : ""
                            }`}
                          >
                            {attemptsCount} / {exam.settings.maxStudentsLimit} thí sinh
                          </span>
                        ) : (
                          <span>
                            <span className="font-semibold">{attemptsCount}</span> lượt
                          </span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td role="cell" data-label="Cập nhật" className="px-4 py-3.5 text-[var(--color-text-secondary)] tabular-nums whitespace-nowrap">
                        {new Date(exam.updatedAt || exam.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Action buttons */}
                      <td role="cell" data-wide data-actions className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex w-full flex-wrap md:flex-nowrap items-center md:justify-end gap-2 md:gap-1.5">
                          {/* Edit button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(exam.id)}
                            title="Chỉnh sửa câu hỏi & cài đặt"
                          >
                            <Edit size={13} />
                            <span>Sửa</span>
                          </Button>

                          {/* Share button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSharingExam(exam)}
                            title="Chia sẻ link làm bài & mã QR cho học sinh"
                          >
                            <Share2 size={13} />
                            <span>Chia sẻ</span>
                          </Button>

                          {/* Download dropdown */}
                          <div className="contents md:relative md:block">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setOpenDownloadMenuId(isMenuOpen ? null : exam.id)
                              }
                              aria-label="Tải đề thi"
                              aria-expanded={isMenuOpen}
                              title="Tải đề thi về máy"
                            >
                              <Download size={13} />
                              <ChevronDown size={11} className="opacity-70" />
                            </Button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="hidden md:block fixed inset-0 z-20"
                                  onClick={() => setOpenDownloadMenuId(null)}
                                />
                                <div className="order-last basis-full md:order-none md:absolute md:right-0 md:top-full mt-1 md:w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-md z-30 py-1 text-left text-xs font-medium">
                                  <button
                                    onClick={() => handleDownload(exam, "docx")}
                                    className="w-full px-3 py-1.5 hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors flex items-center justify-between"
                                  >
                                    <span>Tải file Word (.doc)</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(exam, "pdf")}
                                    className="w-full px-3 py-1.5 hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors flex items-center justify-between"
                                  >
                                    <span>In hoặc Lưu PDF</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(exam, "pptx")}
                                    className="w-full px-3 py-1.5 hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors flex items-center justify-between"
                                  >
                                    <span>PowerPoint (.ppt)</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(exam)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors"
                            title="Nhân bản đề thi này"
                            aria-label="Nhân bản đề thi"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Archive */}
                          {exam.status !== "archived" && (
                            <button
                              onClick={() => handleArchive(exam)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-amber-600 hover:bg-amber-500/10 border border-[var(--color-border)] transition-colors"
                              title="Lưu trữ bài thi"
                              aria-label="Lưu trữ bài thi"
                            >
                              <Archive size={13} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-rose-600 hover:bg-rose-500/10 border border-[var(--color-border)] transition-colors"
                            title="Xóa bài thi"
                            aria-label="Xóa bài thi"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Quiz Modal */}
      {sharingExam && (
        <ShareQuizModal
          isOpen={!!sharingExam}
          onClose={() => setSharingExam(null)}
          quizTitle={sharingExam.title}
          quizId={sharingExam.id}
        />
      )}
    </div>
  );
};
