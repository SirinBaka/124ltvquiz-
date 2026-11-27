import { useEffect } from 'react';
import { Flame, Trophy, X } from 'lucide-react';
import { STREAK_THRESHOLD, getStreakMilestoneMessage } from '../lib/streakHelper';

type StreakBadgeProps = {
  currentStreak: number;
  maxStreak: number;
};

export function StreakBadge({ currentStreak, maxStreak }: StreakBadgeProps) {
  const isThresholdMet = currentStreak >= STREAK_THRESHOLD;

  if (currentStreak === 0) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        title={`Chuỗi đúng cao nhất: ${maxStreak}`}
      >
        <Flame size={14} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        <span className="tabular-nums">0 chuỗi</span>
      </div>
    );
  }

  if (!isThresholdMet) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        title={`Đang đạt ${currentStreak} câu đúng liên tiếp. Đạt ${STREAK_THRESHOLD} câu để ghi nhận chuỗi.`}
      >
        <Flame size={14} aria-hidden="true" className="text-amber-500" />
        <span className="tabular-nums">
          {currentStreak}/{STREAK_THRESHOLD}
        </span>
      </div>
    );
  }

  return (
    <div
      key={`streak-badge-${currentStreak}`}
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-amber-700 border border-amber-500/60 animate-scale-up transform-gpu"
      title={`Chuỗi ${currentStreak} câu đúng liên tiếp`}
    >
      <Flame size={14} aria-hidden="true" className="text-amber-200 fill-amber-200 animate-icon-heartbeat" />
      <span className="tabular-nums">{currentStreak} liên tiếp</span>
    </div>
  );
}

type StreakCelebrationPopupProps = {
  isOpen: boolean;
  streakCount: number;
  onClose: () => void;
};

function StreakCelebrationContent({
  streakCount,
  onClose,
}: {
  streakCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-milestone-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in pointer-events-auto"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-amber-500/50 p-6 text-[var(--color-text)] shadow-xl text-center animate-scale-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 w-10 h-10 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          aria-label="Đóng thông báo chuỗi câu đúng"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500">
          <Flame size={28} aria-hidden="true" className="animate-icon-heartbeat" />
        </div>

        <h3 id="streak-milestone-title" className="text-lg font-extrabold tracking-tight text-[var(--color-text)] mb-1">
          Chuỗi {streakCount} câu đúng liên tiếp
        </h3>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
          {getStreakMilestoneMessage(streakCount)}
        </p>

        <div className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-full h-1.5 overflow-hidden mb-4">
          <div className="bg-amber-500 h-full w-full rounded-full animate-apple-progress-drain transform-gpu" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transform-gpu transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
        >
          Tiếp tục làm bài
        </button>
      </div>
    </div>
  );
}

export function StreakCelebrationPopup({
  isOpen,
  streakCount,
  onClose,
}: StreakCelebrationPopupProps) {
  if (!isOpen) return null;

  return (
    <StreakCelebrationContent
      key={`streak_${streakCount}`}
      streakCount={streakCount}
      onClose={onClose}
    />
  );
}

type StreakResultCardProps = {
  maxStreak: number;
};

export function StreakResultCard({ maxStreak }: StreakResultCardProps) {
  const isMaster = maxStreak >= STREAK_THRESHOLD;

  return (
    <div
      className={`p-4 rounded-xl border ${
        isMaster
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-[var(--color-border)] bg-[var(--color-background)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isMaster
                ? 'bg-amber-700 text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            {isMaster ? <Flame size={20} aria-hidden="true" /> : <Trophy size={18} aria-hidden="true" />}
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Chuỗi đúng dài nhất
            </div>
            <div className="text-sm font-bold text-[var(--color-text)] flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{maxStreak} câu liên tiếp</span>
              {isMaster && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Đạt mốc {STREAK_THRESHOLD}+
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {isMaster ? 'Phong độ ổn định' : `Mục tiêu: ${STREAK_THRESHOLD} câu`}
          </span>
        </div>
      </div>
    </div>
  );
}
