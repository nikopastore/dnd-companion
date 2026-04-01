"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Icon } from "./icon";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 w-full z-50 glass-heavy">
      <div className="flex justify-between items-center px-6 h-16 w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-sm bg-surface-container-high flex items-center justify-center border border-secondary/20 group-hover:border-secondary/50 group-hover:glow-gold transition-all duration-500">
            <Icon name="auto_stories" size={18} className="text-secondary" />
          </div>
          <h1 className="text-lg font-headline text-secondary tracking-[0.2em] uppercase group-hover:text-secondary transition-colors">
            The Digital Tome
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user && (
            <>
              <nav className="hidden md:flex items-center gap-1 mr-2">
                {[
                  { href: "/campaigns", label: "Campaigns", icon: "groups" },
                  { href: "/builder", label: "Create", icon: "person_add" },
                  { href: "/dashboard", label: "DM", icon: "auto_stories" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-label text-[10px] uppercase tracking-[0.15em] text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high/60 transition-all duration-300"
                  >
                    <Icon name={link.icon} size={14} />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-primary/50 hover:text-primary hover:bg-surface-container-high/60 transition-all duration-300 p-2 rounded-sm"
                title="Sign out"
              >
                <Icon name="logout" size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant/20 hover:border-secondary/30 flex items-center justify-center overflow-hidden transition-all duration-300">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-full h-full object-cover"
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
      {/* Decorative gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-secondary/15 to-transparent" />
    </header>
  );
}
