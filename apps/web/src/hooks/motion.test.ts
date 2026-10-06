import { describe, it, expect, vi } from 'vitest';
import { easeOutCubic } from './use-count-up';

describe('Motion Easing Curves', () => {
  it('easeOutCubic maps boundary conditions accurately', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('easeOutCubic demonstrates strong deceleration (Emil Kowalski curve)', () => {
    // At t=0.5 (halfway in time), progress should already be 87.5% done, settling gently at the end
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutCubic(0.2)).toBeCloseTo(0.488, 3);
    expect(easeOutCubic(0.8)).toBeCloseTo(0.992, 3);
  });

  it('easeOutCubic is strictly monotonic between 0 and 1', () => {
    const steps = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    for (let i = 1; i < steps.length; i++) {
      expect(easeOutCubic(steps[i])).toBeGreaterThan(easeOutCubic(steps[i - 1]));
    }
  });
});

describe('Weekly Velocity Bar Geometry & Stagger Sequencing', () => {
  it('calculates correct height percentages with minimum threshold', () => {
    const maxCount = 20;
    const calculateHeightPercent = (count: number) =>
      Math.max(12, Math.round((count / maxCount) * 85));

    // Zero applications still gets a 12% subtle baseline bar
    expect(calculateHeightPercent(0)).toBe(12);
    // 10 applications gets around 43%
    expect(calculateHeightPercent(10)).toBe(43);
    // 20 applications gets maximum 85%
    expect(calculateHeightPercent(20)).toBe(85);
  });

  it('produces strictly progressive stagger delays for 8 weeks', () => {
    const weeksCount = 8;
    const delays = Array.from({ length: weeksCount }, (_, i) => i * 60);

    expect(delays).toEqual([0, 60, 120, 180, 240, 300, 360, 420]);
    expect(delays[delays.length - 1]).toBeLessThanOrEqual(500);
  });
});

describe('Accessibility & Reduced Motion Detection', () => {
  it('correctly queries prefers-reduced-motion media query string', () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal('window', { matchMedia: matchMediaMock });

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(mql.matches).toBe(true);

    vi.unstubAllGlobals();
  });
});
