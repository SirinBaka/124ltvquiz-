import React, { useState } from 'react';
import { FolderSymlink, Folder, X, Check } from 'lucide-react';
import { Button } from '../Button';
import { LibraryStorageService } from '../../services/libraryStorageService';
import type { LibraryFolder } from '@ltvquiz/shared';

interface MoveResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  movingFolderId?: string; // If moving a folder, to prevent cycles
  itemCount?: number;
  currentFolderId?: string | null;
  onConfirmMove: (targetFolderId: string | null) => void;
}

export const MoveResourceModal: React.FC<MoveResourceModalProps> = ({
  isOpen,
  onClose,
  title = 'Di chuyển mục',
  movingFolderId,
  itemCount = 1,
  currentFolderId = null,
  onConfirmMove,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const folders = LibraryStorageService.getFolders();

  if (!isOpen) return null;

  const isFolderDisabled = (folder: LibraryFolder): boolean => {
    if (!movingFolderId) return false;
    if (folder.id === movingFolderId) return true;
    return LibraryStorageService.isDescendantOf(folder.id, movingFolderId);
  };

  const handleConfirm = () => {
    onConfirmMove(selectedFolderId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col max-h-[85dvh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FolderSymlink size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">{title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Di chuyển {itemCount} mục sang thư mục mới
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

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px]">
          {/* Root option */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFolderId === null
                ? 'bg-blue-500/10 border-blue-500 text-blue-600 font-semibold'
                : 'border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Folder size={18} className="text-blue-500" />
              <span className="text-sm">(Gốc Kho đề)</span>
            </div>
            {selectedFolderId === null && <Check size={16} className="text-blue-500" />}
          </button>

          {/* Folder List */}
          {folders.map((folder) => {
            const disabled = isFolderDisabled(folder);
            const isSelected = selectedFolderId === folder.id;

            return (
              <button
                key={folder.id}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed bg-[var(--color-background)] border-transparent'
                    : isSelected
                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 font-semibold cursor-pointer'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text)] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder
                    size={18}
                    style={{ color: folder.color || '#3b82f6' }}
                    className="shrink-0"
                  />
                  <span className="text-sm truncate">{folder.name}</span>
                  {disabled && (
                    <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">
                      (Không thể chọn)
                    </span>
                  )}
                </div>
                {isSelected && <Check size={16} className="text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)] mt-4">
          <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
            Hủy
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleConfirm}
            className="text-xs h-9 px-4 bg-purple-600 hover:bg-purple-700"
          >
            Xác nhận di chuyển
          </Button>
        </div>
      </div>
    </div>
  );
};
