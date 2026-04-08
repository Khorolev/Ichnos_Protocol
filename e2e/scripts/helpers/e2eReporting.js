export function printFailedDetails(platform, results) {
  const failed = results.filter((r) => r.status === "failed");
  if (failed.length === 0) return;
  console.error(`\n[error] ${platform} sync failed for ${failed.length} variable(s):`);
  for (const r of failed) {
    const detail = r.error ? r.error.trim().split("\n")[0].slice(0, 200) : "unknown error";
    console.error(`  - ${r.name}: ${detail}`);
  }
  console.error("Fix the issue(s) above and re-run.");
}

function printSection(label, results) {
  console.log(`\n  ${label}:`);
  for (const r of results) {
    console.log(`    ${r.name.padEnd(30)} ${r.status.padEnd(8)} ${r.masked}`);
    if (r.status === "failed" && r.error) {
      const sanitized = r.error.trim().split("\n")[0].slice(0, 200);
      console.log(`      error: ${sanitized}`);
    }
  }
}

export function printSummary(ghResults, vcResults) {
  console.log("\n--- E2E Credential Sync Summary ---");
  printSection("GitHub Actions Secrets", ghResults);
  printSection("Vercel Preview Env Vars", vcResults);
  console.log("");
}
