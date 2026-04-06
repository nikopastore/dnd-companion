"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

const SYSTEMS = [
  { value: "D&D", label: "Dungeons & Dragons" },
  { value: "Pathfinder", label: "Pathfinder" },
  { value: "Call of Cthulhu", label: "Call of Cthulhu" },
  { value: "Shadowrun", label: "Shadowrun" },
  { value: "Fate", label: "Fate" },
  { value: "Other", label: "Other" },
];

const EDITIONS: Record<string, { value: string; label: string }[]> = {
  "D&D": [
    { value: "5e", label: "5th Edition (2014)" },
    { value: "5e-2024", label: "5th Edition (2024)" },
    { value: "4e", label: "4th Edition" },
    { value: "3.5e", label: "3.5 Edition" },
  ],
  "Pathfinder": [
    { value: "2e", label: "2nd Edition" },
    { value: "1e", label: "1st Edition" },
  ],
  "Call of Cthulhu": [{ value: "7e", label: "7th Edition" }],
  "Shadowrun": [
    { value: "6e", label: "6th World" },
    { value: "5e", label: "5th Edition" },
  ],
  "Fate": [{ value: "Core", label: "Fate Core" }, { value: "Accelerated", label: "Fate Accelerated" }],
  "Other": [{ value: "custom", label: "Custom" }],
};

const SETTINGS = [
  "Forgotten Realms",
  "Eberron",
  "Ravenloft",
  "Greyhawk",
  "Dragonlance",
  "Wildemount",
  "Theros",
  "Ravnica",
  "Spelljammer",
  "Planescape",
  "Dark Sun",
  "Homebrew",
];

const TONES = [
  { value: "Heroic", icon: "shield", desc: "Classic good vs. evil adventures" },
  { value: "Grim", icon: "skull", desc: "Dark, dangerous, morally gray" },
  { value: "Political", icon: "account_balance", desc: "Intrigue, factions, and power" },
  { value: "Exploration", icon: "travel_explore", desc: "Discovery and wonder" },
  { value: "Horror", icon: "visibility_off", desc: "Tension, dread, and the unknown" },
  { value: "Comic", icon: "sentiment_very_satisfied", desc: "Lighthearted and fun" },
];

const HOUSE_RULE_SUGGESTIONS = [
  "Critical hits deal max damage + rolled damage",
  "Flanking grants advantage on attack rolls",
  "Potions can be consumed as a bonus action",
  "Natural 1 on attack rolls causes a fumble",
  "Short rests are 10 minutes instead of 1 hour",
  "Resurrection magic requires a skill challenge",
  "Inspiration can be shared between players",
  "Fall damage is capped at 20d6",
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [system, setSystem] = useState("D&D");
  const [edition, setEdition] = useState("5e");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState("");
  const [onboardingMode, setOnboardingMode] = useState("beginner");
  const [worldName, setWorldName] = useState("");
  const [worldSummary, setWorldSummary] = useState("");
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const editionOptions = EDITIONS[system] ?? EDITIONS["Other"];

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
        system,
        edition,
        setting,
        tone,
        onboardingMode,
        worldName,
        worldSummary,
        houseRules,
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
    <main className="mx-auto max-w-4xl space-y-8 px-6 pb-32 pt-24">
      {/* Header */}
      <section className="space-y-3 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-4 py-1.5">
          <Icon name="auto_stories" size={14} className="text-secondary" />
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
            Campaign Creation
          </span>
        </div>
        <h1 className="font-headline text-4xl tracking-tight text-on-background sm:text-5xl">
          Forge a New Chronicle
        </h1>
        <p className="mx-auto max-w-xl text-base text-on-surface-variant">
          Set up your campaign identity, world, and table rules — then invite your party.
        </p>
      </section>

      {/* Step indicator */}
      <div className="flex justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {["Campaign Core", "World & Rules"].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index === 0 && step === 1 ? setStep(0) : undefined}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-label text-xs uppercase tracking-[0.16em] transition-all ${
              step === index
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : step > index
                  ? "bg-primary/10 text-primary border border-primary/15 cursor-pointer"
                  : "bg-surface-container-high text-on-surface-variant/45 border border-transparent"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest text-[10px] font-bold">
              {step > index ? <Icon name="done" size={12} /> : index + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <section className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 shadow-elevated animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <form onSubmit={handleCreate} className="space-y-6">

          {step === 0 && (
            <>
              <Input
                id="name"
                label="Campaign Name"
                type="text"
                placeholder="The Curse of Strahd, Tomb of Annihilation..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* System selector */}
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  System
                </label>
                <div className="flex flex-wrap gap-2">
                  {SYSTEMS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setSystem(s.value);
                        const newEditions = EDITIONS[s.value];
                        if (newEditions?.[0]) setEdition(newEditions[0].value);
                      }}
                      className={`rounded-xl border px-4 py-2 font-label text-xs uppercase tracking-widest transition-all ${
                        system === s.value
                          ? "border-secondary/30 bg-secondary/10 text-secondary"
                          : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edition selector */}
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Edition
                </label>
                <div className="flex flex-wrap gap-2">
                  {editionOptions.map((ed) => (
                    <button
                      key={ed.value}
                      type="button"
                      onClick={() => setEdition(ed.value)}
                      className={`rounded-xl border px-4 py-2 font-label text-xs uppercase tracking-widest transition-all ${
                        edition === ed.value
                          ? "border-secondary/30 bg-secondary/10 text-secondary"
                          : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                      }`}
                    >
                      {ed.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setting selector */}
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Setting
                </label>
                <div className="flex flex-wrap gap-2">
                  {SETTINGS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSetting(setting === s ? "" : s)}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                        setting === s
                          ? "border-secondary/30 bg-secondary/10 text-secondary font-bold"
                          : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone selector */}
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Campaign Tone
                </label>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(tone === t.value ? "" : t.value)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        tone === t.value
                          ? "border-secondary/30 bg-secondary/10"
                          : "border-outline-variant/10 bg-surface-container-high/40 hover:border-secondary/15"
                      }`}
                    >
                      <Icon name={t.icon} size={18} className={tone === t.value ? "text-secondary" : "text-on-surface-variant/50"} />
                      <div>
                        <div className={`font-headline text-base ${tone === t.value ? "text-secondary" : "text-on-surface"}`}>
                          {t.value}
                        </div>
                        <div className="mt-0.5 text-xs text-on-surface-variant">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="description" className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  placeholder="A brief summary for your players..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 shadow-whisper outline-none transition-all duration-300 focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
                />
              </div>

              {/* Onboarding mode */}
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Onboarding Mode
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      id: "beginner",
                      title: "Beginner-Friendly",
                      icon: "school",
                      text: "Guided defaults and onboarding support for new players.",
                    },
                    {
                      id: "advanced",
                      title: "Advanced Table",
                      icon: "psychology",
                      text: "Full control and denser rules structure for experienced groups.",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setOnboardingMode(option.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        onboardingMode === option.id
                          ? "border-secondary/25 bg-secondary/10"
                          : "border-outline-variant/10 bg-surface-container-high/40 hover:border-secondary/15"
                      }`}
                    >
                      <Icon name={option.icon} size={20} className={onboardingMode === option.id ? "text-secondary" : "text-on-surface-variant/50"} />
                      <div>
                        <div className="font-headline text-lg text-on-surface">{option.title}</div>
                        <div className="mt-1 text-sm text-on-surface-variant">{option.text}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(1)} disabled={!name.trim()}>
                  Next: World & Rules
                  <Icon name="arrow_forward" size={16} />
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Input
                id="world-name"
                label="World / Region Name (optional)"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="Barovia, The Shattered Coast..."
              />

              <div className="space-y-1.5">
                <label htmlFor="world-summary" className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  World Summary (optional)
                </label>
                <textarea
                  id="world-summary"
                  placeholder="A mist-shrouded land ruled by an ancient vampire lord..."
                  value={worldSummary}
                  onChange={(e) => setWorldSummary(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 shadow-whisper outline-none transition-all duration-300 focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
                />
              </div>

              {/* House Rules - toggleable suggestions */}
              <div className="space-y-3">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  House Rules (optional)
                </label>
                <p className="text-xs text-on-surface-variant/60">
                  Select common house rules or add your own.
                </p>
                <div className="flex flex-wrap gap-2">
                  {HOUSE_RULE_SUGGESTIONS.map((rule) => {
                    const isSelected = houseRules.includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() =>
                          setHouseRules(
                            isSelected
                              ? houseRules.filter((r) => r !== rule)
                              : [...houseRules, rule]
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                          isSelected
                            ? "border-secondary/30 bg-secondary/10 text-secondary"
                            : "border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:border-secondary/20"
                        }`}
                      >
                        {isSelected && <Icon name="check" size={12} className="mr-1 inline" />}
                        {rule}
                      </button>
                    );
                  })}
                </div>
                {houseRules.length > 0 && (
                  <p className="text-xs text-secondary/70">{houseRules.length} rule{houseRules.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                  <Icon name="arrow_back" size={16} />
                  Back
                </Button>
                <Button type="submit" className="glow-gold-strong" disabled={loading}>
                  {loading ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </>
          )}

          {error && <p className="text-sm font-body text-error animate-fade-in">{error}</p>}
        </form>
      </section>
    </main>
  );
}
