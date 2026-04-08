import { readFileSync, writeFileSync } from "fs";
import { parse } from "dotenv";

const UID_KEY_PATTERN = /^(E2E_(?:ADMIN|USER|SUPER_ADMIN|MANAGE_ADMIN_TARGET)_UID)=[^#]*?(#.*)?$/;
const PASSWORD_KEY_PATTERN = /^E2E_\w+_PASSWORD$/;

export function readEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  return parse(content);
}

/**
 * Merge process.env E2E_*_PASSWORD values into a file-parsed env object.
 * Shell-exported passwords take precedence over file values.
 */
export function mergeEnvPasswords(fileEnv) {
  const merged = { ...fileEnv };
  for (const key of Object.keys(process.env)) {
    if (PASSWORD_KEY_PATTERN.test(key) && process.env[key]) {
      merged[key] = process.env[key];
    }
  }
  return merged;
}

export function writeUidsToEnvFile(filePath, uidMap) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  const updated = lines.map((line) => {
    const match = line.match(UID_KEY_PATTERN);
    if (match && uidMap[match[1]] !== undefined) {
      const comment = match[2] ? ` ${match[2]}` : "";
      return `${match[1]}=${uidMap[match[1]]}${comment}`;
    }
    return line;
  });

  writeFileSync(filePath, updated.join("\n"), "utf8");
}

export function maskValue(value) {
  if (!value || value.length < 4) return "****";
  return "****" + value.slice(-4);
}
