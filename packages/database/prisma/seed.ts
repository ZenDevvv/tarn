import {
  PrismaClient,
  ApplicationStatus,
  Priority,
  WorkSetup,
  EmploymentType,
  FollowUpStatus,
  TimelineEventType,
  InterviewType,
  InterviewStatus,
  InterviewResult,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing records
  await prisma.interview.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create primary test user (matching Dashboard sample)
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'mika@example.com',
      name: 'Mika Santos',
      passwordHash,
    },
  });

  console.log(`👤 Created user: ${user.name} (${user.email})`);

  // Date helpers
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Seed applications matching Dashboard sample
  const appData = [
    {
      company: 'Halcyon Labs',
      role: 'Frontend Developer',
      status: ApplicationStatus.TECHNICAL_INTERVIEW,
      priority: Priority.HIGH,
      source: 'LinkedIn',
      sourceUrl: 'https://linkedin.com/jobs/view/12345',
      workSetup: WorkSetup.HYBRID,
      salaryMin: 50000,
      salaryMax: 70000,
      appliedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      nextAction: 'Prepare for technical interview',
      nextActionDueAt: today,
      description: 'Senior Frontend Developer focused on React, TypeScript, and modern component architecture.',
    },
    {
      company: 'Northbeam',
      role: 'React Engineer',
      status: ApplicationStatus.HR_INTERVIEW,
      priority: Priority.MEDIUM,
      source: 'JobStreet',
      sourceUrl: 'https://jobstreet.com/jobs/view/23456',
      workSetup: WorkSetup.REMOTE,
      salaryMin: 70000,
      salaryMax: 90000,
      appliedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      nextAction: 'Follow up with recruiter',
      nextActionDueAt: today,
      description: 'React Engineer developing marketing intelligence dashboards and data visualization.',
    },
    {
      company: 'Kite & Compass',
      role: 'Full Stack Developer',
      status: ApplicationStatus.APPLIED,
      priority: Priority.MEDIUM,
      source: 'OnlineJobsPH',
      sourceUrl: 'https://onlinejobs.ph/job/34567',
      workSetup: WorkSetup.REMOTE,
      salaryMin: 80000,
      salaryMax: 100000,
      appliedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      nextAction: 'Send portfolio',
      nextActionDueAt: twoDaysAgo,
      description: 'Full stack role building Node.js microservices and clean React user interfaces.',
    },
    {
      company: 'Pageturn',
      role: 'Frontend Developer',
      status: ApplicationStatus.APPLIED,
      priority: Priority.LOW,
      source: 'Indeed',
      sourceUrl: 'https://indeed.com/viewjob?jk=45678',
      workSetup: WorkSetup.HYBRID,
      salaryMin: 45000,
      salaryMax: 60000,
      appliedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      nextAction: 'Check application status',
      nextActionDueAt: twoDaysLater,
      description: 'Frontend engineer working with design systems and responsive web typography.',
    },
    {
      company: 'Orbit Freight',
      role: 'QA Engineer',
      status: ApplicationStatus.REJECTED,
      priority: Priority.LOW,
      source: 'JobStreet',
      sourceUrl: 'https://jobstreet.com/jobs/view/56789',
      workSetup: WorkSetup.ONSITE,
      salaryMin: 35000,
      salaryMax: 45000,
      appliedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      nextAction: null,
      nextActionDueAt: null,
      description: 'QA automation role for logistics tracking portal and warehouse management systems.',
    },
    {
      company: 'Lumen Health',
      role: 'Full Stack Developer',
      status: ApplicationStatus.OFFER,
      priority: Priority.HIGH,
      source: 'Referral',
      sourceUrl: null,
      workSetup: WorkSetup.HYBRID,
      salaryMin: 90000,
      salaryMax: 110000,
      appliedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      nextAction: 'Review offer',
      nextActionDueAt: fiveDaysLater,
      description: 'Full stack healthcare software with React, Node.js, and HIPAA-compliant data pipelines.',
    },
  ];

  for (const item of appData) {
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: item.company,
        location: item.workSetup === WorkSetup.REMOTE ? 'Remote' : 'Philippines',
      },
    });

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        companyId: company.id,
        title: item.role,
        description: item.description,
        source: item.source,
        sourceUrl: item.sourceUrl,
        workSetup: item.workSetup,
        employmentType: EmploymentType.FULL_TIME,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        currency: 'PHP',
      },
    });

    const app = await prisma.application.create({
      data: {
        userId: user.id,
        companyId: company.id,
        jobId: job.id,
        status: item.status,
        priority: item.priority,
        appliedAt: item.appliedAt,
        nextAction: item.nextAction,
        nextActionDueAt: item.nextActionDueAt,
      },
    });

    // Initial timeline event
    await prisma.timelineEvent.create({
      data: {
        applicationId: app.id,
        type: TimelineEventType.APPLICATION_CREATED,
        title: 'Application submitted',
        description: `Applied via ${item.source}`,
        occurredAt: item.appliedAt,
      },
    });

    if (item.status !== ApplicationStatus.APPLIED) {
      await prisma.timelineEvent.create({
        data: {
          applicationId: app.id,
          type: TimelineEventType.STATUS_CHANGED,
          title: `Moved to ${item.status.replace(/_/g, ' ').toLowerCase()}`,
          occurredAt: new Date(item.appliedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Follow-up if nextAction exists
    if (item.nextAction && item.nextActionDueAt) {
      await prisma.followUp.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          action: item.nextAction,
          dueAt: item.nextActionDueAt,
          priority: item.priority,
          status: FollowUpStatus.PENDING,
        },
      });
    }

    // Seed Interviews for active interview stages
    if (item.company === 'Halcyon Labs') {
      const tomorrow1030 = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      tomorrow1030.setHours(10, 30, 0, 0);

      await prisma.interview.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          round: 2,
          type: InterviewType.TECHNICAL,
          title: 'Technical Deep Dive',
          scheduledAt: tomorrow1030,
          durationMinutes: 60,
          interviewerName: 'Dana Reyes',
          interviewerRole: 'Engineering Lead',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          location: 'Google Meet',
          status: InterviewStatus.SCHEDULED,
          result: InterviewResult.PENDING,
          notes: 'Focus on TypeScript, React architecture, and performance.',
          prepNotes: 'Review React 19 server components, concurrent rendering, and state management.',
        },
      });

      await prisma.timelineEvent.create({
        data: {
          applicationId: app.id,
          type: TimelineEventType.INTERVIEW_SCHEDULED,
          title: 'Technical interview scheduled',
          description: 'Scheduled with Dana Reyes for tomorrow at 10:30 AM',
          occurredAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      });
    } else if (item.company === 'Northbeam') {
      const inThreeDays1400 = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      inThreeDays1400.setHours(14, 0, 0, 0);

      await prisma.interview.create({
        data: {
          userId: user.id,
          applicationId: app.id,
          round: 1,
          type: InterviewType.HR,
          title: 'HR Cultural Fit',
          scheduledAt: inThreeDays1400,
          durationMinutes: 45,
          interviewerName: 'Liam Gomez',
          interviewerRole: 'Talent Partner',
          meetingUrl: 'https://zoom.us/j/1234567890',
          location: 'Zoom',
          status: InterviewStatus.SCHEDULED,
          result: InterviewResult.PENDING,
          notes: 'Discuss previous remote team experience and salary expectations.',
          prepNotes: 'Prepare elevator pitch and questions about team workflow.',
        },
      });

      await prisma.timelineEvent.create({
        data: {
          applicationId: app.id,
          type: TimelineEventType.INTERVIEW_SCHEDULED,
          title: 'HR interview scheduled',
          description: 'Scheduled with Liam Gomez on Zoom',
          occurredAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`✅ Seeded application: ${item.company} — ${item.role}`);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
