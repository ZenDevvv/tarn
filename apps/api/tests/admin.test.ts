import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Admin API Integration Tests", () => {
  let userCookie: string[];
  let adminCookie: string[];
  let standardUserId: string;
  let adminUserId: string;

  const testUserEmail = `user_admin_test_${Date.now()}@example.com`;
  const testAdminEmail = `admin_test_${Date.now()}@example.com`;

  beforeAll(async () => {
    // 1. Register a standard user
    const userRegRes = await request(app).post("/api/v1/auth/register").send({
      email: testUserEmail,
      password: "password123",
      name: "Standard Applicant",
    });
    expect(userRegRes.status).toBe(201);
    userCookie = userRegRes.headers["set-cookie"];
    standardUserId = userRegRes.body.data.user.id;
    expect(userRegRes.body.data.user.role).toBe("USER");
    expect(userRegRes.body.data.user.isActive).toBe(true);

    // 2. Log in as the seeded default admin user
    const adminLoginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });
    expect(adminLoginRes.status).toBe(200);
    adminCookie = adminLoginRes.headers["set-cookie"];
    adminUserId = adminLoginRes.body.data.user.id;
    expect(adminLoginRes.body.data.user.role).toBe("ADMIN");
  });

  describe("RBAC & Route Protection", () => {
    it("GET /api/v1/admin/system/status returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/v1/admin/system/status");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("GET /api/v1/admin/system/status returns 403 when called by standard USER", async () => {
      const res = await request(app)
        .get("/api/v1/admin/system/status")
        .set("Cookie", userCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("GET /api/v1/admin/users returns 403 when called by standard USER", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", userCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("System Status & Telemetry", () => {
    it("GET /api/v1/admin/system/status returns 200 and telemetry data for ADMIN", async () => {
      const res = await request(app)
        .get("/api/v1/admin/system/status")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe("healthy");
      expect(typeof res.body.data.uptimeSeconds).toBe("number");
      expect(res.body.data.memory).toBeDefined();
      expect(typeof res.body.data.memory.rssMb).toBe("number");
      expect(typeof res.body.data.memory.heapUsedMb).toBe("number");
      expect(res.body.data.database).toBeDefined();
      expect(res.body.data.database.status).toBe("connected");
      expect(typeof res.body.data.database.latencyMs).toBe("number");
      expect(res.body.data.database.counts.users).toBeGreaterThanOrEqual(2);
    });
  });

  describe("User Management", () => {
    it("GET /api/v1/admin/users returns paginated user list for ADMIN", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);

      const found = res.body.data.find((u: any) => u.id === standardUserId);
      expect(found).toBeDefined();
      expect(found.counts).toBeDefined();
      expect(found.passwordHash).toBeUndefined(); // Security: passwordHash never exposed
    });

    it("GET /api/v1/admin/users filters by search keyword", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users?search=${encodeURIComponent(testUserEmail)}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe(testUserEmail);
    });

    it("GET /api/v1/admin/users/:id returns user details", async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${standardUserId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(standardUserId);
      expect(res.body.data.email).toBe(testUserEmail);
      expect(res.body.data.counts).toBeDefined();
    });

    it("GET /api/v1/admin/users/:id returns 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users/non_existent_cuid")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Role Management & Anti-Lockout Guards", () => {
    it("PATCH /api/v1/admin/users/:id/role rejects self-demotion with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/role`)
        .set("Cookie", adminCookie)
        .send({ role: "USER" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toContain(
        "cannot revoke their own admin privileges",
      );
    });

    it("PATCH /api/v1/admin/users/:id/role promotes standard user to ADMIN", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${standardUserId}/role`)
        .set("Cookie", adminCookie)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("ADMIN");

      // Verify the user can now access admin endpoints
      const checkRes = await request(app)
        .get("/api/v1/admin/system/status")
        .set("Cookie", userCookie);
      expect(checkRes.status).toBe(200);
    });

    it("PATCH /api/v1/admin/users/:id/role demotes promoted user back to USER", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${standardUserId}/role`)
        .set("Cookie", adminCookie)
        .send({ role: "USER" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("USER");

      // Verify the demoted user immediately loses access (session revoked in real time)
      const checkRes = await request(app)
        .get("/api/v1/admin/system/status")
        .set("Cookie", userCookie);
      expect(checkRes.status).toBe(403);
    });
  });

  describe("User Suspension & Real-Time Session Enforcement", () => {
    it("PATCH /api/v1/admin/users/:id/status rejects self-suspension with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(res.body.error.message).toContain(
        "cannot suspend their own account",
      );
    });

    it("PATCH /api/v1/admin/users/:id/status suspends user account", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${standardUserId}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Verify that existing session cookie is immediately rejected
      const sessionCheckRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", userCookie);
      expect(sessionCheckRes.status).toBe(401);
      expect(sessionCheckRes.body.error.message).toContain("suspended");

      // Verify that new login attempts are rejected
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: testUserEmail,
        password: "password123",
      });
      expect(loginRes.status).toBe(401);
      expect(loginRes.body.error.message).toContain("suspended");
    });

    it("PATCH /api/v1/admin/users/:id/status reactivates user account", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${standardUserId}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);

      // Verify user can log in again
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: testUserEmail,
        password: "password123",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.isActive).toBe(true);
    });
  });
});
