import type { QuizSettings } from '@ltvquiz/shared';

export const DEFAULT_MAX_VIOLATIONS = 3;

export function isAntiCheatEnabled(settings?: QuizSettings): boolean {
  if (!settings) return true;
  return settings.enableAntiCheat !== false;
}

export function getMaxViolations(settings?: QuizSettings): number {
  if (!settings || typeof settings.maxViolations !== 'number' || settings.maxViolations < 1) {
    return DEFAULT_MAX_VIOLATIONS;
  }
  return settings.maxViolations;
}

export function isViolationLimitExceeded(violationCount: number, maxViolations: number): boolean {
  return violationCount >= maxViolations;
}

export function getViolationRemaining(violationCount: number, maxViolations: number): number {
  return Math.max(0, maxViolations - violationCount);
}

export interface AntiCheatAlertInfo {
  title: string;
  description: string;
  isDisqualified: boolean;
}

export function formatViolationAlert(violationCount: number, maxViolations: number): AntiCheatAlertInfo {
  const isDisqualified = isViolationLimitExceeded(violationCount, maxViolations);
  if (isDisqualified) {
    return {
      title: 'VI PHẠM QUÁ SỐ LẦN QUY ĐỊNH',
      description: `Bạn đã rời khỏi phòng thi hoặc chuyển ứng dụng ${violationCount}/${maxViolations} lần. Hệ thống tự động thu bài thi và lưu lại số lần vi phạm.`,
      isDisqualified: true,
    };
  }

  const remaining = getViolationRemaining(violationCount, maxViolations);
  return {
    title: `CẢNH BÁO GIAN LẬN (Lần ${violationCount}/${maxViolations})`,
    description: `Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài (chuyển tab, thu nhỏ cửa sổ hoặc mở ứng dụng khác). Còn lại ${remaining} lần nhắc nhở trước khi bị tự động thu bài!`,
    isDisqualified: false,
  };
}
