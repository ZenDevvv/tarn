import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import pinoHttp from "pino-http";
import { prisma } from "@tracker/database";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { apiLimiter } from "./middleware/rate-limit";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export const app = express();

// Reverse proxy trust (for ALB, Cloudflare, Cloud Run, etc.)
app.set("trust proxy", 1);

// Standard HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Request ID propagation
app.use((req, res, next) => {
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.headers["x-request-id"] = reqId;
  res.setHeader("x-request-id", reqId);
  next();
});

// Structured HTTP logging
app.use(
  pinoHttp({
    logger,
    genReqId: (req) =>
      (req.headers["x-request-id"] as string) || crypto.randomUUID(),
    autoLogging: {
      ignore: (req) => req.url?.startsWith("/api/v1/health") ?? false,
    },
  }),
);

// Middleware
app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

// Payload size isolation: 15mb for resume uploads, 100kb for general API calls
app.use("/api/v1/resumes/upload", express.json({ limit: "15mb" }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// Static files for uploaded resumes and attachments
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Cloud Health Probes (unthrottled)
app.get(["/api/v1/health", "/api/v1/health/live"], (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get("/api/v1/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      data: {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Database readiness check failed");
    return res.status(503).json({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database connection failed",
        status: "not_ready",
      },
    });
  }
});

// Global API rate limiting
app.use("/api/v1", apiLimiter);

import { authRouter } from "./modules/auth/auth.routes";
import { applicationRouter } from "./modules/applications/application.routes";
import { followUpRouter } from "./modules/follow-ups/follow-up.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { interviewRouter } from "./modules/interviews/interview.routes";
import { companyRouter } from "./modules/companies/company.routes";
import { contactRouter } from "./modules/contacts/contact.routes";
import { resumeRouter } from "./modules/resumes/resume.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { statusRouter } from "./modules/statuses/status.routes";
import { adminRouter } from "./modules/admin/admin.routes";

// Root routes
export const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/applications", applicationRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/contacts", contactRouter);
apiRouter.use("/resumes", resumeRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/statuses", statusRouter);
apiRouter.use("/follow-ups", followUpRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/interviews", interviewRouter);
apiRouter.use("/admin", adminRouter);
app.use("/api/v1", apiRouter);

// Error & fallback handling
app.use(notFoundHandler);
app.use(errorHandler);
