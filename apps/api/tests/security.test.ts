import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { app } from "../src/app";

describe("Cloud Security, Observability & Ingress Tests", () => {
  let adminCookie: string[];
  let userCookie: string[];
  let testUserId: string;

  beforeAll(async () => {
    // 1. Create a standard test user
    const userEmail = `security_test_user_${Date.now()}@example.com`;
    const regRes = await request(app).post("/api/v1/auth/register").send({
      email: userEmail,
      password: "password123",
      name: "Security Test User",
    });
    expect(regRes.status).toBe(201);
    userCookie = regRes.headers["set-cookie"];
    testUserId = regRes.body.data.user.id;

    // 2. Authenticate as admin
    const adminLoginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });
    expect(adminLoginRes.status).toBe(200);
    adminCookie = adminLoginRes.headers["set-cookie"];
  });

  describe("HTTP Security Headers & Ingress Defense", () => {
    it("enforces OWASP security headers via helmet", async () => {
      const res = await request(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    it("generates and propagates x-request-id for request tracing", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.headers["x-request-id"]).toBeDefined();
      expect(typeof res.headers["x-request-id"]).toBe("string");
    });

    it("respects and returns client-provided x-request-id", async () => {
      const customId = "trace-client-abc-12345";
      const res = await request(app)
        .get("/api/v1/health")
        .set("x-request-id", customId);

      expect(res.headers["x-request-id"]).toBe(customId);
    });
  });

  describe("Cloud Probes & Health Checks", () => {
    it("GET /api/v1/health returns 200 liveness check", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.uptime).toBeTypeOf("number");
      expect(res.body.data.timestamp).toBeDefined();
    });

    it("GET /api/v1/health/live returns 200 liveness check", async () => {
      const res = await request(app).get("/api/v1/health/live");
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ok");
    });

    it("GET /api/v1/health/ready returns 200 and database connected", async () => {
      const res = await request(app).get("/api/v1/health/ready");
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ready");
      expect(res.body.data.database).toBe("connected");
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe("Payload Size Isolation (100kb standard limit)", () => {
    it("rejects oversized JSON bodies on standard endpoints with 413", async () => {
      // 100kb limit is enforced for general routes. Create a payload exceeding 120kb
      const largePayload = {
        email: "oversized@example.com",
        password: "password123",
        extraData: "A".repeat(125 * 1024),
      };

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(largePayload);

      expect(res.status).toBe(413);
    });
  });

  describe("Administrative Audit Logging & Trail", () => {
    it("records audit logs when admin modifies user role and user status", async () => {
      // 1. Admin updates role to ADMIN
      const roleRes = await request(app)
        .patch(`/api/v1/admin/users/${testUserId}/role`)
        .set("Cookie", adminCookie)
        .set("User-Agent", "TestRunner-Agent/1.0")
        .send({ role: "ADMIN" });
      expect(roleRes.status).toBe(200);

      // 2. Admin updates status to false (suspended)
      const statusRes = await request(app)
        .patch(`/api/v1/admin/users/${testUserId}/status`)
        .set("Cookie", adminCookie)
        .set("User-Agent", "TestRunner-Agent/1.0")
        .send({ isActive: false });
      expect(statusRes.status).toBe(200);

      // 3. Query audit logs endpoint
      const auditRes = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Cookie", adminCookie);

      expect(auditRes.status).toBe(200);
      expect(Array.isArray(auditRes.body.data)).toBe(true);
      expect(auditRes.body.data.length).toBeGreaterThanOrEqual(2);

      // Find the specific log entries for our target user
      const roleLog = auditRes.body.data.find(
        (log: any) =>
          log.targetId === testUserId && log.action === "USER_ROLE_UPDATED"
      );
      expect(roleLog).toBeDefined();
      expect(roleLog.details.newRole).toBe("ADMIN");
      expect(roleLog.details.previousRole).toBe("USER");
      expect(roleLog.actorEmail).toBe("admin@example.com");

      const statusLog = auditRes.body.data.find(
        (log: any) =>
          log.targetId === testUserId && log.action === "USER_STATUS_UPDATED"
      );
      expect(statusLog).toBeDefined();
      expect(statusLog.details.newStatus).toBe(false);
      expect(statusLog.details.previousStatus).toBe(true);

      // Reactivate user and reset role to USER for subsequent standard user tests
      await request(app)
        .patch(`/api/v1/admin/users/${testUserId}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: true });
      await request(app)
        .patch(`/api/v1/admin/users/${testUserId}/role`)
        .set("Cookie", adminCookie)
        .send({ role: "USER" });
    });

    it("blocks standard user from accessing GET /api/v1/admin/audit-logs with 403", async () => {
      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Cookie", userCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("Rate Limiter Engine Behavior", () => {
    it("throttles requests with 429 when rate limit threshold is exceeded", async () => {
      // Test isolated sub-app to verify express-rate-limit logic without affecting test suites
      const testLimiterApp = express();
      const testLimiter = rateLimit({
        windowMs: 1000,
        limit: 2,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: {
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many attempts",
          },
        },
      });

      testLimiterApp.use(testLimiter);
      testLimiterApp.get("/ping", (_req, res) => res.json({ ok: true }));

      const res1 = await request(testLimiterApp).get("/ping");
      expect(res1.status).toBe(200);

      const res2 = await request(testLimiterApp).get("/ping");
      expect(res2.status).toBe(200);

      const res3 = await request(testLimiterApp).get("/ping");
      expect(res3.status).toBe(429);
      expect(res3.body.error.code).toBe("TOO_MANY_REQUESTS");
      expect(res3.headers["ratelimit"]).toContain("remaining=0");
    });
  });
});
