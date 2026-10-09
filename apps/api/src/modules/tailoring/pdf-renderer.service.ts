import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { buildResumeHtml } from './templates/resume-template';
import { buildCoverLetterHtml } from './templates/cover-letter-template';
import { ServiceUnavailableError } from '../../middleware/error-handler';

const CHROMIUM_CANDIDATES = [
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/msedge',
];

export class PdfRendererService {
  public static findChromiumBinary(): string | null {
    if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
      return process.env.CHROMIUM_PATH;
    }
    for (const bin of CHROMIUM_CANDIDATES) {
      if (fs.existsSync(bin)) return bin;
    }
    return null;
  }

  public static checkAvailability(): void {
    const bin = this.findChromiumBinary();
    if (!bin) {
      console.warn('⚠️  WARNING: No Chromium binary found on system. PDF rendering will fail with 503 Service Unavailable. Deliverables are degraded.');
    } else {
      console.log(`✓ Chromium renderer located at ${bin}`);
    }
  }

  public static executeChromium(binary: string, args: string[], options: { timeout: number }): void {
    execFileSync(binary, args, options);
  }

  public static async renderHtmlToPdf(html: string, destinationPath: string): Promise<string> {
    const chromiumBin = this.findChromiumBinary();
    if (!chromiumBin) {
      throw new ServiceUnavailableError('PDF generation is temporarily unavailable');
    }

    const destDir = path.dirname(destinationPath);
    await fs.promises.mkdir(destDir, { recursive: true });

    // Write temporary HTML file
    const tmpDir = path.resolve(process.cwd(), 'uploads', 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const tmpHtml = path.join(tmpDir, `render_${Date.now()}_${crypto.randomUUID().slice(0, 6)}.html`);
    await fs.promises.writeFile(tmpHtml, html, 'utf-8');

    try {
      this.executeChromium(
        chromiumBin,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--no-pdf-header-footer',
          `--print-to-pdf=${destinationPath}`,
          `file://${tmpHtml}`,
        ],
        { timeout: 30000 }
      );

      if (!fs.existsSync(destinationPath)) {
        throw new ServiceUnavailableError('PDF generation failed: output file not created');
      }

      return destinationPath;
    } catch (err: any) {
      if (fs.existsSync(destinationPath)) {
        try {
          fs.unlinkSync(destinationPath);
        } catch {
          // Ignore cleanup error
        }
      }
      if (err instanceof ServiceUnavailableError) {
        throw err;
      }
      throw new ServiceUnavailableError(`PDF generation failed: ${err.message || 'renderer error'}`);
    } finally {
      if (fs.existsSync(tmpHtml)) {
        try {
          await fs.promises.unlink(tmpHtml);
        } catch {
          // Ignore cleanup error
        }
      }
    }
  }

  public static async generateResume(payload: any, uniqueId: string): Promise<{ html: string; pdfUrl: string; localPdfPath: string }> {
    const html = buildResumeHtml(payload);
    const filename = `resume_${uniqueId}.pdf`;
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'resumes');
    const localPdfPath = path.join(uploadsDir, filename);

    await this.renderHtmlToPdf(html, localPdfPath);

    return {
      html,
      pdfUrl: `/uploads/resumes/${filename}`,
      localPdfPath,
    };
  }

  public static async generateCoverLetter(
    markdownText: string,
    basics: any,
    role: string | undefined | null,
    company: string | undefined | null,
    uniqueId: string
  ): Promise<{ html: string; pdfUrl: string; localPdfPath: string }> {
    const html = buildCoverLetterHtml(markdownText, basics, role, company);
    const filename = `cover_letter_${uniqueId}.pdf`;
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'cover-letters');
    const localPdfPath = path.join(uploadsDir, filename);

    await this.renderHtmlToPdf(html, localPdfPath);

    return {
      html,
      pdfUrl: `/uploads/cover-letters/${filename}`,
      localPdfPath,
    };
  }
}
