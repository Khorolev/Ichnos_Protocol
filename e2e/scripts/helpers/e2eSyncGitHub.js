import { spawnSync } from "child_process";
import { maskValue } from "./e2eEnvFile.js";

export function syncToGitHub(credentials, repoRoot) {
  if (!repoRoot) {
    throw new Error(
      "repoRoot is required: pass the repository root directory so gh can locate the repo context.",
    );
  }

  const results = [];

  for (const [secretName, secretValue] of Object.entries(credentials)) {
    if (!secretValue) continue;

    const result = spawnSync("gh", ["secret", "set", secretName], {
      input: secretValue,
      encoding: "utf8",
      cwd: repoRoot,
      shell: true,
    });

    results.push({
      name: secretName,
      status: result.status === 0 ? "success" : "failed",
      masked: maskValue(secretValue),
      ...(result.status !== 0 && {
        error:
          result.stderr ||
          result.error?.message ||
          "Unknown error: process exited with non-zero status",
      }),
    });
  }

  return results;
}
