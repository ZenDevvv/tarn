import { describe, it, expect } from "vitest";
import { SystemStatusDTO, AdminUserListItemDTO, Role } from "@tracker/types";

describe("Admin Domain Contracts & Models", () => {
  it("correctly validates SystemStatusDTO structure", () => {
    const mockStatus: SystemStatusDTO = {
      status: "healthy",
      uptimeSeconds: 3600,
      timestamp: "2026-10-08T12:00:00.000Z",
      environment: "development",
      nodeVersion: "v20.15.0",
      platform: "linux (x64)",
      memory: {
        rssMb: 50.2,
        heapTotalMb: 30.1,
        heapUsedMb: 20.4,
        externalMb: 2.1,
      },
      database: {
        status: "connected",
        latencyMs: 3,
        counts: {
          users: 10,
          activeUsers: 9,
          applications: 50,
          companies: 20,
          jobs: 50,
          interviews: 12,
          resumes: 8,
          contacts: 15,
        },
      },
    };

    expect(mockStatus.status).toBe("healthy");
    expect(mockStatus.database.counts.users).toBe(10);
    expect(mockStatus.database.latencyMs).toBe(3);
    expect(mockStatus.memory.heapUsedMb).toBe(20.4);
  });

  it("correctly validates AdminUserListItemDTO structure and roles", () => {
    const mockAdminUser: AdminUserListItemDTO = {
      id: "usr_admin",
      email: "admin@example.com",
      name: "System Administrator",
      role: "ADMIN" as Role,
      isActive: true,
      headline: "DevOps Lead",
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      counts: {
        applications: 5,
        companies: 3,
        interviews: 2,
        resumes: 1,
      },
    };

    expect(mockAdminUser.role).toBe("ADMIN");
    expect(mockAdminUser.isActive).toBe(true);
    expect(mockAdminUser.counts.applications).toBe(5);
  });
});
