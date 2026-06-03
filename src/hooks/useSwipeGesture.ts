import { useRef, useCallback, useEffect } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  minSwipeDistance?: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    minSwipeDistance = 50,
  } = options;

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touchEndX = e.changedTouches[0]?.clientX;
      const touchEndY = e.changedTouches[0]?.clientY;
      const touchEndTime = Date.now();

      if (
        touchStartX.current === null ||
        touchStartY.current === null ||
        touchStartTime.current === null ||
        touchEndX === undefined ||
        touchEndY === undefined
      ) {
        return;
      }

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const deltaTime = touchEndTime - touchStartTime.current;

      // Detect tap (minimal movement within 300ms)
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8 && deltaTime < 300) {
        onTap?.();
        touchStartX.current = null;
        touchStartY.current = null;
        touchStartTime.current = null;
        return;
      }

      // Only consider swipes if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipes
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      touchStartTime.current = null;
    },
    [minSwipeDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap]
  );

  return { handleTouchStart, handleTouchEnd };
}
