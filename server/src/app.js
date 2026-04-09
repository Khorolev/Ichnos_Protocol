/**
 * Express Application Setup
 *
 * Configures middleware, routes, and error handling.
 * Exported for use by both local dev server and Vercel serverless function.
 */
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import gdprRoutes from "./routes/gdprRoutes.js";
import buildStatusPage from "./helpers/buildStatusPage.js";
import { ensureSeeded, seedStatus } from "../scripts/seedE2EOnPreview.js";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for public endpoints.
// Preview deployments use a higher limit to avoid E2E test failures —
// preview URLs are protected by Vercel Deployment Protection anyway.
const isPreview = process.env.VERCEL_ENV === "preview";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isPreview ? 1000 : 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Root status page
app.get("/", (_req, res) => {
  const clientOrigin =
    process.env.CORS_ORIGIN || "https://ichnos-protocol.com";
  const html = buildStatusPage({
    clientOrigin,
    env: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
  });
  res.status(200).send(html);
});

// Health check endpoint (JSON, for monitoring tools).
// On preview deployments, this endpoint drives the E2E seed: it awaits the
// seed promise so the Vercel function stays alive until seeding completes.
// Without this, Vercel kills the function after sending the response, and
// any fire-and-forget seed work is lost.
app.get("/api/health", async (_req, res) => {
  // Trigger (or join) the seed — only runs once, subsequent calls are no-ops.
  // The await keeps the Vercel function alive for the full seed duration.
  await ensureSeeded();

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    vercelEnv: process.env.VERCEL_ENV || "local",
    node: process.version,
    seed: {
      seeded: seedStatus.seeded,
      error: seedStatus.error,
      attempts: seedStatus.attempts,
      mode: seedStatus.mode,
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gdpr", gdprRoutes);

// 404 handler for undefined routes
app.use((_req, res) => {
  res
    .status(404)
    .json({
      error: "Not Found",
      message: "The requested resource does not exist",
    });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server only in local development (not in Vercel)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
