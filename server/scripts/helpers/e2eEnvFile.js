import { readFileSync, writeFileSync } from "fs";
import { parse } from "dotenv";

const UID_KEY_PATTERN = /^(E2E_(?:ADMIN|USER|SUPER_ADMIN)_UID)=[^#]*?(#.*)?$/;

export function readEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  return parse(content);
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
