import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Application } from "express";
import type { Auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { initAuth } from "./config/auth.js";
import { connectDB } from "./infra/database/connection.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import { generalRateLimiter } from "./common/middleware/rateLimiter.middleware.js";
import { authApiRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/user/users.routes.js";
import { subscriptionRouter } from "./modules/subscription/subscription.routes.js";
import { SubscriptionController } from "./modules/subscription/subscription.controller.js";
import { followupsRouter } from "./modules/followup/followup.routes.js";
import { leadsRouter } from "./modules/lead/lead.routes.js";
import { propertiesRouter } from "./modules/property/property.routes.js";
import { callsRouter } from "./modules/call/call.routes.js";
import { meetingsRouter } from "./modules/meeting/meeting.routes.js";
import { notificationsRouter } from "./modules/notification/notification.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { n8nRouter } from "./modules/n8n/n8n.routes.js";
import { webhooksRouter } from "./modules/webhook/webhook.routes.js";
import { settingsRouter } from "./modules/tenant/tenant.routes.js";
import { logger } from "./config/logger.js";

export function createApp(auth: Auth): Application {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true, // required for Better Auth session cookies
    }),
  );

  /**
   * Better Auth handler — must be mounted BEFORE express.json().
   * It consumes the raw request body for some routes (e.g. One Tap callback).
   */
  app.all("/api/auth/*", toNodeHandler(auth));

  /**
   * Stripe webhook — must receive the raw body before express.json() parses it.
   */
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    SubscriptionController.handleWebhook,
  );

  /**
   * Retell webhook â€” public + signature verified. Must receive raw body.
   */
  app.use("/api/webhooks", webhooksRouter);

  app.use(express.json());
  app.use(generalRateLimiter);

  // ── Health / root ───────────────────────────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({ status: "ok", name: "SAAS API", timestamp: new Date().toISOString() });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── API routes ──────────────────────────────────────────────────────────────
  // /api/profile, /api/sessions, /api/sessions/revoke, /api/sessions/revoke-others
  app.use("/api", authApiRouter);

  // /api/users, /api/admin, /api/stats
  app.use("/api", usersRouter);

  // /api/subscription
  app.use("/api/subscription", subscriptionRouter);

  // /api/leads
  app.use("/api/leads", leadsRouter);

  // /api/properties
  app.use("/api/properties", propertiesRouter);

  // /api/calls
  app.use("/api/calls", callsRouter);

  // /api/meetings
  app.use("/api/meetings", meetingsRouter);

  // /api/followups
  app.use("/api/followups", followupsRouter);

  // /api/notifications
  app.use("/api/notifications", notificationsRouter);

  // /api/analytics/*
  app.use("/api/analytics", analyticsRouter);

  // /api/n8n/*
  app.use("/api/n8n", n8nRouter);

  // /api/settings (workspace Retell + n8n config)
  app.use("/api/settings", settingsRouter);

  // ── 404 for unmatched routes ─────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  // ── Global error handler (must be last) ────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}

let cachedApp: Application | null = null;
let appInitPromise: Promise<Application> | null = null;

async function getOrInitServerlessApp(): Promise<Application> {
  if (cachedApp) return cachedApp;
  if (!appInitPromise) {
    appInitPromise = (async () => {
      await connectDB();
      const auth = initAuth();
      const app = createApp(auth);
      cachedApp = app;
      return app;
    })();
  }
  return appInitPromise;
}

export default async function handler(req: unknown, res: unknown) {
  try {
    const app = await getOrInitServerlessApp();
    return (app as unknown as (request: unknown, response: unknown) => unknown)(req, res);
  } catch (error) {
    logger.error("Serverless app bootstrap failed", error);
    if (
      res
      && typeof res === "object"
      && "statusCode" in res
      && "setHeader" in res
      && "end" in res
    ) {
      const response = res as {
        statusCode: number;
        setHeader: (name: string, value: string) => void;
        end: (body: string) => void;
      };
      response.statusCode = 500;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ success: false, message: "Server bootstrap failed" }));
      return;
    }
    throw error;
  }
}
