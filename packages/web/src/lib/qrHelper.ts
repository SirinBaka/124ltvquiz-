import QRCode from 'qrcode';

export const BRAND_TAGLINE = 'A4 LTVQuiz - Nền tảng luyện thi cho học sinh';

export type QrCodeOptions = {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
};

export function formatShareText(title?: string, url?: string): string {
  const lines: string[] = [BRAND_TAGLINE];
  if (title && title.trim()) {
    lines.push(`📖 ${title.trim()}`);
  }
  if (url && url.trim()) {
    lines.push(`🔗 Liên kết: ${url.trim()}`);
  }
  return lines.join('\n');
}

export async function generateQrCodeDataUrl(
  text: string,
  options?: QrCodeOptions
): Promise<string> {
  if (!text || text.trim() === '') {
    throw new Error('Text to encode in QR code cannot be empty');
  }

  return QRCode.toDataURL(text, {
    width: options?.width ?? 280,
    margin: options?.margin ?? 2,
    color: {
      dark: options?.color?.dark ?? '#000000',
      light: options?.color?.light ?? '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

export function formatQrFileName(title: string, fallback: string = 'qr-code'): string {
  const base = title.trim() || fallback;
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  return `${normalized || fallback}_QR.png`;
}

export function downloadQrCodeImage(dataUrl: string, fileName: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
