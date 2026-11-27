import type { Quiz, Question, Document, DocumentAsset, ShareLink } from '@ltvquiz/shared';

// We'll use localStorage for metadata persistence, and IndexedDB for files
const STORAGE_KEY_QUIZZES = 'ltvquiz_quizzes';
const STORAGE_KEY_ATTEMPTS = 'ltvquiz_attempts';
const STORAGE_KEY_DOCUMENTS = 'ltvquiz_documents';
const STORAGE_KEY_ASSETS = 'ltvquiz_assets';
const STORAGE_KEY_SHARES = 'ltvquiz_shares';

const DB_NAME = 'ltvquiz_db';
const STORE_NAME = 'files';

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageService {
  
  // Quizzes
  static getQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUIZZES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getQuiz(id: string): Quiz | null {
    return this.getQuizzes().find(q => q.id === id) || null;
  }

  static saveQuiz(quiz: Quiz): void {
    const quizzes = this.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
  }

  static deleteQuiz(id: string): void {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
  }

  // Helper to create a draft quiz
  static createDraftQuiz(title: string, questions: Question[]): Quiz {
    const newQuiz: Quiz = {
      id: 'quiz_' + Math.random().toString(36).substr(2, 9),
      title: title || 'Bài kiểm tra mới',
      description: '',
      questions,
      settings: {
        timeLimit: 45,
        shuffleQuestions: true,
        shuffleOptions: true,
        showResults: 'immediately',
        allowReview: true,
        maxAttempts: 1
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveQuiz(newQuiz);
    return newQuiz;
  }

  // Attempts
  static getAttempts(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getAttemptsForQuiz(quizId: string): any[] {
    return this.getAttempts().filter(a => a.quizId === quizId);
  }

  static saveAttempt(attempt: any): void {
    const attempts = this.getAttempts();
    attempts.push(attempt);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));
  }
  // Documents
  static getDocuments(): Document[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getDocument(id: string): Document | null {
    return this.getDocuments().find(d => d.id === id) || null;
  }

  static saveDocument(doc: Document): void {
    const docs = this.getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
  }

  static deleteDocument(id: string): void {
    const docs = this.getDocuments().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
    // Also delete associated assets
    const assets = this.getAssets().filter(a => a.documentId !== id);
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
    // Delete file from IndexedDB asynchronously
    try {
      this.deleteFile(id).catch(() => {});
    } catch {}
  }

  static async deleteDocuments(ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    const docs = this.getDocuments().filter(d => !idSet.has(d.id));
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));

    const assets = this.getAssets().filter(a => !a.documentId || !idSet.has(a.documentId));
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));

    const shares = this.getShareLinks().filter(s => !idSet.has(s.documentId));
    localStorage.setItem(STORAGE_KEY_SHARES, JSON.stringify(shares));

    for (const id of ids) {
      try {
        await this.deleteFile(id);
      } catch {}
    }
  }

  static async clearAllDocuments(): Promise<void> {
    const docs = this.getDocuments();
    for (const d of docs) {
      try {
        await this.deleteFile(d.id);
      } catch {}
    }
    localStorage.removeItem(STORAGE_KEY_DOCUMENTS);
    localStorage.removeItem(STORAGE_KEY_ASSETS);
    localStorage.removeItem(STORAGE_KEY_SHARES);
  }

  // Assets
  static getAssets(): DocumentAsset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ASSETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getAsset(id: string): DocumentAsset | null {
    return this.getAssets().find(a => a.id === id) || null;
  }

  static saveAsset(asset: DocumentAsset): void {
    const assets = this.getAssets();
    const index = assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      assets[index] = asset;
    } else {
      assets.push(asset);
    }
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
  }

  // Share Links
  static getShareLinks(): ShareLink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SHARES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getShareLink(token: string): ShareLink | null {
    return this.getShareLinks().find(s => s.token === token) || null;
  }

  static getShareLinksForDocument(documentId: string): ShareLink[] {
    return this.getShareLinks().filter(s => s.documentId === documentId);
  }

  static saveShareLink(share: ShareLink): void {
    const shares = this.getShareLinks();
    const index = shares.findIndex(s => s.id === share.id);
    if (index >= 0) {
      shares[index] = share;
    } else {
      shares.push(share);
    }
    localStorage.setItem(STORAGE_KEY_SHARES, JSON.stringify(shares));
  }

  static async saveFile(id: string, file: File): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(file, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getFile(id: string): Promise<File | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(tx.error);
    });
  }

  static async deleteFile(id: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
