import { describe, it, expect } from 'vitest';
import { determineResourceAction, getResourceTypeBadge } from './libraryHelper';
import type { LibraryResource } from '@ltvquiz/shared';

describe('libraryHelper', () => {
  describe('determineResourceAction', () => {
    it('determines action for source_document', () => {
      const res: LibraryResource = {
        id: 'res_doc_123',
        documentId: 'doc_real_456',
        displayName: 'Đề thi Văn học.pdf',
        folderId: null,
        resourceType: 'source_document',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
        deletedAt: null,
      };

      const action = determineResourceAction(res);
      expect(action.action).toBe('process_document');
      expect(action.targetId).toBe('doc_real_456');
    });

    it('determines action for question_set', () => {
      const res: LibraryResource = {
        id: 'res_qset_789',
        displayName: 'Bộ 20 câu hỏi Đại số',
        folderId: null,
        resourceType: 'question_set',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
        deletedAt: null,
      };

      const action = determineResourceAction(res);
      expect(action.action).toBe('load_questions');
      expect(action.targetId).toBe('res_qset_789');
    });

    it('determines action for exam', () => {
      const res: LibraryResource = {
        id: 'res_exam_999',
        quizId: 'quiz_final_1',
        displayName: 'Thi Thử Đại Học 2026',
        folderId: null,
        resourceType: 'exam',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
        deletedAt: null,
      };

      const action = determineResourceAction(res);
      expect(action.action).toBe('open_exam');
      expect(action.targetId).toBe('quiz_final_1');
      expect(action.url).toBe('/editor/quiz_final_1');
    });
  });

  describe('getResourceTypeBadge', () => {
    it('returns Vietnamese badge label and theme classes', () => {
      expect(getResourceTypeBadge('source_document').label).toBe('Tài liệu gốc');
      expect(getResourceTypeBadge('question_set').label).toBe('Bộ câu hỏi');
      expect(getResourceTypeBadge('exam').label).toBe('Đề kiểm tra');
    });
  });
});
