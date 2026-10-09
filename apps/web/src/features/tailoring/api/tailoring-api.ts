import { apiClient } from '@/lib/api-client';
import { JdAnalysisResultDTO, ResumeDTO, CoverLetterDTO, GenerationQuotaDTO } from '@tracker/types';
import { GenerateTailoringInput } from '@tracker/validation';

export interface TailoredPackageResponse {
  resume?: ResumeDTO;
  coverLetter?: CoverLetterDTO;
  analysis: JdAnalysisResultDTO;
  validation: {
    keywordCoveragePercent: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    exactPhraseEchoes: string[];
    fidelityWarnings: string[];
    isValid: boolean;
  };
  quota?: GenerationQuotaDTO;
}

export const tailoringApi = {
  async getQuota(): Promise<GenerationQuotaDTO> {
    return apiClient.get<GenerationQuotaDTO>('/tailoring/quota');
  },

  async getAnalysis(applicationId: string): Promise<JdAnalysisResultDTO> {
    return apiClient.get<JdAnalysisResultDTO>(`/tailoring/applications/${applicationId}/analysis`);
  },

  async generatePackage(
    applicationId: string,
    input: GenerateTailoringInput = {}
  ): Promise<TailoredPackageResponse> {
    return apiClient.post<TailoredPackageResponse>(
      `/tailoring/applications/${applicationId}/generate`,
      input
    );
  },


  getResumeHtmlUrl(resumeId: string): string {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    return `${apiBase}/tailoring/resumes/${resumeId}/preview-html`;
  },

  getCoverLetterHtmlUrl(coverLetterId: string): string {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    return `${apiBase}/tailoring/cover-letters/${coverLetterId}/preview-html`;
  },
};
