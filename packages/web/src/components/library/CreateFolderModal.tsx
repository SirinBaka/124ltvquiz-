import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { Button } from '../Button';
import { LibraryStorageService } from '../../services/libraryStorageService';
import type { LibraryFolder } from '@ltvquiz/shared';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newFolder: LibraryFolder) => void;
  currentFolderId?: string | null;
  folders: LibraryFolder[];
}

const COLOR_PRESETS = [
  { name: 'Xanh dương', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Xanh lá', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Tím', value: '#8b5cf6', bg: 'bg-purple-500' },
  { name: 'Hổ phách', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Hồng đỏ', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Xám thép', value: '#64748b', bg: 'bg-slate-500' },
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentFolderId = null,
  folders,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(currentFolderId);
  const [color, setColor] = useState(COLOR_PRESETS[0].value);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tên thư mục không được để trống.');
      return;
    }

    try {
      const created = LibraryStorageService.createFolder(trimmed, parentId, color);
      setName('');
      setError(null);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo thư mục.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Tạo thư mục mới</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Sắp xếp tài liệu và đề thi gọn gàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              Tên thư mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="VD: Toán 12 - Ôn thi THPT Quốc Gia"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              Vị trí thư mục cha
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">(Gốc Kho đề)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">
              Màu biểu tượng
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className={`w-7 h-7 rounded-full ${p.bg} transition-all cursor-pointer ${
                    color === p.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
              Hủy
            </Button>
            <Button variant="primary" type="submit" className="text-xs h-9 px-4">
              Tạo thư mục
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
