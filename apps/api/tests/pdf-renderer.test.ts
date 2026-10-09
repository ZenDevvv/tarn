import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PdfRendererService } from '../src/modules/tailoring/pdf-renderer.service';
import { ServiceUnavailableError } from '../src/middleware/error-handler';

describe('PdfRendererService Tests', () => {
  const testDestPdf = path.resolve(process.cwd(), 'uploads', 'tmp', `test_render_${Date.now()}.pdf`);
  const testDestHtml = testDestPdf.replace(/\.pdf$/, '.html');

  beforeEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(testDestPdf)) fs.unlinkSync(testDestPdf);
    if (fs.existsSync(testDestHtml)) fs.unlinkSync(testDestHtml);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(testDestPdf)) fs.unlinkSync(testDestPdf);
    if (fs.existsSync(testDestHtml)) fs.unlinkSync(testDestHtml);
  });

  it('throws ServiceUnavailableError when no Chromium binary is found and never creates .html fallback', async () => {
    vi.spyOn(PdfRendererService, 'findChromiumBinary').mockReturnValue(null);

    await expect(
      PdfRendererService.renderHtmlToPdf('<h1>Test</h1>', testDestPdf)
    ).rejects.toThrow(ServiceUnavailableError);

    // Verify silent .html fallback was DELETED and never created
    expect(fs.existsSync(testDestHtml)).toBe(false);
    expect(fs.existsSync(testDestPdf)).toBe(false);
  });

  it('throws ServiceUnavailableError when Chromium execution fails and cleans up partial files', async () => {
    vi.spyOn(PdfRendererService, 'findChromiumBinary').mockReturnValue('/mock/chromium');
    vi.spyOn(PdfRendererService, 'executeChromium').mockImplementation(() => {
      // Create a corrupted/partial file to simulate partial write before crashing
      fs.writeFileSync(testDestPdf, 'partial content');
      throw new Error('Chromium process exited with non-zero status');
    });

    await expect(
      PdfRendererService.renderHtmlToPdf('<h1>Test</h1>', testDestPdf)
    ).rejects.toThrow(ServiceUnavailableError);

    expect(fs.existsSync(testDestHtml)).toBe(false);
    expect(fs.existsSync(testDestPdf)).toBe(false);
  });

  it('throws ServiceUnavailableError if Chromium exits without creating destination file', async () => {
    vi.spyOn(PdfRendererService, 'findChromiumBinary').mockReturnValue('/mock/chromium');
    vi.spyOn(PdfRendererService, 'executeChromium').mockImplementation(() => {
      // No file created
    });

    await expect(
      PdfRendererService.renderHtmlToPdf('<h1>Test</h1>', testDestPdf)
    ).rejects.toThrow(ServiceUnavailableError);

    expect(fs.existsSync(testDestHtml)).toBe(false);
  });

  it('succeeds and creates destination PDF when Chromium executes successfully', async () => {
    vi.spyOn(PdfRendererService, 'findChromiumBinary').mockReturnValue('/mock/chromium');
    vi.spyOn(PdfRendererService, 'executeChromium').mockImplementation((_bin, args) => {
      const destArg = args.find((a) => a.startsWith('--print-to-pdf='));
      const dest = destArg!.replace('--print-to-pdf=', '');
      fs.writeFileSync(dest, '%PDF-1.4 mock content');
    });

    const result = await PdfRendererService.renderHtmlToPdf('<h1>Test</h1>', testDestPdf);
    expect(result).toBe(testDestPdf);
    expect(fs.existsSync(testDestPdf)).toBe(true);
  });
});
