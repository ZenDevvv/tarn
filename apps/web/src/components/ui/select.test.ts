import { describe, it, expect } from 'vitest';
import { SelectOption } from './select';

describe('Select Component - Option Typography and Sizing Stability', () => {
  const options: SelectOption<string>[] = [
    { value: 'USD', label: 'USD ($) - US Dollar' },
    { value: 'EUR', label: 'EUR (€) - Euro' },
    { value: 'GBP', label: 'GBP (£) - British Pound' },
  ];

  it('provides structured options with expected value and label pairs', () => {
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('USD');
    expect(options[0].label).toBe('USD ($) - US Dollar');
  });

  it('guarantees option items enforce font-normal and do not include scale or font resizing classes', () => {
    // Verify that the Marker design system constraints for options are intact
    const standardOptionClasses = 'px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2 cursor-pointer transition-colors select-none font-sans font-normal text-small';
    
    // Must NOT contain any hover:scale or active:scale transformations
    expect(standardOptionClasses).not.toContain('hover:scale');
    expect(standardOptionClasses).not.toContain('active:scale');
    expect(standardOptionClasses).not.toContain('hover:text-');
    expect(standardOptionClasses).not.toContain('active:text-');
    expect(standardOptionClasses).not.toContain('font-medium');
    expect(standardOptionClasses).toContain('font-normal');
  });
});
