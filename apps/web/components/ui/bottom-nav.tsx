"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const NAV_ITEMS = [
  { href: "/characters", icon: "person", label: "Sheet" },
  { href: "/campaigns", icon: "groups", label: "Campaign" },
  { href: "/join", icon: "login", label: "Join" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-sm border-t border-secondary/15 bg-surface/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center w-full h-20 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center pt-1 transition-all active:translate-y-0.5 duration-150 ${
                isActive ? "text-primary" : "text-primary/40 hover:text-primary"
              }`}
            >
              <Icon name={item.icon} size={24} filled={isActive} />
              <span className="font-label text-[10px] uppercase tracking-tighter font-bold mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
