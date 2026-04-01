import type { Metadata, Viewport } from "next";
import { Noto_Serif, Inter } from "next/font/google";
import { SessionProvider } from "@/components/auth/session-provider";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-headline",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Digital Tome — D&D 5e Companion",
  description:
    "A premium companion app for Dungeons & Dragons 5th Edition. Create characters, manage campaigns, and track your adventures.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body antialiased min-h-dvh">
        {/* Skip link for keyboard navigation (CRITICAL a11y) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SessionProvider>
          <div id="main-content">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
