"use client";

import { useMemo, useState } from "react";
import { EntityImage } from "@/components/ui/entity-image";
import { Icon } from "@/components/ui/icon";

export interface BuilderOption {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  imageUrl?: string | null;
  entityType: "character" | "npc" | "location" | "item" | "quest" | "encounter" | "race" | "class" | "spell";
  meta?: string[];
  badge?: string;
  searchText?: string;
}

interface OptionGalleryProps {
  options: BuilderOption[];
  selectedId?: string | null;
  selectedIds?: string[];
  onSelect: (option: BuilderOption) => void;
  featuredIds?: string[];
  featuredLabel?: string;
  allLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

function OptionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: BuilderOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex h-full flex-col overflow-hidden rounded-sm border p-4 text-left transition-all duration-300 ${
        isSelected
          ? "border-secondary/50 bg-surface-container shadow-elevated"
          : "border-outline-variant/10 bg-surface-container-low hover:border-secondary/25 hover:bg-surface-container"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
      <div className="mb-4 flex items-start gap-3">
        <EntityImage
          imageUrl={option.imageUrl}
          entityType={option.entityType}
          name={option.title}
          size="sm"
          className={isSelected ? "ring-1 ring-secondary/20" : ""}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-headline text-lg leading-tight ${isSelected ? "text-secondary" : "text-on-surface"}`}>
                {option.title}
              </h3>
              {option.subtitle && (
                <p className="mt-1 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {option.subtitle}
                </p>
              )}
            </div>
            {option.badge && (
              <span className="rounded-full border border-secondary/15 bg-secondary/10 px-2 py-0.5 font-label text-[9px] uppercase tracking-[0.16em] text-secondary">
                {option.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="line-clamp-3 font-body text-sm leading-relaxed text-on-surface-variant">
        {option.description}
      </p>

      {option.meta && option.meta.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {option.meta.map((entry) => (
            <span
              key={entry}
              className={`rounded-full px-2.5 py-1 font-label text-[9px] uppercase tracking-[0.14em] ${
                isSelected
                  ? "bg-secondary/10 text-secondary"
                  : "bg-surface-container-high text-on-surface-variant/70"
              }`}
            >
              {entry}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-label uppercase tracking-[0.16em] text-on-surface-variant/40">
          Choose
        </span>
        <span className={`flex items-center gap-1 font-label uppercase tracking-[0.16em] ${isSelected ? "text-secondary" : "text-on-surface-variant/40 group-hover:text-secondary/70"}`}>
          {isSelected ? "Selected" : "Select"}
          <Icon name={isSelected ? "check_circle" : "arrow_forward"} size={14} />
        </span>
      </div>
    </button>
  );
}

export function OptionGallery({
  options,
  selectedId,
  selectedIds = [],
  onSelect,
  featuredIds = [],
  featuredLabel = "Popular choices",
  allLabel = "All options",
  searchPlaceholder = "Search options",
  emptyMessage = "No options match your search.",
}: OptionGalleryProps) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedIds.filter(Boolean)), [selectedIds]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) =>
      [
        option.title,
        option.subtitle,
        option.description,
        option.searchText,
        ...(option.meta ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [options, query]);

  const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);
  const featured = filtered.filter((option) => featuredSet.has(option.id));
  const remaining = filtered.filter((option) => !featuredSet.has(option.id));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/35"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-sm border border-outline-variant/10 bg-surface-container-highest/80 py-3 pl-11 pr-4 font-body text-sm text-on-surface outline-none transition-all duration-300 placeholder:text-on-surface/25 focus:border-secondary/35 focus:bg-surface-container-highest"
        />
      </div>

      {!query && featured.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">
              {featuredLabel}
            </span>
            <div className="decorative-line flex-1" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedSet.size > 0 ? selectedSet.has(option.id) : selectedId === option.id}
                onSelect={() => onSelect(option)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/55">
            {allLabel}
          </span>
          <div className="decorative-line flex-1" />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-8 text-center">
            <p className="font-body text-sm text-on-surface-variant">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(query ? filtered : remaining.length > 0 ? remaining : filtered).map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedSet.size > 0 ? selectedSet.has(option.id) : selectedId === option.id}
                onSelect={() => onSelect(option)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
