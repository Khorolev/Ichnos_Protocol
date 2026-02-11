/**
 * Vercel Serverless Entry Point
 *
 * Wraps the Express app as a Vercel serverless function.
 * In local development, use `npm run dev` instead (starts Express on PORT).
 * This file is only used by Vercel's build system.
 */
import app from '../src/app.js';

export default app;
