import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resumeRepository, CANONICAL_REQUIRES_APPLICATION } from './resume.repository';
import { CreateResumeInput, UpdateResumeInput, ResumeFiltersInput, UploadResumeFileInput } from '@tracker/validation';
import { ResumeWithDetailsDTO } from '@tracker/types';
import { NotFoundError, BadRequestError } from '../../middleware/error-handler';

// Root directory for uploads: apps/api/uploads/resumes
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'resumes');

export const resumeService = {
  async listResumes(userId: string, filters: Partial<ResumeFiltersInput> = {}): Promise<ResumeWithDetailsDTO[]> {
    return resumeRepository.findMany(userId, filters);
  },

  async getResume(userId: string, id: string): Promise<ResumeWithDetailsDTO> {
    const resume = await resumeRepository.findById(userId, id);
    if (!resume) {
      throw new NotFoundError('Resume not found');
    }
    return resume;
  },

  async createResume(userId: string, input: CreateResumeInput): Promise<ResumeWithDetailsDTO> {
    return resumeRepository.create(userId, input);
  },

  async updateResume(userId: string, id: string, input: UpdateResumeInput): Promise<ResumeWithDetailsDTO> {
    const updated = await resumeRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Resume not found');
    }
    return updated;
  },

  async setCanonicalResume(userId: string, id: string): Promise<ResumeWithDetailsDTO> {
    const updated = await resumeRepository.setCanonical(userId, id);
    if (updated === CANONICAL_REQUIRES_APPLICATION) {
      throw new BadRequestError(
        'Only a tailored attempt can be marked canonical. Manual uploads are not tied to an application.'
      );
    }
    if (!updated) {
      throw new NotFoundError('Resume not found');
    }
    return updated;
  },

  async setDefaultResume(userId: string, id: string): Promise<ResumeWithDetailsDTO> {
    const updated = await resumeRepository.setDefault(userId, id);
    if (!updated) {
      throw new NotFoundError('Resume not found');
    }
    return updated;
  },

  async deleteResume(userId: string, id: string): Promise<boolean> {
    const resume = await resumeRepository.findById(userId, id);
    if (!resume) {
      throw new NotFoundError('Resume not found');
    }

    // If local uploaded file, safely remove it
    if (resume.fileUrl && resume.fileUrl.startsWith('/uploads/resumes/')) {
      try {
        const localPath = path.resolve(process.cwd(), resume.fileUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          await fs.promises.unlink(localPath);
        }
      } catch (err) {
        console.warn('Failed to delete resume local file:', err);
      }
    }

    return resumeRepository.delete(userId, id);
  },

  async uploadFile(userId: string, input: UploadResumeFileInput) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
    ];

    const mime = input.mimeType.toLowerCase();
    if (!allowedMimeTypes.includes(mime)) {
      throw new Error(`Unsupported file type: ${mime}. Allowed formats: PDF, DOCX, DOC, TXT, RTF`);
    }

    const base64Data = input.fileData.includes('base64,')
      ? input.fileData.split('base64,')[1]
      : input.fileData;

    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

    if (buffer.length > MAX_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

    const sanitizedOriginalName = path.basename(input.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedOriginalName) || (mime === 'application/pdf' ? '.pdf' : '');
    const uniqueStorageName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueStorageName);

    await fs.promises.writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/resumes/${uniqueStorageName}`;

    return {
      fileUrl,
      filename: sanitizedOriginalName,
      fileSize: buffer.length,
      mimeType: mime,
    };
  },
};
