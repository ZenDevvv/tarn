import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/company-api';
import { CompanyCard } from '../components/company-card';
import { CompanyFilters } from '../components/company-filters';
import { CompanyDetailModal } from '../components/company-detail-modal';
import { CompanyFormModal } from '../components/company-form-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { CompanyWithDetailsDTO } from '@tracker/types';
import { CreateCompanyInput, UpdateCompanyInput } from '@tracker/validation';
import { Building2, Plus, Sparkles, Briefcase, Activity } from 'lucide-react';

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const { id: routeCompanyId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const queryCompanyId = searchParams.get('companyId');
  const activeCompanyId = routeCompanyId || queryCompanyId || null;

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortBy, setSortBy] = useState('name_asc');

  // Modal states
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetailsDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<CompanyWithDetailsDTO | null>(null);

  // Derived API params
  const apiSortParams = useMemo(() => {
    switch (sortBy) {
      case 'name_desc':
        return { sortBy: 'name' as const, sortOrder: 'desc' as const };
      case 'apps_desc':
        return { sortBy: 'applicationsCount' as const, sortOrder: 'desc' as const };
      case 'recent_desc':
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
      case 'name_asc':
      default:
        return { sortBy: 'name' as const, sortOrder: 'asc' as const };
    }
  }, [sortBy]);

  const hasActiveParam = useMemo(() => {
    if (activeFilter === 'active') return 'true' as const;
    if (activeFilter === 'inactive') return 'false' as const;
    return undefined;
  }, [activeFilter]);

  // Fetch Companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', search, selectedIndustry, hasActiveParam, apiSortParams],
    queryFn: () =>
      companyApi.getCompanies({
        search: search.trim() || undefined,
        industry: selectedIndustry || undefined,
        hasActive: hasActiveParam,
        sortBy: apiSortParams.sortBy,
        sortOrder: apiSortParams.sortOrder,
      }),
  });

  // Extract distinct industries from all companies for the dropdown
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies-all-industries'],
    queryFn: () => companyApi.getCompanies({}),
    staleTime: 60000,
  });

  // Check if company is already available in the list
  const cachedCompany = useMemo(() => {
    if (!activeCompanyId) return null;
    return (
      companies.find((c) => c.id === activeCompanyId) ||
      allCompanies.find((c) => c.id === activeCompanyId) ||
      null
    );
  }, [activeCompanyId, companies, allCompanies]);

  // Fetch full details for the deeplinked company (cached immediately if present in list)
  const {
    data: fetchedCompany,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ['company-detail', activeCompanyId],
    queryFn: () => (activeCompanyId ? companyApi.getCompany(activeCompanyId) : null),
    enabled: Boolean(activeCompanyId),
    initialData: cachedCompany ?? undefined,
  });

  const activeCompany = fetchedCompany || cachedCompany || null;

  const industries = useMemo(() => {
    const set = new Set<string>();
    allCompanies.forEach((c) => {
      if (c.industry && c.industry.trim()) {
        set.add(c.industry.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allCompanies]);

  // Overall statistics
  const totalCompanies = allCompanies.length;
  const totalActivePipelines = useMemo(
    () => allCompanies.reduce((acc, c) => acc + (c.activeApplicationsCount > 0 ? 1 : 0), 0),
    [allCompanies]
  );
  const totalApplications = useMemo(
    () => allCompanies.reduce((acc, c) => acc + c.applicationsCount, 0),
    [allCompanies]
  );

  // Deeplink navigation handlers
  const handleSelectCompany = (company: CompanyWithDetailsDTO) => {
    navigate(`/companies/${company.id}${location.search}`);
  };

  const handleCloseDetail = () => {
    if (searchParams.has('companyId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('companyId');
      const qs = nextParams.toString();
      navigate(`/companies${qs ? `?${qs}` : ''}`);
    } else {
      navigate(`/companies${location.search}`);
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateCompanyInput) => companyApi.createCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-all-industries'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCompanyInput }) =>
      companyApi.updateCompany(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-all-industries'] });
      queryClient.invalidateQueries({ queryKey: ['company-detail', variables.id] });
      setEditingCompany(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-all-industries'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      setDeletingCompany(null);
      if (activeCompanyId) {
        handleCloseDetail();
      }
    },
  });

  const handleCreateSubmit = async (data: CreateCompanyInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (data: CreateCompanyInput) => {
    if (!editingCompany) return;
    await updateMutation.mutateAsync({ id: editingCompany.id, input: data });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    await deleteMutation.mutateAsync(deletingCompany.id);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedIndustry('');
    setActiveFilter('all');
    setSortBy('name_asc');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <Building2 size={24} className="text-primary" />
            <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
              Companies
            </h1>
          </div>
          <p className="text-small text-muted-foreground mt-1">
            Directory of target employers, application histories, and pipeline status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Add company</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-border py-3 text-small">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <Building2 size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalCompanies}
            </div>
            <div className="text-micro text-muted-foreground">Total employers tracked</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Activity size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-primary">
              {totalActivePipelines}
            </div>
            <div className="text-micro text-muted-foreground">With active applications</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalApplications}
            </div>
            <div className="text-micro text-muted-foreground">Roles applied across all</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <CompanyFilters
        search={search}
        onSearchChange={setSearch}
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        industries={industries}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={handleResetFilters}
      />

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 h-48 animate-pulse flex flex-col justify-between"
            >
              <div className="flex flex-col gap-2.5">
                <div className="h-5 w-2/3 bg-secondary rounded" />
                <div className="h-4 w-1/3 bg-secondary rounded" />
              </div>
              <div className="h-10 bg-secondary/60 rounded" />
            </div>
          ))}
        </div>
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={handleSelectCompany}
              onEdit={setEditingCompany}
              onDelete={setDeletingCompany}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/50">
          <div className="p-3.5 rounded-full bg-secondary text-muted-foreground mb-3">
            <Building2 size={32} />
          </div>
          <h3 className="font-display font-semibold text-subheading text-foreground">
            {search || selectedIndustry || activeFilter !== 'all'
              ? 'No matching companies found'
              : 'No companies tracked yet'}
          </h3>
          <p className="text-small text-muted-foreground mt-1 max-w-md">
            {search || selectedIndustry || activeFilter !== 'all'
              ? 'Try adjusting your search criteria or clearing active filters.'
              : 'Companies are automatically added when you submit or save job applications, or you can add target companies manually.'}
          </p>
          <div className="mt-5 flex items-center gap-3">
            {search || selectedIndustry || activeFilter !== 'all' ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-4 rounded-md border border-border text-foreground hover:bg-secondary font-medium text-small transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={16} />
              <span>Add your first company</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {/* 1. Deeplinked Detail Modal */}
      <CompanyDetailModal
        isOpen={Boolean(activeCompanyId)}
        company={activeCompany}
        isLoading={Boolean(activeCompanyId && !activeCompany && isLoadingDetail)}
        onClose={handleCloseDetail}
        onEdit={(comp) => {
          setEditingCompany(comp);
        }}
        onDelete={(comp) => {
          setDeletingCompany(comp);
        }}
      />

      {/* 2. Create Modal */}
      <CompanyFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        company={null}
      />

      {/* 3. Edit Modal */}
      <CompanyFormModal
        isOpen={Boolean(editingCompany)}
        onClose={() => setEditingCompany(null)}
        onSubmit={handleEditSubmit}
        company={editingCompany}
      />

      {/* 4. Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingCompany)}
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Company?"
        itemName={deletingCompany?.name}
        description={
          <div>
            Are you sure you want to delete <span className="font-semibold">{deletingCompany?.name}</span>?
            {deletingCompany && deletingCompany.applicationsCount > 0 && (
              <p className="mt-2 text-destructive font-medium">
                Warning: This company currently has {deletingCompany.applicationsCount} associated{' '}
                {deletingCompany.applicationsCount === 1 ? 'application' : 'applications'}. Deleting the company
                will also remove its application history.
              </p>
            )}
          </div>
        }
        confirmLabel="Delete Company"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
