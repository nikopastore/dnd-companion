import { randomBytes } from "crypto";

/** Generate a 6-character alphanumeric invite code using cryptographic RNG */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 to avoid confusion
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/** Format a class name with level, e.g. "Ranger 5" */
export function formatClassLevel(className: string, level: number): string {
  return `${className} ${level}`;
}
