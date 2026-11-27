import type { LibraryResource, LibraryResourceType } from '@ltvquiz/shared';

export interface LibraryActionRoute {
  action: 'process_document' | 'load_questions' | 'open_exam';
  targetId?: string;
  url?: string;
}

export function determineResourceAction(
  resource: LibraryResource,
): LibraryActionRoute {
  if (resource.resourceType === 'source_document' || resource.resourceType === 'document') {
    const docId = resource.documentId || resource.sourceDocumentId || resource.id.replace('res_doc_', '');
    return {
      action: 'process_document',
      targetId: docId,
    };
  }

  if (resource.resourceType === 'question_set') {
    return {
      action: 'load_questions',
      targetId: resource.id,
    };
  }

  // exam
  const examId = resource.quizId || resource.metadata?.examId || resource.metadata?.quiz?.id;
  return {
    action: 'open_exam',
    targetId: examId,
    url: `/editor/${examId}`,
  };
}

export function getResourceTypeBadge(type: LibraryResourceType): {
  label: string;
  badgeClass: string;
} {
  switch (type) {
    case 'source_document':
    case 'document':
      return { label: 'Tài liệu gốc', badgeClass: 'bg-blue-500/10 text-blue-600' };
    case 'question_set':
      return { label: 'Bộ câu hỏi', badgeClass: 'bg-emerald-500/10 text-emerald-600' };
    case 'exam':
      return { label: 'Đề kiểm tra', badgeClass: 'bg-purple-500/10 text-purple-600' };
    default:
      return { label: 'Khác', badgeClass: 'bg-slate-500/10 text-slate-600' };
  }
}
