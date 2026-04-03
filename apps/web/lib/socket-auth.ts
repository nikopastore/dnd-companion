import crypto from "node:crypto";

const SOCKET_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret";

function base64urlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", SOCKET_SECRET).update(encodedPayload).digest("base64url");
}

export function createSocketToken(payload: { id: string; name: string; email?: string | null }) {
  const encodedPayload = base64urlEncode(
    JSON.stringify({
      id: payload.id,
      name: payload.name,
      email: payload.email ?? null,
      exp: Date.now() + 1000 * 60 * 15,
    })
  );
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}
