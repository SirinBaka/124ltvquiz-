import { DocumentParser } from './index';
import type { Question, Option, ValidationStatus, ContentBlock } from '../types';

export class AdvancedDocumentParser extends DocumentParser {
  private maskedImageMap: Map<string, string> = new Map();

  private maskImages(text: string): string {
    return text.replace(
      /!\[((?:\\[\s\S]|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(<img\b[^>]*>)/gi,
      (full) => {
        const token = `@@LTVIMG${this.maskedImageMap.size}END@@`;
        this.maskedImageMap.set(token, full);
        return token;
      },
    );
  }

  private unmaskImages(text: string): string {
    if (this.maskedImageMap.size === 0) return text;
    return text.replace(
      /@@LTVIMG(\d+)END@@/g,
      (full) => this.maskedImageMap.get(full) ?? full,
    );
  }

  parse(content: string): Question[] {
    this.maskedImageMap = new Map();
    const questions: Question[] = [];
    
    // 1. Normalize whitespace and layout (mask images first so alt/URL never interferes with question/option regexes)
    let normalized = this.maskImages(content).replace(/\r\n/g, '\n');
    // Replace non-breaking spaces
    normalized = normalized.replace(/\u00A0/g, ' ');
    // Clean any Mammoth escaped tags or noise
    normalized = normalized
      .replace(/\\\[\/?BOLD\\\]/gi, '')
      .replace(/\\\[(RED|\/RED|UNDERLINE|\/UNDERLINE)\\\]/gi, '[$1]')
      .replace(/((?:Câu|Question|Bài)\s*\d+)\\\./gi, '$1.')
      .replace(/(^|\s|\()([A-Da-d])\\\./gm, '$1$2.');
    // Normalize circled and special letter markers
    normalized = normalized
      .replace(/[Ⓐ🅐]/g, 'A. ')
      .replace(/[Ⓑ🅑]/g, 'B. ')
      .replace(/[Ⓒ🅒]/g, 'C. ')
      .replace(/[Ⓓ🅓]/g, 'D. ')
      .replace(/[ⓐ]/g, 'a. ')
      .replace(/[ⓑ]/g, 'b. ')
      .replace(/[ⓒ]/g, 'c. ')
      .replace(/[ⓓ]/g, 'd. ');
    
    // 2. Extract Answer Section
    let mainText = normalized;
    let answerText = '';
    const ansMatch = /(?:^|\n)\s*(?:BẢNG\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*GIẢI|ĐÁP\s*SỐ|LỜI\s*GIẢI\s*CHI\s*TIẾT|KEY|ANSWER\s*KEY)\s*[:.\-]?(?:\n|[^\S\r\n]+)(.+)$/is.exec(normalized);
    if (ansMatch) {
      const remainder = ansMatch[1].trim();
      if (!/(?:^|\n)\s*(?:Câu|Question|Bài)\s*\d+\b/i.test(remainder)) {
        mainText = normalized.substring(0, ansMatch.index);
        answerText = remainder;
      }
    }
    
    const globalAnswers = this.parseAnswerSection(answerText);

    // 2.1 Detect Exam Sections (e.g. PHẦN I, PHẦN II, PHẦN III)
    interface ExamSection {
      startIndex: number;
      type: 'multiple_choice' | 'true_false_multiple' | 'short_answer';
      title?: string;
    }
    const examSections: ExamSection[] = [];
    const sectionRegex = /(?:^|\n)\s*(?:\[!b:\$?)?(?:PHẦN|Phần|PART|Part)\s*(I{1,3}|IV|V|[1-3])\b[^\n]*/gi;
    let secMatch;
    while ((secMatch = sectionRegex.exec(mainText)) !== null) {
      const rawSecStr = secMatch[0].trim();
      const secStr = rawSecStr.toLowerCase();
      const secNum = secMatch[1].toUpperCase();
      let type: 'multiple_choice' | 'true_false_multiple' | 'short_answer' = 'multiple_choice';
      if (secNum === 'II' || secNum === '2' || secStr.includes('đúng sai') || secStr.includes('true/false')) {
        type = 'true_false_multiple';
      } else if (secNum === 'III' || secNum === '3' || secStr.includes('ngắn') || secStr.includes('điền')) {
        type = 'short_answer';
      }

      // Clean section title, e.g. [!b:$PHẦN I$] -> PHẦN I
      const cleanTitle = rawSecStr
        .replace(/\[!b:\$?/gi, '')
        .replace(/\$?\]/gi, '')
        .trim();

      examSections.push({
        startIndex: secMatch.index,
        type,
        title: cleanTitle
      });
    }
    
    // 3. Question Boundary Detection
    // If the document explicitly has "Câu X", "Bài X" or "Question X", do not split on standalone numbers like "1." in formulas or lists
    const hasExplicitKeywords = /(?:^|\n|\s)(?:[_*]+|\[!b:\$?)?(?:Câu|Question|Bài)\s*\d+/i.test(mainText);
    const questionStartRegex = hasExplicitKeywords
      ? /(?:^|\n)\s*(?:[_*]+|\[!b:\$?)?\s*(?:Câu|Question|Bài)\s*(\d+)\s*(?:\\?[:.\-)]|[_*]+)\s*/gi
      : /(?:^|\n)\s*(?:(?:[_*]+|\[!b:\$?)?\s*(?:Câu|Question|Bài)\s*(\d+)\s*(?:\\?[:.\-)]|[_*]+)\s*|(\d+)\s*[:.\-)]\s+)/gi;
    
    interface QBlock {
      qNum: number;
      text: string;
      sectionType?: 'multiple_choice' | 'true_false_multiple' | 'short_answer';
      sectionTitle?: string;
    }
    
    const blocks: QBlock[] = [];
    let match;
    let lastIndex = 0;
    let currentQNum = -1;
    let currentStartIndex = 0;
    let fallbackIndex = 1;

    // Reset regex state
    questionStartRegex.lastIndex = 0;

    const getSectionInfo = (idx: number) => {
      let activeType: 'multiple_choice' | 'true_false_multiple' | 'short_answer' = 'multiple_choice';
      let activeTitle: string | undefined = undefined;
      for (const sec of examSections) {
        if (sec.startIndex <= idx) {
          activeType = sec.type;
          activeTitle = sec.title;
        }
      }
      return { activeType, activeTitle };
    };
    
    while ((match = questionStartRegex.exec(mainText)) !== null) {
      if (lastIndex > 0) {
        const textBefore = mainText.substring(lastIndex, match.index).trim();
        if (textBefore) {
          const sec = getSectionInfo(currentStartIndex);
          blocks.push({
            qNum: currentQNum !== -1 ? currentQNum : fallbackIndex++,
            text: textBefore,
            sectionType: sec.activeType,
            sectionTitle: sec.activeTitle
          });
        }
      }
      currentQNum = parseInt(match[1] || match[2], 10);
      currentStartIndex = match.index;
      lastIndex = match.index + match[0].length;
    }
    
    // Push the last block
    if (lastIndex < mainText.length) {
      const textAfter = mainText.substring(lastIndex).trim();
      if (textAfter) {
        const sec = getSectionInfo(currentStartIndex);
        blocks.push({
          qNum: currentQNum !== -1 ? currentQNum : fallbackIndex++,
          text: textAfter,
          sectionType: sec.activeType,
          sectionTitle: sec.activeTitle
        });
      }
    }
    
    // If no blocks were found but there is text, maybe there are no question markers?
    if (blocks.length === 0 && mainText.trim()) {
      const sec = getSectionInfo(0);
      blocks.push({ qNum: 1, text: mainText.trim(), sectionType: sec.activeType, sectionTitle: sec.activeTitle });
    }

    // 4. Process Each Question Block
    for (const block of blocks) {
      const parsedQ = this.parseQuestionBlock(block.text, block.qNum, globalAnswers, block.sectionType, block.sectionTitle);
      if (parsedQ) {
        questions.push(parsedQ);
      }
    }
    
    return questions;
  }

  private parseAnswerSection(text: string): Map<number, string | Record<string, boolean>> {
    const answerMap = new Map<number, string | Record<string, boolean>>();
    if (!text) return answerMap;

    // True/False Grid Format: "1: Đ S Đ S" or "Câu 1: Đ, S, Đ, S" or "1: T F T F"
    const tfSequenceRegex = /(?:^|\n)\s*(?:Câu\s*)?(\d+)\s*[:.\-]?\s*([ĐDSTFTrueFalse]{1,5})\s*[,|\s]\s*([ĐDSTFTrueFalse]{1,5})\s*[,|\s]\s*([ĐDSTFTrueFalse]{1,5})\s*[,|\s]\s*([ĐDSTFTrueFalse]{1,5})(?=[^\S\r\n]*$|\n)/gi;
    let seqMatch;
    while ((seqMatch = tfSequenceRegex.exec(text)) !== null) {
      const qNum = parseInt(seqMatch[1], 10);
      const labels = ['a', 'b', 'c', 'd'];
      const tfAnswers: Record<string, boolean> = {};
      for (let k = 0; k < 4; k++) {
        const val = seqMatch[k + 2].toUpperCase();
        tfAnswers[labels[k]] = val.startsWith('Đ') || val === 'T' || val === 'TRUE';
      }
      answerMap.set(qNum, tfAnswers);
    }

    // Multiple Choice Matches: "1. A", "1-A", "Câu 1: A", "1A" (on same line)
    const ansRegex = /(?:Câu|Answer)?[^\S\r\n]*(\d+)[^\S\r\n]*[:.\-]?[^\S\r\n]*([A-D])(?=[^\S\r\n]*$|\s|[,;|/])/gi;
    let am;
    while ((am = ansRegex.exec(text)) !== null) {
      const qNum = parseInt(am[1], 10);
      if (!answerMap.has(qNum)) {
        answerMap.set(qNum, am[2].toUpperCase());
      }
    }

    // Grid / table parsing:
    // Check for pairs of lines where first line has numbers and second line has letters A-D
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (let li = 0; li < lines.length - 1; li++) {
      const numTokens = lines[li].split(/[\s|\t,]+/).filter(Boolean);
      const ansTokens = lines[li + 1].split(/[\s|\t,]+/).filter(Boolean);
      
      const cleanNums = numTokens.filter(t => /^\d+$/.test(t)).map(t => parseInt(t, 10));
      const cleanAns = ansTokens.filter(t => /^[A-D]$/i.test(t)).map(t => t.toUpperCase());
      
      if (cleanNums.length >= 2 && cleanNums.length === cleanAns.length) {
        for (let k = 0; k < cleanNums.length; k++) {
          if (!answerMap.has(cleanNums[k])) {
            answerMap.set(cleanNums[k], cleanAns[k]);
          }
        }
      }
    }

    // True/False Matches: "1. a) Đ b) S c) Đ d) S" or "Câu 1: a-Đ, b-S, c-Đ, d-S"
    const tfQuestionRegex = /(?:Câu|Answer)?\s*(\d+)\s*[:.\-]?\s*((?:[a-d]\s*[:.)\-]?\s*(?:Đ|S|Đúng|Sai|T|F|True|False)\s*[,;]?\s*){2,4})/gi;
    let tfm;
    while ((tfm = tfQuestionRegex.exec(text)) !== null) {
      const qNum = parseInt(tfm[1], 10);
      const tfString = tfm[2];
      const tfParts = /(?:^|\s)([a-d])\s*[:.)\-]?\s*(Đ|S|Đúng|Sai|T|F|True|False)/gi;
      const tfAnswers: Record<string, boolean> = {};
      let partMatch;
      while ((partMatch = tfParts.exec(tfString)) !== null) {
        const label = partMatch[1].toLowerCase();
        const val = partMatch[2].toUpperCase();
        tfAnswers[label] = val.startsWith('Đ') || val === 'T' || val === 'TRUE';
      }
      answerMap.set(qNum, tfAnswers);
    }

    if (answerMap.size === 0) {
      const singleMatch = /(?:^|\s)(?:Đáp\s*án(?:\s*đúng)?\s*[:]?|Answer\s*[:]?|Chọn\s*[:]?|=>|->)\s*([A-D])\b/i.exec(text);
      if (singleMatch) {
        answerMap.set(1, singleMatch[1].toUpperCase());
      }
    }
    
    return answerMap;
  }

  private findBestSequence(options: { label: string; index: number; length: number; isNewLine: boolean }[], isTrueFalse: boolean) {
    let best: { label: string; index: number; length: number; isNewLine: boolean }[] = [];
    const startChar = isTrueFalse ? 'a' : 'A';
    
    // First try starting with 'A'/'a'
    for (let i = 0; i < options.length; i++) {
      if (options[i].label === startChar) {
        const seq = [options[i]];
        for (let j = i + 1; j < options.length; j++) {
          const currentLabel = options[j].label;
          const lastLabel = seq[seq.length - 1].label;
          if (currentLabel > lastLabel) {
            seq.push(options[j]);
          }
        }
        if (seq.length > best.length) {
          best = seq;
        }
      }
    }
    
    // If no sequence starting with 'A'/'a' was found, try from any option
    if (best.length < 2) {
      for (let i = 0; i < options.length; i++) {
        const seq = [options[i]];
        for (let j = i + 1; j < options.length; j++) {
          const currentLabel = options[j].label;
          const lastLabel = seq[seq.length - 1].label;
          if (currentLabel > lastLabel) {
            seq.push(options[j]);
          }
        }
        if (seq.length > best.length) {
          best = seq;
        }
      }
    }
    
    return best;
  }

  private cleanDocumentNoise(rawText: string): string {
    return rawText
      .replace(/(?:^|\n)\s*(?:Trang\s*\d+\s*(?:\/\s*\d+)?|\bPage\s*\d+\b|Mã\s*đề(?:\s*thi)?\s*[:.\-]?\s*\d+|Họ\s*(?:và|&)?\s*tên(?:\s*thí\s*sinh)?\s*[:.\-]?|Số\s*báo\s*danh\s*[:.\-]?|SBD\s*[:.\-]?)[^\n]*/gi, '')
      .replace(/(?:^|\n)\s*(?:\[!b:\$?)?(?:PHẦN|Phần|PART|Part)\s*(?:I{1,3}|IV|V|[1-3])\b[^\n]*/gi, '')
      .trim();
  }

  private cleanOptionTags(rawText: string): string {
    // Temporarily mask markdown images and HTML <img> so URL/data-URI underscores aren't stripped
    const imageTokens: string[] = [];
    const masked = rawText.replace(
      /!\[(?:\\[\s\S]|[^\]])*\]\([^)\s]+\)|<img\b[^>]*>/gi,
      (m) => {
        const idx = imageTokens.length;
        imageTokens.push(m);
        return `@@PARSERIMG${idx}@@`;
      }
    );

    const cleaned = masked
      .replace(/(?:^|\n)\s*(?:\[!b:\$?)?(?:PHẦN|Phần|PART|Part)\s*(?:I{1,3}|IV|V|[1-3])\b[^\n]*/gi, '')
      .replace(/\\?\[\/?(?:RED|UNDERLINE|BOLD)\\?\]/gi, '')
      .replace(/<\/?(?:span|font|u|ins|b|strong)[^>]*>/gi, '')
      .replace(/^\s*[\*●]\s*/, '')
      .replace(/__+/g, '')
      .replace(/\\([._[\]])/g, '$1')
      .trim();

    return cleaned.replace(/@@PARSERIMG(\d+)@@/g, (_m, i) => imageTokens[Number(i)] || '');
  }

  private parseQuestionBlock(
    text: string, 
    qNum: number, 
    globalAnswers: Map<number, string | Record<string, boolean>>,
    sectionType?: 'multiple_choice' | 'true_false_multiple' | 'short_answer',
    sectionTitle?: string
  ): Question | null {
    let questionText = text;
    
    // Normalize Unicode NFC
    text = text.normalize('NFC');
    // Extract inline answer if present (e.g. "Đáp án: A", "Đáp án đúng: B", "Chọn B.")
    let inlineAnswer = '';
    const inlineAnsMatch = /(?:^|\s)(?:Đáp\s*án(?:\s*đúng)?\s*[:]?|Answer\s*[:]?|Chọn\s*[:]?|=>|->)\s*([A-D])(?=[^\S\r\n]*$|\s|[\.\,\;\:\)])/i.exec(text);
    if (inlineAnsMatch) {
      inlineAnswer = inlineAnsMatch[1].toUpperCase();
      text = text.substring(0, inlineAnsMatch.index) + ' ' + text.substring(inlineAnsMatch.index + inlineAnsMatch[0].length);
    }

    interface FoundOption {
      label: string;
      index: number;
      length: number;
      isNewLine: boolean;
    }

    const isTrueFalse = sectionType === 'true_false_multiple' ||
                       /cho các phát biểu|đúng\s*\/\s*sai|true\s*\/\s*false/i.test(questionText) || 
                       (globalAnswers.has(qNum) && typeof globalAnswers.get(qNum) === 'object');
    
    const optionPrefixPattern = `(?:\\[(?:RED|UNDERLINE|BOLD)\\]|<(?:span|font|u|ins|b|strong)[^>]*>|\\*|●|\\([xX*]\\)|\\[[xX*]\\]|[_*]+)?\\s*`;

    const foundOptions: FoundOption[] = [];
    
    // Look for options starting on a new line (prefer newlines to prevent false matches in question text)
    const newLineRegex = isTrueFalse 
      ? new RegExp(`(?:^|\\n)\\s*${optionPrefixPattern}(?:\\(?([a-d])[\\.:\\)\\-．\\*]|[[(]([a-d])[\\)\\]]|([a-d])\\\\\\.)\\s*`, 'gi')
      : new RegExp(`(?:^|\\n)\\s*${optionPrefixPattern}(?:\\(?([A-D])[\\.:\\)\\-．\\*]|[[(]([A-D])[\\)\\]]|([A-D])\\\\\\.)\\s*`, 'gi');
    let nlMatch;
    while ((nlMatch = newLineRegex.exec(text)) !== null) {
      const label = nlMatch[1] || nlMatch[2] || nlMatch[3];
      foundOptions.push({
        label: isTrueFalse ? label.toLowerCase() : label.toUpperCase(),
        index: nlMatch.index,
        length: nlMatch[0].length,
        isNewLine: true
      });
    }

    // Check if new-line options form a valid sequence
    let bestSequence = this.findBestSequence(foundOptions, isTrueFalse);

    // If new-line options did NOT find all 4 options, fall back to inline option regex
    if (bestSequence.length < 4) {
      const inlineRegex = isTrueFalse 
        ? new RegExp(`(?:^|\\s+|@@LTVIMG\\d+END@@)${optionPrefixPattern}(?:\\(?([a-d])[\\.:\\)\\-．\\*]|[[(]([a-d])[\\)\\]]|([a-d])\\\\\\.)\\s*`, 'gi')
        : new RegExp(`(?:^|\\s+|@@LTVIMG\\d+END@@)${optionPrefixPattern}(?:\\(?([A-D])[\\.:\\)\\-．\\*]|[[(]([A-D])[\\)\\]]|([A-D])\\\\\\.)\\s*`, 'gi');
      let inlineMatch;
      while ((inlineMatch = inlineRegex.exec(text)) !== null) {
        let matchIndex = inlineMatch.index;
        let matchLength = inlineMatch[0].length;
        const imgPrefixMatch = /^@@LTVIMG\d+END@@/.exec(inlineMatch[0]);
        if (imgPrefixMatch) {
          matchIndex += imgPrefixMatch[0].length;
          matchLength -= imgPrefixMatch[0].length;
        }
        if (!foundOptions.some(o => o.index === matchIndex)) {
          const label = inlineMatch[1] || inlineMatch[2] || inlineMatch[3];
          foundOptions.push({
            label: isTrueFalse ? label.toLowerCase() : label.toUpperCase(),
            index: matchIndex,
            length: matchLength,
            isNewLine: false
          });
        }
      }
      foundOptions.sort((a, b) => a.index - b.index);
      const inlineSequence = this.findBestSequence(foundOptions, isTrueFalse);
      if (inlineSequence.length > bestSequence.length) {
        bestSequence = inlineSequence;
      }
    }

    const options: Option[] = [];
    const markedCorrectLabels: string[] = [];
    
    if (bestSequence.length > 0) {
      // We found a sequence of options!
      const firstOptIndex = bestSequence[0].index;
      // The text before the first option is the question
      questionText = this.cleanDocumentNoise(
        this.cleanOptionTags(text.substring(0, firstOptIndex))
      );
      
      for (let i = 0; i < bestSequence.length; i++) {
        const opt = bestSequence[i];
        const nextOpt = bestSequence[i + 1];
        const contentStart = opt.index + opt.length;
        const contentEnd = nextOpt ? nextOpt.index : text.length;
        const rawOptSegment = text.substring(opt.index, contentEnd);
        let optContent = text.substring(contentStart, contentEnd).trim();

        // If this is the last option, check for trailing explanation
        if (i === bestSequence.length - 1) {
          const expMatch = /(?:^|\n)\s*(?:Lời\s*giải(?:\s*chi\s*tiết)?|Hướng\s*dẫn\s*giải|Giải\s*thích|Giải)\s*[:.\-]?\s*([\s\S]*)$/i.exec(optContent);
          if (expMatch) {
            const explanationContent = expMatch[1];
            optContent = optContent.substring(0, expMatch.index).trim();
            const expAnsMatch = /(?:Đáp\s*án(?:\s*đúng)?\s*[:]?|Chọn\s*[:]?|Answer\s*[:]?|=>|->)\s*([A-D])\b/i.exec(explanationContent);
            if (expAnsMatch) {
              inlineAnswer = expAnsMatch[1].toUpperCase();
            }
          }
        }
        
        // Detect if this option is formatted as correct (RED, UNDERLINE, BOLD, Asterisk)
        const isRed = /\[RED\]|<(?:span|font)[^>]*style="[^"]*color:\s*(?:red|#ff[0-9a-f]{4}|rgb\(\s*(?:2[0-5][0-9]|1[6-9][0-9])\s*,\s*[0-9]{1,2}\s*,\s*[0-9]{1,2}\s*\))[^"]*"|<font[^>]*color="red"|<span[^>]*class="[^"]*text-red[^"]*"/i.test(rawOptSegment);
        const isUnderline = /\[UNDERLINE\]|<u\b|<ins\b|text-decoration:\s*underline/i.test(rawOptSegment);
        const isBold = /\[BOLD\]|<b\b|<strong\b/i.test(rawOptSegment);
        const hasAsteriskInPrefix = /(?:^|\s)[\*●]|\*\s*[A-D]|\([xX*]\)|\[[xX*]\]|[A-D]\s*\*|\*\s*$/i.test(text.substring(opt.index, contentStart));
        const hasAsteriskInStart = /^\s*[\*●]\s*/.test(optContent);
        const hasAsterisk = hasAsteriskInPrefix || hasAsteriskInStart;

        if (isRed || isUnderline || isBold || hasAsterisk) {
          markedCorrectLabels.push(opt.label);
        }

        // Clean any tags from option content and remove redundant leading labels like "A. " or "* "
        optContent = this.cleanOptionTags(optContent)
          .replace(/^(?:[A-D]|[a-d])[.:)\-]\s+/, '')
          .replace(/^[\*●]\s*/, '')
          .trim();
        
        options.push({
          id: this.generateId('opt'),
          label: opt.label,
          content: this.parseContentBlocks(this.unmaskImages(optContent))
        });
      }
    } else {
      questionText = this.cleanDocumentNoise(
        this.cleanOptionTags(text)
      );
    }

    // If question text is empty after stripping options, it's invalid
    if (!questionText) {
      return null;
    }

    const gAns = globalAnswers.get(qNum);
    const finalAnswerLabel = inlineAnswer || (typeof gAns === 'string' ? gAns : '');
    const correctAnswerIds: string[] = [];
    
    if (isTrueFalse) {
      if (typeof gAns === 'object') {
        for (const opt of options) {
          if (gAns[opt.label]) {
            correctAnswerIds.push(opt.id);
          }
        }
      } else if (markedCorrectLabels.length > 0) {
        for (const opt of options) {
          if (markedCorrectLabels.includes(opt.label)) {
            correctAnswerIds.push(opt.id);
          }
        }
      }
    } else {
      if (finalAnswerLabel) {
        const opt = options.find(o => o.label === finalAnswerLabel);
        if (opt) {
          correctAnswerIds.push(opt.id);
        }
      } else if (markedCorrectLabels.length > 0) {
        for (const markedLabel of markedCorrectLabels) {
          const opt = options.find(o => o.label === markedLabel);
          if (opt && !correctAnswerIds.includes(opt.id)) {
            correctAnswerIds.push(opt.id);
          }
        }
      }
    }

    let status: ValidationStatus = 'valid';
    const warnings: string[] = [];
    const errors: string[] = [];

    if (options.length === 0) {
      status = 'error';
      errors.push('Không nhận diện được đáp án (A, B, C, D)');
    } else if (options.length < 4) {
      status = 'warning';
      warnings.push(`Chỉ nhận diện được ${options.length} đáp án`);
    }

    if (correctAnswerIds.length === 0 && options.length > 0) {
      status = 'warning';
      warnings.push('Chưa xác định được đáp án đúng');
    }

    return {
      id: this.generateId('q'),
      type: isTrueFalse ? 'true_false_multiple' : 'multiple_choice',
      sectionTitle,
      question: this.parseContentBlocks(this.unmaskImages(questionText)),
      options: options,
      correctAnswer: correctAnswerIds,
      points: this.config.defaultPoints || 0.25,
      validation: {
        status,
        warnings,
      }
    };
  }

  private sanitizeImageUrl(url: string): string {
    const trimmed = url.trim();
    if (trimmed.startsWith('data:image/')) {
      // Unescape markdown-escaped characters (e.g. \+ \_ \/) introduced by docx-to-markdown converters
      return trimmed.replace(/\\([+_\/\-=])/g, '$1');
    }
    return trimmed;
  }

  private parseContentBlocks(text: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const imageRegex = /!\[((?:\\[\s\S]|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(<img\b[^>]*>)/gi;
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textPart = text.substring(lastIndex, match.index).trim();
        if (textPart) {
          blocks.push({ type: 'text', content: textPart });
        }
      }

      let rawUrl = '';
      let rawAlt = 'image';

      if (match[3]) {
        const imgTag = match[3];
        const srcMatch = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(imgTag);
        const altMatch = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(imgTag);
        rawUrl = srcMatch ? (srcMatch[1] || srcMatch[2] || srcMatch[3] || '') : '';
        rawAlt = altMatch ? (altMatch[1] || altMatch[2] || altMatch[3] || 'image') : 'image';
      } else {
        rawAlt = (match[1] || 'image').replace(/\s+/g, ' ').trim() || 'image';
        rawUrl = match[2] || '';
      }

      const url = this.sanitizeImageUrl(rawUrl);
      if (url) {
        blocks.push({
          type: 'image',
          content: url,
          alt: rawAlt,
        });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const textPart = text.substring(lastIndex).trim();
      if (textPart) {
        blocks.push({ type: 'text', content: textPart });
      }
    }

    if (blocks.length === 0) {
      return [{ type: 'text', content: text }];
    }

    return blocks;
  }
}
