"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  detailRenderer?: (option: BuilderOption) => ReactNode;
  confirmLabel?: string;
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

/* ---------- Sparkle particles ---------- */
function SparkleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="sparkle-dot absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
      <style jsx>{`
        .sparkle-dot {
          background: radial-gradient(circle, rgba(255, 215, 123, 0.9), rgba(255, 215, 123, 0));
          animation: sparkle-float ease-in-out infinite;
        }
        @keyframes sparkle-float {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-12px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export function OptionGallery({
  options,
  selectedId,
  selectedIds = [],
  onSelect,
  detailRenderer,
  confirmLabel = "Select option",
  featuredIds = [],
  featuredLabel = "Popular choices",
  allLabel = "All options",
  searchPlaceholder = "Search options",
  emptyMessage = "No options match your search.",
}: OptionGalleryProps) {
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [spotlightPhase, setSpotlightPhase] = useState<"entering" | "visible" | "exiting" | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds.filter(Boolean)), [selectedIds]);
  const backdropRef = useRef<HTMLDivElement>(null);

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
  const previewOption = previewId ? options.find((option) => option.id === previewId) ?? null : null;

  function openPreview(option: BuilderOption) {
    setPreviewId(option.id);
    setIsFlipped(false);
    setSpotlightPhase("entering");
  }

  useEffect(() => {
    if (spotlightPhase === "entering") {
      const timer = setTimeout(() => setSpotlightPhase("visible"), 50);
      return () => clearTimeout(timer);
    }
  }, [spotlightPhase]);

  function closePreview() {
    setSpotlightPhase("exiting");
    setTimeout(() => {
      setPreviewId(null);
      setSpotlightPhase(null);
    }, 350);
  }

  function handleCardSelect(option: BuilderOption) {
    if (detailRenderer) {
      openPreview(option);
      return;
    }

    onSelect(option);
  }

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
                onSelect={() => handleCardSelect(option)}
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
                onSelect={() => handleCardSelect(option)}
              />
            ))}
          </div>
        )}
      </section>

      {previewOption && detailRenderer && (
        <div
          ref={backdropRef}
          className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-500 ${
            spotlightPhase === "visible"
              ? "bg-black/80 backdrop-blur-lg"
              : spotlightPhase === "exiting"
                ? "bg-black/0 backdrop-blur-none"
                : "bg-black/0 backdrop-blur-none"
          }`}
        >
          <div className="absolute inset-0" onClick={closePreview} />

          {/* Ambient glow behind card */}
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
              spotlightPhase === "visible" ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <div className="h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,215,123,0.18),rgba(127,80,255,0.08),transparent_70%)] blur-2xl" />
          </div>

          <div
            className={`relative z-10 w-full max-w-5xl space-y-5 transition-all duration-500 ${
              spotlightPhase === "visible"
                ? "opacity-100 scale-100 translate-y-0"
                : spotlightPhase === "exiting"
                  ? "opacity-0 scale-90 translate-y-8"
                  : "opacity-0 scale-75 translate-y-16"
            }`}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closePreview}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-low text-on-surface transition-colors hover:border-secondary/30 hover:text-secondary"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Card container with glow border */}
              <div className="relative rounded-[28px] border border-secondary/20 bg-[radial-gradient(circle_at_top,rgba(255,215,123,0.24),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <SparkleField />

                {/* Animated glow ring */}
                <div
                  className={`pointer-events-none absolute -inset-[2px] rounded-[30px] transition-opacity duration-700 ${
                    isFlipped ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: "conic-gradient(from 0deg, transparent, rgba(255,215,123,0.4), rgba(127,80,255,0.3), transparent)",
                    animation: isFlipped ? "spin-glow 3s linear infinite" : "none",
                  }}
                />

                <div className="relative rounded-[24px] border border-secondary/15 bg-background/70 p-4">
                  <div
                    className="relative h-[540px] w-full"
                    style={{ perspective: "1800px" }}
                  >
                    <div
                      className="relative h-full w-full"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        transition: "transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)",
                      }}
                    >
                      {/* Front face */}
                      <div
                        className="absolute inset-0 overflow-hidden rounded-[22px] border border-secondary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.12))] p-6"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,216,130,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(127,80,255,0.12),transparent_30%)]" />
                        <div className="relative flex h-full flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/80">
                                  Choice spotlight
                                </p>
                                <h3 className="mt-2 font-headline text-4xl text-on-surface">
                                  {previewOption.title}
                                </h3>
                                {previewOption.subtitle && (
                                  <p className="mt-2 text-sm uppercase tracking-[0.16em] text-on-surface-variant/70">
                                    {previewOption.subtitle}
                                  </p>
                                )}
                              </div>
                              <EntityImage
                                imageUrl={previewOption.imageUrl}
                                entityType={previewOption.entityType}
                                name={previewOption.title}
                                size="lg"
                                className="ring-1 ring-secondary/20 shadow-[0_0_35px_rgba(255,215,123,0.18)]"
                              />
                            </div>
                            <p className="mt-6 text-base leading-relaxed text-on-surface-variant">
                              {previewOption.description}
                            </p>
                          </div>

                          <div className="space-y-5">
                            {previewOption.meta && previewOption.meta.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {previewOption.meta.map((entry) => (
                                  <span
                                    key={entry}
                                    className="rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-secondary"
                                  >
                                    {entry}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="rounded-2xl border border-secondary/10 bg-secondary/5 px-4 py-3 text-sm text-on-surface-variant">
                              Flip the card to inspect traits, proficiencies, and equipment before you lock this choice in.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Back face */}
                      <div
                        className="absolute inset-0 overflow-hidden rounded-[22px] border border-secondary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.12))] p-6"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,88,255,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(255,216,130,0.12),transparent_30%)]" />
                        <div className="relative h-full overflow-y-auto pr-2">
                          {detailRenderer(previewOption)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-5 self-end rounded-[28px] border border-outline-variant/10 bg-surface-container-low/95 p-6 shadow-elevated">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/80">
                    {previewOption.title}
                  </p>
                  <h3 className="mt-2 font-headline text-2xl text-on-surface">
                    {isFlipped ? "Rules & Details" : "Overview"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {isFlipped
                      ? "Review the mechanical details — traits, proficiencies, and starting gear — before committing."
                      : "Flip the card to see the full rules breakdown, or confirm your choice now."}
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-on-surface-variant">
                  <div className="rounded-2xl border border-outline-variant/10 bg-background/40 px-4 py-3">
                    Front: visual identity, role, and high-level summary.
                  </div>
                  <div className="rounded-2xl border border-outline-variant/10 bg-background/40 px-4 py-3">
                    Back: traits, proficiencies, equipment, and the details players actually need.
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsFlipped((current) => !current)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 font-label text-xs uppercase tracking-[0.18em] text-secondary transition-all duration-300 hover:border-secondary/35 hover:bg-secondary/15 hover:shadow-[0_0_20px_rgba(255,215,123,0.15)]"
                  >
                    <Icon name="autorenew" size={16} className={`transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
                    {isFlipped ? "View artwork" : "Flip for details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(previewOption);
                      closePreview();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-label text-xs uppercase tracking-[0.18em] text-on-primary shadow-[0_0_30px_rgba(255,205,120,0.22)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(255,205,120,0.35)]"
                  >
                    <Icon name="auto_awesome" size={16} />
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes spin-glow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
