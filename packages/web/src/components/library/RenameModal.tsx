import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';
import { Button } from '../Button';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialName: string;
  onRename: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  title = 'Đổi tên',
  initialName,
  onRename,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setError(null);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tên không được để trống.');
      return;
    }
    onRename(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Edit3 size={19} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">{title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Cập nhật tên hiển thị</p>
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
              Tên mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
              Hủy
            </Button>
            <Button variant="primary" type="submit" className="text-xs h-9 px-4">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
