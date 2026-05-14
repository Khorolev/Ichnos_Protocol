#!/usr/bin/env node
/**
 * Extract baseline metrics from a Playwright JSON report and write them
 * to e2e/baseline-metrics.json.
 *
 * Usage:
 *   node e2e/scripts/extract-baseline.js <path-to-report.json> [--run-id <id>] [--run-url <url>] [--commit <sha>]
 *
 * The Playwright JSON report is produced by:
 *   cd e2e && npx playwright test --reporter=json > report.json
 *
 * Or downloaded from the CI `playwright-report` artifact (look for
 * report.json inside the artifact zip).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(__dirname, "..", "baseline-metrics.json");

function parseArgs(argv) {
  const args = { reportPath: null, runId: null, runUrl: null, commit: null };
  let i = 2;
  while (i < argv.length) {
    if (argv[i] === "--run-id" && argv[i + 1]) {
      args.runId = argv[++i];
    } else if (argv[i] === "--run-url" && argv[i + 1]) {
      args.runUrl = argv[++i];
    } else if (argv[i] === "--commit" && argv[i + 1]) {
      args.commit = argv[++i];
    } else if (!args.reportPath) {
      args.reportPath = argv[i];
    }
    i++;
  }
  return args;
}

function extractMetrics(report) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let retries = 0;

  function walk(suites) {
    for (const suite of suites) {
      if (suite.suites) walk(suite.suites);
      if (!suite.specs) continue;
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          total++;
          const lastResult = test.results[test.results.length - 1];
          if (lastResult?.status === "passed" || test.status === "expected") {
            passed++;
          } else if (lastResult?.status === "skipped" || test.status === "skipped") {
            skipped++;
          } else {
            failed++;
          }
          if (test.results.length > 1) retries++;
        }
      }
    }
  }

  walk(report.suites || []);

  const durationMs = report.stats?.duration ?? 0;

  return {
    total_tests: total,
    passed,
    failed,
    skipped,
    wall_clock_time_s: Math.round(durationMs / 1000),
    retries_triggered: retries,
  };
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.reportPath) {
    console.error("Usage: node extract-baseline.js <report.json> [--run-id <id>] [--run-url <url>] [--commit <sha>]");
    process.exit(1);
  }

  const raw = readFileSync(resolve(args.reportPath), "utf-8");
  const report = JSON.parse(raw);
  const metrics = extractMetrics(report);

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  baseline.metrics = metrics;
  baseline.source.date = new Date().toISOString().slice(0, 10);
  if (args.runId) baseline.source.run_id = args.runId;
  if (args.runUrl) baseline.source.run_url = args.runUrl;
  if (args.commit) baseline.source.commit_sha = args.commit;

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  console.log("Baseline metrics written to e2e/baseline-metrics.json:");
  console.log(JSON.stringify(metrics, null, 2));
}

main();
