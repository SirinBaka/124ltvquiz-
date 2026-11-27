import React from 'react';
import { X, FileText, HelpCircle, Award, Download, ExternalLink, Calendar, HardDrive } from 'lucide-react';
import { Button } from '../Button';
import { RichContent } from '../RichText';
import { formatFileSize } from '../../pages/createQuizHelper';
import { LibraryZipService } from '../../services/libraryZipService';
import { StorageService } from '../../services/storageService';
import type { LibraryResource, Question } from '@ltvquiz/shared';
import { useNavigate } from 'react-router-dom';

interface LibraryResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: LibraryResource | null;
}

export const LibraryResourcePreviewModal: React.FC<LibraryResourcePreviewModalProps> = ({
  isOpen,
  onClose,
  resource,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !resource) return null;

  const handleDownload = async () => {
    try {
      await LibraryZipService.downloadSingleResource(resource);
    } catch (err: any) {
      alert(err.message || 'Không thể tải xuống tệp.');
    }
  };

  const isDocType = resource.resourceType === 'document' || resource.resourceType === 'source_document';
  const questions: Question[] = resource.questions || resource.metadata?.questions || [];
  const quiz = resource.quizId ? StorageService.getQuiz(resource.quizId) : resource.metadata?.quiz;

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDocType
                ? 'bg-blue-500/10 text-blue-600'
                : resource.resourceType === 'question_set'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-purple-500/10 text-purple-600'
            }`}>
              {isDocType ? (
                <FileText size={20} />
              ) : resource.resourceType === 'question_set' ? (
                <HelpCircle size={20} />
              ) : (
                <Award size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-[var(--color-text)] truncate">
                {resource.displayName}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(resource.createdAt).toLocaleDateString('vi-VN')}
                </span>
                {resource.fileSize ? (
                  <span className="flex items-center gap-1">
                    <HardDrive size={12} />
                    {formatFileSize(resource.fileSize)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Source Document Preview */}
          {isDocType && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Thông tin tệp
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Định dạng:</span>{' '}
                    <span className="font-medium text-[var(--color-text)] uppercase">{resource.fileFormat || resource.fileExtension || 'pdf'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Dung lượng:</span>{' '}
                    <span className="font-medium text-[var(--color-text)]">
                      {resource.fileSize ? formatFileSize(resource.fileSize) : 'Không xác định'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[var(--color-text-secondary)]">Tệp gốc:</span>{' '}
                    <span className="font-medium text-[var(--color-text)]">{resource.originalFileName || resource.originalFilename || resource.displayName}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/50">
                <FileText size={36} className="mx-auto text-[var(--color-primary)] mb-2 opacity-80" />
                <p className="text-sm font-medium text-[var(--color-text)]">Tài liệu đã được lưu trữ an toàn</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Bạn có thể tải về máy hoặc dùng để bóc tách câu hỏi trắc nghiệm tự động.
                </p>
              </div>
            </div>
          )}

          {/* Question Set Preview */}
          {resource.resourceType === 'question_set' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>Tổng số câu hỏi: <strong className="text-[var(--color-text)]">{questions.length}</strong></span>
              </div>

              {questions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
                  Bộ câu hỏi này chưa có câu hỏi nào.
                </div>
              ) : (
                questions.map((q: Question, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] space-y-2 text-xs"
                  >
                    <div className="font-semibold text-[var(--color-text)] flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
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
                          className="flex gap-2 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
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
                ))
              )}
            </div>
          )}

          {/* Exam Preview */}
          {resource.resourceType === 'exam' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Cấu hình đề thi
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Số câu hỏi:</span>{' '}
                    <span className="font-bold text-[var(--color-text)]">
                      {quiz?.questions?.length || questions.length} câu
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Thời gian làm bài:</span>{' '}
                    <span className="font-bold text-[var(--color-text)]">
                      {quiz?.settings?.timeLimitMinutes ? `${quiz.settings.timeLimitMinutes} phút` : 'Không giới hạn'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Trộn câu hỏi:</span>{' '}
                    <span className="font-medium text-[var(--color-text)]">
                      {quiz?.settings?.shuffleQuestions ? 'Bật' : 'Tắt'}
                    </span>
                  </div>
                </div>
              </div>

              {quiz?.id && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigate(`/test/${quiz.id}`);
                      onClose();
                    }}
                    className="flex-1 text-xs h-9 gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>Vào trang làm bài thi</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate(`/editor/${quiz.id}`);
                      onClose();
                    }}
                    className="flex-1 text-xs h-9 gap-1.5"
                  >
                    <span>Mở trong trình soạn thảo</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] mt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={handleDownload}
            className="text-xs h-9 px-3 gap-1.5"
          >
            <Download size={14} />
            <span>Tải xuống</span>
          </Button>

          <Button variant="primary" type="button" onClick={onClose} className="text-xs h-9 px-4">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
