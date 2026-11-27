import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, GraduationCap } from 'lucide-react';
import { Button } from '../Button';
import { QrCodeView } from '../QrCodeView';
import { ShareLinkBanner } from '../ShareLinkBanner';

type ShareQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  quizId: string;
};

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({
  isOpen,
  onClose,
  quizTitle,
  quizId,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/test/${quizId}`;

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
        className="w-full max-w-lg bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fade-in-up max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Chia sẻ bài kiểm tra</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Gửi link hoặc mã QR cho học sinh làm bài</p>
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quiz Details Banner */}
          <div className="p-3.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="font-bold text-sm text-[var(--color-text)] truncate">{quizTitle || 'Bài kiểm tra'}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Mã đề: <span className="font-mono font-medium">{quizId}</span>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Sẵn sàng làm bài
            </span>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Đường dẫn làm bài trực tuyến
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
            title={quizTitle || 'Bài kiểm tra trực tuyến'}
            subtitle="Bài kiểm tra trực tuyến dành cho học sinh"
          />

          {/* QR Code Section */}
          <QrCodeView 
            url={shareUrl} 
            title={quizTitle || 'Bài kiểm tra'} 
            defaultFileName="bai-thi" 
            description="Học sinh quét mã QR để mở giao diện làm bài trên điện thoại hoặc máy tính bảng"
          />

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
            <Button 
              variant="secondary" 
              className="h-10 text-xs gap-1.5 justify-center"
              onClick={handleOpenLink}
            >
              <ExternalLink size={14} /> Mở bài thi thử
            </Button>
            <Button 
              variant="secondary" 
              className="h-10 text-xs justify-center"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
