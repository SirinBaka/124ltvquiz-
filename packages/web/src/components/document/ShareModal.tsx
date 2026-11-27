import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import { Button } from '../Button';
import { QrCodeView } from '../QrCodeView';
import { ShareLinkBanner } from '../ShareLinkBanner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  shareUrl: string;
  sourceType?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  documentName,
  shareUrl,
  sourceType = 'pdf'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLink = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Chia sẻ tài liệu</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Tạo liên kết xem công khai</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Doc details */}
          <div className="p-3.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="font-semibold text-sm text-[var(--color-text)] truncate">{documentName}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Định dạng: <span className="uppercase font-medium">{sourceType}</span> • Trạng thái: Sẵn sàng
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <ShieldCheck size={13} /> Công khai
            </span>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Liên kết xem tài liệu (Toàn màn hình)
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={shareUrl}
                className="flex-1 h-10 px-3.5 text-xs font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] select-all focus:outline-none focus:border-[var(--color-primary)]"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button 
                variant="primary" 
                className="h-10 px-4 text-xs font-semibold gap-1.5 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-white" /> Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Link Banner with Logo and 'A4 LTVQuiz - Nền tảng luyện thi cho học sinh' */}
          <ShareLinkBanner
            url={shareUrl}
            title={documentName}
            subtitle={`Tài liệu ${sourceType.toUpperCase()} trực tuyến`}
          />

          {/* QR Code Section */}
          <QrCodeView 
            url={shareUrl} 
            title={documentName} 
            defaultFileName="tai-lieu" 
            description="Quét mã QR bằng điện thoại để xem trực tiếp tài liệu này"
          />

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
            <Button 
              variant="secondary" 
              className="h-10 text-xs gap-1.5 justify-center"
              onClick={handleOpenLink}
            >
              <ExternalLink size={14} /> Mở liên kết ngay
            </Button>
            <Button 
              variant="secondary" 
              className="h-10 text-xs justify-center"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>

          {/* Note */}
          <p className="text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-primary)]/5 p-3 rounded-lg border border-[var(--color-primary)]/15">
            💡 <strong>Mẹo:</strong> Bất kỳ ai có liên kết này đều có thể xem toàn bộ nội dung tài liệu ở chế độ toàn màn hình sắc nét và theo dõi các câu hỏi đã được hệ thống bóc tách mà không cần đăng nhập.
          </p>
        </div>
      </div>
    </div>
  );
};
