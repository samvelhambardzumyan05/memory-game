import { useState, useEffect, useRef, useCallback } from 'react';

export function useBoardDimensions(gridCols, isActive) {
  const [size, setSize] = useState(0);
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  const updateSize = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const { width, height } = element.getBoundingClientRect();
    const nextSize = Math.floor(Math.min(width, height));
    setSize(nextSize > 0 ? nextSize : 0);
  }, []);

  const containerRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (!node || !isActive) {
      setSize(0);
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
      setSize(0);
      return undefined;
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, [isActive, gridCols, updateSize]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { containerRef, size };
}
