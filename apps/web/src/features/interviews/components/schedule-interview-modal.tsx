import React, { useState, useEffect } from 'react';
import { CreateInterviewInput, UpdateInterviewInput } from '@tracker/validation';
import { InterviewDTO, ApplicationDTO } from '@tracker/types';
import { X, Calendar, Clock, Video, User, FileText } from 'lucide-react';
import { applicationApi } from '@/features/applications/api/application-api';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateInterviewInput | UpdateInterviewInput) => Promise<void>;
  initialData?: InterviewDTO | null;
  defaultApplicationId?: string;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultApplicationId,
}: ScheduleInterviewModalProps) {
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [applicationId, setApplicationId] = useState<string>(
    initialData?.applicationId || defaultApplicationId || ''
  );
  const [round, setRound] = useState<number>(initialData?.round || 1);
  const [type, setType] = useState<string>(initialData?.type || 'TECHNICAL');
  const [title, setTitle] = useState<string>(initialData?.title || '');

  // Format ISO for datetime-local input
  const defaultDateTime = () => {
    if (initialData?.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [scheduledAt, setScheduledAt] = useState<string>(defaultDateTime());
  const [durationMinutes, setDurationMinutes] = useState<number>(initialData?.durationMinutes || 45);
  const [interviewerName, setInterviewerName] = useState<string>(initialData?.interviewerName || '');
  const [interviewerRole, setInterviewerRole] = useState<string>(initialData?.interviewerRole || '');
  const [meetingUrl, setMeetingUrl] = useState<string>(initialData?.meetingUrl || '');
  const [location, setLocation] = useState<string>(initialData?.location || 'Google Meet');
  const [prepNotes, setPrepNotes] = useState<string>(initialData?.prepNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active applications for dropdown if not pre-scoped
  useEffect(() => {
    if (isOpen && !defaultApplicationId) {
      applicationApi
        .getApplications({ limit: 50 })
        .then((res) => {
          setApplications(res.data);
          if (!applicationId && res.data.length > 0) {
            setApplicationId(res.data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, defaultApplicationId]);

  // Sync state if initialData changes
  useEffect(() => {
    if (initialData) {
      setApplicationId(initialData.applicationId);
      setRound(initialData.round);
      setType(initialData.type);
      setTitle(initialData.title || '');
      setScheduledAt(defaultDateTime());
      setDurationMinutes(initialData.durationMinutes);
      setInterviewerName(initialData.interviewerName || '');
      setInterviewerRole(initialData.interviewerRole || '');
      setMeetingUrl(initialData.meetingUrl || '');
      setLocation(initialData.location || 'Google Meet');
      setPrepNotes(initialData.prepNotes || '');
    } else if (defaultApplicationId) {
      setApplicationId(defaultApplicationId);
    }
  }, [initialData, defaultApplicationId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const isoScheduled = new Date(scheduledAt).toISOString();
      await onSubmit({
        applicationId,
        round: Number(round),
        type: type as any,
        title: title.trim() || undefined,
        scheduledAt: isoScheduled,
        durationMinutes: Number(durationMinutes),
        interviewerName: interviewerName.trim() || undefined,
        interviewerRole: interviewerRole.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        location: location.trim() || undefined,
        prepNotes: prepNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 id="modal-title" className="font-display font-semibold text-subheading text-foreground">
              {initialData ? 'Edit interview' : 'Schedule interview'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-small">
              {error}
            </div>
          )}

          {/* Target Application */}
          {!defaultApplicationId && (
            <div>
              <label htmlFor="app-select" className="block text-small font-medium text-foreground mb-1">
                Opportunity / Application *
              </label>
              <select
                id="app-select"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company?.name} — {app.job?.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Round & Interview Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="interview-round" className="block text-small font-medium text-foreground mb-1">
                Round Number
              </label>
              <input
                id="interview-round"
                type="number"
                min={1}
                max={10}
                value={round}
                onChange={(e) => setRound(Number(e.target.value))}
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="interview-type" className="block text-small font-medium text-foreground mb-1">
                Interview Type *
              </label>
              <select
                id="interview-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="HR">HR Interview</option>
                <option value="RECRUITER">Recruiter Screen</option>
                <option value="TECHNICAL">Technical Deep Dive</option>
                <option value="CODING_ASSESSMENT">Coding Assessment</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="FINAL">Final Interview</option>
                <option value="CLIENT">Client Interview</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Custom Round Title */}
          <div>
            <label htmlFor="interview-title" className="block text-small font-medium text-foreground mb-1">
              Custom Title / Focus <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="interview-title"
              type="text"
              placeholder="e.g. Frontend Architecture with Team Lead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Date & Time + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="interview-time" className="block text-small font-medium text-foreground mb-1">
                Date & Time *
              </label>
              <input
                id="interview-time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="interview-duration" className="block text-small font-medium text-foreground mb-1">
                Duration
              </label>
              <select
                id="interview-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Meeting Link & Platform */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="interview-location" className="block text-small font-medium text-foreground mb-1">
                Platform / Location
              </label>
              <input
                id="interview-location"
                type="text"
                placeholder="Google Meet, Zoom, Onsite"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="interview-url" className="block text-small font-medium text-foreground mb-1">
                Meeting URL
              </label>
              <input
                id="interview-url"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Interviewer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="interviewer-name" className="block text-small font-medium text-foreground mb-1">
                Interviewer Name
              </label>
              <input
                id="interviewer-name"
                type="text"
                placeholder="Dana Reyes"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="interviewer-role" className="block text-small font-medium text-foreground mb-1">
                Interviewer Role
              </label>
              <input
                id="interviewer-role"
                type="text"
                placeholder="Engineering Manager"
                value={interviewerRole}
                onChange={(e) => setInterviewerRole(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Prep Notes & Questions */}
          <div>
            <label htmlFor="interview-prep" className="block text-small font-medium text-foreground mb-1">
              Preparation Notes & Talking Points
            </label>
            <textarea
              id="interview-prep"
              rows={3}
              placeholder="Key skills to emphasize, questions to ask the interviewer, technical topics to review..."
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border text-small font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save changes' : 'Schedule interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
