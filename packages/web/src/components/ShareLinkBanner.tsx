import React, { useState } from 'react';
import { Share2, Copy, Check, Download, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { BRAND_TAGLINE, formatShareText } from '../lib/qrHelper';

export type ShareLinkBannerProps = {
  url: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

export const ShareLinkBanner: React.FC<ShareLinkBannerProps> = ({
  url,
  title = '',
  subtitle,
  className = '',
}) => {
  const [copiedWithBanner, setCopiedWithBanner] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [downloadingBanner, setDownloadingBanner] = useState<boolean>(false);

  const displayTitle = title.trim() || 'Bài thi & Tài liệu học tập';
  const displaySubtitle = subtitle || 'Học sinh có thể click để làm bài hoặc xem trực tiếp';
  const hostName = typeof window !== 'undefined' ? window.location.host : 'ltvquiz.vn';

  const handleCopyWithBanner = async () => {
    const textToCopy = formatShareText(title, url);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedWithBanner(true);
      setTimeout(() => setCopiedWithBanner(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedWithBanner(true);
      setTimeout(() => setCopiedWithBanner(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    const shareData = {
      title: BRAND_TAGLINE,
      text: `${title ? `${title} - ` : ''}${BRAND_TAGLINE}`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyWithBanner();
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      setIsSharing(false);
      handleCopyWithBanner();
    }
  };

  const handleDownloadBannerImage = () => {
    if (typeof window === 'undefined') return;
    setDownloadingBanner(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloadingBanner(false);
      return;
    }

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#09090b');
    bgGradient.addColorStop(1, '#18181b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative glow
    const glow = ctx.createRadialGradient(250, 315, 50, 250, 315, 350);
    glow.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 630);

    // Border line around card
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 570);

    // Load web logo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/a4-logo.png';

    const renderTextAndSave = () => {
      // Draw Logo
      const logoSize = 180;
      const logoX = 100;
      const logoY = 225;

      // Logo container box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20, 28);
      ctx.fill();

      if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      }

      // Brand Title: A4 LTVQuiz - Nền tảng luyện thi cho học sinh
      const textX = 340;
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('NỀN TẢNG LUYỆN THI THÔNG MINH', textX, 190);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText('A4 LTVQuiz - Nền tảng luyện thi cho học sinh', textX, 250);

      // Specific Resource Title
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 32px Inter, system-ui, sans-serif';
      const truncatedTitle = displayTitle.length > 40 ? `${displayTitle.slice(0, 40)}...` : displayTitle;
      ctx.fillText(truncatedTitle, textX, 320);

      // Domain badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(textX, 370, 420, 56, 16);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px Inter, system-ui, sans-serif';
      ctx.fillText(`🌐 ${hostName} • Làm bài & Xem trực tuyến`, textX + 24, 406);

      // Footer callout
      ctx.fillStyle = '#64748b';
      ctx.font = '400 20px Inter, system-ui, sans-serif';
      ctx.fillText('Chia sẻ liên kết trực tuyến • Học tập mọi lúc mọi nơi', textX, 480);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'A4_LTVQuiz_Share_Banner.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setDownloadingBanner(false);
    };

    img.onload = renderTextAndSave;
    img.onerror = renderTextAndSave;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500 animate-pulse" />
          <span>Thẻ xem trước hiển thị dưới liên kết (Share Banner)</span>
        </label>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Tự động đính kèm
        </span>
      </div>

      {/* The Banner Container */}
      <div className="p-4 rounded-2xl border-2 border-blue-500/20 bg-gradient-to-r from-blue-50/60 via-[var(--color-background)] to-indigo-50/40 dark:from-blue-950/20 dark:via-[var(--color-background)] dark:to-indigo-950/20 shadow-sm transition-all hover:border-blue-500/40">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Web Logo */}
          <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center overflow-hidden group">
            <img
              src="/a4-logo.png"
              alt="A4 LTVQuiz Logo"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                // Fallback to favicon if logo path fails
                (e.target as HTMLImageElement).src = '/favicon.svg';
              }}
            />
          </div>

          {/* Banner Text Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-[var(--color-text)] tracking-tight">
                {BRAND_TAGLINE}
              </h4>
            </div>

            <p className="text-xs font-medium text-[var(--color-primary)] mt-0.5 truncate">
              {displayTitle}
            </p>

            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--color-text-secondary)]">
              <span className="font-mono bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                {hostName}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate">{displaySubtitle}</span>
            </div>
          </div>
        </div>

        {/* Action buttons inside the banner */}
        <div className="mt-3.5 pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs font-medium gap-1.5"
              onClick={handleDownloadBannerImage}
              disabled={downloadingBanner}
              title="Tải thẻ ảnh banner để đăng bài hoặc in ấn"
            >
              <Download size={13} />
              <span className="hidden xs:inline">Tải ảnh Banner</span>
            </Button>

            <Button
              variant="secondary"
              className="h-8 px-2.5 text-xs font-semibold gap-1.5"
              onClick={handleCopyWithBanner}
              title="Sao chép nội dung liên kết chia sẻ"
            >
              {copiedWithBanner ? (
                <>
                  <Check size={13} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Sao chép</span>
                </>
              )}
            </Button>

            <Button
              variant="primary"
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm"
              onClick={handleNativeShare}
              disabled={isSharing}
              title="Mở bảng chia sẻ trực tiếp"
            >
              <Share2 size={13} />
              <span>Chia sẻ</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
