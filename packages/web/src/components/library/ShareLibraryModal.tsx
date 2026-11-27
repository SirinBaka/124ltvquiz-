import React, { useState } from 'react';
import { Share2, Copy, Check, Link as LinkIcon, X, Clock, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { LibraryStorageService } from '../../services/libraryStorageService';
import type { LibraryResource } from '@ltvquiz/shared';

interface ShareLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: LibraryResource | null;
  onUpdated?: () => void;
}

export const ShareLibraryModal: React.FC<ShareLibraryModalProps> = ({
  isOpen,
  onClose,
  resource,
  onUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [expiryOption, setExpiryOption] = useState<'never' | '1d' | '7d' | '30d'>('never');

  if (!isOpen || !resource) return null;

  const existingShare = LibraryStorageService.getActiveShareForResource(resource.id);

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/share/library/${token}`;
  };

  const handleCreateShare = () => {
    let expiresAt: string | null = null;
    const now = Date.now();
    if (expiryOption === '1d') {
      expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
    } else if (expiryOption === '7d') {
      expiresAt = new Date(now + 7 * 24 * 3600 * 1000).toISOString();
    } else if (expiryOption === '30d') {
      expiresAt = new Date(now + 30 * 24 * 3600 * 1000).toISOString();
    }

    LibraryStorageService.createShareLink(resource.id, permission, expiresAt);
    if (onUpdated) onUpdated();
  };

  const handleRevokeShare = (token: string) => {
    LibraryStorageService.revokeShareLink(token);
    if (onUpdated) onUpdated();
  };

  const handleCopyLink = (token: string) => {
    const url = getShareUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex modal-scroll justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--color-text)]">Chia sẻ tài nguyên</h3>
              <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-xs">
                {resource.displayName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {existingShare ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Liên kết chia sẻ đang hoạt động
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-medium">
                  {existingShare.permission === 'viewer' ? 'Chỉ xem' : 'Chỉnh sửa'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(existingShare.token)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] select-all"
                />
                <Button
                  variant="primary"
                  onClick={() => handleCopyLink(existingShare.token)}
                  className="text-xs h-8 px-3 shrink-0 gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </Button>
              </div>

              {existingShare.expiresAt && (
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)] mt-2">
                  <Clock size={12} />
                  <span>Hết hạn lúc: {new Date(existingShare.expiresAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleRevokeShare(existingShare.token)}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={14} />
                <span>Thu hồi liên kết này</span>
              </button>

              <Button variant="secondary" onClick={onClose} className="text-xs h-9 px-4">
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Tạo liên kết bảo mật có mã băm ngẫu nhiên để chia sẻ tài nguyên này cho học sinh hoặc đồng nghiệp. Người nhận liên kết có thể xem nội dung mà không cần quyền chỉnh sửa.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                Quyền truy cập
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as any)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="viewer">Chỉ xem (Viewer - An toàn, không lộ đáp án)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                Thời hạn liên kết
              </label>
              <select
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value as any)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="never">Không giới hạn thời gian</option>
                <option value="1d">Hết hạn sau 24 giờ (1 ngày)</option>
                <option value="7d">Hết hạn sau 7 ngày</option>
                <option value="30d">Hết hạn sau 30 ngày</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
              <Button variant="secondary" type="button" onClick={onClose} className="text-xs h-9 px-4">
                Hủy
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleCreateShare}
                className="text-xs h-9 px-4 gap-1.5"
              >
                <LinkIcon size={14} />
                <span>Tạo liên kết chia sẻ</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
