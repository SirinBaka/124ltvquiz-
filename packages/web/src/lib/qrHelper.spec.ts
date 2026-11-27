import { describe, expect, it } from 'vitest';
import {
  generateQrCodeDataUrl,
  formatQrFileName,
  BRAND_TAGLINE,
  formatShareText,
} from './qrHelper';

describe('BRAND_TAGLINE', () => {
  it('has exact required branding text', () => {
    expect(BRAND_TAGLINE).toBe('A4 LTVQuiz - Nền tảng luyện thi cho học sinh');
  });
});

describe('formatShareText', () => {
  it('formats text with brand tagline, title, and url', () => {
    const formatted = formatShareText('Đề ôn thi học kỳ', 'https://ltvquiz.vn/test/123');
    expect(formatted).toBe(
      'A4 LTVQuiz - Nền tảng luyện thi cho học sinh\n📖 Đề ôn thi học kỳ\n🔗 Liên kết: https://ltvquiz.vn/test/123'
    );
  });

  it('handles empty title gracefully', () => {
    const formatted = formatShareText('', 'https://ltvquiz.vn/test/123');
    expect(formatted).toBe(
      'A4 LTVQuiz - Nền tảng luyện thi cho học sinh\n🔗 Liên kết: https://ltvquiz.vn/test/123'
    );
  });

  it('handles only brand when no args passed', () => {
    const formatted = formatShareText();
    expect(formatted).toBe('A4 LTVQuiz - Nền tảng luyện thi cho học sinh');
  });
});

describe('formatQrFileName', () => {
  it('converts title to clean, safe filename ending with .png', () => {
    const filename = formatQrFileName('Bài thi Toán 12 - Học kỳ 1');
    expect(filename).toBe('Bai_thi_Toan_12_-_Hoc_ky_1_QR.png');
  });

  it('uses fallback when title is empty', () => {
    const filename = formatQrFileName('', 'tai-lieu');
    expect(filename).toBe('tai-lieu_QR.png');
  });
});

describe('generateQrCodeDataUrl', () => {
  it('generates a valid data URL containing PNG data', async () => {
    const url = 'https://ltvquiz.edu.vn/test/quiz_123';
    const dataUrl = await generateQrCodeDataUrl(url, { width: 256 });
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('rejects or throws on empty text', async () => {
    await expect(generateQrCodeDataUrl('')).rejects.toThrow();
  });
});
