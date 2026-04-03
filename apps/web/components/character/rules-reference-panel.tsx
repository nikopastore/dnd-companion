"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AUTOMATION_MODES,
  RULES_REFERENCE,
  type AutomationMode,
  type ConditionKey,
  type RuleCategory,
} from "@dnd-companion/shared";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { normalizeAutomationMode } from "@/lib/rest-automation";

interface CampaignContext {
  name: string;
  system: string;
  edition: string;
  houseRules: unknown;
}

interface RulesReferencePanelProps {
  automationMode: unknown;
  rulesBookmarks: unknown;
  activeConditions: ConditionKey[];
  concentrationSpell: string | null;
  spellSlotsState: Record<string, { current: number; total: number }> | null;
  pactSpellSlotsState: Record<string, { current: number; total: number }> | null;
  campaignContext: CampaignContext | null;
  onUpdateField: (field: string, value: unknown) => Promise<void>;
}

interface HouseRuleEntry {
  id: string;
  title: string;
  description: string;
}

const CATEGORY_META: Array<{ key: RuleCategory | "all" | "bookmarks"; label: string; icon: string }> = [
  { key: "all", label: "All", icon: "apps" },
  { key: "bookmarks", label: "Saved", icon: "bookmark" },
  { key: "conditions", label: "Conditions", icon: "healing" },
  { key: "combat", label: "Combat", icon: "swords" },
  { key: "spellcasting", label: "Spells", icon: "auto_fix_high" },
  { key: "rest", label: "Rest", icon: "bedtime" },
  { key: "travel", label: "Travel", icon: "map" },
  { key: "downtime", label: "Downtime", icon: "schedule" },
  { key: "crafting", label: "Crafting", icon: "construction" },
];

function normalizeBookmarks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeHouseRules(value: unknown): HouseRuleEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (typeof entry === "string") {
        return {
          id: `house-rule-${index}`,
          title: `House Rule ${index + 1}`,
          description: entry,
        };
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const title =
          typeof record.title === "string" && record.title.trim().length > 0
            ? record.title.trim()
            : `House Rule ${index + 1}`;
        const description =
          typeof record.description === "string" && record.description.trim().length > 0
            ? record.description.trim()
            : typeof record.summary === "string"
            ? record.summary.trim()
            : "";

        if (description.length === 0) {
          return null;
        }

        return {
          id: typeof record.id === "string" ? record.id : `house-rule-${index}`,
          title,
          description,
        };
      }

      return null;
    })
    .filter((entry): entry is HouseRuleEntry => Boolean(entry));
}

function formatSlotSummary(state: Record<string, { current: number; total: number }> | null): string[] {
  if (!state) return [];

  return Object.entries(state)
    .filter(([, slotState]) => slotState.total > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([slotLevel, slotState]) => `Level ${slotLevel}: ${slotState.current}/${slotState.total}`);
}

export function RulesReferencePanel({
  automationMode,
  rulesBookmarks,
  activeConditions,
  concentrationSpell,
  spellSlotsState,
  pactSpellSlotsState,
  campaignContext,
  onUpdateField,
}: RulesReferencePanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RuleCategory | "all" | "bookmarks">("all");
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [savingMode, setSavingMode] = useState<AutomationMode | null>(null);
  const [savingBookmark, setSavingBookmark] = useState<string | null>(null);
  const normalizedMode = normalizeAutomationMode(automationMode);
  const [bookmarks, setBookmarks] = useState<string[]>(() => normalizeBookmarks(rulesBookmarks));

  useEffect(() => {
    setBookmarks(normalizeBookmarks(rulesBookmarks));
  }, [rulesBookmarks]);

  const houseRules = useMemo(
    () => normalizeHouseRules(campaignContext?.houseRules),
    [campaignContext?.houseRules]
  );
  const bookmarkedSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const activeConditionSet = useMemo(() => new Set(activeConditions), [activeConditions]);
  const slotSummary = useMemo(() => formatSlotSummary(spellSlotsState), [spellSlotsState]);
  const pactSlotSummary = useMemo(() => formatSlotSummary(pactSpellSlotsState), [pactSpellSlotsState]);

  const filteredRules = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return RULES_REFERENCE.filter((entry) => {
      if (activeCategory === "bookmarks" && !bookmarkedSet.has(entry.id)) return false;
      if (activeCategory !== "all" && activeCategory !== "bookmarks" && entry.category !== activeCategory) {
        return false;
      }

      if (!lowerSearch) return true;

      const haystack = [
        entry.title,
        entry.summary,
        entry.category,
        ...entry.tags,
        ...entry.details,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(lowerSearch);
    }).sort((a, b) => {
      const aPriority =
        (bookmarkedSet.has(a.id) ? 2 : 0) +
        (a.linkedCondition && activeConditionSet.has(a.linkedCondition) ? 1 : 0);
      const bPriority =
        (bookmarkedSet.has(b.id) ? 2 : 0) +
        (b.linkedCondition && activeConditionSet.has(b.linkedCondition) ? 1 : 0);

      if (aPriority !== bPriority) return bPriority - aPriority;
      return a.title.localeCompare(b.title);
    });
  }, [activeCategory, activeConditionSet, bookmarkedSet, search]);

  async function handleModeChange(mode: AutomationMode) {
    setSavingMode(mode);
    try {
      await onUpdateField("automationMode", mode);
      setStatus({ kind: "success", message: `${AUTOMATION_MODES[mode].label} automation enabled.` });
    } catch {
      setStatus({ kind: "error", message: "Could not update automation mode." });
    } finally {
      setSavingMode(null);
    }
  }

  async function handleBookmarkToggle(ruleId: string) {
    const nextBookmarks = bookmarkedSet.has(ruleId)
      ? bookmarks.filter((entry) => entry !== ruleId)
      : [...bookmarks, ruleId];

    setBookmarks(nextBookmarks);
    setSavingBookmark(ruleId);
    try {
      await onUpdateField("rulesBookmarks", nextBookmarks);
      setStatus({
        kind: "success",
        message: bookmarkedSet.has(ruleId) ? "Rule bookmark removed." : "Rule bookmarked.",
      });
    } catch {
      setBookmarks(bookmarks);
      setStatus({ kind: "error", message: "Could not update bookmarks." });
    } finally {
      setSavingBookmark(null);
    }
  }

  return (
    <div className="space-y-6">
      {status && <FormStatus kind={status.kind} message={status.message} />}

      <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="tune" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">Automation Depth</h3>
          </div>
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
            Choose how much the sheet should manage
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {(Object.entries(AUTOMATION_MODES) as Array<[AutomationMode, (typeof AUTOMATION_MODES)[AutomationMode]]>).map(
            ([mode, meta]) => (
              <button
                key={mode}
                type="button"
                disabled={savingMode !== null}
                onClick={() => handleModeChange(mode)}
                className={`rounded-sm border p-4 text-left transition-colors ${
                  normalizedMode === mode
                    ? "border-secondary/40 bg-secondary/10 text-on-surface"
                    : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-headline text-base">{meta.label}</p>
                  {normalizedMode === mode && <Icon name="check_circle" size={18} className="text-secondary" />}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{meta.description}</p>
              </button>
            )
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="bolt" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Current Rules Context</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Active Conditions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeConditions.length > 0 ? (
                    activeConditions.map((condition) => {
                      const entry = RULES_REFERENCE.find((rule) => rule.linkedCondition === condition);
                      return (
                        <span
                          key={condition}
                          className="rounded-full border border-error/20 bg-error-container/20 px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-error"
                        >
                          {entry?.title ?? condition}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-on-surface-variant">No active tracked conditions.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Concentration
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {concentrationSpell ? `Maintaining ${concentrationSpell}.` : "No concentration spell is tracked."}
                </p>
              </div>

              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60">
                  Spell Slots
                </p>
                <div className="mt-2 space-y-1 text-sm text-on-surface-variant">
                  {slotSummary.length === 0 && pactSlotSummary.length === 0 ? (
                    <p>No spell-slot pools are currently active.</p>
                  ) : (
                    <>
                      {slotSummary.map((entry) => (
                        <p key={entry}>{entry}</p>
                      ))}
                      {pactSlotSummary.map((entry) => (
                        <p key={`pact-${entry}`}>Pact {entry}</p>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="gavel" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Campaign House Rules</h3>
            </div>

            {campaignContext ? (
              <div className="space-y-4">
                <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                  <p className="font-headline text-base text-on-surface">{campaignContext.name}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {campaignContext.system} {campaignContext.edition}
                  </p>
                </div>

                {houseRules.length > 0 ? (
                  <div className="space-y-3">
                    {houseRules.map((rule) => (
                      <div key={rule.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                        <p className="font-headline text-base text-on-surface">{rule.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    No house rules are currently saved for this campaign.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                This character is not currently linked to a campaign with shared house rules.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="menu_book" size={18} className="text-secondary" />
              <h3 className="font-headline text-lg text-on-surface">Rules Reference</h3>
            </div>
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Search, filter, bookmark
            </span>
          </div>

          <Input
            id="rules-search"
            label="Search Rules"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conditions, rest, combat, concentration, crafting"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORY_META.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  activeCategory === category.key
                    ? "border-secondary/30 bg-secondary/10 text-secondary"
                    : "border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-secondary/20"
                }`}
              >
                <Icon name={category.icon} size={14} />
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {filteredRules.length === 0 ? (
              <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-5 text-sm text-on-surface-variant">
                No rules matched that search.
              </div>
            ) : (
              filteredRules.map((rule) => {
                const isBookmarked = bookmarkedSet.has(rule.id);
                const isActiveCondition = rule.linkedCondition ? activeConditionSet.has(rule.linkedCondition) : false;

                return (
                  <div key={rule.id} className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Icon
                            name={rule.icon}
                            size={16}
                            className={isActiveCondition ? "text-error" : "text-secondary"}
                          />
                          <p className="font-headline text-base text-on-surface">{rule.title}</p>
                          <span className="rounded-full border border-outline-variant/10 bg-surface-container-high px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">
                            {rule.category}
                          </span>
                          {isActiveCondition && (
                            <span className="rounded-full border border-error/20 bg-error-container/20 px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-error">
                              Active now
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{rule.summary}</p>
                        <div className="mt-3 space-y-2">
                          {rule.details.map((detail) => (
                            <p key={detail} className="text-sm text-on-surface-variant">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant={isBookmarked ? "secondary" : "ghost"}
                        size="sm"
                        loading={savingBookmark === rule.id}
                        onClick={() => handleBookmarkToggle(rule.id)}
                      >
                        <Icon name={isBookmarked ? "bookmark" : "bookmark_add"} size={16} />
                        {isBookmarked ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
