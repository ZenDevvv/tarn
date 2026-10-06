import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import { cn } from '@/lib/cn';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Scroll orientation:
   * - 'horizontal': allows x-axis overflow
   * - 'vertical': allows y-axis overflow
   * - 'both': allows both axes overflow (default)
   */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /**
   * When true (default), the scrollbar thumb is hidden until the user hovers over the container
   * or scrolls with wheel/touchpad. When false, the scrollbar thumb is always visible.
   */
  hoverOnly?: boolean;
  /**
   * Additional classes for the outer container wrapper
   */
  containerClassName?: string;
  /**
   * Additional classes for the internal scrollable viewport
   */
  viewportClassName?: string;
}

/**
 * ScrollArea - Minimal scrollbar container component.
 * Features:
 * - Hidden scrollbar thumb by default that reveals instantly on cursor hover inside the board container
 * - Automatically fades out smoothly when cursor exits the container
 * - Isolated group name (group/scroll-area) to prevent triggering child hover states
 * - Custom minimalist pill thumb matching design system tokens (--scrollbar-thumb, --scrollbar-thumb-hover)
 * - Native hardware-accelerated scrolling with zero overhead, vertical mouse wheel translation, and full gesture support
 * - Draggable thumb and clickable track jump support
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      containerClassName,
      viewportClassName,
      orientation = 'both',
      hoverOnly = true,
      children,
      onScroll,
      ...props
    },
    ref
  ) => {
    const internalViewportRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => internalViewportRef.current as HTMLDivElement);

    const hTrackRef = useRef<HTMLDivElement>(null);
    const hThumbRef = useRef<HTMLDivElement>(null);
    const vTrackRef = useRef<HTMLDivElement>(null);
    const vThumbRef = useRef<HTMLDivElement>(null);

    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [hThumb, setHThumb] = useState({ width: 0, left: 0, hasScroll: false });
    const [vThumb, setVThumb] = useState({ height: 0, top: 0, hasScroll: false });

    const updateScrollbars = useCallback(() => {
      const el = internalViewportRef.current;
      if (!el) return;

      const { clientWidth, scrollWidth, scrollLeft, clientHeight, scrollHeight, scrollTop } = el;

      // Horizontal
      if (orientation === 'horizontal' || orientation === 'both') {
        const hasHorizontal = scrollWidth > clientWidth + 1;
        if (!hasHorizontal) {
          setHThumb({ width: 0, left: 0, hasScroll: false });
        } else {
          const rawRatio = clientWidth / scrollWidth;
          const widthPercent = Math.max(rawRatio * 100, 6);
          const maxScroll = scrollWidth - clientWidth;
          const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
          const leftPercent = scrollRatio * (100 - widthPercent);

          setHThumb({
            width: widthPercent,
            left: leftPercent,
            hasScroll: true,
          });
        }
      }

      // Vertical
      if (orientation === 'vertical' || orientation === 'both') {
        const hasVertical = scrollHeight > clientHeight + 1;
        if (!hasVertical) {
          setVThumb({ height: 0, top: 0, hasScroll: false });
        } else {
          const rawRatio = clientHeight / scrollHeight;
          const heightPercent = Math.max(rawRatio * 100, 6);
          const maxScroll = scrollHeight - clientHeight;
          const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
          const topPercent = scrollRatio * (100 - heightPercent);

          setVThumb({
            height: heightPercent,
            top: topPercent,
            hasScroll: true,
          });
        }
      }
    }, [orientation]);

    useEffect(() => {
      const el = internalViewportRef.current;
      if (!el) return;

      updateScrollbars();

      const resizeObserver = new ResizeObserver(() => {
        updateScrollbars();
      });

      resizeObserver.observe(el);
      if (el.firstElementChild) {
        resizeObserver.observe(el.firstElementChild);
      }

      window.addEventListener('resize', updateScrollbars);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateScrollbars);
      };
    }, [updateScrollbars]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      updateScrollbars();
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 700);

      onScroll?.(e);
    };

    // Horizontal wheel conversion when hovering over horizontal board
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (orientation !== 'horizontal') return;
      const el = internalViewportRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;

      // Check if target element can scroll vertically (e.g. inside a specific column with many cards)
      let target = e.target as HTMLElement | null;
      let canScrollY = false;

      while (target && target !== el) {
        if (target.scrollHeight > target.clientHeight && target.clientHeight > 0) {
          const style = window.getComputedStyle(target);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            if (
              (e.deltaY > 0 && target.scrollTop < target.scrollHeight - target.clientHeight - 1) ||
              (e.deltaY < 0 && target.scrollTop > 1)
            ) {
              canScrollY = true;
              break;
            }
          }
        }
        target = target.parentElement;
      }

      if (!canScrollY && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
      }
    };

    // Horizontal thumb dragging
    const handleHThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const viewport = internalViewportRef.current;
      const track = hTrackRef.current;
      if (!viewport || !track) return;

      const startX = e.clientX;
      const startScrollLeft = viewport.scrollLeft;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const trackWidth = track.clientWidth;
      const thumbWidthPx = (hThumb.width / 100) * trackWidth;
      const maxTravel = trackWidth - thumbWidthPx;

      if (maxTravel <= 0 || maxScroll <= 0) return;

      setIsDragging(true);
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const scrollDelta = (deltaX / maxTravel) * maxScroll;
        viewport.scrollLeft = startScrollLeft + scrollDelta;
      };

      const onPointerUp = () => {
        setIsDragging(false);
        document.body.style.userSelect = prevUserSelect;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    // Horizontal track click to jump
    const handleHTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === hThumbRef.current) return;
      const viewport = internalViewportRef.current;
      const track = hTrackRef.current;
      if (!viewport || !track) return;

      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = rect.width;
      const thumbWidthPx = (hThumb.width / 100) * trackWidth;
      const targetTravel = clickX - thumbWidthPx / 2;
      const maxTravel = trackWidth - thumbWidthPx;
      const ratio = Math.max(0, Math.min(1, targetTravel / maxTravel));

      viewport.scrollTo({
        left: ratio * (viewport.scrollWidth - viewport.clientWidth),
        behavior: 'smooth',
      });
    };

    // Vertical thumb dragging
    const handleVThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const viewport = internalViewportRef.current;
      const track = vTrackRef.current;
      if (!viewport || !track) return;

      const startY = e.clientY;
      const startScrollTop = viewport.scrollTop;
      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      const trackHeight = track.clientHeight;
      const thumbHeightPx = (vThumb.height / 100) * trackHeight;
      const maxTravel = trackHeight - thumbHeightPx;

      if (maxTravel <= 0 || maxScroll <= 0) return;

      setIsDragging(true);
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const scrollDelta = (deltaY / maxTravel) * maxScroll;
        viewport.scrollTop = startScrollTop + scrollDelta;
      };

      const onPointerUp = () => {
        setIsDragging(false);
        document.body.style.userSelect = prevUserSelect;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    // Vertical track click to jump
    const handleVTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === vThumbRef.current) return;
      const viewport = internalViewportRef.current;
      const track = vTrackRef.current;
      if (!viewport || !track) return;

      const rect = track.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const trackHeight = rect.height;
      const thumbHeightPx = (vThumb.height / 100) * trackHeight;
      const targetTravel = clickY - thumbHeightPx / 2;
      const maxTravel = trackHeight - thumbHeightPx;
      const ratio = Math.max(0, Math.min(1, targetTravel / maxTravel));

      viewport.scrollTo({
        top: ratio * (viewport.scrollHeight - viewport.clientHeight),
        behavior: 'smooth',
      });
    };

    const isVisible = !hoverOnly || isHovered || isDragging || isScrolling;

    const orientationClass =
      orientation === 'horizontal'
        ? 'overflow-x-auto'
        : orientation === 'vertical'
        ? 'overflow-y-auto'
        : 'overflow-auto';

    return (
      <div
        data-slot="scroll-area"
        data-orientation={orientation}
        data-hover-only={hoverOnly ? 'true' : 'false'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn('relative w-full group/scroll-area', containerClassName)}
      >
        <div
          ref={internalViewportRef}
          data-slot="scroll-area-viewport"
          onScroll={handleScroll}
          onWheel={handleWheel}
          className={cn(
            'w-full scrollbar-none',
            orientationClass,
            className,
            viewportClassName
          )}
          {...props}
        >
          {children}
        </div>

        {/* Horizontal Scrollbar */}
        {(orientation === 'horizontal' || orientation === 'both') && hThumb.hasScroll && (
          <div
            ref={hTrackRef}
            role="scrollbar"
            aria-orientation="horizontal"
            tabIndex={-1}
            data-slot="scroll-area-h-scrollbar"
            onClick={handleHTrackClick}
            className={cn(
              'absolute bottom-1 inset-x-3 h-3 z-20 select-none cursor-pointer flex items-center transition-opacity duration-200 ease-out',
              hoverOnly
                ? isVisible
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none group-hover/scroll-area:opacity-100 group-hover/scroll-area:pointer-events-auto'
                : 'opacity-100 pointer-events-auto'
            )}
          >
            {/* Subtle track background */}
            <div className="w-full h-1.5 rounded-full bg-border/20 transition-colors" />

            {/* Draggable Thumb */}
            <div
              ref={hThumbRef}
              onPointerDown={handleHThumbPointerDown}
              style={{
                width: `${hThumb.width}%`,
                left: `${hThumb.left}%`,
              }}
              className="absolute top-0.5 bottom-0.5 rounded-full bg-[var(--scrollbar-thumb)] hover:bg-[var(--scrollbar-thumb-hover)] active:bg-[var(--scrollbar-thumb-hover)] cursor-grab active:cursor-grabbing transition-colors pointer-events-auto shadow-xs"
            />
          </div>
        )}

        {/* Vertical Scrollbar */}
        {(orientation === 'vertical' || orientation === 'both') && vThumb.hasScroll && (
          <div
            ref={vTrackRef}
            role="scrollbar"
            aria-orientation="vertical"
            tabIndex={-1}
            data-slot="scroll-area-v-scrollbar"
            onClick={handleVTrackClick}
            className={cn(
              'absolute right-1 inset-y-3 w-3 z-20 select-none cursor-pointer flex justify-center transition-opacity duration-200 ease-out',
              hoverOnly
                ? isVisible
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none group-hover/scroll-area:opacity-100 group-hover/scroll-area:pointer-events-auto'
                : 'opacity-100 pointer-events-auto'
            )}
          >
            {/* Subtle track background */}
            <div className="h-full w-1.5 rounded-full bg-border/20 transition-colors" />

            {/* Draggable Thumb */}
            <div
              ref={vThumbRef}
              onPointerDown={handleVThumbPointerDown}
              style={{
                height: `${vThumb.height}%`,
                top: `${vThumb.top}%`,
              }}
              className="absolute left-0.5 right-0.5 rounded-full bg-[var(--scrollbar-thumb)] hover:bg-[var(--scrollbar-thumb-hover)] active:bg-[var(--scrollbar-thumb-hover)] cursor-grab active:cursor-grabbing transition-colors pointer-events-auto shadow-xs"
            />
          </div>
        )}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

/**
 * MinimalScrollbar alias for backward compatibility and intuitive discovery.
 */
export const MinimalScrollbar = ScrollArea;
