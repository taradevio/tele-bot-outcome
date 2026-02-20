import { useState, useRef } from "react";

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [startY, setStartY] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Threshold to trigger refresh
  const threshold = 100; // Drag down 100px to trigger

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        // Apply resistance
        setPullY(diff * 0.5);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > threshold) {
      setIsRefreshing(true);
      setPullY(60); // Snap to loading spinner height
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPullY(0); // Snap back if threshold not met
    }
    setStartY(0);
  };

  return {
    contentRef,
    pullY,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
