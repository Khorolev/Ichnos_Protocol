import { existsSync } from "fs";
import { readEnvFile } from "./e2eEnvFile.js";
import { validateCredentials } from "./e2ePreflightValidators.js";
import {
  checkGhAuth,
  checkVercelAuth,
  checkVercelProject,
  checkFirebaseEnv,
} from "./e2ePreflightChecks.js";

export function runPreflight({ syncOnly, envFilePath, serverDir }) {
  if (!existsSync(envFilePath)) {
    throw new Error(
      `.env.e2e not found at ${envFilePath}.\nRemediation: Copy .env.e2e.example to .env.e2e and fill in your credentials.`,
    );
  }

  const env = readEnvFile(envFilePath);
  validateCredentials(env, syncOnly);

  checkGhAuth();
  checkVercelAuth();
  checkVercelProject(serverDir);

  if (!syncOnly) {
    checkFirebaseEnv();
  }

  return true;
}
