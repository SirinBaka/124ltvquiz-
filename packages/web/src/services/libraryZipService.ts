import JSZip from 'jszip';
import type { LibraryResource, LibraryFolder } from '@ltvquiz/shared';
import { StorageService } from './storageService';
import { downloadBlob, generateMarkdown } from './exportService';

export function sanitizeZipFileName(name: string): string {
  if (!name) return 'tai_lieu';
  // Remove path traversal and forbidden characters
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .trim()
    .slice(0, 120);
}

export function buildFolderPathsMap(folders: LibraryFolder[]): Map<string, string> {
  const map = new Map<string, string>();
  const folderMap = new Map(folders.map((f) => [f.id, f]));

  for (const folder of folders) {
    const segments: string[] = [];
    let current: LibraryFolder | undefined = folder;
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      segments.unshift(sanitizeZipFileName(current.name));
      current = current.parentId ? folderMap.get(current.parentId) : undefined;
    }

    map.set(folder.id, segments.join('/') + '/');
  }

  return map;
}

export class LibraryZipService {
  /**
   * Downloads a single resource in its native format.
   */
  static async downloadSingleResource(resource: LibraryResource): Promise<void> {
    const safeName = sanitizeZipFileName(resource.displayName);

    if (resource.resourceType === 'document' && resource.documentId) {
      const file = await StorageService.getFile(resource.documentId);
      if (file) {
        downloadBlob(file, file.name || `${safeName}.${resource.fileFormat || 'pdf'}`);
        return;
      }

      // Fallback if IndexedDB file wasn't found
      const fallbackBlob = new Blob([`Tài liệu: ${resource.displayName}\nNgày tạo: ${resource.createdAt}`], {
        type: 'text/plain;charset=utf-8',
      });
      downloadBlob(fallbackBlob, `${safeName}.txt`);
      return;
    }

    if (resource.resourceType === 'question_set' && resource.questions) {
      const mdContent = generateMarkdown(resource.displayName, resource.questions);
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      downloadBlob(blob, `${safeName}.md`);
      return;
    }

    if (resource.resourceType === 'exam') {
      const quiz = resource.quizId ? StorageService.getQuiz(resource.quizId) : null;
      const questions = quiz?.questions || resource.questions || [];
      const mdContent = generateMarkdown(quiz?.title || resource.displayName, questions);
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      downloadBlob(blob, `${safeName}.md`);
      return;
    }
  }

  /**
   * Packages multiple resources and folder structures into a single standard ZIP archive.
   */
  static async downloadBulkResources(
    resources: LibraryResource[],
    foldersOrName: LibraryFolder[] | string = [],
    zipFileName = 'khode_ltvquiz.zip'
  ): Promise<{ success: boolean; fileCount: number }> {
    if (typeof foldersOrName === 'string') {
      return this.downloadResourcesAsZip(resources, [], foldersOrName);
    }
    return this.downloadResourcesAsZip(resources, foldersOrName, zipFileName);
  }

  static async downloadResourcesAsZip(
    resources: LibraryResource[],
    allFolders: LibraryFolder[] = [],
    zipFileName = 'khode_ltvquiz.zip'
  ): Promise<{ success: boolean; fileCount: number }> {
    const zip = new JSZip();
    const folderPathMap = buildFolderPathsMap(allFolders);
    const usedPaths = new Set<string>();

    let fileCount = 0;

    for (const res of resources) {
      const folderPrefix = res.folderId ? folderPathMap.get(res.folderId) || '' : '';
      let baseName = sanitizeZipFileName(res.displayName);

      if (res.resourceType === 'document') {
        const ext = res.fileFormat || 'pdf';
        if (!baseName.toLowerCase().endsWith(`.${ext}`)) {
          baseName += `.${ext}`;
        }

        // Avoid duplicate paths
        let finalPath = `${folderPrefix}${baseName}`;
        let counter = 1;
        while (usedPaths.has(finalPath)) {
          finalPath = `${folderPrefix}${sanitizeZipFileName(res.displayName)}_${counter}.${ext}`;
          counter++;
        }
        usedPaths.add(finalPath);

        let fileBlob: Blob | null = null;
        if (res.documentId) {
          try {
            fileBlob = await StorageService.getFile(res.documentId);
          } catch {}
        }

        if (!fileBlob) {
          fileBlob = new Blob([`Tài liệu: ${res.displayName}\nTạo lúc: ${res.createdAt}`], {
            type: 'text/plain;charset=utf-8',
          });
        }

        zip.file(finalPath, fileBlob);
        fileCount++;
      } else if (res.resourceType === 'question_set') {
        let finalPath = `${folderPrefix}${baseName}.md`;
        let counter = 1;
        while (usedPaths.has(finalPath)) {
          finalPath = `${folderPrefix}${baseName}_${counter}.md`;
          counter++;
        }
        usedPaths.add(finalPath);

        const mdContent = generateMarkdown(res.displayName, res.questions || []);
        zip.file(finalPath, mdContent);
        fileCount++;
      } else if (res.resourceType === 'exam') {
        let finalPath = `${folderPrefix}${baseName}.md`;
        let counter = 1;
        while (usedPaths.has(finalPath)) {
          finalPath = `${folderPrefix}${baseName}_${counter}.md`;
          counter++;
        }
        usedPaths.add(finalPath);

        const quiz = res.quizId ? StorageService.getQuiz(res.quizId) : null;
        const questions = quiz?.questions || res.questions || [];
        const mdContent = generateMarkdown(quiz?.title || res.displayName, questions);
        zip.file(finalPath, mdContent);
        fileCount++;
      }
    }

    if (fileCount === 0) {
      // Empty zip
      zip.file('README.txt', 'Kho đề LTVQuiz - Không có tệp tin nào được chọn.');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, zipFileName);

    return { success: true, fileCount };
  }
}
