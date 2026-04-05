"use client";

import type { ReactNode } from "react";
import { EntityImage } from "@/components/ui/entity-image";
import { Icon } from "@/components/ui/icon";

interface AtmosphericHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  entityType: "character" | "npc" | "location" | "item" | "quest" | "encounter" | "race" | "class" | "spell";
  imageName: string;
  imageUrl?: string | null;
  chips?: string[];
  highlights?: Array<{ icon: string; label: string; value: string }>;
  actions?: ReactNode;
  sideContent?: ReactNode;
  className?: string;
}

export function AtmosphericHero({
  eyebrow,
  title,
  description,
  entityType,
  imageName,
  imageUrl,
  chips = [],
  highlights = [],
  actions,
  sideContent,
  className = "",
}: AtmosphericHeroProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-xl border border-secondary/10 bg-surface-container-low shadow-float ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,195,73,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(165,42,42,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(255,255,255,0.05))]" />
      <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_62%)] opacity-80" />

      <div className="relative z-10 grid gap-6 p-4 sm:p-6 md:p-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1.5">
              <Icon name="auto_stories" size={14} className="text-secondary" />
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                {eyebrow}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-headline text-3xl leading-[1.04] text-on-background sm:text-4xl md:text-5xl xl:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base md:text-lg">
                {description}
              </p>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-outline-variant/15 bg-surface-container px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/80"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {highlights.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map((highlight) => (
                <div
                  key={`${highlight.label}-${highlight.value}`}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container/70 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-secondary">
                    <Icon name={highlight.icon} size={15} />
                    <span className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary/90">
                      {highlight.label}
                    </span>
                  </div>
                  <p className="mt-2 font-headline text-lg text-on-surface">
                    {highlight.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.25rem] border border-secondary/15 bg-surface-container-high/80 p-3 shadow-elevated">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_45%,rgba(0,0,0,0.22))]" />
            <EntityImage
              imageUrl={imageUrl}
              entityType={entityType}
              name={imageName}
              size="xl"
              className="h-[220px] w-full rounded-[1rem] border-none sm:h-[280px] md:h-[320px]"
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl border border-secondary/15 bg-background/55 px-4 py-3 backdrop-blur-md">
              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary/85">
                Featured Scene
              </p>
              <p className="mt-1 font-headline text-lg text-on-surface sm:text-xl">{imageName}</p>
            </div>
          </div>

          {sideContent && (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container/70 p-4 backdrop-blur-sm">
              {sideContent}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
