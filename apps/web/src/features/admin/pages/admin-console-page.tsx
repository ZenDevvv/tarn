import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { useAuth } from "@/features/auth/context/auth-context";
import { AdminUserListItemDTO, Role } from "@tracker/types";
import {
  Activity,
  Users,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  UserCheck,
  UserX,
  Clock,
  HardDrive,
  FileText,
  Building2,
  Briefcase,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function AdminConsolePage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"system" | "users">("system");

  // Users Directory Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Modal States
  const [roleModalUser, setRoleModalUser] =
    useState<AdminUserListItemDTO | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<Role>("USER");
  const [statusModalUser, setStatusModalUser] =
    useState<AdminUserListItemDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const {
    data: systemStatus,
    isLoading: isSystemLoading,
    isRefetching: isSystemRefetching,
    refetch: refetchSystem,
  } = useQuery({
    queryKey: ["admin-system-status"],
    queryFn: () => adminApi.getSystemStatus(),
    refetchInterval: 20000,
  });

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isRefetching: isUsersRefetching,
  } = useQuery({
    queryKey: ["admin-users", search, roleFilter, statusFilter, page],
    queryFn: () =>
      adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? (roleFilter as Role) : undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "suspended"
              ? false
              : undefined,
        page,
        limit: 15,
      }),
    enabled: activeTab === "users",
  });

  // Role Mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleModalUser(null);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || "Failed to update user role");
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-system-status"] });
      setStatusModalUser(null);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.message || "Failed to update user status");
    },
  });

  const handleOpenRoleModal = (user: AdminUserListItemDTO) => {
    setRoleModalUser(user);
    setNewSelectedRole(user.role);
    setActionError(null);
  };

  const handleOpenStatusModal = (user: AdminUserListItemDTO) => {
    setStatusModalUser(user);
    setActionError(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-semibold bg-primary/15 text-primary border border-primary/25">
              <ShieldAlert size={12} />
              ADMIN CONSOLE
            </span>
          </div>
          <h1 className="font-display font-bold text-heading text-foreground mt-1 tracking-tight">
            System Administration
          </h1>
          <p className="text-small text-muted-foreground mt-0.5">
            Monitor real-time system diagnostics, platform telemetry, and user
            directory.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-secondary rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-small font-medium transition-all",
              activeTab === "system"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Activity size={15} />
            Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-small font-medium transition-all",
              activeTab === "users"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users size={15} />
            Users
          </button>
        </div>
      </div>

      {/* Tab 1: System Diagnostics */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-subheading text-foreground">
              Platform Health & Telemetry
            </h2>
            <button
              type="button"
              onClick={() => refetchSystem()}
              disabled={isSystemLoading || isSystemRefetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-small font-medium text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={cn(
                  isSystemRefetching && "animate-spin text-primary",
                )}
              />
              Refresh
            </button>
          </div>

          {/* Telemetry Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Health Card */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between text-muted-foreground text-caption font-medium">
                <span>SYSTEM HEALTH</span>
                <Server size={15} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span
                    className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      systemStatus?.status === "healthy"
                        ? "bg-emerald-400"
                        : "bg-amber-400",
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      systemStatus?.status === "healthy"
                        ? "bg-emerald-500"
                        : "bg-amber-500",
                    )}
                  />
                </span>
                <span className="font-display font-bold text-subheading text-foreground uppercase tracking-tight">
                  {systemStatus?.status || "CHECKING..."}
                </span>
              </div>
              <p className="text-caption text-muted-foreground mt-1">
                PostgreSQL latency: {systemStatus?.database.latencyMs ?? 0}ms
              </p>
            </div>

            {/* Uptime Card */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between text-muted-foreground text-caption font-medium">
                <span>SYSTEM UPTIME</span>
                <Clock size={15} />
              </div>
              <div className="mt-2 font-display font-bold text-subheading text-foreground tracking-tight">
                {systemStatus ? formatUptime(systemStatus.uptimeSeconds) : "—"}
              </div>
              <p className="text-caption text-muted-foreground mt-1">
                Environment: {systemStatus?.environment || "—"}
              </p>
            </div>

            {/* Runtime Info Card */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between text-muted-foreground text-caption font-medium">
                <span>NODE RUNTIME</span>
                <Cpu size={15} />
              </div>
              <div className="mt-2 font-display font-bold text-subheading text-foreground tracking-tight">
                {systemStatus?.nodeVersion || "—"}
              </div>
              <p
                className="text-caption text-muted-foreground mt-1 truncate"
                title={systemStatus?.platform}
              >
                OS: {systemStatus?.platform || "—"}
              </p>
            </div>

            {/* Memory Card */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between text-muted-foreground text-caption font-medium">
                <span>PROCESS MEMORY</span>
                <HardDrive size={15} />
              </div>
              <div className="mt-2 font-display font-bold text-subheading text-foreground tracking-tight">
                {systemStatus ? `${systemStatus.memory.heapUsedMb} MB` : "—"}
              </div>
              <div className="mt-1 flex items-center justify-between text-caption text-muted-foreground">
                <span>Heap: {systemStatus?.memory.heapTotalMb} MB</span>
                <span>RSS: {systemStatus?.memory.rssMb} MB</span>
              </div>
            </div>
          </div>

          {/* Database Volume Statistics */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary" />
              <h3 className="font-display font-semibold text-body text-foreground">
                Database Aggregate Footprint
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Users
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.users ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({systemStatus?.database.counts.activeUsers ?? 0} active)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Applications
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.applications ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  pipeline total
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Companies
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.companies ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  profiles
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Jobs
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.jobs ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  postings
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Interviews
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.interviews ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  rounds
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Resumes
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.resumes ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  variants
                </span>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-caption text-muted-foreground block font-medium">
                  Contacts
                </span>
                <span className="font-display font-bold text-heading text-foreground mt-0.5 block">
                  {systemStatus?.database.counts.contacts ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  network
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by role"
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admins Only</option>
                <option value="USER">Users Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by account status"
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-small border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-muted-foreground text-caption font-medium">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Joined</th>
                    <th className="py-3 px-3">Data Footprint</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isUsersLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw
                            size={18}
                            className="animate-spin text-primary"
                          />
                          <span>Loading user directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : usersData?.data?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    usersData?.data?.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-secondary font-semibold text-small grid place-items-center shrink-0 border border-border">
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[11px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-caption text-muted-foreground truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {u.role === "ADMIN" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/15 text-primary border border-primary/25">
                                <ShieldCheck size={11} />
                                ADMIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                                USER
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Suspended
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-caption text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 text-caption text-muted-foreground">
                              <span title="Applications">
                                {u.counts.applications} apps
                              </span>
                              <span>•</span>
                              <span title="Companies">
                                {u.counts.companies} co.
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(u)}
                                className="px-2.5 py-1 rounded text-caption font-medium border border-border hover:bg-secondary text-foreground transition-colors"
                              >
                                Role
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(u)}
                                className={cn(
                                  "px-2.5 py-1 rounded text-caption font-medium border transition-colors",
                                  u.isActive
                                    ? "border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
                                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
                                )}
                              >
                                {u.isActive ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {usersData?.meta && usersData.meta.totalPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-between text-caption text-muted-foreground">
                <span>
                  Page {usersData.meta.page} of {usersData.meta.totalPages} (
                  {usersData.meta.total} users)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={usersData.meta.page <= 1}
                    className="px-2.5 py-1 rounded border border-border text-foreground disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.min(usersData.meta.totalPages, p + 1))
                    }
                    disabled={usersData.meta.page >= usersData.meta.totalPages}
                    className="px-2.5 py-1 rounded border border-border text-foreground disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-subheading text-foreground">
                Update User Role
              </h3>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-small text-muted-foreground">
              Modify system access tier for{" "}
              <strong>{roleModalUser.name}</strong> ({roleModalUser.email}).
            </p>

            {actionError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-small flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {roleModalUser.id === currentUser?.id ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-small flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Self-demotion protection is active: you cannot revoke your own
                  administrator role.
                </span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <label className="text-small font-medium text-foreground block">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewSelectedRole("USER")}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      newSelectedRole === "USER"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground",
                    )}
                  >
                    <div className="font-semibold text-small">USER</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      Standard ATS applicant pipeline access
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSelectedRole("ADMIN")}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      newSelectedRole === "ADMIN"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground",
                    )}
                  >
                    <div className="font-semibold text-small flex items-center gap-1">
                      ADMIN <ShieldCheck size={12} className="text-primary" />
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      Full system diagnostics & user controls
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-3.5 py-2 rounded-lg border border-border text-small font-medium hover:bg-secondary text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  roleModalUser.id === currentUser?.id ||
                  newSelectedRole === roleModalUser.role ||
                  roleMutation.isPending
                }
                onClick={() =>
                  roleMutation.mutate({
                    userId: roleModalUser.id,
                    role: newSelectedRole,
                  })
                }
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors disabled:opacity-40"
              >
                {roleMutation.isPending ? "Updating..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Modal (Suspend / Activate) */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-subheading text-foreground">
                {statusModalUser.isActive
                  ? "Suspend User Account"
                  : "Reactivate User Account"}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-small text-muted-foreground">
              {statusModalUser.isActive
                ? `Suspending ${statusModalUser.name} (${statusModalUser.email}) will immediately terminate active sessions and block further login attempts.`
                : `Reactivating ${statusModalUser.name} (${statusModalUser.email}) will restore full access to their application pipeline.`}
            </p>

            {actionError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-small flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {statusModalUser.id === currentUser?.id ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-small flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  You cannot suspend your own active administrator account.
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-3.5 py-2 rounded-lg border border-border text-small font-medium hover:bg-secondary text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  statusModalUser.id === currentUser?.id ||
                  statusMutation.isPending
                }
                onClick={() =>
                  statusMutation.mutate({
                    userId: statusModalUser.id,
                    isActive: !statusModalUser.isActive,
                  })
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-small font-medium transition-colors disabled:opacity-40",
                  statusModalUser.isActive
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-primary hover:bg-primary-hover text-primary-foreground",
                )}
              >
                {statusMutation.isPending
                  ? "Processing..."
                  : statusModalUser.isActive
                    ? "Confirm Suspension"
                    : "Reactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
