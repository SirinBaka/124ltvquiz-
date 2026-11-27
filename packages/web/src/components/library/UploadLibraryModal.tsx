import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../Button';
import { StorageService } from '../../services/storageService';
import { LibraryStorageService } from '../../services/libraryStorageService';
import { formatFileSize } from '../../pages/createQuizHelper';
import type { LibraryFolder, LibraryResource, Document, DocumentSourceType } from '@ltvquiz/shared';

interface UploadLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId: string | null;
  folders: LibraryFolder[];
  onSuccess: (resource: LibraryResource) => void;
}

export const UploadLibraryModal: React.FC<UploadLibraryModalProps> = ({
  isOpen,
  onClose,
  targetFolderId,
  folders,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<string | null>(targetFolderId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md'];
    if (!ext || !allowed.includes(ext)) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên PDF, DOCX, TXT hoặc Markdown.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Dung lượng tệp vượt quá giới hạn 25MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn một tệp để tải lên.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Create Document metadata
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const docSourceType: DocumentSourceType = ext === 'md' ? 'markdown' : (ext as DocumentSourceType);
      const now = new Date().toISOString();
      const doc: Document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: selectedFile.name,
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        status: 'ready',
        sourceType: docSourceType,
        createdAt: now,
        updatedAt: now,
      };

      // 2. Save binary file to StorageService IndexedDB
      await StorageService.saveFile(doc.id, selectedFile);
      StorageService.saveDocument(doc);

      // 3. Register as Library Resource
      const resource = LibraryStorageService.createDocumentResource(doc, folderId);

      onSuccess(resource);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu tài liệu vào Kho đề.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Tải tài liệu lên</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Thêm tệp nguồn vào Kho đề</p>
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
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl text-center bg-[var(--color-background)]/50 cursor-pointer transition-all hover:bg-[var(--color-background)]"
            >
              <UploadCloud size={32} className="mx-auto text-[var(--color-text-secondary)] mb-2" />
              <p className="text-xs font-semibold text-[var(--color-text)]">
                Nhấn để chọn tệp từ thiết bị
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Hỗ trợ PDF, DOCX, TXT, MD (tối đa 25MB)
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={20} className="text-[var(--color-primary)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-rose-500 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
              Thư mục lưu trữ
            </label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value ? e.target.value : null)}
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
              Hủy
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              className="text-xs h-9 px-4 gap-1.5"
            >
              {uploading ? (
                <span>Đang tải lên...</span>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Tải lên</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
