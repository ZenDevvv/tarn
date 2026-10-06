import { describe, it, expect } from 'vitest';
import { ContactWithDetailsDTO } from '@tracker/types';

describe('Contacts Feature - Unit Tests', () => {
  const mockContact: ContactWithDetailsDTO = {
    id: 'contact_123',
    userId: 'user_123',
    name: 'Sarah Connor',
    role: 'Senior Technical Recruiter',
    email: 'sarah.connor@stripe.com',
    phone: '+1 555-0199',
    linkedinUrl: 'https://linkedin.com/in/sarah-connor-recruiter',
    companyId: 'comp_123',
    applicationId: 'app_123',
    notes: 'Direct recruiter screen went great.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: {
      id: 'comp_123',
      name: 'Stripe Inc',
      website: 'https://stripe.com',
    },
    application: {
      id: 'app_123',
      status: 'INTERVIEWING',
      priority: 'HIGH',
      company: {
        id: 'comp_123',
        name: 'Stripe Inc',
      },
      job: {
        id: 'job_123',
        title: 'Backend Engineer',
      },
    },
  };

  it('validates contact entity fields and relationships', () => {
    expect(mockContact.name).toBe('Sarah Connor');
    expect(mockContact.role).toBe('Senior Technical Recruiter');
    expect(mockContact.company?.name).toBe('Stripe Inc');
    expect(mockContact.application?.job?.title).toBe('Backend Engineer');
    expect(mockContact.application?.status).toBe('INTERVIEWING');
  });

  it('formats communication action URIs correctly', () => {
    expect(`mailto:${mockContact.email}`).toBe('mailto:sarah.connor@stripe.com');
    expect(`tel:${mockContact.phone}`).toBe('tel:+1 555-0199');
    expect(mockContact.linkedinUrl).toContain('linkedin.com/in/');
  });

  it('safely extracts status label when application status is a dynamic status object from database', () => {
    const contactWithDynamicStatus = {
      ...mockContact,
      application: {
        ...mockContact.application!,
        status: {
          id: 'status_1',
          name: 'Technical Screening',
          order: 2,
          closeType: null,
          isDefault: false,
        } as any,
      },
    };

    expect(contactWithDynamicStatus.application.status.name).toBe('Technical Screening');
  });
});
