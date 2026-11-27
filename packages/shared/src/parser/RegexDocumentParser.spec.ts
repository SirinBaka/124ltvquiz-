import { RegexDocumentParser } from './RegexDocumentParser';
import { describe, it, expect } from 'vitest';

describe('RegexDocumentParser', () => {
  it('parses a basic multiple choice question', () => {
    const parser = new RegexDocumentParser();
    const content = `
Câu 1. Hàm số nào sau đây đồng biến trên R?
A. y = x²
B. y = 2x + 1
C. y = -x + 3
D. y = 1/x
    `;

    const questions = parser.parse(content);
    
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('multiple_choice');
    expect(questions[0].question[0].content).toBe('Hàm số nào sau đây đồng biến trên R?');
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[0].content[0].content).toBe('y = x²');
    expect(questions[0].validation.status).toBe('valid');
  });

  it('flags warning when missing an option', () => {
    const parser = new RegexDocumentParser();
    const content = `
Câu 2. Missing option C?
A. Option A
B. Option B
D. Option D
    `;

    const questions = parser.parse(content);
    
    expect(questions).toHaveLength(1);
    expect(questions[0].validation.status).toBe('warning');
    expect(questions[0].options).toHaveLength(3);
    expect(questions[0].validation.warnings[0]).toContain('Expected 4 options, found 3');
  });
});
