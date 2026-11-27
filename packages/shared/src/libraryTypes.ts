import type { Question } from './types';

export type LibraryResourceType = 'document' | 'source_document' | 'question_set' | 'exam';

export interface LibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LibraryResource {
  id: string;
  folderId: string | null;
  resourceType: LibraryResourceType;
  displayName: string;
  description?: string;
  
  // For 'document' / 'source_document'
  documentId?: string;
  originalFileName?: string;
  originalFilename?: string;
  fileFormat?: string; // pdf, docx, txt, md
  fileExtension?: string;
  fileSize?: number;

  // For 'question_set'
  questions?: Question[];
  questionCount?: number;
  sourceDocumentId?: string;
  sourceDocumentName?: string;

  // For 'exam'
  quizId?: string;
  timeLimit?: number | null;

  // Generic metadata
  metadata?: Record<string, any>;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  originalFolderId?: string | null;
}

export interface LibraryShareLink {
  id: string;
  resourceId: string;
  resourceType: LibraryResourceType;
  token: string;
  permission: 'viewer' | 'editor';
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  accessCount: number;
}

export interface LibraryBreadcrumb {
  id: string | null;
  name: string;
}

export type LibraryViewFilter = 'all' | 'documents' | 'questions' | 'exams' | 'trash' | 'shared';

export type LibrarySortBy = 'updatedAt' | 'createdAt' | 'name' | 'size' | 'type';
export type LibrarySortOrder = 'asc' | 'desc';
