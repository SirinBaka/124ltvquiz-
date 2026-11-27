import { useState, useEffect, useRef, useCallback } from 'react';
import { isAntiCheatEnabled, getMaxViolations, isViolationLimitExceeded } from '../lib/antiCheatHelper';
import type { QuizSettings } from '@ltvquiz/shared';

interface UseAntiCheatOptions {
  settings?: QuizSettings;
  isActive: boolean;
  onAutoSubmit: (finalViolationCount: number) => void;
}

export function useAntiCheat({ settings, isActive, onAutoSubmit }: UseAntiCheatOptions) {
  const enabled = isAntiCheatEnabled(settings);
  const maxViolations = getMaxViolations(settings);

  const [violationCount, setViolationCount] = useState(0);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const lastViolationTimeRef = useRef<number>(0);
  const autoSubmitCalledRef = useRef<boolean>(false);

  const triggerViolation = useCallback(() => {
    if (!enabled || !isActive || autoSubmitCalledRef.current) return;

    // Debounce to prevent duplicate triggers when visibilitychange and blur fire simultaneously
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1200) {
      return;
    }
    lastViolationTimeRef.current = now;

    setViolationCount(prev => {
      const nextCount = prev + 1;
      setIsWarningOpen(true);

      if (isViolationLimitExceeded(nextCount, maxViolations)) {
        if (!autoSubmitCalledRef.current) {
          autoSubmitCalledRef.current = true;
          onAutoSubmit(nextCount);
        }
      }

      return nextCount;
    });
  }, [enabled, isActive, maxViolations, onAutoSubmit]);

  useEffect(() => {
    if (!enabled || !isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation();
      }
    };

    const handleWindowBlur = () => {
      triggerViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, isActive, triggerViolation]);

  const dismissWarning = useCallback(() => {
    if (!isViolationLimitExceeded(violationCount, maxViolations)) {
      setIsWarningOpen(false);
    }
  }, [violationCount, maxViolations]);

  return {
    enabled,
    maxViolations,
    violationCount,
    isWarningOpen,
    dismissWarning,
  };
}
