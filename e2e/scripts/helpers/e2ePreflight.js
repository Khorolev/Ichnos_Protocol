import { existsSync } from "fs";
import { readEnvFile, mergeEnvPasswords } from "./e2eEnvFile.js";
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
      `.env.e2e not found at ${envFilePath}.\nRemediation: The provision script reads e2e/.env.e2e. Verify the file exists at that path and contains your credentials.`,
    );
  }

  const env = mergeEnvPasswords(readEnvFile(envFilePath));
  validateCredentials(env, syncOnly);

  checkGhAuth();
  checkVercelAuth();
  checkVercelProject(serverDir);

  if (!syncOnly) {
    checkFirebaseEnv();
  }

  return true;
}
