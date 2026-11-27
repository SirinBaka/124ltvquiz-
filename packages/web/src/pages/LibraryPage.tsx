import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban,
  FolderPlus,
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Folder,
  FileText,
  HelpCircle,
  Award,
  MoreVertical,
  Trash2,
  Share2,
  Download,
  Edit3,
  FolderSymlink,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  CheckSquare,
  Square,
  Eye,
  Archive,
} from 'lucide-react';
import { Button } from '../components/Button';
import { LibraryStorageService } from '../services/libraryStorageService';
import { LibraryZipService } from '../services/libraryZipService';
import { formatFileSize } from './createQuizHelper';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CreateFolderModal } from '../components/library/CreateFolderModal';
import { RenameModal } from '../components/library/RenameModal';
import { MoveResourceModal } from '../components/library/MoveResourceModal';
import { ShareLibraryModal } from '../components/library/ShareLibraryModal';
import { LibraryResourcePreviewModal } from '../components/library/LibraryResourcePreviewModal';
import { UploadLibraryModal } from '../components/library/UploadLibraryModal';
import type {
  LibraryFolder,
  LibraryResource,
  LibraryResourceType,
  LibrarySortBy,
  LibrarySortOrder,
} from '@ltvquiz/shared';

type LibraryTab = 'all' | 'folders' | 'shared-by-me' | 'shared-with-me' | 'trash';

export const LibraryPage: React.FC = () => {
  useDocumentTitle('12/4 LTVQuiz - Kho đề & Thư viện tài liệu');

  // Sync existing local documents & quizzes so they show up seamlessly
  useEffect(() => {
    LibraryStorageService.syncExistingDataToLibrary();
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Search, Filter, Sort, View State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<LibrarySortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<LibrarySortOrder>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('ltvquiz_lib_view_mode') as 'grid' | 'list') || 'list';
    } catch {
      return 'list';
    }
  });

  // Bulk Selection
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  // Modals State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    type: 'folder' | 'resource';
    id: string;
    name: string;
  } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{
    isBulk: boolean;
    resourceIds?: string[];
    folderId?: string;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<LibraryResource | null>(null);
  const [previewTarget, setPreviewTarget] = useState<LibraryResource | null>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // Active Dropdown context menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Load Folders & Resources
  const allFolders = useMemo(() => {
    return LibraryStorageService.getFolders(activeTab === 'trash');
  }, [refreshKey, activeTab]);

  const currentFolder = useMemo(() => {
    return currentFolderId ? LibraryStorageService.getFolder(currentFolderId) : null;
  }, [currentFolderId, refreshKey]);

  const breadcrumbs = useMemo(() => {
    return LibraryStorageService.getBreadcrumbs(currentFolderId);
  }, [currentFolderId, refreshKey]);

  // Subfolders in current view
  const visibleFolders = useMemo(() => {
    if (activeTab === 'trash') {
      return allFolders.filter((f) => !!f.deletedAt);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return allFolders.filter((f) => !f.deletedAt && f.name.toLowerCase().includes(q));
    }
    return allFolders.filter((f) => !f.deletedAt && f.parentId === currentFolderId);
  }, [allFolders, activeTab, searchQuery, currentFolderId]);

  // Resources in current view
  const visibleResources = useMemo(() => {
    if (activeTab === 'trash') {
      return LibraryStorageService.getTrashResources();
    }
    if (activeTab === 'shared-by-me') {
      const shares = LibraryStorageService.getShareLinks().filter((s) => !s.revokedAt);
      const sharedResourceIds = new Set(shares.map((s) => s.resourceId));
      return LibraryStorageService.getAllActiveResources().filter((r) =>
        sharedResourceIds.has(r.id)
      );
    }
    if (activeTab === 'shared-with-me') {
      return []; // Personal storage model
    }

    return LibraryStorageService.searchResources({
      query: searchQuery,
      folderId: searchQuery ? undefined : currentFolderId,
      resourceType: typeFilter !== 'all' ? (typeFilter as LibraryResourceType) : undefined,
      sortBy,
      sortOrder,
      includeDeleted: false,
    });
  }, [activeTab, searchQuery, currentFolderId, typeFilter, sortBy, sortOrder, refreshKey]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.library-menu-trigger')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedResourceIds.length === visibleResources.length) {
      setSelectedResourceIds([]);
    } else {
      setSelectedResourceIds(visibleResources.map((r) => r.id));
    }
  };

  // Actions
  const handleRenameConfirm = (newName: string) => {
    if (!renameTarget) return;
    try {
      if (renameTarget.type === 'folder') {
        LibraryStorageService.renameFolder(renameTarget.id, newName);
      } else {
        LibraryStorageService.renameResource(renameTarget.id, newName);
      }
      refresh();
    } catch (err: any) {
      alert(err.message || 'Không thể đổi tên.');
    }
  };

  const handleMoveConfirm = (targetFolderId: string | null) => {
    if (!moveTarget) return;
    try {
      if (moveTarget.isBulk && moveTarget.resourceIds) {
        LibraryStorageService.moveMultipleResources(moveTarget.resourceIds, targetFolderId);
        setSelectedResourceIds([]);
      } else if (moveTarget.folderId) {
        LibraryStorageService.moveFolder(moveTarget.folderId, targetFolderId);
      } else if (moveTarget.resourceIds && moveTarget.resourceIds[0]) {
        LibraryStorageService.moveResource(moveTarget.resourceIds[0], targetFolderId);
      }
      refresh();
    } catch (err: any) {
      alert(err.message || 'Không thể di chuyển.');
    }
  };

  const handleDeleteResource = (resource: LibraryResource) => {
    if (confirm(`Bạn có chắc muốn chuyển "${resource.displayName}" vào Thùng rác?`)) {
      LibraryStorageService.deleteResource(resource.id);
      setSelectedResourceIds((prev) => prev.filter((i) => i !== resource.id));
      refresh();
    }
  };

  const handleDeleteFolder = (folder: LibraryFolder) => {
    if (
      confirm(
        `Bạn có chắc muốn xóa thư mục "${folder.name}"? Các tài liệu bên trong sẽ được giữ an toàn trong Thùng rác.`
      )
    ) {
      LibraryStorageService.deleteFolder(folder.id);
      refresh();
    }
  };

  const handleBulkDelete = () => {
    if (
      confirm(`Bạn có chắc muốn chuyển ${selectedResourceIds.length} mục đã chọn vào Thùng rác?`)
    ) {
      selectedResourceIds.forEach((id) => LibraryStorageService.deleteResource(id));
      setSelectedResourceIds([]);
      refresh();
    }
  };

  const handleBulkDownload = async () => {
    const resourcesToDownload = visibleResources.filter((r) =>
      selectedResourceIds.includes(r.id)
    );
    if (resourcesToDownload.length === 0) return;
    try {
      await LibraryZipService.downloadBulkResources(resourcesToDownload, 'LTVQuiz_KhoDe_LuaChon.zip');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải gói tệp nén.');
    }
  };

  const handleDownloadSingle = async (resource: LibraryResource) => {
    try {
      await LibraryZipService.downloadSingleResource(resource);
    } catch (err: any) {
      alert(err.message || 'Không thể tải xuống tệp.');
    }
  };

  // Trash actions
  const handleRestoreResource = (id: string) => {
    LibraryStorageService.restoreResource(id);
    refresh();
  };

  const handlePermanentDeleteResource = (id: string) => {
    if (confirm('Xóa vĩnh viễn tệp này? Hành động này không thể hoàn tác!')) {
      LibraryStorageService.permanentDeleteResource(id);
      refresh();
    }
  };

  const handleRestoreFolder = (id: string) => {
    LibraryStorageService.restoreFolder(id);
    refresh();
  };

  const handlePermanentDeleteFolder = (id: string) => {
    if (confirm('Xóa vĩnh viễn thư mục này? Hành động này không thể hoàn tác!')) {
      LibraryStorageService.permanentDeleteFolder(id);
      refresh();
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Bạn có chắc muốn dọn sạch toàn bộ Thùng rác vĩnh viễn?')) {
      LibraryStorageService.emptyTrash();
      refresh();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <FolderKanban size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
              Kho đề
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Lưu trữ, sắp xếp và quản lý tài liệu cùng các đề kiểm tra của bạn.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setIsCreateFolderOpen(true)}
            className="text-xs h-9 px-3.5 gap-1.5 shadow-2xs"
          >
            <FolderPlus size={15} />
            <span>Tạo thư mục</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs h-9 px-3.5 gap-1.5 shadow-xs"
          >
            <UploadCloud size={15} />
            <span>Tải tài liệu lên</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] overflow-x-auto pb-px">
        <button
          onClick={() => {
            setActiveTab('all');
            setCurrentFolderId(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'all'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <FolderKanban size={15} />
          <span>Tất cả tệp</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('folders');
            setCurrentFolderId(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'folders'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <Folder size={15} />
          <span>Thư mục của tôi</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('shared-by-me');
            setCurrentFolderId(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'shared-by-me'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <Share2 size={15} />
          <span>Đã chia sẻ</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('shared-with-me');
            setCurrentFolderId(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'shared-with-me'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          <Archive size={15} />
          <span>Được chia sẻ với tôi</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('trash');
            setCurrentFolderId(null);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ml-auto ${
            activeTab === 'trash'
              ? 'border-rose-500 text-rose-500 bg-rose-500/10'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-rose-500'
          }`}
        >
          <Trash2 size={15} />
          <span>Thùng rác</span>
        </button>
      </div>

      {/* Breadcrumb Navigation Bar (when inside folders or browsing) */}
      {activeTab !== 'trash' && activeTab !== 'shared-with-me' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] overflow-x-auto">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`hover:text-[var(--color-primary)] font-medium cursor-pointer flex items-center gap-1 shrink-0 ${
                currentFolderId === null ? 'text-[var(--color-primary)] font-bold' : ''
              }`}
            >
              <FolderKanban size={14} />
              <span>Kho đề</span>
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={13} className="shrink-0 text-[var(--color-text-secondary)]" />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:text-[var(--color-primary)] truncate max-w-[150px] cursor-pointer ${
                    crumb.id === currentFolderId ? 'text-[var(--color-primary)] font-bold' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg hover:bg-[var(--color-background)] cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          )}
        </div>
      )}

      {/* Main Toolbar: Search, Filters, Sorting, Bulk selection */}
      <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, câu hỏi, đề thi theo tên..."
              className="w-full text-xs h-9 pl-9 pr-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Controls: Type Filter, Sorting, View Toggle */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs h-9 px-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="source_document">Tài liệu gốc (PDF/DOCX/TXT)</option>
              <option value="question_set">Bộ câu hỏi đã lưu</option>
              <option value="exam">Đề kiểm tra (Quiz)</option>
            </select>

            {/* Sorting */}
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as LibrarySortBy);
                setSortOrder(so as LibrarySortOrder);
              }}
              className="text-xs h-9 px-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="updatedAt_desc">Mới cập nhật nhất</option>
              <option value="updatedAt_asc">Cũ nhất</option>
              <option value="displayName_asc">Tên A-Z</option>
              <option value="displayName_desc">Tên Z-A</option>
              <option value="fileSize_desc">Dung lượng lớn nhất</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-[var(--color-border)] rounded-xl p-0.5 bg-[var(--color-background)]">
              <button
                onClick={() => {
                  setViewMode('grid');
                  try {
                    localStorage.setItem('ltvquiz_lib_view_mode', 'grid');
                  } catch {}
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  try {
                    localStorage.setItem('ltvquiz_lib_view_mode', 'list');
                  } catch {}
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                title="Dạng danh sách"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedResourceIds.length > 0 && activeTab !== 'trash' && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 animate-fade-in flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold">Đã chọn {selectedResourceIds.length} mục</span>
              <button
                onClick={() => setSelectedResourceIds([])}
                className="underline text-[11px] hover:text-blue-900 cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setMoveTarget({ isBulk: true, resourceIds: selectedResourceIds })
                }
                className="text-xs h-7 px-2.5 gap-1"
              >
                <FolderSymlink size={13} />
                <span>Di chuyển</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleBulkDownload}
                className="text-xs h-7 px-2.5 gap-1"
              >
                <Download size={13} />
                <span>Tải ZIP ({selectedResourceIds.length})</span>
              </Button>

              <button
                onClick={handleBulkDelete}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Xóa vào thùng rác</span>
              </button>
            </div>
          </div>
        )}

        {/* Trash Actions Bar */}
        {activeTab === 'trash' && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
            <span className="flex items-center gap-1.5">
              <Trash2 size={14} />
              Các mục trong thùng rác có thể được khôi phục hoặc xóa hoàn toàn.
            </span>
            <Button
              variant="secondary"
              onClick={handleEmptyTrash}
              className="text-xs h-7 px-3 text-rose-600 border-rose-300 hover:bg-rose-50"
            >
              Dọn sạch thùng rác
            </Button>
          </div>
        )}
      </div>

      {/* Folders Section (Only when browsing all or folders tab) */}
      {activeTab !== 'trash' && activeTab !== 'shared-with-me' && visibleFolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Thư mục ({visibleFolders.length})
            </h3>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {visibleFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative p-3 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface)] hover:shadow-xs transition-all flex flex-col justify-between gap-3 cursor-pointer"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${folder.color || '#3b82f6'}15` }}
                    >
                      <Folder size={22} style={{ color: folder.color || '#3b82f6' }} />
                    </div>

                    {/* Context menu trigger */}
                    <div className="relative library-menu-trigger" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === folder.id ? null : folder.id)
                        }
                        className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {activeMenuId === folder.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-20 py-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setRenameTarget({
                                type: 'folder',
                                id: folder.id,
                                name: folder.name,
                              });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Đổi tên</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setMoveTarget({ isBulk: false, folderId: folder.id });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                          >
                            <FolderSymlink size={13} />
                            <span>Di chuyển</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeleteFolder(folder);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Xóa thư mục</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[var(--color-text)] truncate" title={folder.name}>
                      {folder.name}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      {new Date(folder.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xs divide-y divide-[var(--color-border)]">
              {visibleFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--color-background)] transition-colors cursor-pointer group"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${folder.color || '#3b82f6'}15` }}
                    >
                      <Folder size={18} style={{ color: folder.color || '#3b82f6' }} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-[var(--color-text)] truncate" title={folder.name}>
                        {folder.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        <span className="font-medium text-[var(--color-primary)]">Thư mục</span>
                        <span>•</span>
                        <span>{new Date(folder.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="relative library-menu-trigger">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === folder.id ? null : folder.id)
                        }
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] cursor-pointer"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {activeMenuId === folder.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-20 py-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setRenameTarget({
                                type: 'folder',
                                id: folder.id,
                                name: folder.name,
                              });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Đổi tên</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setMoveTarget({ isBulk: false, folderId: folder.id });
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                          >
                            <FolderSymlink size={13} />
                            <span>Di chuyển</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeleteFolder(folder);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Xóa thư mục</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trashed Folders (in Trash Tab) */}
      {activeTab === 'trash' && visibleFolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Thư mục trong thùng rác ({visibleFolders.length})
          </h3>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {visibleFolders.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder size={18} className="text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--color-text)] truncate">{f.name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        Đã xóa: {f.deletedAt ? new Date(f.deletedAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRestoreFolder(f.id)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 cursor-pointer text-xs flex items-center gap-1"
                      title="Khôi phục"
                    >
                      <RotateCcw size={14} />
                      <span>Khôi phục</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDeleteFolder(f.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xs divide-y divide-[var(--color-border)]">
              {visibleFolders.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--color-background)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <Folder size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] truncate">{f.name}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Thư mục • Đã xóa: {f.deletedAt ? new Date(f.deletedAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRestoreFolder(f.id)}
                      className="px-2.5 py-1 rounded-lg text-emerald-600 hover:bg-emerald-500/10 cursor-pointer text-xs font-semibold flex items-center gap-1"
                      title="Khôi phục"
                    >
                      <RotateCcw size={13} />
                      <span>Khôi phục</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDeleteFolder(f.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resources Section */}
      <div className="space-y-3">
        {visibleResources.length > 0 && (
          <div className={`flex items-center justify-between ${viewMode === 'list' ? 'md:hidden' : ''}`}>
            <div className="flex items-center gap-2">
              {activeTab !== 'trash' && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="min-h-11 md:min-h-0 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center gap-1.5 cursor-pointer mr-2"
                >
                  {selectedResourceIds.length === visibleResources.length &&
                  visibleResources.length > 0 ? (
                    <CheckSquare size={15} className="text-[var(--color-primary)]" />
                  ) : (
                    <Square size={15} />
                  )}
                  <span>Chọn tất cả</span>
                </button>
              )}
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {activeTab === 'trash' ? 'Tài liệu trong thùng rác' : 'Tệp & Đề thi'} (
                {visibleResources.length})
              </h3>
            </div>
          </div>
        )}

        {/* Empty States */}
        {visibleResources.length === 0 && visibleFolders.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-background)] flex items-center justify-center mx-auto text-[var(--color-text-secondary)] mb-3">
              {activeTab === 'trash' ? <Trash2 size={24} /> : <FolderKanban size={24} />}
            </div>
            <h4 className="font-bold text-sm text-[var(--color-text)]">
              {activeTab === 'trash'
                ? 'Thùng rác đang trống'
                : searchQuery
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có tài liệu hoặc đề thi nào'}
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
              {activeTab === 'trash'
                ? 'Các mục bạn xóa sẽ xuất hiện ở đây để bạn có thể khôi phục bất cứ lúc nào.'
                : 'Bấm "Tải tài liệu lên" hoặc "Tạo thư mục" để bắt đầu xây dựng kho tài nguyên học tập của bạn!'}
            </p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && visibleResources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {visibleResources.map((res) => {
              const isSelected = selectedResourceIds.includes(res.id);
              const activeShare = LibraryStorageService.getActiveShareForResource(res.id);

              return (
                <div
                  key={res.id}
                  className={`group relative p-4 rounded-2xl border bg-[var(--color-surface)] transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs ${
                    isSelected
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  {/* Card Header: Checkbox & Type Icon & Context Menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeTab !== 'trash' && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(res.id)}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[var(--color-primary)]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      )}

                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          res.resourceType === 'source_document'
                            ? 'bg-blue-500/10 text-blue-600'
                            : res.resourceType === 'question_set'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-purple-500/10 text-purple-600'
                        }`}
                      >
                        {res.resourceType === 'source_document' ? (
                          <FileText size={18} />
                        ) : res.resourceType === 'question_set' ? (
                          <HelpCircle size={18} />
                        ) : (
                          <Award size={18} />
                        )}
                      </div>
                    </div>

                    {/* Context menu */}
                    <div className="relative library-menu-trigger">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === res.id ? null : res.id)
                        }
                        className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === res.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl z-20 py-1 text-xs">
                          {activeTab === 'trash' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleRestoreResource(res.id);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-emerald-500/10 text-emerald-600 flex items-center gap-2 cursor-pointer"
                              >
                                <RotateCcw size={13} />
                                <span>Khôi phục</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handlePermanentDeleteResource(res.id);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Xóa vĩnh viễn</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setPreviewTarget(res);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>Xem trước</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setRenameTarget({
                                    type: 'resource',
                                    id: res.id,
                                    name: res.displayName,
                                  });
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Đổi tên</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setMoveTarget({
                                    isBulk: false,
                                    resourceIds: [res.id],
                                  });
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                              >
                                <FolderSymlink size={13} />
                                <span>Di chuyển</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setShareTarget(res);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                              >
                                <Share2 size={13} />
                                <span>Chia sẻ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDownloadSingle(res);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] flex items-center gap-2 text-[var(--color-text)] cursor-pointer"
                              >
                                <Download size={13} />
                                <span>Tải xuống</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDeleteResource(res);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-600 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Xóa</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resource Info */}
                  <div className="cursor-pointer" onClick={() => setPreviewTarget(res)}>
                    <h4
                      className="font-bold text-xs sm:text-sm text-[var(--color-text)] truncate"
                      title={res.displayName}
                    >
                      {res.displayName}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-1.5 flex-wrap">
                      <span className="capitalize font-medium text-[var(--color-text)]">
                        {res.resourceType === 'source_document'
                          ? `Tài liệu ${res.fileExtension?.toUpperCase() || ''}`
                          : res.resourceType === 'question_set'
                          ? `${res.metadata?.questions?.length || 0} câu hỏi`
                          : 'Đề thi'}
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

                  {/* Active Share Badge */}
                  {activeShare && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md font-medium w-fit">
                      <Share2 size={11} />
                      <span>Đang chia sẻ công khai</span>
                    </div>
                  )}

                  {/* Quick Card Footer Action */}
                  <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTarget(res)}
                      className="text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Xem chi tiết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(res)}
                      className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] cursor-pointer"
                      title="Tải xuống"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View (Clean Table) */}
        {viewMode === 'list' && visibleResources.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table role="table" aria-label="Danh sách tài nguyên" className="responsive-table w-full text-left text-xs md:min-w-[680px]">
                <thead role="rowgroup" className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] select-none">
                  <tr role="row">
                    {activeTab !== 'trash' && (
                      <th role="columnheader" scope="col" className="pl-4 pr-2 py-2.5 w-10">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="hidden md:flex text-[var(--color-text-secondary)] hover:text-[var(--color-text)] items-center cursor-pointer"
                          title="Chọn tất cả"
                        >
                          {selectedResourceIds.length === visibleResources.length &&
                          visibleResources.length > 0 ? (
                            <CheckSquare size={15} className="text-[var(--color-primary)]" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </th>
                    )}
                    <th role="columnheader" scope="col" className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider">
                      {activeTab === 'trash' ? 'Tài liệu trong thùng rác' : 'Tệp & Đề thi'} ({visibleResources.length})
                    </th>
                    <th role="columnheader" scope="col" className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Loại
                    </th>
                    <th role="columnheader" scope="col" className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Cập nhật
                    </th>
                    <th role="columnheader" scope="col" className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">
                      Dung lượng
                    </th>
                    <th role="columnheader" scope="col" className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-right whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody role="rowgroup" className="divide-y divide-[var(--color-border)]">
                  {visibleResources.map((res) => {
                    const isSelected = selectedResourceIds.includes(res.id);
                    const activeShare = LibraryStorageService.getActiveShareForResource(res.id);

                    return (
                      <tr role="row"
                        key={res.id}
                        className={`hover:bg-[var(--color-surface-hover)] transition-colors ${
                          isSelected ? 'bg-[var(--color-primary)]/[0.04]' : ''
                        }`}
                      >
                        {activeTab !== 'trash' && (
                          <td role="cell" data-wide data-actions className="pl-4 pr-2 py-3 w-10">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(res.id)}
                              aria-label={`Chọn ${res.displayName}`}
                              aria-pressed={isSelected}
                              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={15} className="text-[var(--color-primary)]" />
                              ) : (
                                <Square size={15} />
                              )}
                            </button>
                          </td>
                        )}

                        <td role="cell" data-wide className="px-3 py-3 max-w-md">
                          <button
                            type="button"
                            className="flex items-center gap-2.5 min-w-0 max-w-full text-left cursor-pointer group"
                            onClick={() => setPreviewTarget(res)}
                          >
                            <span className="text-[var(--color-text-secondary)] shrink-0">
                              {res.resourceType === 'source_document' ? (
                                <FileText size={15} />
                              ) : res.resourceType === 'question_set' ? (
                                <HelpCircle size={15} />
                              ) : (
                                <Award size={15} />
                              )}
                            </span>
                            <span className="font-semibold text-[13px] text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors wrap-anywhere md:truncate">
                              {res.displayName}
                            </span>
                            {activeShare && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium shrink-0">
                                Đã chia sẻ
                              </span>
                            )}
                          </button>
                        </td>

                        <td role="cell" data-label="Loại" className="px-3 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                          {res.resourceType === 'source_document'
                            ? `Tài liệu ${res.fileExtension?.toUpperCase() || ''}`
                            : res.resourceType === 'question_set'
                            ? `${res.metadata?.questions?.length || 0} câu hỏi`
                            : 'Đề kiểm tra'}
                        </td>

                        <td role="cell" data-label="Cập nhật" className="px-3 py-3 text-[var(--color-text-secondary)] tabular-nums whitespace-nowrap">
                          {new Date(res.updatedAt).toLocaleDateString('vi-VN')}
                        </td>

                        <td role="cell" data-label="Dung lượng" className="px-3 py-3 text-[var(--color-text-secondary)] tabular-nums whitespace-nowrap">
                          {res.fileSize ? formatFileSize(res.fileSize) : '—'}
                        </td>

                        <td role="cell" data-wide data-actions className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex flex-wrap items-center gap-1">
                            {activeTab === 'trash' ? (
                              <>
                                <button
                                  onClick={() => handleRestoreResource(res.id)}
                                  className="px-2.5 py-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw size={13} />
                                  <span>Khôi phục</span>
                                </button>
                                <button
                                  onClick={() => handlePermanentDeleteResource(res.id)}
                                  className="p-1.5 rounded-md text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                  title="Xóa vĩnh viễn"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setPreviewTarget(res)}
                                  className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] cursor-pointer"
                                  title="Xem trước"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => setShareTarget(res)}
                                  className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                                  title="Chia sẻ"
                                >
                                  <Share2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDownloadSingle(res)}
                                  className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] cursor-pointer"
                                  title="Tải xuống"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(res)}
                                  className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        currentFolderId={currentFolderId}
        folders={allFolders.filter((f) => !f.deletedAt)}
        onSuccess={() => refresh()}
      />

      <UploadLibraryModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        targetFolderId={currentFolderId}
        folders={allFolders.filter((f) => !f.deletedAt)}
        onSuccess={() => refresh()}
      />

      {renameTarget && (
        <RenameModal
          isOpen={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          title={renameTarget.type === 'folder' ? 'Đổi tên thư mục' : 'Đổi tên tài nguyên'}
          initialName={renameTarget.name}
          onRename={handleRenameConfirm}
        />
      )}

      {moveTarget && (
        <MoveResourceModal
          isOpen={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          movingFolderId={moveTarget.folderId}
          itemCount={moveTarget.resourceIds?.length || 1}
          currentFolderId={currentFolderId}
          onConfirmMove={handleMoveConfirm}
        />
      )}

      {shareTarget && (
        <ShareLibraryModal
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          resource={shareTarget}
          onUpdated={() => refresh()}
        />
      )}

      {previewTarget && (
        <LibraryResourcePreviewModal
          isOpen={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          resource={previewTarget}
        />
      )}
    </div>
  );
};
