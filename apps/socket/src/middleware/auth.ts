import type { Socket } from "socket.io";
import crypto from "node:crypto";

const SOCKET_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret";

interface SocketTokenPayload {
  id?: string;
  name?: string;
  email?: string | null;
  exp?: number;
}

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      return next(new Error("Invalid token format"));
    }

    const expectedSignature = crypto.createHmac("sha256", SOCKET_SECRET).update(encodedPayload).digest("base64url");
    if (signature !== expectedSignature) {
      return next(new Error("Invalid token signature"));
    }

    const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SocketTokenPayload;
    if (!decoded.exp || decoded.exp < Date.now()) {
      return next(new Error("Expired token"));
    }

    socket.data.userId = decoded.id;
    socket.data.userName = decoded.name || decoded.email || "Unknown";

    if (!socket.data.userId) {
      return next(new Error("Invalid token: no user ID"));
    }

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
