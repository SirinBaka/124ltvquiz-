import type { Question } from '../types';

export interface DocumentParserConfig {
  defaultPoints?: number;
}

/**
 * Base Parser class that different document format extractors can implement.
 */
export abstract class DocumentParser {
  config: DocumentParserConfig;

  constructor(config: DocumentParserConfig = { defaultPoints: 0.25 }) {
    this.config = config;
  }

  /**
   * Main extraction pipeline. 
   * @param content Raw string content of the document.
   */
  abstract parse(content: string): Question[];

  protected generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
