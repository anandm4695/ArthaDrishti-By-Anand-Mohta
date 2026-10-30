import { useState, useEffect, useRef, useCallback } from "react";

interface UseIdleScreensaverOptions {
  timeoutMs?: number; // Inactivity timeout in ms (default: 60,000 = 60s)
  enabled?: boolean;
}

export function useIdleScreensaver({
  timeoutMs = 60000,
  enabled = true,
}: UseIdleScreensaverOptions = {}) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;

    timerRef.current = setTimeout(() => {
      setIsScreensaverActive(true);
    }, timeoutMs);
  }, [enabled, timeoutMs]);

  const closeScreensaver = useCallback(() => {
    setIsScreensaverActive(false);
    resetTimer();
  }, [resetTimer]);

  const launchScreensaver = useCallback(() => {
    setIsScreensaverActive(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"];

    const onActivity = () => {
      // If screensaver is NOT active, reset idle countdown
      if (!isScreensaverActive) {
        resetTimer();
      }
    };

    resetTimer();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onActivity);
      });
    };
  }, [enabled, isScreensaverActive, resetTimer]);

  return {
    isScreensaverActive,
    closeScreensaver,
    launchScreensaver,
  };
}

