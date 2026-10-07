import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../api/resume-api';
import { ResumeCard } from '../components/resume-card';
import { ResumeFilters } from '../components/resume-filters';
import { ResumeFormModal } from '../components/resume-form-modal';
import { ResumeDetailModal } from '../components/resume-detail-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { ResumeWithDetailsDTO } from '@tracker/types';
import { CreateResumeInput } from '@tracker/validation';
import {
  FileText,
  Plus,
  Briefcase,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';

export function ResumesPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sortBy, setSortBy] = useState('recent_desc');

  // Modal states
  const [selectedResume, setSelectedResume] = useState<ResumeWithDetailsDTO | null>(null);
  const [editingResume, setEditingResume] = useState<ResumeWithDetailsDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingResume, setDeletingResume] = useState<ResumeWithDetailsDTO | null>(null);

  // Derived API params
  const apiSortParams = useMemo(() => {
    switch (sortBy) {
      case 'updated_desc':
        return { sortBy: 'updatedAt' as const, sortOrder: 'desc' as const };
      case 'name_asc':
        return { sortBy: 'name' as const, sortOrder: 'asc' as const };
      case 'version_desc':
        return { sortBy: 'version' as const, sortOrder: 'desc' as const };
      case 'recent_desc':
      default:
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    }
  }, [sortBy]);

  // Fetch Resumes
  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes', search, selectedRole, apiSortParams],
    queryFn: () =>
      resumeApi.getResumes({
        search: search.trim() || undefined,
        targetRole: selectedRole || undefined,
        sortBy: apiSortParams.sortBy,
        sortOrder: apiSortParams.sortOrder,
      }),
  });

  // Extract distinct target roles for the dropdown
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    resumes.forEach((r) => {
      if (r.targetRole) set.add(r.targetRole);
    });
    return Array.from(set).sort();
  }, [resumes]);

  // Metrics / Statistics
  const totalResumes = resumes.length;
  const totalLinkedApplications = useMemo(
    () => resumes.reduce((acc, r) => acc + (r.applicationsCount || 0), 0),
    [resumes]
  );
  const uniqueRolesCount = useMemo(() => {
    const set = new Set<string>();
    resumes.forEach((r) => {
      if (r.targetRole) set.add(r.targetRole);
    });
    return set.size;
  }, [resumes]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateResumeInput) => resumeApi.createResume(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes-count'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
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

  const deleteMutation = useMutation({
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

  const handleCreateSubmit = async (data: CreateResumeInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (data: CreateResumeInput) => {
    if (!editingResume) return;
    await updateMutation.mutateAsync({ id: editingResume.id, input: data });
  };

  const handleSetDefault = async (resume: ResumeWithDetailsDTO) => {
    await setDefaultMutation.mutateAsync(resume.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingResume) return;
    await deleteMutation.mutateAsync(deletingResume.id);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSortBy('recent_desc');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
            Resumes
          </h1>
          <p className="text-small text-muted-foreground mt-1">
            Manage multiple tailored resume versions and track which opportunities they were used for.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-small rounded-lg shadow-sm hover:opacity-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          <span>Add Resume Version</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-border py-3 text-small">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <FileText size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalResumes}
            </div>
            <div className="text-micro text-muted-foreground">Total versions</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-primary">
              {totalLinkedApplications}
            </div>
            <div className="text-micro text-muted-foreground">Linked to opportunities</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <Layers size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {uniqueRolesCount}
            </div>
            <div className="text-micro text-muted-foreground">Target roles configured</div>
          </div>
        </div>
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
      ) : resumes.length === 0 ? (
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
                ? 'Try adjusting your filters or search keywords to find what you are looking for.'
                : 'Upload or link tailored resume versions to track which version you submitted to each employer.'}
            </p>
          </div>
          {search || selectedRole ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-small font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
            >
              Reset filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-small font-semibold rounded-lg hover:opacity-95 transition-opacity"
            >
              <Upload size={15} />
              <span>Add Your First Resume</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onSelect={setSelectedResume}
              onEdit={setEditingResume}
              onDelete={setDeletingResume}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Modals */}
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
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingResume)}
        onClose={() => setDeletingResume(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Resume Version"
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
            'Are you sure you want to permanently delete this resume version?'
          )
        }
        itemName={deletingResume?.name}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
