"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const NAV_ITEMS = [
  { href: "/characters", icon: "person", label: "Sheet" },
  { href: "/campaigns", icon: "groups", label: "Campaign" },
  { href: "/builder", icon: "add_circle", label: "Create" },
  { href: "/dashboard", icon: "auto_stories", label: "DM" },
  { href: "/join", icon: "login", label: "Join" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 glass-heavy border-t border-secondary/10 md:hidden">
      <div className="flex justify-around items-center w-full h-[72px] px-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center pt-1 w-16 transition-all duration-300 active:scale-90 ${
                isActive ? "text-primary" : "text-on-surface/30 hover:text-on-surface/60"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -top-[1px] w-8 h-[2px] bg-secondary rounded-full animate-scale-in" />
              )}
              <Icon name={item.icon} size={22} filled={isActive} />
              <span className="font-label text-[9px] uppercase tracking-wider font-bold mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
