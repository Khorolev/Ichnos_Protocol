#!/usr/bin/env node
/**
 * ============================================================================
 *  Neon Preview-Branch Cleanup — E2E post-run hook
 * ============================================================================
 *
 * Deletes the Neon database branches that the Vercel ↔ Neon integration
 * created for the current git branch's preview deployment. Intended to be
 * invoked from .github/workflows/e2e.yml as an `if: always()` post-test
 * step, so Neon branches don't accumulate past the project's free-tier
 * limit and block future deployments with "Branch limit exceeded".
 *
 * This script is BEST-EFFORT:
 *   - Missing env vars cause a soft exit (code 0). The workflow continues.
 *   - API failures are logged but do not fail the workflow.
 *   - A 404 on DELETE is treated as success (branch already gone).
 *
 * The filter logic and HTTP wrappers live in helpers/cleanupNeonBranch.js
 * and are fully unit-tested.
 *
 * Usage:
 *   NEON_API_KEY=... NEON_PROJECT_ID=... GIT_BRANCH=main \
 *     node e2e/scripts/cleanupNeonBranch.js [--dry-run]
 *
 * Env:
 *   NEON_API_KEY     (required) — Neon personal/organization API key
 *   NEON_PROJECT_ID  (required) — Neon project ID (e.g. "wispy-bar-12345678")
 *   GIT_BRANCH       (required) — git branch name to scope the cleanup to
 *
 * Flags:
 *   --dry-run        — list matched branches but do not delete anything
 * ============================================================================
 */
import {
  listBranches,
  deleteBranch,
  selectBranchesToDelete,
} from "./helpers/cleanupNeonBranch.js";

const LOG_PREFIX = "[cleanup-neon]";

function log(msg) {
  console.log(`${LOG_PREFIX} ${msg}`);
}

function logError(msg) {
  console.error(`${LOG_PREFIX} ${msg}`);
}

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;
  const gitBranch = process.env.GIT_BRANCH;
  const { dryRun } = parseArgs(process.argv);

  // Best-effort: missing config is a soft skip, not a failure.
  if (!apiKey) {
    log("NEON_API_KEY not set — skipping cleanup (soft exit).");
    process.exit(0);
  }
  if (!projectId) {
    log("NEON_PROJECT_ID not set — skipping cleanup (soft exit).");
    process.exit(0);
  }
  if (!gitBranch) {
    log("GIT_BRANCH not set — skipping cleanup (soft exit).");
    process.exit(0);
  }

  log(`Cleaning up Neon preview branches for git branch: ${gitBranch}`);
  if (dryRun) {
    log("DRY RUN — no deletions will be performed.");
  }

  let allBranches;
  try {
    allBranches = await listBranches(fetch, { apiKey, projectId });
  } catch (err) {
    // Soft-fail: log and exit 0. We never want cleanup to block a CI run.
    logError(`Failed to list Neon branches: ${err.message}`);
    process.exit(0);
  }

  log(`Total Neon branches in project: ${allBranches.length}`);

  const targets = selectBranchesToDelete(allBranches, gitBranch);
  log(`Matching preview branches for "${gitBranch}": ${targets.length}`);
  for (const b of targets) {
    log(`  • ${b.id}  ${b.name}  (created ${b.created_at ?? "?"})`);
  }

  if (targets.length === 0) {
    log("Nothing to delete.");
    process.exit(0);
  }

  if (dryRun) {
    log("DRY RUN complete — exiting without deleting.");
    process.exit(0);
  }

  let deleted = 0;
  let failed = 0;
  for (const b of targets) {
    try {
      const res = await deleteBranch(fetch, {
        apiKey,
        projectId,
        branchId: b.id,
      });
      deleted += 1;
      log(`Deleted ${b.id} ${b.name} (HTTP ${res.status})`);
    } catch (err) {
      failed += 1;
      logError(`Failed to delete ${b.id} ${b.name}: ${err.message}`);
    }
  }

  log(
    `Cleanup summary: ${deleted} deleted, ${failed} failed, ${targets.length} matched.`,
  );
  // Always exit 0 — partial failures should not fail the workflow.
  process.exit(0);
}

main().catch((err) => {
  logError(`Unexpected error: ${err.stack || err.message}`);
  process.exit(0);
});
