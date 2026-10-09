import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { buildResumeHtml } from './templates/resume-template';
import { buildCoverLetterHtml } from './templates/cover-letter-template';

const CHROMIUM_CANDIDATES = [
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/msedge',
];

export class PdfRendererService {
  public static findChromiumBinary(): string | null {
    for (const bin of CHROMIUM_CANDIDATES) {
      if (fs.existsSync(bin)) return bin;
    }
    return null;
  }

  public static async renderHtmlToPdf(html: string, destinationPath: string): Promise<string> {
    const chromiumBin = this.findChromiumBinary();
    const destDir = path.dirname(destinationPath);
    await fs.promises.mkdir(destDir, { recursive: true });

    if (!chromiumBin) {
      // If no headless browser is found on server, write the HTML file alongside destination
      const htmlFallbackPath = destinationPath.replace(/\.pdf$/, '.html');
      await fs.promises.writeFile(htmlFallbackPath, html, 'utf-8');
      return htmlFallbackPath;
    }

    // Write temporary HTML file
    const tmpDir = path.resolve(process.cwd(), 'uploads', 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const tmpHtml = path.join(tmpDir, `render_${Date.now()}_${crypto.randomUUID().slice(0, 6)}.html`);
    await fs.promises.writeFile(tmpHtml, html, 'utf-8');

    try {
      execFileSync(
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
      return destinationPath;
    } finally {
      if (fs.existsSync(tmpHtml)) {
        await fs.promises.unlink(tmpHtml);
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
