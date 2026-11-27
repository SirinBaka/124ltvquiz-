import React, { useState } from 'react';
import { BookmarkPlus, X, CheckCircle } from 'lucide-react';
import { Button } from '../Button';
import { LibraryStorageService } from '../../services/libraryStorageService';
import type { Question, Quiz, LibraryResource } from '@ltvquiz/shared';

interface SaveToLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  questions?: Question[];
  quiz?: Quiz;
  sourceDocId?: string;
  onSuccess?: (resource: LibraryResource) => void;
}

export const SaveToLibraryModal: React.FC<SaveToLibraryModalProps> = ({
  isOpen,
  onClose,
  defaultTitle,
  questions,
  quiz,
  sourceDocId,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState(defaultTitle);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const folders = LibraryStorageService.getFolders();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên tài nguyên.');
      return;
    }

    try {
      let created: LibraryResource;
      if (quiz) {
        created = LibraryStorageService.createExamResource(quiz, selectedFolderId);
      } else if (questions) {
        created = LibraryStorageService.createQuestionSetResource(
          trimmed,
          questions,
          selectedFolderId,
          sourceDocId,
          description
        );
      } else {
        throw new Error('Không có dữ liệu câu hỏi hoặc đề thi hợp lệ.');
      }

      setSavedSuccess(true);
      if (onSuccess) onSuccess(created);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu vào Kho đề.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookmarkPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Lưu vào Kho đề</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Lưu trữ vĩnh viễn và đồng bộ câu hỏi vào hệ thống thư mục
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle size={28} />
            </div>
            <h4 className="font-bold text-sm text-[var(--color-text)]">Đã lưu thành công!</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tài nguyên đã được cập nhật vào Kho đề của bạn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                Tên hiển thị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                Chọn thư mục lưu trữ
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="">(Gốc Kho đề)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                Ghi chú mô tả (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Bộ câu hỏi kiểm tra định kỳ 45 phút học kỳ 1"
                rows={2}
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
              <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
                Hủy
              </Button>
              <Button variant="primary" type="submit" className="text-xs h-9 px-4 bg-emerald-600 hover:bg-emerald-700">
                Lưu vào Kho đề
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
