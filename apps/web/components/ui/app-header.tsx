"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Icon } from "./icon";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-low">
      <div className="flex justify-between items-center px-6 h-16 w-full">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-surface-container-high flex items-center justify-center border border-secondary/20">
              <Icon name="auto_stories" size={16} className="text-secondary" />
            </div>
            <h1 className="text-xl font-headline text-secondary tracking-widest uppercase">
              The Digital Tome
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <Link href="/campaigns" className="hidden md:block">
                <span className="font-label text-xs uppercase tracking-widest text-on-surface/60 hover:text-on-surface transition-colors">
                  Campaigns
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-primary/70 hover:bg-surface-container-high transition-colors duration-300 p-2 rounded-sm"
              >
                <Icon name="logout" size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-secondary/30 flex items-center justify-center overflow-hidden">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-headline text-sm text-on-surface">
                    {session.user.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
