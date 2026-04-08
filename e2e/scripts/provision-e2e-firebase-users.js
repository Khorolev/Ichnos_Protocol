/** E2E Credential Pipeline — Orchestrator. See .env.e2e.example for usage. */
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config } from "dotenv";
import { runPreflight } from "./helpers/e2ePreflight.js";
import { readEnvFile, mergeEnvPasswords, writeUidsToEnvFile } from "./helpers/e2eEnvFile.js";
import { syncToGitHub } from "./helpers/e2eSyncGitHub.js";
import { syncToVercel } from "./helpers/e2eSyncVercel.js";
import { buildCredentialMaps } from "./helpers/e2eCredentials.js";
import { printFailedDetails, printSummary } from "./helpers/e2eReporting.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, "../../server");
const repoRoot = resolve(__dirname, "../..");
const envFilePath = resolve(__dirname, "../.env.e2e");
const serverEnvPath = resolve(serverDir, ".env");
const syncOnly = process.argv.includes("--sync-only");

config({ path: serverEnvPath });

async function main() {
  const mode = syncOnly ? "sync-only" : "full pipeline";
  console.log(`[orchestrator] ${mode}\n`);

  runPreflight({ syncOnly, envFilePath, serverDir });
  console.log("[preflight] all checks passed");

  const env = mergeEnvPasswords(readEnvFile(envFilePath));
  const { github, vercel, firebaseCreds } = buildCredentialMaps(env);

  if (!syncOnly) {
    console.log("\n=== Firebase Provisioning ===");
    const { provisionFirebaseUsers } = await import(
      "./helpers/firebaseTestSetup.js"
    );
    const uidMap = await provisionFirebaseUsers(firebaseCreds);
    writeUidsToEnvFile(envFilePath, uidMap);
    console.log("[env] UIDs written back to .env.e2e");
    for (const [key, uid] of Object.entries(uidMap)) {
      vercel[key] = uid;
    }
  }

  console.log("\n=== GitHub Actions Sync ===");
  const ghResults = syncToGitHub(github, repoRoot);
  const ghFailed = ghResults.some((r) => r.status === "failed");
  if (ghFailed) {
    printSummary(ghResults, []);
    printFailedDetails("GitHub", ghResults);
    process.exit(1);
  }

  console.log("\n=== Vercel Preview Sync ===");
  const vcResults = syncToVercel(vercel, serverDir);
  const vcFailed = vcResults.some((r) => r.status === "failed");

  printSummary(ghResults, vcResults);

  if (vcFailed) {
    printFailedDetails("Vercel", vcResults);
    process.exit(1);
  }

  console.log("[reminder] Vercel Preview env changes require a new deployment or redeploy.");
  console.log("[done] E2E credential pipeline complete.");
}

main().catch((err) => {
  console.error(`\n[fatal] ${err.message}`);
  process.exit(1);
});
