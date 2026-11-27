import React, { useState } from 'react';
import {
  FolderKanban,
  X,
  Search,
  Folder,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  ArrowLeft,
  Check,
  Eye,
} from 'lucide-react';
import { Button } from '../Button';
import { LibraryStorageService } from '../../services/libraryStorageService';
import { formatFileSize } from '../../pages/createQuizHelper';
import { LibraryResourcePreviewModal } from './LibraryResourcePreviewModal';
import type { LibraryResource, LibraryResourceType } from '@ltvquiz/shared';

interface SelectFromLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResource: (resource: LibraryResource) => void;
  allowedTypes?: LibraryResourceType[];
  title?: string;
}

export const SelectFromLibraryModal: React.FC<SelectFromLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectResource,
  allowedTypes,
  title = 'Chọn từ Kho đề',
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);

  if (!isOpen) return null;

  // Sync existing documents & quizzes lazy if not yet in library
  LibraryStorageService.syncExistingDataToLibrary();

  const allFolders = LibraryStorageService.getFolders();
  const currentFolder = currentFolderId ? LibraryStorageService.getFolder(currentFolderId) : null;
  const breadcrumbs = LibraryStorageService.getBreadcrumbs(currentFolderId);

  // Subfolders in current view
  const subfolders = allFolders.filter((f) => f.parentId === currentFolderId);

  // Resources in current view or search
  const resources = LibraryStorageService.searchResources({
    query: searchQuery,
    folderId: searchQuery ? undefined : currentFolderId,
    resourceType: typeFilter !== 'all' ? (typeFilter as LibraryResourceType) : undefined,
    includeDeleted: false,
  }).filter((r) => {
    if (allowedTypes && allowedTypes.length > 0) {
      return allowedTypes.includes(r.resourceType);
    }
    return true;
  });

  const handleSelect = (res: LibraryResource) => {
    onSelectResource(res);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-3xl shadow-xl flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">{title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Duyệt thư mục, tài liệu gốc hoặc bộ câu hỏi đã lưu
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

        {/* Toolbar: Breadcrumbs & Search & Type Filter */}
        <div className="space-y-2.5 mb-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background)] p-2 rounded-xl border border-[var(--color-border)] overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className={`hover:text-[var(--color-primary)] font-medium cursor-pointer ${
                currentFolderId === null ? 'text-[var(--color-primary)] font-bold' : ''
              }`}
            >
              Kho đề
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={13} className="shrink-0 text-[var(--color-text-secondary)]" />
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:text-[var(--color-primary)] truncate max-w-[140px] cursor-pointer ${
                    crumb.id === currentFolderId ? 'text-[var(--color-primary)] font-bold' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh tài liệu, câu hỏi..."
                className="w-full text-xs h-9 pl-9 pr-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs h-9 px-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shrink-0"
            >
              <option value="all">Tất cả loại tài nguyên</option>
              <option value="source_document">Tài liệu gốc (PDF/DOCX/TXT)</option>
              <option value="question_set">Bộ câu hỏi đã lưu</option>
              <option value="exam">Đề kiểm tra (Quiz)</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[300px]">
          {/* Subfolders (only if not searching) */}
          {!searchQuery && subfolders.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Thư mục ({subfolders.length})
              </h4>
              <div className="flex flex-col gap-1.5">
                {subfolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCurrentFolderId(f.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-background)] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder
                        size={18}
                        style={{ color: f.color || '#3b82f6' }}
                        className="shrink-0 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-xs font-semibold text-[var(--color-text)] truncate">
                        {f.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-secondary)] shrink-0 group-hover:text-[var(--color-primary)]">
                      Mở →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          <div>
            {!searchQuery && (
              <h4 className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Tệp & Câu hỏi ({resources.length})
              </h4>
            )}

            {resources.length === 0 && subfolders.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--color-text-secondary)]">
                Không có tài nguyên nào trong mục này.
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-background)] transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        res.resourceType === 'source_document'
                          ? 'bg-blue-500/10 text-blue-600'
                          : res.resourceType === 'question_set'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-purple-500/10 text-purple-600'
                      }`}>
                        {res.resourceType === 'source_document' ? (
                          <FileText size={16} />
                        ) : res.resourceType === 'question_set' ? (
                          <HelpCircle size={16} />
                        ) : (
                          <Award size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--color-text)] truncate">
                          {res.displayName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                          <span className="capitalize">
                            {res.resourceType === 'source_document'
                              ? `Tài liệu (${res.fileExtension?.toUpperCase() || 'FILE'})`
                              : res.resourceType === 'question_set'
                              ? `Bộ ${res.metadata?.questions?.length || 0} câu hỏi`
                              : 'Đề kiểm tra'}
                          </span>
                          <span>•</span>
                          <span>{new Date(res.updatedAt).toLocaleDateString('vi-VN')}</span>
                          {res.fileSize ? (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(res.fileSize)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewResource(res)}
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer"
                        title="Xem trước"
                      >
                        <Eye size={14} />
                      </button>
                      <Button
                        variant="primary"
                        onClick={() => handleSelect(res)}
                        className="text-xs h-8 px-3 gap-1"
                      >
                        <Check size={13} />
                        <span>Chọn</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] mt-3">
          {currentFolderId ? (
            <button
              type="button"
              onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Lên thư mục trước</span>
            </button>
          ) : (
            <div />
          )}

          <Button variant="secondary" onClick={onClose} className="text-xs h-8 px-3">
            Đóng
          </Button>
        </div>
      </div>

      {previewResource && (
        <LibraryResourcePreviewModal
          isOpen={!!previewResource}
          onClose={() => setPreviewResource(null)}
          resource={previewResource}
        />
      )}
    </div>
  );
};
