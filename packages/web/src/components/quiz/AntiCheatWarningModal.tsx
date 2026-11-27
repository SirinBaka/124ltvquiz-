import { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { formatViolationAlert, isViolationLimitExceeded } from '../../lib/antiCheatHelper';

interface AntiCheatWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  maxViolations: number;
  onDismiss: () => void;
}

export function AntiCheatWarningModal({
  isOpen,
  violationCount,
  maxViolations,
  onDismiss,
}: AntiCheatWarningModalProps) {
  const isDisqualified = isViolationLimitExceeded(violationCount, maxViolations);

  useEffect(() => {
    if (!isOpen || isDisqualified) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDisqualified, onDismiss]);

  if (!isOpen) return null;

  const alertInfo = formatViolationAlert(violationCount, maxViolations);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anticheat-modal-title"
      className="fixed inset-0 z-[100] flex modal-scroll justify-center bg-black/80 backdrop-blur-md select-none animate-fade-in"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border animate-scale-up"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: isDisqualified ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)',
        }}
      >
        {/* Header banner */}
        <div
          className={`p-6 text-center text-white ${
            isDisqualified ? 'bg-red-700' : 'bg-amber-700'
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/20 border border-white/25 mb-3">
            {isDisqualified ? (
              <ShieldAlert size={30} aria-hidden="true" className="text-white animate-icon-wiggle" />
            ) : (
              <AlertTriangle size={30} aria-hidden="true" className="text-white animate-icon-wiggle" />
            )}
          </div>
          <h2 id="anticheat-modal-title" className="text-lg sm:text-xl font-bold tracking-tight uppercase">
            {alertInfo.title}
          </h2>
          <p className="text-sm text-white/95 mt-1">
            {isDisqualified
              ? 'Hệ thống bảo vệ phòng thi đã kích hoạt thu bài'
              : 'Tạm dừng bài thi do phát hiện thao tác rời màn hình'}
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5" style={{ color: 'var(--color-text)' }}>
          {/* Violation step indicators */}
          <div className="flex flex-wrap items-center justify-center gap-2 py-1">
            {Array.from({ length: maxViolations }).map((_, idx) => {
              const isViolated = idx < violationCount;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    isViolated
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full ${
                      isViolated ? 'bg-red-500' : 'bg-[var(--color-border)]'
                    }`}
                  />
                  <span>
                    Lần {idx + 1}
                    {isViolated ? ' (Vi phạm)' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="p-4 rounded-xl text-sm leading-relaxed border"
            style={{
              backgroundColor: isDisqualified ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: isDisqualified ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            }}
          >
            <p className="font-medium">{alertInfo.description}</p>
          </div>

          {/* Rules recap */}
          <div className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="font-semibold text-xs flex items-center gap-1.5 text-[var(--color-text)]">
              <Lock size={13} aria-hidden="true" />
              <span>Quy chế thi trực tuyến:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 leading-relaxed">
              <li>Không chuyển sang tab trình duyệt hoặc ứng dụng khác.</li>
              <li>Không mở cửa sổ nổi, thanh công cụ hoặc phần mềm đè lên màn hình thi.</li>
              <li>Không sử dụng phím tắt chuyển cửa sổ (Alt + Tab, phím Windows).</li>
            </ul>
          </div>

          {/* Action button */}
          <div className="pt-1">
            {isDisqualified ? (
              <div
                role="status"
                aria-live="polite"
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-red-700 text-white font-semibold text-center flex items-center justify-center gap-2"
              >
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Đang nộp bài và ghi nhận kết quả...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Tôi đã hiểu và quay lại làm bài</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
