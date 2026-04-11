/**
 * Pure helpers for Neon preview-branch cleanup.
 *
 * Separated from the CLI entrypoint (e2e/scripts/cleanupNeonBranch.js)
 * so the filter and HTTP wrapper logic can be unit-tested against a
 * mocked fetch without spawning a subprocess.
 *
 * Ownership boundary: this module NEVER deletes anything directly. It
 * only lists, filters, and issues DELETE calls that the caller has
 * explicitly requested on branches returned by `selectBranchesToDelete`.
 *
 * Safety rules encoded in `selectBranchesToDelete`:
 *   - `primary` branches are never deleted (Neon's production branch)
 *   - `protected` branches are never deleted
 *   - Branches named exactly `main`, `production`, or `staging` are
 *     never deleted, regardless of other fields
 *   - Only branches whose name equals `preview/{gitBranch}` or starts
 *     with `preview/{gitBranch}-` are returned
 */

const NEON_API_BASE = "https://console.neon.tech/api/v2";

const NEVER_DELETE_NAMES = new Set(["main", "production", "staging"]);

/**
 * Filter a list of Neon branch objects down to those that should be
 * deleted for the given git branch. Pure function — safe to unit test.
 *
 * @param {Array<object>} branches - raw Neon branch objects
 * @param {string} gitBranch - git branch name (e.g. "main", "feature/foo")
 * @returns {Array<object>} subset of `branches` that passed every safety
 *   check and matched the preview-branch naming pattern
 */
export function selectBranchesToDelete(branches, gitBranch) {
  if (!Array.isArray(branches) || !gitBranch) return [];
  const exact = `preview/${gitBranch}`;
  const prefix = `preview/${gitBranch}-`;
  return branches.filter((b) => {
    if (!b || typeof b.name !== "string") return false;
    if (b.primary === true) return false;
    if (b.protected === true) return false;
    if (NEVER_DELETE_NAMES.has(b.name)) return false;
    return b.name === exact || b.name.startsWith(prefix);
  });
}

/**
 * GET /projects/{projectId}/branches — returns the raw `branches` array.
 * Throws on non-2xx responses so the caller can surface the error.
 */
export async function listBranches(fetchFn, { apiKey, projectId }) {
  const res = await fetchFn(
    `${NEON_API_BASE}/projects/${projectId}/branches`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) {
    const body = await safeReadText(res);
    throw new Error(
      `Neon list branches failed: HTTP ${res.status} ${res.statusText} — ${body}`,
    );
  }
  const json = await res.json();
  return Array.isArray(json?.branches) ? json.branches : [];
}

/**
 * DELETE /projects/{projectId}/branches/{branchId}.
 * A 404 is treated as "already gone" (idempotent success).
 */
export async function deleteBranch(
  fetchFn,
  { apiKey, projectId, branchId },
) {
  const res = await fetchFn(
    `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok && res.status !== 404) {
    const body = await safeReadText(res);
    throw new Error(
      `Neon delete branch ${branchId} failed: HTTP ${res.status} ${res.statusText} — ${body}`,
    );
  }
  return { ok: true, status: res.status };
}

async function safeReadText(res) {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "(no body)";
  }
}
