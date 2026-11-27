export type QuestionType = 'multiple_choice' | 'true_false' | 'true_false_multiple';

export type ValidationStatus = 'valid' | 'warning' | 'error';

export interface ContentBlock {
  type: 'text' | 'math' | 'image';
  content: string; // The text content or URL/Base64 for images
  assetId?: string;
  alt?: string;
}

export interface Option {
  id: string;
  label: string; // A, B, C, D or a, b, c, d
  content: ContentBlock[];
}

export interface Question {
  id: string;
  type: QuestionType;
  question: ContentBlock[];
  options: Option[];
  correctAnswer: string[]; // Array of Option IDs, or Array of True/False values for true_false_multiple
  points: number;
  sectionTitle?: string; // e.g. "PHẦN I", "PHẦN II"
  source?: {
    file?: string;
    documentId?: string;
    page?: number;
  };
  validation: {
    status: ValidationStatus;
    confidence?: number;
    warnings: string[];
  };
}

export interface QuizSettings {
  timeLimit: number | null; // minutes, null means unlimited
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after_deadline' | 'never';
  allowReview: boolean;
  maxAttempts: number;
  requireStudentInfo?: boolean;
  enableAntiCheat?: boolean;
  maxViolations?: number;
  accessPassword?: string;
  assignExamCode?: boolean;
  maxStudentsLimit?: number | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  settings: QuizSettings;
  status: 'draft' | 'review' | 'published' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type Exam = Quiz; // Alias for backward compatibility

export interface Attempt {
  id: string;
  quizId: string; // or examId
  studentName: string;
  answers: Record<string, string>; // questionId -> optionId
  score: number;
  totalPoints: number;
  timeSpent: number; // in seconds
  createdAt: string;
  maxStreak?: number;
  studentClass?: string;
  violationCount?: number;
  examCode?: string;
}

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'warning' | 'failed';
export type DocumentSourceType = 'pdf' | 'docx' | 'txt' | 'markdown';

export interface Document {
  id: string;
  name: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
  sourceType: DocumentSourceType;
  processing?: {
    progress?: number;
    stage?: string;
    warnings: string[];
    errors: string[];
  };
}

export interface DocumentAsset {
  id: string;
  documentId?: string;
  type: 'image';
  mimeType: string;
  url?: string;
  storageKey?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  documentId: string;
  token: string;
  type: 'public' | 'restricted';
  status: 'active' | 'revoked';
  createdAt: string;
}
