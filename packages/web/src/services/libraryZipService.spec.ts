import { describe, it, expect } from 'vitest';
import { sanitizeZipFileName, buildFolderPathsMap } from './libraryZipService';
import type { LibraryFolder } from '@ltvquiz/shared';

describe('libraryZipService', () => {
  describe('sanitizeZipFileName', () => {
    it('removes forbidden characters and path traversal', () => {
      expect(sanitizeZipFileName('../../etc/passwd')).toBe('____etc_passwd');
      expect(sanitizeZipFileName('Bài tập: Toán & Lý <12>?')).toBe('Bài tập_ Toán & Lý _12__');
      expect(sanitizeZipFileName('')).toBe('tai_lieu');
    });
  });

  describe('buildFolderPathsMap', () => {
    it('constructs correct hierarchical folder paths', () => {
      const folders: LibraryFolder[] = [
        {
          id: 'f1',
          name: 'Lớp 12',
          parentId: null,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
        },
        {
          id: 'f2',
          name: 'Môn Toán',
          parentId: 'f1',
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
        },
        {
          id: 'f3',
          name: 'Đề kiểm tra',
          parentId: 'f2',
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
        },
      ];

      const pathMap = buildFolderPathsMap(folders);
      expect(pathMap.get('f1')).toBe('Lớp 12/');
      expect(pathMap.get('f2')).toBe('Lớp 12/Môn Toán/');
      expect(pathMap.get('f3')).toBe('Lớp 12/Môn Toán/Đề kiểm tra/');
    });
  });
});
