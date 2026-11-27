import type {
  LibraryFolder,
  LibraryResource,
  LibraryResourceType,
  LibraryShareLink,
  LibraryBreadcrumb,
  LibrarySortBy,
  LibrarySortOrder,
  LibraryViewFilter,
  Question,
  Quiz,
  Document,
} from '@ltvquiz/shared';
import { StorageService } from './storageService';

const STORAGE_KEY_FOLDERS = 'ltvquiz_library_folders';
const STORAGE_KEY_RESOURCES = 'ltvquiz_library_resources';
const STORAGE_KEY_LIBRARY_SHARES = 'ltvquiz_library_shares';

export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function generateStableId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function generateCryptoShareToken(): string {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export class LibraryStorageService {
  // ==========================================
  // FOLDER OPERATIONS
  // ==========================================

  static getFolders(includeDeleted = false): LibraryFolder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FOLDERS);
      const folders: LibraryFolder[] = data ? JSON.parse(data) : [];
      if (includeDeleted) return folders;
      return folders.filter((f) => !f.deletedAt);
    } catch {
      return [];
    }
  }

  static getFolder(id: string): LibraryFolder | null {
    const folders = this.getFolders(true);
    return folders.find((f) => f.id === id) || null;
  }

  static saveFolders(folders: LibraryFolder[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (err) {
      console.error('Không thể lưu thư mục vào bộ nhớ:', err);
    }
  }

  static createFolder(name: string, parentId: string | null = null, color?: string): LibraryFolder {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new Error('Tên thư mục không được để trống.');
    }

    if (parentId) {
      const parent = this.getFolder(parentId);
      if (!parent || parent.deletedAt) {
        throw new Error('Thư mục cha không tồn tại hoặc đã bị xóa.');
      }
    }

    const now = new Date().toISOString();
    const newFolder: LibraryFolder = {
      id: generateStableId('folder'),
      name: trimmed,
      parentId,
      color: color || '#8b5cf6',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const folders = this.getFolders(true);
    folders.push(newFolder);
    this.saveFolders(folders);

    return newFolder;
  }

  static renameFolder(id: string, newName: string): LibraryFolder {
    const trimmed = newName?.trim();
    if (!trimmed) {
      throw new Error('Tên thư mục không được để trống.');
    }

    const folders = this.getFolders(true);
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      throw new Error('Thư mục không tồn tại.');
    }

    folder.name = trimmed;
    folder.updatedAt = new Date().toISOString();
    this.saveFolders(folders);

    return folder;
  }

  /**
   * Checks if folderB is a descendant of folderA (or equal).
   * Prevents moving a folder inside itself or its children.
   */
  static isDescendantOf(folderIdToCheck: string, potentialAncestorId: string): boolean {
    if (folderIdToCheck === potentialAncestorId) return true;

    const folders = this.getFolders(true);
    let current = folders.find((f) => f.id === folderIdToCheck);

    const visited = new Set<string>();
    while (current && current.parentId) {
      if (visited.has(current.id)) break;
      visited.add(current.id);

      if (current.parentId === potentialAncestorId) {
        return true;
      }
      current = folders.find((f) => f.id === current?.parentId);
    }

    return false;
  }

  static moveFolder(folderId: string, newParentId: string | null): LibraryFolder {
    const folders = this.getFolders(true);
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error('Thư mục không tồn tại.');
    }

    if (folderId === newParentId) {
      throw new Error('Không thể di chuyển thư mục vào chính nó.');
    }

    if (newParentId) {
      const newParent = folders.find((f) => f.id === newParentId);
      if (!newParent || newParent.deletedAt) {
        throw new Error('Thư mục đích không tồn tại hoặc đã bị xóa.');
      }

      if (this.isDescendantOf(newParentId, folderId)) {
        throw new Error('Không thể di chuyển thư mục vào bên trong một thư mục con của nó.');
      }
    }

    folder.parentId = newParentId;
    folder.updatedAt = new Date().toISOString();
    this.saveFolders(folders);

    return folder;
  }

  static deleteFolder(id: string, soft = true): void {
    const folders = this.getFolders(true);
    const targetFolder = folders.find((f) => f.id === id);
    if (!targetFolder) return;

    // Collect all descendant folder IDs
    const toDeleteFolderIds = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && toDeleteFolderIds.has(f.parentId) && !toDeleteFolderIds.has(f.id)) {
          toDeleteFolderIds.add(f.id);
          added = true;
        }
      }
    }

    const now = new Date().toISOString();

    if (soft) {
      for (const f of folders) {
        if (toDeleteFolderIds.has(f.id)) {
          f.deletedAt = now;
          f.updatedAt = now;
        }
      }
      this.saveFolders(folders);

      // Soft-delete resources within these folders
      const resources = this.getResources(null, true);
      for (const r of resources) {
        if (r.folderId && toDeleteFolderIds.has(r.folderId)) {
          r.deletedAt = now;
          r.originalFolderId = r.folderId;
        }
      }
      this.saveResources(resources);
    } else {
      // Permanent delete
      const remainingFolders = folders.filter((f) => !toDeleteFolderIds.has(f.id));
      this.saveFolders(remainingFolders);

      const resources = this.getResources(null, true);
      const remainingResources = resources.filter((r) => !r.folderId || !toDeleteFolderIds.has(r.folderId));
      this.saveResources(remainingResources);
    }
  }

  static restoreFolder(id: string): void {
    const folders = this.getFolders(true);
    const targetFolder = folders.find((f) => f.id === id);
    if (!targetFolder) return;

    // If parent was deleted, reset parentId to root null
    if (targetFolder.parentId) {
      const parent = folders.find((f) => f.id === targetFolder.parentId);
      if (!parent || parent.deletedAt) {
        targetFolder.parentId = null;
      }
    }

    targetFolder.deletedAt = null;
    targetFolder.updatedAt = new Date().toISOString();
    this.saveFolders(folders);

    // Restore child resources
    const resources = this.getResources(null, true);
    for (const r of resources) {
      if (r.folderId === id && r.deletedAt) {
        r.deletedAt = null;
        r.updatedAt = new Date().toISOString();
      }
    }
    this.saveResources(resources);
  }

  static getBreadcrumbs(folderId: string | null): LibraryBreadcrumb[] {
    const breadcrumbs: LibraryBreadcrumb[] = [{ id: null, name: 'Kho đề' }];
    if (!folderId) return breadcrumbs;

    const folders = this.getFolders(true);
    const path: LibraryBreadcrumb[] = [];
    let currentId: string | null = folderId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return [...breadcrumbs, ...path];
  }

  // ==========================================
  // RESOURCE OPERATIONS
  // ==========================================

  static getResources(folderId: string | null = null, includeDeleted = false): LibraryResource[] {
    try {
      this.syncExistingDataToLibrary();
      const data = localStorage.getItem(STORAGE_KEY_RESOURCES);
      const resources: LibraryResource[] = data ? JSON.parse(data) : [];

      if (includeDeleted) return resources;

      const nonDeleted = resources.filter((r) => !r.deletedAt);
      if (folderId === undefined) return nonDeleted;

      return nonDeleted.filter((r) => r.folderId === folderId);
    } catch {
      return [];
    }
  }

  static getAllActiveResources(): LibraryResource[] {
    return this.getResources(null, false);
  }

  static saveResources(resources: LibraryResource[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
    } catch (err) {
      console.error('Không thể lưu tài nguyên vào bộ nhớ:', err);
    }
  }

  static getResource(id: string): LibraryResource | null {
    const resources = this.getResources(undefined as any, true);
    return resources.find((r) => r.id === id) || null;
  }

  static createDocumentResource(doc: Document, folderId: string | null = null): LibraryResource {
    const now = new Date().toISOString();
    const newRes: LibraryResource = {
      id: generateStableId('res_doc'),
      folderId,
      resourceType: 'source_document',
      displayName: doc.name || doc.originalFileName || 'Tài liệu không tên',
      documentId: doc.id,
      originalFileName: doc.originalFileName,
      fileFormat: doc.sourceType || 'pdf',
      fileExtension: doc.sourceType || 'pdf',
      fileSize: doc.size,
      metadata: { doc },
      createdAt: doc.createdAt || now,
      updatedAt: now,
      deletedAt: null,
    };

    const resources = this.getResources(undefined as any, true);
    const existingIdx = resources.findIndex((r) => r.documentId === doc.id);
    if (existingIdx >= 0) {
      resources[existingIdx] = { ...resources[existingIdx], ...newRes, id: resources[existingIdx].id };
    } else {
      resources.push(newRes);
    }

    this.saveResources(resources);
    return newRes;
  }

  static createQuestionSetResource(
    name: string,
    questions: Question[],
    folderId: string | null = null,
    sourceDoc?: { id?: string; name?: string } | string,
    description?: string
  ): LibraryResource {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new Error('Tên bộ câu hỏi không được để trống.');
    }

    const now = new Date().toISOString();
    const sourceDocId = typeof sourceDoc === 'string' ? sourceDoc : sourceDoc?.id;
    const sourceDocName = typeof sourceDoc === 'string' ? undefined : sourceDoc?.name;

    const newRes: LibraryResource = {
      id: generateStableId('res_qset'),
      folderId,
      resourceType: 'question_set',
      displayName: trimmed,
      description: description || undefined,
      questions,
      questionCount: questions.length,
      sourceDocumentId: sourceDocId,
      sourceDocumentName: sourceDocName,
      fileFormat: 'qset',
      metadata: { questions, sourceDocId, description },
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const resources = this.getResources(undefined as any, true);
    resources.push(newRes);
    this.saveResources(resources);

    return newRes;
  }

  static createExamResource(quiz: Quiz, folderId: string | null = null): LibraryResource {
    const now = new Date().toISOString();
    const newRes: LibraryResource = {
      id: generateStableId('res_exam'),
      folderId,
      resourceType: 'exam',
      displayName: quiz.title || 'Bài kiểm tra không tên',
      description: quiz.description,
      quizId: quiz.id,
      questions: quiz.questions,
      questionCount: quiz.questions?.length || 0,
      timeLimit: quiz.settings?.timeLimit,
      fileFormat: 'quiz',
      metadata: { quiz, questions: quiz.questions, examId: quiz.id },
      createdAt: quiz.createdAt || now,
      updatedAt: quiz.updatedAt || now,
      deletedAt: null,
    };

    const resources = this.getResources(undefined as any, true);
    const existingIdx = resources.findIndex((r) => r.quizId === quiz.id);
    if (existingIdx >= 0) {
      resources[existingIdx] = { ...resources[existingIdx], ...newRes, id: resources[existingIdx].id };
    } else {
      resources.push(newRes);
    }

    this.saveResources(resources);
    return newRes;
  }

  static renameResource(id: string, newName: string): LibraryResource {
    const trimmed = newName?.trim();
    if (!trimmed) {
      throw new Error('Tên tệp không được để trống.');
    }

    const resources = this.getResources(undefined as any, true);
    const res = resources.find((r) => r.id === id);
    if (!res) {
      throw new Error('Tài nguyên không tồn tại.');
    }

    res.displayName = trimmed;
    res.updatedAt = new Date().toISOString();
    this.saveResources(resources);

    // Also sync document or quiz title if linked
    if (res.resourceType === 'document' && res.documentId) {
      const doc = StorageService.getDocument(res.documentId);
      if (doc) {
        doc.name = trimmed;
        StorageService.saveDocument(doc);
      }
    } else if (res.resourceType === 'exam' && res.quizId) {
      const quiz = StorageService.getQuiz(res.quizId);
      if (quiz) {
        quiz.title = trimmed;
        StorageService.saveQuiz(quiz);
      }
    }

    return res;
  }

  static moveResource(resourceId: string, newFolderId: string | null): LibraryResource {
    const resources = this.getResources(undefined as any, true);
    const res = resources.find((r) => r.id === resourceId);
    if (!res) {
      throw new Error('Tài nguyên không tồn tại.');
    }

    if (newFolderId) {
      const folder = this.getFolder(newFolderId);
      if (!folder || folder.deletedAt) {
        throw new Error('Thư mục đích không tồn tại hoặc đã bị xóa.');
      }
    }

    res.folderId = newFolderId;
    res.updatedAt = new Date().toISOString();
    this.saveResources(resources);

    return res;
  }

  static moveResources(resourceIds: string[], newFolderId: string | null): void {
    if (newFolderId) {
      const folder = this.getFolder(newFolderId);
      if (!folder || folder.deletedAt) {
        throw new Error('Thư mục đích không tồn tại hoặc đã bị xóa.');
      }
    }

    const idSet = new Set(resourceIds);
    const resources = this.getResources(undefined as any, true);
    const now = new Date().toISOString();

    for (const r of resources) {
      if (idSet.has(r.id)) {
        r.folderId = newFolderId;
        r.updatedAt = now;
      }
    }

    this.saveResources(resources);
  }

  static deleteResource(id: string, soft = true): void {
    const resources = this.getResources(undefined as any, true);
    const res = resources.find((r) => r.id === id);
    if (!res) return;

    if (soft) {
      res.deletedAt = new Date().toISOString();
      res.originalFolderId = res.folderId;
      this.saveResources(resources);
    } else {
      // Permanent delete
      const remaining = resources.filter((r) => r.id !== id);
      this.saveResources(remaining);

      // Clean up linked share links
      const shares = this.getShareLinks().filter((s) => s.resourceId !== id);
      this.saveShareLinks(shares);
    }
  }

  static deleteResources(ids: string[], soft = true): void {
    const idSet = new Set(ids);
    const resources = this.getResources(undefined as any, true);

    if (soft) {
      const now = new Date().toISOString();
      for (const r of resources) {
        if (idSet.has(r.id)) {
          r.deletedAt = now;
          r.originalFolderId = r.folderId;
        }
      }
      this.saveResources(resources);
    } else {
      const remaining = resources.filter((r) => !idSet.has(r.id));
      this.saveResources(remaining);

      const shares = this.getShareLinks().filter((s) => !idSet.has(s.resourceId));
      this.saveShareLinks(shares);
    }
  }

  static restoreResource(id: string): void {
    const resources = this.getResources(undefined as any, true);
    const res = resources.find((r) => r.id === id);
    if (!res) return;

    // Restore to original folder if still active, else root
    let targetFolderId = res.originalFolderId || null;
    if (targetFolderId) {
      const folder = this.getFolder(targetFolderId);
      if (!folder || folder.deletedAt) {
        targetFolderId = null;
      }
    }

    res.folderId = targetFolderId;
    res.deletedAt = null;
    res.originalFolderId = null;
    res.updatedAt = new Date().toISOString();
    this.saveResources(resources);
  }

  static restoreResources(ids: string[]): void {
    for (const id of ids) {
      this.restoreResource(id);
    }
  }

  static getTrashItems(): { resources: LibraryResource[]; folders: LibraryFolder[] } {
    const folders = this.getFolders(true).filter((f) => Boolean(f.deletedAt));
    const resources = this.getResources(undefined as any, true).filter((r) => Boolean(r.deletedAt));
    return { resources, folders };
  }

  static emptyTrash(): void {
    const remainingFolders = this.getFolders(true).filter((f) => !f.deletedAt);
    this.saveFolders(remainingFolders);

    const remainingResources = this.getResources(undefined as any, true).filter((r) => !r.deletedAt);
    this.saveResources(remainingResources);
  }

  // ==========================================
  // SHARING
  // ==========================================

  static getShareLinks(): LibraryShareLink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LIBRARY_SHARES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveShareLinks(shares: LibraryShareLink[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY_SHARES, JSON.stringify(shares));
    } catch (err) {
      console.error('Không thể lưu liên kết chia sẻ vào bộ nhớ:', err);
    }
  }

  static createShareLink(
    resourceId: string,
    permission: 'viewer' | 'editor' = 'viewer',
    expiresAt: string | null = null
  ): LibraryShareLink {
    const res = this.getResource(resourceId);
    if (!res || res.deletedAt) {
      throw new Error('Tài nguyên không hợp lệ hoặc đã bị xóa vào thùng rác.');
    }

    const token = generateCryptoShareToken();
    const newShare: LibraryShareLink = {
      id: generateStableId('lib_share'),
      resourceId,
      resourceType: res.resourceType,
      token,
      permission,
      expiresAt,
      revokedAt: null,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    };

    const shares = this.getShareLinks();
    shares.push(newShare);
    this.saveShareLinks(shares);

    return newShare;
  }

  static getShareLinkByToken(token: string): LibraryShareLink | null {
    if (!token) return null;
    return this.getShareLinks().find((s) => s.token === token) || null;
  }

  static revokeShareLink(shareId: string): void {
    const shares = this.getShareLinks();
    const share = shares.find((s) => s.id === shareId);
    if (share) {
      share.revokedAt = new Date().toISOString();
      this.saveShareLinks(shares);
    }
  }

  static validateShareAccess(token: string): {
    valid: boolean;
    reason?: 'revoked' | 'expired' | 'not_found' | 'resource_deleted';
    share?: LibraryShareLink;
    resource?: LibraryResource;
  } {
    const share = this.getShareLinkByToken(token);
    if (!share) {
      return { valid: false, reason: 'not_found' };
    }

    if (share.revokedAt) {
      return { valid: false, reason: 'revoked', share };
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: 'expired', share };
    }

    const resource = this.getResource(share.resourceId);
    if (!resource || resource.deletedAt) {
      return { valid: false, reason: 'resource_deleted', share };
    }

    // Increment access count
    share.accessCount = (share.accessCount || 0) + 1;
    this.saveShareLinks(this.getShareLinks().map((s) => (s.id === share.id ? share : s)));

    return { valid: true, share, resource };
  }

  static validateShareLink(token: string) {
    return this.validateShareAccess(token);
  }

  // ==========================================
  // ADAPTER / BACKWARD COMPATIBILITY
  // ==========================================

  /**
   * Seamlessly registers all existing Document and Quiz objects from StorageService
   * so they are available in Kho đề immediately without data duplication.
   */
  static syncExistingDataToLibrary(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RESOURCES);
      const existingResources: LibraryResource[] = data ? JSON.parse(data) : [];

      const docIds = new Set(existingResources.filter((r) => r.resourceType === 'document').map((r) => r.documentId));
      const quizIds = new Set(existingResources.filter((r) => r.resourceType === 'exam').map((r) => r.quizId));

      let hasChanges = false;

      // 1. Check existing documents
      const docs = StorageService.getDocuments();
      for (const d of docs) {
        if (!docIds.has(d.id)) {
          existingResources.push({
            id: generateStableId('res_doc'),
            folderId: null,
            resourceType: 'document',
            displayName: d.name || d.originalFileName || 'Tài liệu',
            documentId: d.id,
            originalFileName: d.originalFileName,
            fileFormat: d.sourceType || 'pdf',
            fileSize: d.size,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
            deletedAt: null,
          });
          hasChanges = true;
        }
      }

      // 2. Check existing quizzes / exams
      const quizzes = StorageService.getQuizzes();
      for (const q of quizzes) {
        if (!quizIds.has(q.id)) {
          existingResources.push({
            id: generateStableId('res_exam'),
            folderId: null,
            resourceType: 'exam',
            displayName: q.title || 'Đề kiểm tra',
            description: q.description,
            quizId: q.id,
            questions: q.questions,
            questionCount: q.questions?.length || 0,
            timeLimit: q.settings?.timeLimit,
            fileFormat: 'quiz',
            createdAt: q.createdAt || new Date().toISOString(),
            updatedAt: q.updatedAt || new Date().toISOString(),
            deletedAt: null,
          });
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(existingResources));
      }
    } catch (err) {
      console.warn('Failed to sync existing data to library:', err);
    }
  }

  // ==========================================
  // SEARCH, FILTER & SORT
  // ==========================================

  static filterAndSortItems(params: {
    resources: LibraryResource[];
    folders: LibraryFolder[];
    searchQuery: string;
    filter: LibraryViewFilter;
    sortBy: LibrarySortBy;
    sortOrder: LibrarySortOrder;
    currentFolderId: string | null;
  }): { filteredResources: LibraryResource[]; filteredFolders: LibraryFolder[] } {
    const { resources, folders, searchQuery, filter, sortBy, sortOrder, currentFolderId } = params;

    const normalizedQuery = normalizeVietnamese(searchQuery);

    // 1. Folder filtering
    let matchedFolders = folders.filter((f) => {
      if (filter === 'trash') {
        return Boolean(f.deletedAt);
      }
      if (f.deletedAt) return false;

      // In normal view, if there is a search query, show matched folders globally
      if (normalizedQuery) {
        return normalizeVietnamese(f.name).includes(normalizedQuery);
      }

      // Otherwise show folders whose parentId is currentFolderId
      return f.parentId === currentFolderId;
    });

    // 2. Resource filtering
    let matchedResources = resources.filter((r) => {
      if (filter === 'trash') {
        return Boolean(r.deletedAt);
      }
      if (r.deletedAt) return false;

      // Type filter
      if (filter === 'documents' && r.resourceType !== 'document') return false;
      if (filter === 'questions' && r.resourceType !== 'question_set') return false;
      if (filter === 'exams' && r.resourceType !== 'exam') return false;

      // Search query
      if (normalizedQuery) {
        const nameMatch = normalizeVietnamese(r.displayName).includes(normalizedQuery);
        const descMatch = r.description ? normalizeVietnamese(r.description).includes(normalizedQuery) : false;
        const formatMatch = r.fileFormat ? normalizeVietnamese(r.fileFormat).includes(normalizedQuery) : false;
        return nameMatch || descMatch || formatMatch;
      }

      // In normal navigation, show resources in current folder
      return r.folderId === currentFolderId;
    });

    // 3. Sorting
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;

    matchedFolders.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'vi') * sortMultiplier;
      }
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return (timeA - timeB) * sortMultiplier;
    });

    matchedResources.sort((a, b) => {
      if (sortBy === 'name') {
        return a.displayName.localeCompare(b.displayName, 'vi') * sortMultiplier;
      }
      if (sortBy === 'size') {
        const sizeA = a.fileSize || (a.questionCount ? a.questionCount * 1024 : 0);
        const sizeB = b.fileSize || (b.questionCount ? b.questionCount * 1024 : 0);
        return (sizeA - sizeB) * sortMultiplier;
      }
      if (sortBy === 'type') {
        return a.resourceType.localeCompare(b.resourceType) * sortMultiplier;
      }
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return (timeA - timeB) * sortMultiplier;
    });

    return {
      filteredResources: matchedResources,
      filteredFolders: matchedFolders,
    };
  }

  static getTrashResources(): LibraryResource[] {
    return this.getResources(undefined as any, true).filter((r) => Boolean(r.deletedAt));
  }

  static searchResources(
    queryOrOptions: string | {
      query?: string;
      folderId?: string | null;
      resourceType?: LibraryResourceType;
      sortBy?: LibrarySortBy;
      sortOrder?: LibrarySortOrder;
      includeDeleted?: boolean;
    },
    filter: LibraryViewFilter = 'all'
  ): LibraryResource[] {
    if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
      const {
        query = '',
        folderId,
        resourceType,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        includeDeleted = false,
      } = queryOrOptions;
      let resources = this.getResources(undefined as any, includeDeleted);
      if (folderId !== undefined) {
        resources = resources.filter((r) => r.folderId === folderId);
      }
      if (resourceType) {
        resources = resources.filter((r) => r.resourceType === resourceType);
      }
      const q = normalizeVietnamese(query);
      if (q) {
        resources = resources.filter(
          (r) =>
            normalizeVietnamese(r.displayName).includes(q) ||
            (Boolean(r.description) && normalizeVietnamese(r.description!).includes(q))
        );
      }

      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      resources.sort((a, b) => {
        if (sortBy === 'name') {
          return a.displayName.localeCompare(b.displayName, 'vi') * sortMultiplier;
        }
        if (sortBy === 'size') {
          const sizeA = a.fileSize || (a.questionCount ? a.questionCount * 1024 : 0);
          const sizeB = b.fileSize || (b.questionCount ? b.questionCount * 1024 : 0);
          return (sizeA - sizeB) * sortMultiplier;
        }
        if (sortBy === 'type') {
          return a.resourceType.localeCompare(b.resourceType) * sortMultiplier;
        }
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return (timeA - timeB) * sortMultiplier;
      });

      return resources;
    }
    const resources = this.getResources(undefined as any, filter === 'trash');
    const q = normalizeVietnamese(queryOrOptions);
    if (!q) return resources;
    return resources.filter((r) => normalizeVietnamese(r.displayName).includes(q));
  }

  static moveMultipleResources(resourceIds: string[], targetFolderId: string | null): void {
    const resources = this.getResources(undefined as any, true);
    resources.forEach((r) => {
      if (resourceIds.includes(r.id)) {
        r.folderId = targetFolderId;
        r.updatedAt = new Date().toISOString();
      }
    });
    this.saveResources(resources);
  }

  static permanentDeleteResource(id: string): void {
    const resources = this.getResources(undefined as any, true).filter((r) => r.id !== id);
    this.saveResources(resources);
  }

  static permanentDeleteFolder(id: string): void {
    const folders = this.getFolders(true).filter((f) => f.id !== id);
    this.saveFolders(folders);
  }

  static getActiveShareForResource(resourceId: string): LibraryShareLink | null {
    const shares = this.getShareLinks();
    return shares.find((s) => s.resourceId === resourceId && !s.revokedAt) || null;
  }
}
