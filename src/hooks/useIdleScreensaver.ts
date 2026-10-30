import { useState, useEffect, useRef, useCallback } from "react";

interface UseIdleScreensaverOptions {
  timeoutMs?: number; // Inactivity timeout in ms (default: 30,000 = 30s)
  enabled?: boolean;
}

export function useIdleScreensaver({
  timeoutMs = 30000,
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

    let lastPos = { x: -1, y: -1 };

    const handleMouseMove = (e: MouseEvent) => {
      if (lastPos.x !== -1 && lastPos.y !== -1) {
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        // Filter out micro-vibrations and optical mouse jitter (< 8px movement)
        if (Math.hypot(dx, dy) < 8) {
          return;
        }
      }
      lastPos = { x: e.clientX, y: e.clientY };
      if (!isScreensaverActive) {
        resetTimer();
      }
    };

    const handleActivity = () => {
      if (!isScreensaverActive) {
        resetTimer();
      }
    };

    const handleCustomLaunch = () => {
      setIsScreensaverActive(true);
    };

    resetTimer();

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("launch-screensaver", handleCustomLaunch);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("launch-screensaver", handleCustomLaunch);
    };
  }, [enabled, isScreensaverActive, resetTimer]);

  return {
    isScreensaverActive,
    closeScreensaver,
    launchScreensaver,
  };
}


