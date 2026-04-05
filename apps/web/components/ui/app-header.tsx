"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Icon } from "./icon";

export function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/campaigns", label: "Campaigns", icon: "groups" },
    { href: "/builder", label: "Create", icon: "person_add" },
    { href: "/dashboard", label: "DM", icon: "auto_stories" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
      <div className="glass-heavy relative mx-auto flex h-16 max-w-7xl items-center justify-between overflow-hidden rounded-2xl border border-secondary/10 px-4 shadow-float md:px-6">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(233,195,73,0.08),transparent_24%,transparent_76%,rgba(165,42,42,0.1))]" />
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-secondary/20 bg-surface-container-high transition-all duration-500 group-hover:border-secondary/50 group-hover:glow-gold">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(233,195,73,0.16),transparent_65%)]" />
            <Icon name="auto_stories" size={18} className="text-secondary" />
          </div>
          <div>
            <h1 className="text-lg font-headline text-secondary tracking-[0.2em] uppercase group-hover:text-secondary transition-colors">
              The Digital Tome
            </h1>
            <p className="hidden text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/50 md:block">
              Mythic Campaign OS
            </p>
          </div>
        </Link>

        <div className="relative z-10 flex items-center gap-2">
          {session?.user && (
            <>
              <nav className="flex items-center gap-1 md:hidden">
                {links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" && pathname?.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                        active
                          ? "bg-secondary/15 text-secondary shadow-whisper"
                          : "text-on-surface/55 hover:bg-surface-container-high/70 hover:text-on-surface"
                      }`}
                      aria-label={link.label}
                      title={link.label}
                    >
                      <Icon name={link.icon} size={16} />
                    </Link>
                  );
                })}
              </nav>

              <nav className="hidden items-center gap-1 rounded-full border border-outline-variant/10 bg-surface-container/70 px-2 py-1 md:flex">
                {links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/" && pathname?.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${
                        active
                          ? "bg-secondary/15 text-secondary shadow-whisper"
                          : "text-on-surface/55 hover:bg-surface-container-high/70 hover:text-on-surface"
                      }`}
                    >
                      <Icon name={link.icon} size={14} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden rounded-full border border-outline-variant/10 bg-surface-container/80 px-3 py-1.5 md:block">
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/45">
                  Logged In
                </p>
                <p className="max-w-[140px] truncate font-headline text-sm text-on-surface">
                  {session.user.name || session.user.email}
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full p-2 text-primary/50 transition-all duration-300 hover:bg-surface-container-high/60 hover:text-primary"
                title="Sign out"
                aria-label="Sign out"
              >
                <Icon name="logout" size={18} />
              </button>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant/20 bg-surface-container-highest transition-all duration-300 hover:border-secondary/30">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-headline text-sm text-secondary">
                    {session.user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mx-auto mt-2 hidden h-px max-w-6xl bg-gradient-to-r from-transparent via-secondary/15 to-transparent md:block" />
    </header>
  );
}
