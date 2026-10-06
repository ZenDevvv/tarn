import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './use-reduced-motion';

export interface UseCountUpOptions {
  duration?: number;
  isInView?: boolean;
  start?: number;
  decimals?: number;
}

/**
 * Deceleration curve: cubic ease-out (1 - (1 - t)^3)
 * Starts with snappy momentum and decelerates smoothly to the final value.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animated number hook that transitions from `start` (0) to `targetValue`
 * using requestAnimationFrame and a cubic ease-out curve.
 * Automatically halts when target is reached or when reduced-motion is requested.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): number {
  const {
    duration = 1000,
    isInView = true,
    start = 0,
    decimals = 0,
  } = options;

  const reducedMotion = useReducedMotion();
  const [currentValue, setCurrentValue] = useState<number>(() =>
    reducedMotion ? targetValue : (isInView ? start : start)
  );
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setCurrentValue(targetValue);
      return;
    }

    if (!isInView) {
      return;
    }

    const fromValue = start;
    const diff = targetValue - fromValue;

    if (diff === 0 || duration <= 0) {
      setCurrentValue(targetValue);
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const val = fromValue + diff * easedProgress;

      const rounded = decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
      setCurrentValue(rounded);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [targetValue, duration, isInView, start, decimals, reducedMotion]);

  return currentValue;
}

/**
 * Component wrapper for useCountUp for convenient JSX inline use
 */
export function AnimatedNumber({
  value,
  duration = 1000,
  isInView = true,
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  isInView?: boolean;
  decimals?: number;
  className?: string;
}) {
  const animated = useCountUp(value, { duration, isInView, decimals });
  return <span className={className}>{animated}</span>;
}
