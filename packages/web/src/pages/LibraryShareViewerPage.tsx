import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  FileText,
  HelpCircle,
  Award,
  Download,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Button } from '../components/Button';
import { RichContent } from '../components/RichText';
import { LibraryStorageService } from '../services/libraryStorageService';
import { LibraryZipService } from '../services/libraryZipService';
import { formatFileSize } from './createQuizHelper';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Question } from '@ltvquiz/shared';

export const LibraryShareViewerPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const validation = useMemo(() => {
    if (!token) return { valid: false, reason: 'not_found' as const };
    return LibraryStorageService.validateShareLink(token);
  }, [token]);

  useDocumentTitle(
    validation.valid && validation.resource
      ? `12/4 LTVQuiz - ${validation.resource.displayName}`
      : '12/4 LTVQuiz - Liên kết chia sẻ'
  );

  const handleDownload = async () => {
    if (!validation.resource) return;
    try {
      await LibraryZipService.downloadSingleResource(validation.resource);
    } catch (err: any) {
      alert(err.message || 'Không thể tải xuống tệp.');
    }
  };

  // Error States
  if (!validation.valid || !validation.resource) {
    let title = 'Liên kết không hợp lệ';
    let message = 'Đường dẫn chia sẻ không tồn tại hoặc tài nguyên đã bị xóa.';

    if (validation.reason === 'expired') {
      title = 'Liên kết đã hết hạn';
      message = 'Đường dẫn chia sẻ này đã hết thời gian hiệu lực được cấp bởi người tạo.';
    } else if (validation.reason === 'revoked') {
      title = 'Liên kết đã bị thu hồi';
      message = 'Chủ sở hữu tài nguyên đã hủy quyền truy cập của liên kết này.';
    }

    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            {validation.reason === 'expired' ? <Clock size={28} /> : <ShieldAlert size={28} />}
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {message}
          </p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="secondary" className="text-xs h-9 px-4">
                Quay về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { resource } = validation;
  const questions: Question[] = resource.metadata?.questions || resource.questions || [];
  const quiz = resource.metadata?.quiz;

  return (
    <div className="min-h-dvh bg-[var(--color-background)] py-4 sm:py-10 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                resource.resourceType === 'source_document'
                  ? 'bg-blue-500/10 text-blue-600'
                  : resource.resourceType === 'question_set'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-purple-500/10 text-purple-600'
              }`}
            >
              {resource.resourceType === 'source_document' ? (
                <FileText size={24} />
              ) : resource.resourceType === 'question_set' ? (
                <HelpCircle size={24} />
              ) : (
                <Award size={24} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/10 text-blue-600">
                  Chế độ xem bảo mật
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(resource.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[var(--color-text)] wrap-anywhere mt-1">
                {resource.displayName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              onClick={handleDownload}
              className="text-xs min-h-11 sm:min-h-9 px-3.5 gap-1.5 shadow-xs"
            >
              <Download size={14} />
              <span>Tải xuống</span>
            </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 sm:p-6 shadow-sm space-y-6">
          {/* Source Document View */}
          {resource.resourceType === 'source_document' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Thông tin tệp
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Định dạng:</span>{' '}
                    <span className="font-medium text-[var(--color-text)] uppercase">
                      {resource.fileExtension}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Dung lượng:</span>{' '}
                    <span className="font-medium text-[var(--color-text)]">
                      {resource.fileSize ? formatFileSize(resource.fileSize) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-10 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/50">
                <FileText size={48} className="mx-auto text-[var(--color-primary)] mb-3 opacity-80" />
                <h4 className="font-bold text-sm text-[var(--color-text)]">
                  Tài liệu nguồn đã sẵn sàng
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
                  Bạn có thể tải về tệp gốc nguyên vẹn để học tập và ôn luyện.
                </p>
                <div className="mt-4">
                  <Button variant="primary" onClick={handleDownload} className="text-xs h-9 px-4 gap-1.5">
                    <Download size={14} />
                    <span>Tải về tệp này</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Question Set View (Safe read-only questions without leaking answers) */}
          {resource.resourceType === 'question_set' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Danh sách câu hỏi ({questions.length} câu)
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Lock size={12} />
                  Đáp án được bảo mật
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q: Question, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="p-3 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-3"
                  >
                    <div className="font-bold text-xs sm:text-sm text-[var(--color-text)] flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
                        Câu {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <RichContent content={q.question} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:pl-6">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex gap-2 p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)]"
                        >
                          <span className="shrink-0 font-bold text-[var(--color-primary)]">
                            {opt.label || opt.id.toUpperCase()}.
                          </span>
                          <div className="min-w-0 flex-1">
                            <RichContent content={opt.content} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam View */}
          {resource.resourceType === 'exam' && (
            <div className="space-y-5 text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                <Award size={36} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--color-text)]">
                  {quiz?.title || resource.displayName}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Đề thi trắc nghiệm trực tuyến LTVQuiz
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <div>
                  <span className="text-[var(--color-text-secondary)]">Số lượng câu:</span>{' '}
                  <span className="font-bold text-[var(--color-text)]">
                    {quiz?.questions?.length || questions.length} câu
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">Thời gian:</span>{' '}
                  <span className="font-bold text-[var(--color-text)]">
                    {quiz?.settings?.timeLimitMinutes ? `${quiz.settings.timeLimitMinutes} phút` : 'Tự do'}
                  </span>
                </div>
              </div>

              {quiz?.id && (
                <div className="pt-2">
                  <Link to={`/test/${quiz.id}`}>
                    <Button variant="primary" className="text-xs h-9 px-6 gap-1.5 shadow-sm">
                      <ExternalLink size={14} />
                      <span>Bắt đầu làm bài thi</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--color-text-secondary)]">
          12/4 LTVQuiz — Nền tảng ôn thi & chia sẻ tài liệu thông minh
        </div>
      </div>
    </div>
  );
};
