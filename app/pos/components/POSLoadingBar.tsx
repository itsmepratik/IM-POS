"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface POSLoadingBarProps {
  /** When true, the bar jumps to 100% and fades out */
  isReady?: boolean;
  /** Called after the fade-out animation completes */
  onComplete?: () => void;
}

/**
 * Premium animated bar-fill progress loader for the POS page.
 *
 * Progress behavior:
 *  - 0 → 60%   in ~1.5s  (fast — gives a sense of speed)
 *  - 60 → 85%  in ~3s    (medium — data is arriving)
 *  - 85 → 95%  crawls    (slow — waiting for last items)
 *  - Jumps to 100% when `isReady` becomes true
 *  - Fades out over 400ms, then calls `onComplete`
 */
export function POSLoadingBar({
  isReady = false,
  onComplete,
}: POSLoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Simulated progress curve
  useEffect(() => {
    if (isReady) return; // Stop simulating once ready

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 2.5; // Fast: 0→60 in ~1.5s (24 ticks × 60ms)
        if (prev < 85) return prev + 0.5; // Medium: 60→85 in ~3s (50 ticks × 60ms)
        if (prev < 95) return prev + 0.1; // Crawl: 85→95 very slowly
        return prev; // Park at 95 until ready
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isReady]);

  // When ready, jump to 100% and trigger fade-out
  useEffect(() => {
    if (!isReady) return;

    setProgress(100);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 300); // Brief hold at 100% before fade

    const hideTimer = setTimeout(() => {
      setIsHidden(true);
      onComplete?.();
    }, 700); // 300ms hold + 400ms fade

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [isReady, onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-400",
        isFadingOut && "opacity-0 pointer-events-none",
      )}
    >
      {/* Content container */}
      <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Retail POS
          </h1>
          <p className="text-sm text-muted-foreground">Loading products…</p>
        </div>

        {/* Progress bar container */}
        <div className="w-full space-y-3">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress < 60
                ? "Fetching inventory…"
                : progress < 85
                  ? "Processing products…"
                  : progress < 100
                    ? "Almost ready…"
                    : "Ready!"}
            </span>
            <span className="tabular-nums font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
