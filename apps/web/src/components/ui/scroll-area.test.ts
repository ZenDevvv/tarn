import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ScrollArea, MinimalScrollbar } from './scroll-area';

describe('ScrollArea / MinimalScrollbar Component', () => {
  it('exports MinimalScrollbar as an identical alias to ScrollArea', () => {
    expect(MinimalScrollbar).toBe(ScrollArea);
  });

  it('renders container with data attributes and viewport with horizontal orientation classes', () => {
    const html = renderToString(
      React.createElement(
        ScrollArea,
        {
          orientation: 'horizontal',
          hoverOnly: true,
          className: 'flex gap-4 pb-6 pt-1',
        },
        React.createElement('div', null, 'Column 1')
      )
    );

    expect(html).toContain('data-slot="scroll-area"');
    expect(html).toContain('data-orientation="horizontal"');
    expect(html).toContain('data-hover-only="true"');
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('scrollbar-none');
    expect(html).toContain('flex gap-4');
    expect(html).toContain('Column 1');
  });

  it('renders vertical orientation with scrollbar-none and overflow-y-auto', () => {
    const html = renderToString(
      React.createElement(
        ScrollArea,
        {
          orientation: 'vertical',
          className: 'h-64',
        },
        React.createElement('div', null, 'Content')
      )
    );

    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain('data-hover-only="true"');
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('scrollbar-none');
  });

  it('supports containerClassName and hoverOnly false configuration', () => {
    const html = renderToString(
      React.createElement(
        ScrollArea,
        {
          orientation: 'both',
          hoverOnly: false,
          containerClassName: 'max-w-xl',
        },
        React.createElement('div', null, 'Both Axes')
      )
    );

    expect(html).toContain('data-orientation="both"');
    expect(html).toContain('data-hover-only="false"');
    expect(html).toContain('max-w-xl');
    expect(html).toContain('overflow-auto');
  });
});
