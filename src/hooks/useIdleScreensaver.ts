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
  const activeSinceRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;

    timerRef.current = setTimeout(() => {
      activeSinceRef.current = Date.now();
      setIsScreensaverActive(true);
    }, timeoutMs);
  }, [enabled, timeoutMs]);

  const closeScreensaver = useCallback(() => {
    setIsScreensaverActive(false);
    resetTimer();
  }, [resetTimer]);

  const launchScreensaver = useCallback(() => {
    activeSinceRef.current = Date.now();
    setIsScreensaverActive(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const prevX = lastPosRef.current.x;
      const prevY = lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      if (prevX === -1 && prevY === -1) {
        return;
      }

      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      const dist = Math.hypot(dx, dy);

      // Filter out micro-vibrations and optical mouse jitter (< 10px movement)
      if (dist < 10) {
        return;
      }

      if (isScreensaverActive) {
        // Stop screensaver on mouse move (with small grace period right when triggered)
        if (Date.now() - activeSinceRef.current > 250) {
          closeScreensaver();
        }
      } else {
        resetTimer();
      }
    };

    const handleActivity = () => {
      if (isScreensaverActive) {
        // Any keypress, click, scroll or touch immediately stops the screensaver
        if (Date.now() - activeSinceRef.current > 100) {
          closeScreensaver();
        }
      } else {
        resetTimer();
      }
    };

    const handleCustomLaunch = () => {
      activeSinceRef.current = Date.now();
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
  }, [enabled, isScreensaverActive, resetTimer, closeScreensaver]);

  return {
    isScreensaverActive,
    closeScreensaver,
    launchScreensaver,
  };
}



