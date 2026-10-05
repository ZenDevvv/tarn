export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'APPLICATION_VIEWED'
  | 'RECRUITER_CONTACTED'
  | 'HR_INTERVIEW'
  | 'TECHNICAL_INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'NO_RESPONSE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type WorkSetup = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'FREELANCE';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type TimelineEventType =
  | 'APPLICATION_CREATED'
  | 'STATUS_CHANGED'
  | 'FOLLOW_UP_CREATED'
  | 'FOLLOW_UP_COMPLETED'
  | 'NOTE_ADDED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'CUSTOM_EVENT';

export type InterviewType =
  | 'HR'
  | 'RECRUITER'
  | 'TECHNICAL'
  | 'CODING_ASSESSMENT'
  | 'SYSTEM_DESIGN'
  | 'HIRING_MANAGER'
  | 'FINAL'
  | 'CLIENT'
  | 'OTHER';

export type InterviewStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type InterviewResult =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'DID_NOT_HEAR_BACK';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface CompanyDTO {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyWithDetailsDTO extends CompanyDTO {
  createdAt: string;
  updatedAt: string;
  applicationsCount: number;
  activeApplicationsCount: number;
  applications: Array<{
    id: string;
    status: ApplicationStatus;
    priority: Priority;
    appliedAt: string;
    job?: {
      id: string;
      title: string;
      location?: string | null;
      workSetup?: WorkSetup | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency?: string | null;
    } | null;
  }>;
}

export interface JobDTO {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  location?: string | null;
  workSetup?: WorkSetup | null;
  employmentType?: EmploymentType | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  datePosted?: string | null;
}

export interface ApplicationDTO {
  id: string;
  userId: string;
  companyId: string;
  jobId: string;
  status: ApplicationStatus;
  priority: Priority;
  appliedAt?: string | null;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  notes?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: CompanyDTO;
  job?: JobDTO;
  interviews?: InterviewDTO[];
}

export interface TimelineEventDTO {
  id: string;
  applicationId: string;
  type: TimelineEventType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

export interface FollowUpDTO {
  id: string;
  userId: string;
  applicationId: string;
  action: string;
  dueAt: string;
  priority: Priority;
  status: FollowUpStatus;
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    company: { name: string };
    job: { title: string };
  };
}

export interface DashboardSummaryDTO {
  activeApplications: number;
  activeDeltaNote: string;
  interviewCount: number;
  interviewDeltaNote: string;
  followUpsDue: number;
  followUpsOverdueCount: number;
  appliedThisWeek: number;
  appliedThisMonth: number;
}

export interface WeeklyVelocityItemDTO {
  weekLabel: string;
  count: number;
  inProgress: boolean;
}

export interface WeeklyVelocityDTO {
  averagePerWeek: number;
  currentWeekLabel: string;
  weeks: WeeklyVelocityItemDTO[];
}

export interface InterviewDTO {
  id: string;
  userId: string;
  applicationId: string;
  round: number;
  type: InterviewType;
  title?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  timezone?: string | null;
  interviewerName?: string | null;
  interviewerRole?: string | null;
  meetingUrl?: string | null;
  location?: string | null;
  status: InterviewStatus;
  result: InterviewResult;
  notes?: string | null;
  prepNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    company: { name: string };
    job: { title: string };
  };
}

export interface DashboardUpcomingInterviewDTO {
  id: string;
  applicationId?: string;
  companyName: string;
  roleTitle: string;
  stage: string;
  date: string;
  location: string;
  meetingUrl?: string | null;
  interviewerName?: string | null;
  prepDone: number;
  prepTotal: number;
}

export interface DashboardAnalyticsDTO {
  summary: DashboardSummaryDTO;
  weeklyVelocity: WeeklyVelocityDTO;
  pipeline: Record<ApplicationStatus, number>;
  upcomingInterviews?: DashboardUpcomingInterviewDTO[];
}

export interface ParsedJobMetadataDTO {
  url?: string;
  companyName?: string;
  position?: string;
  source?: string;
  location?: string;
  workSetup?: WorkSetup;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description?: string;
  extractedVia?: 'json-ld' | 'opengraph' | 'heuristic' | 'url' | 'text_snippet' | 'bot_protected';
  isBotProtected?: boolean;
  botPlatform?: string;
  message?: string;
}



