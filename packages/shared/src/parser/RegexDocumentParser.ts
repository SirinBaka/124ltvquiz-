import { DocumentParser } from './index';
import type { Question, Option, ValidationStatus } from '../types';

export class RegexDocumentParser extends DocumentParser {
  parse(content: string): Question[] {
    const questions: Question[] = [];
    
    // First, let's extract a potential answer key block at the end
    // E.g., "BẢNG ĐÁP ÁN", "Đáp án:", etc.
    let mainText = content;
    let answerKeyText = '';
    
    const answerKeyMatch = /(?:BẢNG\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*GIẢI|ĐÁP\s*SỐ)(.+)$/is.exec(content);
    if (answerKeyMatch) {
      answerKeyText = answerKeyMatch[1];
      mainText = content.substring(0, answerKeyMatch.index);
    }
    
    // Parse answers from answerKeyText (e.g. "1. A", "1A", "Câu 1: B")
    const answerMap = new Map<number, string>();
    if (answerKeyText) {
      const ansRegex = /(?:Câu\s*)?(\d+)\s*[.:\-]?\s*([A-D])/gi;
      let am;
      while ((am = ansRegex.exec(answerKeyText)) !== null) {
        answerMap.set(parseInt(am[1], 10), am[2].toUpperCase());
      }
    }

    // Split by "Câu X.", "Question X.", "Bài X.", "X."
    const questionRegex = /(?:^|\n)\s*(?:Câu\s*(\d+)|Question\s*(\d+)|Bài\s*(\d+)|(\d+))\s*[.:]\s*(.+?)(?=(?:\n\s*(?:Câu\s*\d+|Question\s*\d+|Bài\s*\d+|\d+\s*[.:]))|$)/gis;
    
    let match;
    let fallbackIndex = 1;
    
    while ((match = questionRegex.exec(mainText)) !== null) {
      const qNumStr = match[1] || match[2] || match[3] || match[4];
      const qNum = qNumStr ? parseInt(qNumStr, 10) : fallbackIndex;
      const fullQuestionText = match[5].trim();
      
      const parsedQuestion = this.parseQuestionBlock(fullQuestionText, qNum, answerMap);
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        fallbackIndex++;
      }
    }

    return questions;
  }

  private parseQuestionBlock(text: string, qNum: number, globalAnswers: Map<number, string>): Question | null {
    // Look for options A., B., C., D. or A), B)
    const optionRegex = /([A-D])\s*[.)]\s*(.+?)(?=(?:[A-D]\s*[.)]|$))/gis;
    
    let questionText = text;
    const options: Option[] = [];
    
    let firstOptionIndex = text.length;
    
    // Extract inline answer if present
    let inlineAnswer = '';
    const inlineAnsMatch = /(?:Đáp\s*án\s*[:]?|Answer\s*[:]?)\s*([A-D])/i.exec(text);
    if (inlineAnsMatch) {
      inlineAnswer = inlineAnsMatch[1].toUpperCase();
      // Remove inline answer text
      text = text.substring(0, inlineAnsMatch.index) + text.substring(inlineAnsMatch.index + inlineAnsMatch[0].length);
    }

    // Find the first option to split question from options
    const firstOptionMatch = /(?:^|\n|\s)([A-D])\s*[.)]\s*/i.exec(text);
    if (firstOptionMatch) {
      // index should start at the letter
      firstOptionIndex = firstOptionMatch.index + firstOptionMatch[0].indexOf(firstOptionMatch[1]);
      questionText = text.substring(0, firstOptionIndex).trim();
      
      const optionsText = text.substring(firstOptionIndex);
      let optMatch;
      while ((optMatch = optionRegex.exec(optionsText)) !== null) {
        options.push({
          id: this.generateId('opt'),
          label: optMatch[1].toUpperCase(),
          content: [{ type: 'text', content: optMatch[2].trim() }]
        });
      }
    }

    // Determine correct answer
    const finalAnswerLabel = inlineAnswer || globalAnswers.get(qNum);
    const correctAnswerIds: string[] = [];
    if (finalAnswerLabel) {
      const opt = options.find(o => o.label === finalAnswerLabel);
      if (opt) {
        correctAnswerIds.push(opt.id);
      }
    }

    // Identify validation status
    let status: ValidationStatus = 'valid';
    const warnings: string[] = [];

    if (options.length !== 4) {
      status = 'warning';
      warnings.push(`Expected 4 options, found ${options.length}`);
    }

    if (!questionText) {
      status = 'error';
      warnings.push('Thiếu nội dung câu hỏi');
    }
    
    if (correctAnswerIds.length === 0 && options.length > 0) {
      warnings.push('Chưa xác định được đáp án đúng');
    }

    return {
      id: this.generateId('q'),
      type: 'multiple_choice',
      question: [{ type: 'text', content: questionText }],
      options: options.length > 0 ? options : [
        { id: this.generateId('opt'), label: 'A', content: [{ type: 'text', content: '' }] },
        { id: this.generateId('opt'), label: 'B', content: [{ type: 'text', content: '' }] },
        { id: this.generateId('opt'), label: 'C', content: [{ type: 'text', content: '' }] },
        { id: this.generateId('opt'), label: 'D', content: [{ type: 'text', content: '' }] }
      ],
      correctAnswer: correctAnswerIds,
      points: this.config.defaultPoints || 0.25,
      validation: {
        status,
        warnings,
      }
    };
  }
}
