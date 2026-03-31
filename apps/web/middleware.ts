export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all routes except auth, api, static files, and landing page
    "/((?!api|_next/static|_next/image|favicon.ico|textures|login|register|$).*)",
  ],
};
