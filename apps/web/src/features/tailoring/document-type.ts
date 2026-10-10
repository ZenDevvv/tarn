import type { GenerateTailoringInput } from '@tracker/validation';

export type DocumentType = 'resume' | 'cv' | 'federal';

export interface DocumentTypeOption {
  value: DocumentType;
  label: string;
  description: string;
}

/**
 * A federal resume, an academic CV, and a private-sector resume are different documents, not
 * different templates. This selector changes the content policy the synthesis prompt applies; it
 * does not restyle anything.
 */
export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  {
    value: 'resume',
    label: 'Resume',
    description: 'Private sector. One to two pages, most relevant experience first.',
  },
  {
    value: 'cv',
    label: 'Academic CV',
    description: 'Research, teaching, and publications in full. No page limit.',
  },
  {
    value: 'federal',
    label: 'Federal',
    description: 'Uncapped detail including pay, hours, supervisor, and clearance.',
  },
];

export function buildGenerateInput(
  documentType: DocumentType,
  targetArtifact: GenerateTailoringInput['targetArtifact'],
  overrideWarnings: boolean
): GenerateTailoringInput {
  return { targetArtifact, documentType, overrideWarnings };
}
