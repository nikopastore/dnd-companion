import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret";

interface JWTPayload {
  id?: string;
  name?: string;
  email?: string;
  sub?: string;
}

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    socket.data.userId = decoded.id || decoded.sub;
    socket.data.userName = decoded.name || decoded.email || "Unknown";

    if (!socket.data.userId) {
      return next(new Error("Invalid token: no user ID"));
    }

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
