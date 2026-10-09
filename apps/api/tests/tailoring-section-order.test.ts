import { describe, it, expect } from 'vitest';
import { determineOptimalSectionOrder } from '../src/modules/tailoring/tailoring.service';
import { MasterProfileDTO } from '@tracker/types';

const baseProfile: MasterProfileDTO = {
  id: 'p1',
  userId: 'u1',
  basics: { name: 'Test Candidate', links: [] },
  positioningRules: [],
  factBank: {},
  workExperience: [],
  projectExperience: [],
  skills: {},
  education: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const twoRoles = [
  { company: 'Acme Software', role: 'Senior Developer', date_range: '2020 - Present', bullets: ['Shipped features.', 'Mentored juniors.'] },
  { company: 'Beta Systems', role: 'Developer', date_range: '2018 - 2020', bullets: ['Built services.'] },
];

describe('determineOptimalSectionOrder', () => {
  it('orders experienced profiles as summary -> experience -> ... -> certifications', () => {
    const profile: MasterProfileDTO = { ...baseProfile, workExperience: twoRoles };

    expect(determineOptimalSectionOrder(profile)).toEqual([
      'summary',
      'experience',
      'projects',
      'skills',
      'education',
      'certifications',
    ]);
  });

  it('floats certifications to position 2 for licensed professionals (2+ verified)', () => {
    const profile: MasterProfileDTO = {
      ...baseProfile,
      workExperience: [
        { company: 'Mercy General Hospital', role: 'Registered Nurse', date_range: '2020 - Present', bullets: ['Triaged patients.', 'Administered medications.'] },
        { company: 'St Luke Medical', role: 'Staff Nurse', date_range: '2017 - 2020', bullets: ['Rounded on 6 patients.'] },
      ],
      factBank: { certifications: ['Registered Nurse (RN)', 'Basic Life Support (BLS)', 'ACLS'] },
    };

    const order = determineOptimalSectionOrder(profile);
    expect(order[0]).toBe('summary');
    expect(order[1]).toBe('certifications');
  });

  it('recognizes licenses stored under non-standard skill category keys', () => {
    const profile: MasterProfileDTO = {
      ...baseProfile,
      workExperience: twoRoles,
      skills: { 'Nursing Licenses': ['BLS', 'ACLS'] },
    };

    expect(determineOptimalSectionOrder(profile)[1]).toBe('certifications');
  });

  it('does not float certifications with fewer than 2 verified', () => {
    const profile: MasterProfileDTO = {
      ...baseProfile,
      workExperience: twoRoles,
      factBank: { certifications: ['CPA'] },
    };

    expect(determineOptimalSectionOrder(profile)[1]).toBe('experience');
  });

  it('keeps project-first ordering for portfolio candidates', () => {
    const profile: MasterProfileDTO = {
      ...baseProfile,
      projectExperience: [
        { name: 'Proj A', bullets: ['Built a thing.'] },
        { name: 'Proj B', bullets: ['Built another.'] },
      ],
    };

    expect(determineOptimalSectionOrder(profile)).toEqual([
      'summary',
      'projects',
      'skills',
      'education',
      'certifications',
      'experience',
    ]);
  });
});
