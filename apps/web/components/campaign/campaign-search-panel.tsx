"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  snippet: string;
  reason?: string;
}

interface Props {
  campaignId: string;
}

const TYPE_ICONS: Record<string, string> = {
  npc: "groups",
  location: "map",
  quest: "assignment",
  item: "inventory_2",
  session: "event_note",
  note: "sticky_note_2",
  "world-region": "public",
  faction: "flag",
  lore: "menu_book",
  "timeline-event": "history",
  handout: "collections_bookmark",
  mystery: "help",
  "schedule-poll": "event_upcoming",
};

export function CampaignSearchPanel({ campaignId }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const url = query.trim()
          ? `/api/campaigns/${campaignId}/search?q=${encodeURIComponent(query.trim())}`
          : `/api/campaigns/${campaignId}/search`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [campaignId, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-secondary/10 bg-surface-container-low p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="manage_search" size={18} className="text-secondary" />
          <h3 className="font-headline text-lg text-on-surface">Campaign Search</h3>
        </div>
        <Input
          id="campaign-search"
          label="Search Across Campaign Memory"
          icon="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search NPCs, items, quests, sessions, lore, and notes..."
        />
      </div>

      {loading && (
        <div className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
          {query.trim() ? "Searching campaign memory..." : "Loading recently relevant memory..."}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <div className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
          No results matched that query.
        </div>
      )}

      {!loading && !query.trim() && results.length === 0 && (
        <div className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
          No recent memory signals are available yet.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {!query.trim() && (
            <div className="rounded-sm border border-secondary/10 bg-secondary/5 p-4">
              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-secondary/80">
                Recently Relevant
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                These are the campaign details most likely to matter next based on active quests, latest recaps, pinned handouts, mysteries, and open logistics.
              </p>
            </div>
          )}
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="rounded-sm border border-outline-variant/10 bg-surface-container-low p-4 shadow-whisper"
            >
              <div className="mb-1 flex items-center gap-2">
                <Icon name={TYPE_ICONS[result.type] || "description"} size={16} className="text-secondary" />
                <span className="font-body text-sm font-semibold text-on-surface">{result.title}</span>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label text-[9px] uppercase tracking-[0.14em] text-on-surface-variant/60">
                  {result.subtitle}
                </span>
              </div>
              {result.snippet && (
                <p className="pl-6 text-sm leading-relaxed text-on-surface-variant">{result.snippet}</p>
              )}
              {result.reason && (
                <p className="mt-2 pl-6 font-label text-[10px] uppercase tracking-[0.16em] text-secondary/70">
                  {result.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
