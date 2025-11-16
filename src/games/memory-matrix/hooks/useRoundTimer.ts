import { useEffect, useRef, useState } from 'react';

export function useRoundTimer(isActive: boolean) {
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isActive) {
      if (frameRef.current) {
        clearInterval(frameRef.current);
        frameRef.current = null;
      }
      setElapsedMs(0);
      return;
    }

    const start = Date.now();
    frameRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);

    return () => {
      if (frameRef.current) {
        clearInterval(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isActive]);

  const formatted = `${(elapsedMs / 1000).toFixed(1)}s`;

  return { elapsedMs, formatted };
}
