import { describe, it, expect, beforeEach } from 'vitest';
import {
  LibraryStorageService,
  normalizeVietnamese,
} from './libraryStorageService';
import type { Question } from '@ltvquiz/shared';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('LibraryStorageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('normalizeVietnamese', () => {
    it('normalizes diacritics and cases correctly', () => {
      expect(normalizeVietnamese('Đề thi Toán Học')).toBe('de thi toan hoc');
      expect(normalizeVietnamese('Khảo sát Lý 12')).toBe('khao sat ly 12');
      expect(normalizeVietnamese('')).toBe('');
    });
  });

  describe('Folder Hierarchy and Cycle Prevention', () => {
    it('creates root and nested folders', () => {
      const root = LibraryStorageService.createFolder('Toán Học');
      expect(root.id).toBeDefined();
      expect(root.name).toBe('Toán Học');
      expect(root.parentId).toBeNull();

      const sub = LibraryStorageService.createFolder('Đại số 12', root.id);
      expect(sub.parentId).toBe(root.id);
      expect(sub.name).toBe('Đại số 12');

      const folders = LibraryStorageService.getFolders();
      expect(folders).toHaveLength(2);
    });

    it('rejects empty folder name', () => {
      expect(() => LibraryStorageService.createFolder('   ')).toThrow('Tên thư mục không được để trống.');
    });

    it('renames a folder', () => {
      const folder = LibraryStorageService.createFolder('Lý 10');
      const updated = LibraryStorageService.renameFolder(folder.id, 'Vật Lý 10');
      expect(updated.name).toBe('Vật Lý 10');

      const found = LibraryStorageService.getFolder(folder.id);
      expect(found?.name).toBe('Vật Lý 10');
    });

    it('moves a folder to another parent', () => {
      const f1 = LibraryStorageService.createFolder('Folder 1');
      const f2 = LibraryStorageService.createFolder('Folder 2');
      const moved = LibraryStorageService.moveFolder(f2.id, f1.id);
      expect(moved.parentId).toBe(f1.id);
    });

    it('prevents cycle: cannot move folder into itself', () => {
      const f1 = LibraryStorageService.createFolder('Folder 1');
      expect(() => LibraryStorageService.moveFolder(f1.id, f1.id)).toThrow('Không thể di chuyển thư mục vào chính nó.');
    });

    it('prevents cycle: cannot move folder into its own descendant', () => {
      const root = LibraryStorageService.createFolder('Root');
      const child = LibraryStorageService.createFolder('Child', root.id);
      const grandChild = LibraryStorageService.createFolder('GrandChild', child.id);

      // Attempt to move Root into GrandChild
      expect(() => LibraryStorageService.moveFolder(root.id, grandChild.id)).toThrow(
        'Không thể di chuyển thư mục vào bên trong một thư mục con của nó.'
      );
    });

    it('generates breadcrumbs from root to deep folder', () => {
      const f1 = LibraryStorageService.createFolder('Lớp 12');
      const f2 = LibraryStorageService.createFolder('Toán', f1.id);
      const f3 = LibraryStorageService.createFolder('Hình học', f2.id);

      const crumbs = LibraryStorageService.getBreadcrumbs(f3.id);
      expect(crumbs).toHaveLength(4);
      expect(crumbs[0].name).toBe('Kho đề');
      expect(crumbs[1].name).toBe('Lớp 12');
      expect(crumbs[2].name).toBe('Toán');
      expect(crumbs[3].name).toBe('Hình học');
    });
  });

  describe('Resource Management and Trash System', () => {
    it('creates and retrieves question set resource', () => {
      const sampleQuestions: Question[] = [
        {
          id: 'q1',
          type: 'multiple_choice',
          points: 1,
          question: [{ type: 'text', content: 'Thủ đô của Việt Nam là gì?' }],
          options: [
            { id: 'opt1', label: 'A', content: [{ type: 'text', content: 'Hà Nội' }] },
            { id: 'opt2', label: 'B', content: [{ type: 'text', content: 'TP.HCM' }] },
          ],
          correctAnswer: ['opt1'],
          validation: { status: 'valid', warnings: [] },
        },
      ];

      const res = LibraryStorageService.createQuestionSetResource('Bộ câu hỏi Địa lý', sampleQuestions);
      expect(res.id).toBeDefined();
      expect(res.resourceType).toBe('question_set');
      expect(res.questionCount).toBe(1);

      const retrieved = LibraryStorageService.getResource(res.id);
      expect(retrieved?.displayName).toBe('Bộ câu hỏi Địa lý');
    });

    it('soft deletes resource to trash and restores it', () => {
      const folder = LibraryStorageService.createFolder('Thư mục test');
      const res = LibraryStorageService.createQuestionSetResource('Test QSet', [], folder.id);

      // Soft delete
      LibraryStorageService.deleteResource(res.id, true);

      // Active resources in folder should be empty
      const activeInFolder = LibraryStorageService.getResources(folder.id, false);
      expect(activeInFolder).toHaveLength(0);

      // Trash should contain the item
      const trash = LibraryStorageService.getTrashItems();
      expect(trash.resources.some((r) => r.id === res.id)).toBe(true);

      // Restore
      LibraryStorageService.restoreResource(res.id);
      const restored = LibraryStorageService.getResources(folder.id, false);
      expect(restored).toHaveLength(1);
      expect(restored[0].id).toBe(res.id);
    });

    it('moves multiple resources between folders', () => {
      const f1 = LibraryStorageService.createFolder('Source');
      const f2 = LibraryStorageService.createFolder('Destination');

      const r1 = LibraryStorageService.createQuestionSetResource('Res 1', [], f1.id);
      const r2 = LibraryStorageService.createQuestionSetResource('Res 2', [], f1.id);

      LibraryStorageService.moveResources([r1.id, r2.id], f2.id);

      expect(LibraryStorageService.getResources(f1.id, false)).toHaveLength(0);
      expect(LibraryStorageService.getResources(f2.id, false)).toHaveLength(2);
    });
  });

  describe('Sharing and Access Validation', () => {
    it('creates and validates a share link', () => {
      const res = LibraryStorageService.createQuestionSetResource('Bài chia sẻ', []);
      const share = LibraryStorageService.createShareLink(res.id);

      expect(share.token).toBeDefined();
      expect(share.permission).toBe('viewer');

      const check = LibraryStorageService.validateShareAccess(share.token);
      expect(check.valid).toBe(true);
      expect(check.resource?.id).toBe(res.id);
    });

    it('rejects revoked share link', () => {
      const res = LibraryStorageService.createQuestionSetResource('Bài chia sẻ 2', []);
      const share = LibraryStorageService.createShareLink(res.id);

      LibraryStorageService.revokeShareLink(share.id);
      const check = LibraryStorageService.validateShareAccess(share.token);
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('revoked');
    });

    it('rejects expired share link', () => {
      const res = LibraryStorageService.createQuestionSetResource('Bài chia sẻ 3', []);
      const expiredDate = new Date(Date.now() - 10000).toISOString();
      const share = LibraryStorageService.createShareLink(res.id, 'viewer', expiredDate);

      const check = LibraryStorageService.validateShareAccess(share.token);
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('expired');
    });
  });
});
