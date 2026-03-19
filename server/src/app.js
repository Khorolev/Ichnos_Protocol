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
import { seedE2EOnPreview } from "../scripts/seedE2EOnPreview.js";

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

// Rate limiting for public endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

// Health check endpoint (JSON, for monitoring tools)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    node: process.version,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gdpr", gdprRoutes);

// Auto-seed E2E data on preview startup — fire-and-forget, does not block request handling
seedE2EOnPreview();

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
