import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../api/resume-api';
import { coverLetterApi } from '@/features/cover-letters/api/cover-letter-api';
import { tailoringApi } from '@/features/tailoring/api/tailoring-api';
import { ResumeCard } from '../components/resume-card';
import { CoverLetterCard } from '../components/cover-letter-card';
import { ResumeFilters } from '../components/resume-filters';
import { ResumeFormModal } from '../components/resume-form-modal';
import { ResumeDetailModal } from '../components/resume-detail-modal';
import { DocumentPreviewModal } from '@/features/tailoring/components/document-preview-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { ResumeWithDetailsDTO, CoverLetterWithDetailsDTO, CoverLetterDTO } from '@tracker/types';
import { CreateResumeInput } from '@tracker/validation';
import {
  FileText,
  Plus,
  Briefcase,
  Layers,
  Sparkles,
  Upload,
  Mail,
  Files,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type DocumentTab = 'all' | 'resumes' | 'cover_letters';

export function ResumesPage() {
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<DocumentTab>('all');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sortBy, setSortBy] = useState('recent_desc');

  // Modal states - Resumes
  const [selectedResume, setSelectedResume] = useState<ResumeWithDetailsDTO | null>(null);
  const [previewingResume, setPreviewingResume] = useState<ResumeWithDetailsDTO | null>(null);
  const [editingResume, setEditingResume] = useState<ResumeWithDetailsDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingResume, setDeletingResume] = useState<ResumeWithDetailsDTO | null>(null);

  // Modal states - Cover Letters
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<CoverLetterWithDetailsDTO | null>(null);
  const [editingCoverLetter, setEditingCoverLetter] = useState<CoverLetterWithDetailsDTO | null>(null);
  const [deletingCoverLetter, setDeletingCoverLetter] = useState<CoverLetterWithDetailsDTO | null>(null);

  // Derived API sort params for resumes query
  const apiSortParams = useMemo(() => {
    switch (sortBy) {
      case 'updated_desc':
        return { sortBy: 'updatedAt' as const, sortOrder: 'desc' as const };
      case 'name_asc':
        return { sortBy: 'name' as const, sortOrder: 'asc' as const };
      case 'recent_desc':
      default:
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    }
  }, [sortBy]);

  // Fetch Resumes
  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes', search, selectedRole, apiSortParams],
    queryFn: () =>
      resumeApi.getResumes({
        search: search.trim() || undefined,
        targetRole: selectedRole || undefined,
        sortBy: apiSortParams.sortBy,
        sortOrder: apiSortParams.sortOrder,
      }),
  });

  // Fetch Cover Letters
  const { data: rawCoverLetters = [], isLoading: coverLettersLoading } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => coverLetterApi.getAll(),
  });

  // Filter Cover Letters locally based on search & role
  const coverLetters = useMemo(() => {
    let list = [...rawCoverLetters];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (cl) =>
          cl.name.toLowerCase().includes(q) ||
          (cl.role && cl.role.toLowerCase().includes(q)) ||
          (cl.company && cl.company.toLowerCase().includes(q)) ||
          cl.content.toLowerCase().includes(q)
      );
    }

    if (selectedRole) {
      list = list.filter((cl) => cl.role === selectedRole);
    }

    // Sort cover letters
    list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [rawCoverLetters, search, selectedRole, sortBy]);

  // Combined documents for "All" tab
  type UnifiedDoc =
    | { type: 'resume'; data: ResumeWithDetailsDTO; createdAt: string; updatedAt: string; name: string }
    | { type: 'cover_letter'; data: CoverLetterWithDetailsDTO; createdAt: string; updatedAt: string; name: string };

  const unifiedDocs = useMemo<UnifiedDoc[]>(() => {
    const list: UnifiedDoc[] = [
      ...resumes.map((r) => ({
        type: 'resume' as const,
        data: r,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        name: r.name,
      })),
      ...coverLetters.map((cl) => ({
        type: 'cover_letter' as const,
        data: cl,
        createdAt: cl.createdAt,
        updatedAt: cl.updatedAt,
        name: cl.name,
      })),
    ];

    list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [resumes, coverLetters, sortBy]);

  // Extract distinct target roles for the dropdown across both resumes & cover letters
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    resumes.forEach((r) => {
      if (r.targetRole) set.add(r.targetRole);
    });
    rawCoverLetters.forEach((cl) => {
      if (cl.role) set.add(cl.role);
    });
    return Array.from(set).sort();
  }, [resumes, rawCoverLetters]);

  // Statistics
  const totalResumes = resumes.length;
  const totalCoverLetters = coverLetters.length;
  const totalDocs = resumes.length + coverLetters.length;

  const totalLinkedApplications = useMemo(() => {
    const resumeApps = resumes.reduce((acc, r) => acc + (r.applicationsCount || 0), 0);
    const coverLetterApps = rawCoverLetters.filter((cl) => Boolean(cl.applicationId)).length;
    return resumeApps + coverLetterApps;
  }, [resumes, rawCoverLetters]);

  // Mutations - Resumes
  const createResumeMutation = useMutation({
    mutationFn: (input: CreateResumeInput) => resumeApi.createResume(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-count'] });
      setIsCreateOpen(false);
    },
  });

  const updateResumeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateResumeInput }) =>
      resumeApi.updateResume(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-count'] });
      setEditingResume(null);
      if (selectedResume && selectedResume.id === data.id) {
        setSelectedResume(data);
      }
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => resumeApi.setDefaultResume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-count'] });
      if (selectedResume && selectedResume.id === data.id) {
        setSelectedResume(data);
      }
    },
  });

  const setCanonicalMutation = useMutation({
    mutationFn: (id: string) => resumeApi.setCanonicalResume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      if (selectedResume && selectedResume.id === data.id) {
        setSelectedResume(data);
      }
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: string) => resumeApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-count'] });
      setDeletingResume(null);
      if (selectedResume && deletingResume && selectedResume.id === deletingResume.id) {
        setSelectedResume(null);
      }
    },
  });

  // Mutations - Cover Letters
  const deleteCoverLetterMutation = useMutation({
    mutationFn: (id: string) => coverLetterApi.deleteCoverLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      queryClient.invalidateQueries({ queryKey: ['cover-letters-count'] });
      setDeletingCoverLetter(null);
      if (selectedCoverLetter && deletingCoverLetter && selectedCoverLetter.id === deletingCoverLetter.id) {
        setSelectedCoverLetter(null);
      }
    },
  });

  const handleCreateSubmit = async (data: CreateResumeInput) => {
    await createResumeMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (data: CreateResumeInput) => {
    if (!editingResume) return;
    await updateResumeMutation.mutateAsync({ id: editingResume.id, input: data });
  };

  const handleSetDefault = async (resume: ResumeWithDetailsDTO) => {
    await setDefaultMutation.mutateAsync(resume.id);
  };

  const handleSetCanonical = async (resume: ResumeWithDetailsDTO) => {
    await setCanonicalMutation.mutateAsync(resume.id);
  };

  const handleDeleteResumeConfirm = async () => {
    if (!deletingResume) return;
    await deleteResumeMutation.mutateAsync(deletingResume.id);
  };

  const handleDeleteCoverLetterConfirm = async () => {
    if (!deletingCoverLetter) return;
    await deleteCoverLetterMutation.mutateAsync(deletingCoverLetter.id);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSortBy('recent_desc');
  };

  const isLoading = resumesLoading || coverLettersLoading;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
            Documents
          </h1>
          <p className="text-small text-muted-foreground mt-1">
            Store and manage your resumes and cover letters, and track which opportunity each document is linked to.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-small rounded-lg shadow-sm hover:opacity-95 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Resume</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-border py-3 text-small">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-md bg-secondary text-foreground shrink-0">
            <Files size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalDocs}
            </div>
            <div className="text-micro text-muted-foreground">Total documents</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-l border-border">
          <div className="p-2 rounded-md bg-secondary text-foreground shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalResumes}
            </div>
            <div className="text-micro text-muted-foreground">Resumes</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-secondary text-foreground shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalCoverLetters}
            </div>
            <div className="text-micro text-muted-foreground">Cover letters</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-primary">
              {totalLinkedApplications}
            </div>
            <div className="text-micro text-muted-foreground">Linked to opportunities</div>
          </div>
        </div>
      </div>

      {/* Document Type Switcher Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-3.5 py-1.5 text-small font-medium rounded-lg transition-colors cursor-pointer',
            activeTab === 'all'
              ? 'bg-secondary text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          All Documents ({totalDocs})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resumes')}
          className={cn(
            'px-3.5 py-1.5 text-small font-medium rounded-lg transition-colors cursor-pointer',
            activeTab === 'resumes'
              ? 'bg-secondary text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          Resumes ({totalResumes})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cover_letters')}
          className={cn(
            'px-3.5 py-1.5 text-small font-medium rounded-lg transition-colors cursor-pointer',
            activeTab === 'cover_letters'
              ? 'bg-secondary text-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          Cover Letters ({totalCoverLetters})
        </button>
      </div>

      {/* Filter Bar */}
      <ResumeFilters
        search={search}
        onSearchChange={setSearch}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        availableRoles={availableRoles}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={handleResetFilters}
      />

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card border border-border rounded-xl p-5 h-44 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
              <div className="h-8 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : activeTab === 'all' && unifiedDocs.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/40">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Files size={24} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-subheading text-foreground">
              {search || selectedRole ? 'No matching documents found' : 'No documents in storage yet'}
            </h3>
            <p className="text-small text-muted-foreground max-w-sm mt-1">
              {search || selectedRole
                ? 'Try adjusting your filters or search keywords to find what you are looking for.'
                : 'Upload tailored resumes or generate tailored cover letters for your applications.'}
            </p>
          </div>
          {search || selectedRole ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-small font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-small font-semibold rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Upload size={15} />
              <span>Add Your First Resume</span>
            </button>
          )}
        </div>
      ) : activeTab === 'resumes' && resumes.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/40">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-subheading text-foreground">
              {search || selectedRole ? 'No matching resumes found' : 'No resumes added yet'}
            </h3>
            <p className="text-small text-muted-foreground max-w-sm mt-1">
              {search || selectedRole
                ? 'Try adjusting your filters or search keywords.'
                : 'Upload or link tailored resumes to track what you sent each employer.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-small font-semibold rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Upload size={15} />
            <span>Add Resume</span>
          </button>
        </div>
      ) : activeTab === 'cover_letters' && coverLetters.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/40">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-subheading text-foreground">
              {search || selectedRole ? 'No matching cover letters found' : 'No cover letters created yet'}
            </h3>
            <p className="text-small text-muted-foreground max-w-sm mt-1">
              Generate targeted cover letters directly from your applications using the Tailoring Studio.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'all' &&
            unifiedDocs.map((item) =>
              item.type === 'resume' ? (
                <ResumeCard
                  key={`resume-${item.data.id}`}
                  resume={item.data}
                  onSelect={setSelectedResume}
                  onEdit={setEditingResume}
                  onDelete={setDeletingResume}
                  onSetDefault={handleSetDefault}
                />
              ) : (
                <CoverLetterCard
                  key={`cl-${item.data.id}`}
                  coverLetter={item.data}
                  onSelect={setSelectedCoverLetter}
                  onEdit={(cl) => {
                    setSelectedCoverLetter(cl);
                  }}
                  onDelete={setDeletingCoverLetter}
                />
              )
            )}

          {activeTab === 'resumes' &&
            resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onSelect={setSelectedResume}
                onEdit={setEditingResume}
                onDelete={setDeletingResume}
                onSetDefault={handleSetDefault}
              />
            ))}

          {activeTab === 'cover_letters' &&
            coverLetters.map((letter) => (
              <CoverLetterCard
                key={letter.id}
                coverLetter={letter}
                onSelect={setSelectedCoverLetter}
                onEdit={(cl) => {
                  setSelectedCoverLetter(cl);
                }}
                onDelete={setDeletingCoverLetter}
              />
            ))}
        </div>
      )}

      {/* Modals - Resumes */}
      <ResumeFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <ResumeFormModal
        isOpen={Boolean(editingResume)}
        onClose={() => setEditingResume(null)}
        onSubmit={handleEditSubmit}
        resume={editingResume}
      />

      <ResumeDetailModal
        isOpen={Boolean(selectedResume)}
        onClose={() => setSelectedResume(null)}
        resume={selectedResume}
        onEdit={(r) => {
          setSelectedResume(null);
          setEditingResume(r);
        }}
        onDelete={(r) => {
          setSelectedResume(null);
          setDeletingResume(r);
        }}
        onSetDefault={handleSetDefault}
        onSetCanonical={handleSetCanonical}
        onPreviewFullscreen={(r) => {
          setPreviewingResume(r);
        }}
      />

      {/* Modals - Resume Fullscreen Preview */}
      {previewingResume && (
        <DocumentPreviewModal
          isOpen={Boolean(previewingResume)}
          onClose={() => setPreviewingResume(null)}
          title={previewingResume.name}
          previewHtmlUrl={
            previewingResume.isTailored || previewingResume.content
              ? tailoringApi.getResumeHtmlUrl(previewingResume.id)
              : null
          }
          fileUrl={previewingResume.fileUrl}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingResume)}
        onClose={() => setDeletingResume(null)}
        onConfirm={handleDeleteResumeConfirm}
        title="Delete Resume Document"
        description={
          deletingResume?.applicationsCount && deletingResume.applicationsCount > 0 ? (
            <span>
              This resume is currently linked to{' '}
              <strong>
                {deletingResume.applicationsCount}{' '}
                {deletingResume.applicationsCount === 1 ? 'application' : 'applications'}
              </strong>
              . Deleting it will detach the resume from those applications.
            </span>
          ) : (
            'Are you sure you want to permanently delete this resume document?'
          )
        }
        itemName={deletingResume?.name}
        isPending={deleteResumeMutation.isPending}
      />

      {/* Modals - Cover Letters */}
      {selectedCoverLetter && (
        <DocumentPreviewModal
          isOpen={Boolean(selectedCoverLetter)}
          onClose={() => setSelectedCoverLetter(null)}
          title={selectedCoverLetter.name}
          previewHtmlUrl={tailoringApi.getCoverLetterHtmlUrl(selectedCoverLetter.id)}
          fileUrl={selectedCoverLetter.fileUrl}
          coverLetter={selectedCoverLetter}
          onCoverLetterUpdated={(updated: CoverLetterDTO) => {
            queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
            setSelectedCoverLetter((prev) => (prev ? { ...prev, ...updated } : null));
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingCoverLetter)}
        onClose={() => setDeletingCoverLetter(null)}
        onConfirm={handleDeleteCoverLetterConfirm}
        title="Delete Cover Letter Document"
        description={
          deletingCoverLetter?.application ? (
            <span>
              This cover letter is currently linked to{' '}
              <strong>
                {deletingCoverLetter.application.company?.name || 'an application'}
              </strong>
              . Are you sure you want to permanently delete it?
            </span>
          ) : (
            'Are you sure you want to permanently delete this cover letter document?'
          )
        }
        itemName={deletingCoverLetter?.name}
        isPending={deleteCoverLetterMutation.isPending}
      />
    </div>
  );
}
