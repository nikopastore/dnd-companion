export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /login
Disallow: /register
Disallow: /start
Disallow: /dashboard
Disallow: /builder
Disallow: /character
Disallow: /campaign

Sitemap: https://dnd-companion-taupe.vercel.app/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
