import { spawnSync } from "child_process";
import { maskValue } from "./e2eEnvFile.js";

export function syncToVercel(credentials, serverDir) {
  const results = [];

  for (const [varName, varValue] of Object.entries(credentials)) {
    if (!varValue) continue;

    const spawnOpts = { input: varValue, encoding: "utf8", cwd: serverDir };

    let result = spawnSync(
      "vercel",
      ["env", "update", varName, "preview", "--yes"],
      spawnOpts,
    );

    if (result.status !== 0) {
      result = spawnSync(
        "vercel",
        ["env", "add", varName, "preview", "--yes"],
        spawnOpts,
      );
    }

    results.push({
      name: varName,
      status: result.status === 0 ? "success" : "failed",
      masked: maskValue(varValue),
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
