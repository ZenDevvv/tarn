import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

export const app = express();

// Request ID & security headers
app.use((req, res, next) => {
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("x-request-id", reqId);
  next();
});

// Middleware
app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// Static files for uploaded resumes and attachments
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Health check endpoint
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

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

// Root routes placeholder
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
