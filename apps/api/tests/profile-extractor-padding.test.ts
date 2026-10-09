import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { ProfileExtractorService } from '../src/modules/master-profile/profile-extractor.service';

const ZEN_PDF = '/home/machenike/Projects/Resume-Builder/Zen Obrero RESUME.pdf';

describe('pdftotext -layout column padding (education)', () => {
  it('strips multi-space runs from education fields on the real PDF', () => {
    const text = ProfileExtractorService.extractTextFromBuffer(
      fs.readFileSync(ZEN_PDF),
      'application/pdf'
    );
    const { education } = ProfileExtractorService.parseResumeText(text).profile;

    expect(education.length).toBeGreaterThan(0);
    const padding = / {6,}/;
    for (const entry of education) {
      expect(entry.school, 'school carries pdftotext column padding').not.toMatch(padding);
      if (entry.degree) {
        expect(entry.degree, 'degree carries pdftotext column padding').not.toMatch(padding);
      }
    }
  });

  it('keeps the institution identifiable after collapsing', () => {
    const text = ProfileExtractorService.extractTextFromBuffer(
      fs.readFileSync(ZEN_PDF),
      'application/pdf'
    );
    const { education } = ProfileExtractorService.parseResumeText(text).profile;

    expect(education[0].school).toContain('Biliran Province State University');
    expect(education[0].degree).toContain('Bachelor of Science in Computer Science');
  });
});
