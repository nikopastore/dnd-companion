import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware that checks for session token cookie
// without importing the full auth config (which uses bcrypt/Prisma)
export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect app routes, not auth/api/static/landing
    "/((?!api|_next/static|_next/image|favicon.ico|textures|login|register|$).*)",
  ],
};
