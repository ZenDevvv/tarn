import { describe, it, expect } from 'vitest';
import { DOCUMENT_TYPE_OPTIONS, buildGenerateInput } from './document-type';

describe('Tailoring document type selector', () => {
  it('offers exactly three document types', () => {
    expect(DOCUMENT_TYPE_OPTIONS.map((o) => o.value)).toEqual(['resume', 'cv', 'federal']);
  });

  it('describes each option so the choice is self-explanatory', () => {
    DOCUMENT_TYPE_OPTIONS.forEach((option) => {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.description.length).toBeGreaterThan(0);
    });
  });

  it('sends documentType alongside the other generation inputs', () => {
    const input = buildGenerateInput('federal', 'package', true);

    expect(input).toEqual({
      targetArtifact: 'package',
      documentType: 'federal',
      overrideWarnings: true,
    });
  });

  it('defaults to resume so existing callers are unchanged', () => {
    expect(buildGenerateInput('resume', 'resume', false).documentType).toBe('resume');
  });
});
