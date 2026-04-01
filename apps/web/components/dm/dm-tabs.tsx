"use client";

import { useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

export interface TabDefinition {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface DMTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TabDefinition[];
}

export function DMTabs({ activeTab, onTabChange, tabs }: DMTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll the active tab into view on mobile
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeRef.current;
      const scrollLeft =
        button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <nav className="relative border-b border-outline-variant/10">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide md:overflow-x-visible md:flex-wrap gap-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5
                font-label text-xs uppercase tracking-[0.12em] font-bold
                whitespace-nowrap transition-all duration-300 ease-out
                shrink-0
                ${
                  isActive
                    ? "text-secondary"
                    : "text-on-surface-variant/50 hover:text-on-surface-variant/80"
                }
              `}
            >
              <Icon
                name={tab.icon}
                size={18}
                filled={isActive}
                className={`transition-all duration-300 ${
                  isActive ? "text-secondary" : ""
                }`}
              />
              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span
                  className={`
                    inline-flex items-center justify-center
                    min-w-[20px] h-5 px-1.5 rounded-full
                    text-[10px] font-bold
                    transition-all duration-300
                    ${
                      isActive
                        ? "bg-secondary/20 text-secondary"
                        : "bg-surface-container-high/60 text-on-surface-variant/40"
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}

              {/* Gold underline indicator */}
              <span
                className={`
                  absolute bottom-0 left-2 right-2 h-[2px] rounded-full
                  transition-all duration-300 ease-out
                  ${isActive ? "bg-secondary shadow-[0_0_8px_rgba(233,195,73,0.4)]" : "bg-transparent"}
                `}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
