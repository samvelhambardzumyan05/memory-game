import { useState, useEffect, useRef, useCallback } from 'react';

export function useBoardDimensions(gridCols, gridRows, isActive) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, cellSize: 0 });
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  const updateSize = useCallback(() => {
    const element = elementRef.current;
    if (!element || !gridCols || !gridRows) return;

    const { width, height } = element.getBoundingClientRect();
    const cellFromWidth = width / gridCols;
    const cellFromHeight = height / gridRows;
    const cellSize = Math.floor(Math.min(cellFromWidth, cellFromHeight));

    if (cellSize <= 0) return;

    setDimensions({
      width: cellSize * gridCols,
      height: cellSize * gridRows,
      cellSize,
    });
  }, [gridCols, gridRows]);

  const containerRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (!node || !isActive) {
      setDimensions({ width: 0, height: 0, cellSize: 0 });
      return;
    }

    observerRef.current = new ResizeObserver(updateSize);
    observerRef.current.observe(node);

    requestAnimationFrame(() => {
      requestAnimationFrame(updateSize);
    });
  }, [isActive, updateSize]);

  useEffect(() => {
    if (!isActive) {
      setDimensions({ width: 0, height: 0, cellSize: 0 });
      return undefined;
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, [isActive, gridCols, gridRows, updateSize]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { containerRef, dimensions };
}
