import { describe, it, expect } from 'vitest';
import {
  isAntiCheatEnabled,
  getMaxViolations,
  isViolationLimitExceeded,
  getViolationRemaining,
  formatViolationAlert,
  DEFAULT_MAX_VIOLATIONS,
} from './antiCheatHelper';
import type { QuizSettings } from '@ltvquiz/shared';

describe('antiCheatHelper', () => {
  describe('isAntiCheatEnabled', () => {
    it('defaults to true when settings are missing or enableAntiCheat is undefined', () => {
      expect(isAntiCheatEnabled(undefined)).toBe(true);
      expect(isAntiCheatEnabled({} as QuizSettings)).toBe(true);
      expect(isAntiCheatEnabled({ enableAntiCheat: true } as QuizSettings)).toBe(true);
    });

    it('returns false when explicitly disabled', () => {
      expect(isAntiCheatEnabled({ enableAntiCheat: false } as QuizSettings)).toBe(false);
    });
  });

  describe('getMaxViolations', () => {
    it('returns default 3 when not specified', () => {
      expect(getMaxViolations(undefined)).toBe(DEFAULT_MAX_VIOLATIONS);
      expect(getMaxViolations({} as QuizSettings)).toBe(3);
    });

    it('returns custom max violations when configured', () => {
      expect(getMaxViolations({ maxViolations: 5 } as QuizSettings)).toBe(5);
      expect(getMaxViolations({ maxViolations: 1 } as QuizSettings)).toBe(1);
    });
  });

  describe('isViolationLimitExceeded', () => {
    it('returns false when violations are strictly below limit', () => {
      expect(isViolationLimitExceeded(0, 3)).toBe(false);
      expect(isViolationLimitExceeded(1, 3)).toBe(false);
      expect(isViolationLimitExceeded(2, 3)).toBe(false);
    });

    it('returns true when violations reach or exceed limit', () => {
      expect(isViolationLimitExceeded(3, 3)).toBe(true);
      expect(isViolationLimitExceeded(4, 3)).toBe(true);
    });
  });

  describe('getViolationRemaining', () => {
    it('calculates remaining chances accurately without dropping below 0', () => {
      expect(getViolationRemaining(1, 3)).toBe(2);
      expect(getViolationRemaining(2, 3)).toBe(1);
      expect(getViolationRemaining(3, 3)).toBe(0);
      expect(getViolationRemaining(4, 3)).toBe(0);
    });
  });

  describe('formatViolationAlert', () => {
    it('formats warning when limit is not exceeded', () => {
      const alert = formatViolationAlert(1, 3);
      expect(alert.isDisqualified).toBe(false);
      expect(alert.title).toContain('CẢNH BÁO GIAN LẬN (Lần 1/3)');
      expect(alert.description).toContain('Còn lại 2 lần nhắc nhở');
    });

    it('formats disqualification/auto-submit when limit is reached', () => {
      const alert = formatViolationAlert(3, 3);
      expect(alert.isDisqualified).toBe(true);
      expect(alert.title).toContain('VI PHẠM QUÁ SỐ LẦN QUY ĐỊNH');
      expect(alert.description).toContain('tự động thu bài');
    });
  });
});
