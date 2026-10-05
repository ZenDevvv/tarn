import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactApi } from '../api/contact-api';
import { companyApi } from '@/features/companies/api/company-api';
import { applicationApi } from '@/features/applications/api/application-api';
import { ContactCard } from '../components/contact-card';
import { ContactFilters } from '../components/contact-filters';
import { ContactFormModal } from '../components/contact-form-modal';
import { ContactDetailModal } from '../components/contact-detail-modal';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { ContactWithDetailsDTO } from '@tracker/types';
import { CreateContactInput, UpdateContactInput } from '@tracker/validation';
import { Users, Plus, Building2, Briefcase, UserCheck } from 'lucide-react';

export function ContactsPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [hasApplicationFilter, setHasApplicationFilter] = useState('all'); // 'all' | 'linked' | 'unlinked'
  const [sortBy, setSortBy] = useState('name_asc');

  // Modal states
  const [selectedContact, setSelectedContact] = useState<ContactWithDetailsDTO | null>(null);
  const [editingContact, setEditingContact] = useState<ContactWithDetailsDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<ContactWithDetailsDTO | null>(null);

  // Derived API params
  const apiSortParams = useMemo(() => {
    switch (sortBy) {
      case 'name_desc':
        return { sortBy: 'name' as const, sortOrder: 'desc' as const };
      case 'recent_desc':
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
      case 'role_asc':
        return { sortBy: 'role' as const, sortOrder: 'asc' as const };
      case 'name_asc':
      default:
        return { sortBy: 'name' as const, sortOrder: 'asc' as const };
    }
  }, [sortBy]);

  const hasApplicationParam = useMemo(() => {
    if (hasApplicationFilter === 'linked') return 'true' as const;
    if (hasApplicationFilter === 'unlinked') return 'false' as const;
    return undefined;
  }, [hasApplicationFilter]);

  // Fetch Contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', search, selectedCompany, hasApplicationParam, apiSortParams],
    queryFn: () =>
      contactApi.getContacts({
        search: search.trim() || undefined,
        companyId: selectedCompany || undefined,
        hasApplication: hasApplicationParam,
        sortBy: apiSortParams.sortBy,
        sortOrder: apiSortParams.sortOrder,
      }),
  });

  // Fetch Companies for dropdown
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.getCompanies({}),
    staleTime: 60000,
  });

  // Fetch Applications for dropdown
  const { data: appsResponse } = useQuery({
    queryKey: ['applications-all'],
    queryFn: () => applicationApi.getApplications({ limit: 100 }),
    staleTime: 60000,
  });

  const availableApplications = useMemo(() => {
    if (!appsResponse?.data) return [];
    return appsResponse.data.map((app) => ({
      id: app.id,
      position: app.job?.title || 'Unknown Position',
      companyName: app.company?.name || 'Unknown Company',
    }));
  }, [appsResponse]);

  // Overall statistics
  const totalContacts = contacts.length;
  const linkedApplicationsCount = useMemo(
    () => contacts.reduce((acc, c) => acc + (c.applicationId ? 1 : 0), 0),
    [contacts]
  );
  const distinctCompaniesCount = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.company?.name) set.add(c.company.name);
    });
    return set.size;
  }, [contacts]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateContactInput) => contactApi.createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-count'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactInput }) =>
      contactApi.updateContact(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-count'] });
      setEditingContact(null);
      if (selectedContact && selectedContact.id === data.id) {
        setSelectedContact(data as ContactWithDetailsDTO);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-count'] });
      setDeletingContact(null);
      if (selectedContact && deletingContact && selectedContact.id === deletingContact.id) {
        setSelectedContact(null);
      }
    },
  });

  const handleCreateSubmit = async (data: CreateContactInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditSubmit = async (data: CreateContactInput) => {
    if (!editingContact) return;
    await updateMutation.mutateAsync({ id: editingContact.id, input: data });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;
    await deleteMutation.mutateAsync(deletingContact.id);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCompany('');
    setHasApplicationFilter('all');
    setSortBy('name_asc');
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <Users size={24} className="text-primary" />
            <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
              Contacts
            </h1>
          </div>
          <p className="text-small text-muted-foreground mt-1">
            Directory of recruiters, hiring managers, and professional contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Add contact</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-border py-3 text-small">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <Users size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {totalContacts}
            </div>
            <div className="text-micro text-muted-foreground">Total contacts</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-primary">
              {linkedApplicationsCount}
            </div>
            <div className="text-micro text-muted-foreground">Linked to opportunities</div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="p-2 rounded-md bg-secondary text-foreground">
            <Building2 size={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-heading text-foreground">
              {distinctCompaniesCount}
            </div>
            <div className="text-micro text-muted-foreground">Target companies</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        companies={allCompanies}
        hasApplicationFilter={hasApplicationFilter}
        onHasApplicationFilterChange={setHasApplicationFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={handleResetFilters}
      />

      {/* Contacts List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 h-48 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onSelect={setSelectedContact}
              onEdit={setEditingContact}
              onDelete={setDeletingContact}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-xl">
          <div className="p-3 rounded-full bg-secondary text-muted-foreground mb-3">
            <Users size={28} />
          </div>
          <h3 className="font-display font-semibold text-heading text-foreground">
            {search || selectedCompany || hasApplicationFilter !== 'all'
              ? 'No contacts match your filters'
              : 'No contacts added yet'}
          </h3>
          <p className="text-small text-muted-foreground mt-1 max-w-sm">
            {search || selectedCompany || hasApplicationFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting your filters.'
              : 'Keep track of recruiters, hiring managers, and interviewers in one place.'}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {search || selectedCompany || hasApplicationFilter !== 'all' ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-4 rounded-md border border-input bg-background hover:bg-secondary text-foreground font-medium text-small transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} strokeWidth={1.5} />
                <span>Add your first contact</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      <ContactDetailModal
        isOpen={Boolean(selectedContact)}
        onClose={() => setSelectedContact(null)}
        contact={selectedContact}
        onEdit={(c) => {
          setSelectedContact(null);
          setEditingContact(c);
        }}
        onDelete={(c) => {
          setSelectedContact(null);
          setDeletingContact(c);
        }}
      />

      {/* Create Contact Modal */}
      <ContactFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        companies={allCompanies}
        applications={availableApplications}
      />

      {/* Edit Contact Modal */}
      <ContactFormModal
        isOpen={Boolean(editingContact)}
        onClose={() => setEditingContact(null)}
        onSubmit={handleEditSubmit}
        contact={editingContact}
        companies={allCompanies}
        applications={availableApplications}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingContact)}
        onClose={() => setDeletingContact(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete contact"
        description={
          deletingContact ? (
            <span>
              Are you sure you want to delete <strong>{deletingContact.name}</strong>? This action cannot be undone.
            </span>
          ) : undefined
        }
        confirmLabel="Delete contact"
      />
    </div>
  );
}
