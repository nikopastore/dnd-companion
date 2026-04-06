"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

const TONES = ["Heroic", "Grim", "Political", "Exploration", "Horror", "Lighthearted"];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState("Heroic");
  const [description, setDescription] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [houseRules, setHouseRules] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        system: "D&D",
        edition: "5e",
        setting,
        tone,
        onboardingMode: "beginner",
        worldName,
        houseRules: houseRules
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create campaign");
      return;
    }

    const campaign = await res.json();
    router.push(`/lobby/${campaign.id}`);
  }

  return (
    <main className="mx-auto max-w-lg space-y-8 px-6 pb-32 pt-24">
      <div className="space-y-2 text-center">
        <h1 className="font-headline text-4xl tracking-tight text-on-background">
          Create a Campaign
        </h1>
        <p className="text-sm text-on-surface-variant">
          Name it, pick a tone, and you&apos;re ready to invite players.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        <Input
          id="name"
          label="Campaign Name"
          placeholder="e.g. The Curse of Strahd"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          id="setting"
          label="Setting (optional)"
          placeholder="e.g. Forgotten Realms, Homebrew"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
        />

        {/* Tone */}
        <div className="space-y-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                  tone === t
                    ? "border-secondary/30 bg-secondary/10 text-secondary font-bold"
                    : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Description (optional)
          </label>
          <textarea
            id="description"
            placeholder="A short summary for your players..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface/30 outline-none transition-all focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
          />
        </div>

        {/* Toggle for optional fields */}
        {!showOptional && (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            <Icon name="add" size={14} />
            Add world name &amp; house rules
          </button>
        )}

        {showOptional && (
          <div className="space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container/50 p-4">
            <Input
              id="world-name"
              label="World / Region Name"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              placeholder="e.g. Barovia"
            />
            <div className="space-y-1.5">
              <label htmlFor="house-rules" className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                House Rules
              </label>
              <textarea
                id="house-rules"
                placeholder="One per line, e.g. Potions as bonus action"
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface/30 outline-none transition-all focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" className="w-full glow-gold-strong" disabled={loading || !name.trim()}>
          {loading ? "Creating..." : "Create Campaign"}
        </Button>
      </form>
    </main>
  );
}
