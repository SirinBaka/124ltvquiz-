import { useState, useEffect } from 'react';
import { Download, Check, QrCode as QrIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { generateQrCodeDataUrl, downloadQrCodeImage, formatQrFileName } from '../lib/qrHelper';

type QrCodeViewProps = {
  url: string;
  title?: string;
  defaultFileName?: string;
  description?: string;
};

export function QrCodeView({
  url,
  title = '',
  defaultFileName = 'ma-qr',
  description = 'Học sinh có thể quét mã bằng camera điện thoại để vào xem/làm bài ngay',
}: QrCodeViewProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    generateQrCodeDataUrl(url, { width: 320, margin: 2 })
      .then(result => {
        if (isMounted) {
          setDataUrl(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const fileName = formatQrFileName(title, defaultFileName);
    downloadQrCodeImage(dataUrl, fileName);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-center space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
        <QrIcon size={15} className="text-[var(--color-primary)]" />
        <span>Mã QR quét nhanh</span>
      </div>

      <div className="relative p-3 bg-white rounded-xl shadow-sm border border-[var(--color-border)] flex items-center justify-center min-w-[200px] min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
            <span>Đang tạo mã QR...</span>
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`Mã QR cho ${title || 'liên kết'}`}
            className="w-48 h-48 rounded-lg object-contain"
          />
        ) : (
          <div className="text-xs text-red-500">Không thể tạo mã QR</div>
        )}
      </div>

      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      <Button
        variant="primary"
        className="h-9 px-4 text-xs font-semibold gap-2 shadow-sm"
        disabled={!dataUrl || loading}
        onClick={handleDownload}
      >
        {downloaded ? (
          <>
            <Check size={14} className="text-white" />
            <span>Đã lưu ảnh QR!</span>
          </>
        ) : (
          <>
            <Download size={14} />
            <span>Lưu QR dạng ảnh (.png)</span>
          </>
        )}
      </Button>
    </div>
  );
}
