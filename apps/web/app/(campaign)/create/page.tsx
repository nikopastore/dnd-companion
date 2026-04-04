"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

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
        system,
        edition,
        setting,
        tone,
        onboardingMode,
        worldName,
        worldSummary,
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
    <main className="mx-auto max-w-7xl space-y-12 px-6 pb-32 pt-24">
      <AtmosphericHero
        eyebrow="Campaign Creation"
        title="Forge a campaign with mood, world identity, and table posture from the first screen."
        description="The creation flow now frames campaign setup like the opening spread of a setting guide, so it feels less like app configuration and more like starting a living world."
        entityType="location"
        imageName="The First Lantern of Elaris"
        chips={["Onboarding", "World Seed", "House Rules", "Table Tone"]}
        highlights={[
          { icon: "auto_stories", label: "Flow", value: "Two-step founding pass" },
          { icon: "public", label: "World", value: worldName.trim() || "Awaiting name" },
          {
            icon: "tune",
            label: "Mode",
            value: onboardingMode === "advanced" ? "Advanced table" : "Beginner-friendly",
          },
        ]}
        sideContent={
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Founding Principles
            </p>
            <div className="grid gap-3 text-sm text-on-surface-variant">
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                Establish tone, world framing, and player onboarding before the first
                invite goes out.
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                This is the origin point for the campaign&apos;s later continuity,
                worldbuilding, and prep tools.
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3 animate-fade-in-up">
        {[
          {
            icon: "theater_comedy",
            title: "Set the table mood",
            text: "Tone, setting, and onboarding mode shape how the rest of the platform behaves.",
          },
          {
            icon: "travel_explore",
            title: "Name the world early",
            text: "World framing is promoted so the campaign starts with setting identity, not just metadata.",
          },
          {
            icon: "gavel",
            title: "Codify table rules",
            text: "House rules stay part of the founding flow instead of becoming an afterthought.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-outline-variant/10 bg-surface-container/70 p-5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-secondary">
              <Icon name={item.icon} size={16} />
              <p className="font-label text-[10px] uppercase tracking-[0.16em]">
                {item.title}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-xl border border-secondary/5 bg-surface-container-low p-8 shadow-float md:p-12">
        <div className="pointer-events-none absolute inset-0 paper-texture opacity-5" />
        <div className="decorative-orb absolute -right-20 -top-20 h-56 w-56" />
        <div className="decorative-orb absolute -bottom-16 -left-16 h-40 w-40" />

        <div className="relative z-10 space-y-8">
          <div className="space-y-3 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1.5">
              <Icon name="flare" size={14} className="text-secondary" />
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                Founding Wizard
              </span>
            </div>
            <h2 className="font-headline text-3xl tracking-tight text-secondary">
              Forge a New Chronicle
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              Set campaign identity, world foundations, and onboarding before inviting
              the party.
            </p>
          </div>

          <form
            onSubmit={handleCreate}
            className="space-y-6 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="flex flex-wrap gap-2">
              {["Campaign Core", "World & Rules"].map((label, index) => (
                <div
                  key={label}
                  className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] ${
                    step === index
                      ? "bg-secondary/10 text-secondary"
                      : step > index
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container-high text-on-surface-variant/45"
                  }`}
                >
                  {index + 1}. {label}
                </div>
              ))}
            </div>

            {step === 0 && (
              <>
                <Input
                  id="name"
                  label="Campaign Name"
                  type="text"
                  placeholder="The Curse of Strahd..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Input id="system" label="System" value={system} onChange={(e) => setSystem(e.target.value)} />
                  <Input id="edition" label="Edition" value={edition} onChange={(e) => setEdition(e.target.value)} />
                  <Input
                    id="setting"
                    label="Setting"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="Forgotten Realms, custom world..."
                  />
                  <Input
                    id="tone"
                    label="Tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Heroic, grim, political, surreal..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="description"
                    className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="A tale of darkness and redemption..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 shadow-whisper outline-none transition-all duration-300 focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                    Onboarding Mode
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      {
                        id: "beginner",
                        title: "Beginner-Friendly",
                        text: "Guide players with simpler defaults, support, and onboarding cues.",
                      },
                      {
                        id: "advanced",
                        title: "Advanced Table",
                        text: "Assume experienced players and expose denser prep and rules structure.",
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setOnboardingMode(option.id)}
                        className={`rounded-sm border p-4 text-left transition-all duration-300 ${
                          onboardingMode === option.id
                            ? "border-secondary/25 bg-secondary/10"
                            : "border-outline-variant/10 bg-surface-container-high/40"
                        }`}
                      >
                        <div className="font-headline text-lg text-on-surface">
                          {option.title}
                        </div>
                        <div className="mt-1 text-sm text-on-surface-variant">
                          {option.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    disabled={!name.trim()}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    id="world-name"
                    label="World / Region Name"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    placeholder="Barovia, Elaris, The Shattered Coast..."
                  />
                  <Input
                    id="setting-echo"
                    label="Setting Summary"
                    value={`${system} ${edition}${setting ? ` · ${setting}` : ""}`}
                    readOnly
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="world-summary"
                    className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
                  >
                    World Summary
                  </label>
                  <textarea
                    id="world-summary"
                    placeholder="What kind of world are the players stepping into?"
                    value={worldSummary}
                    onChange={(e) => setWorldSummary(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 shadow-whisper outline-none transition-all duration-300 focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="house-rules"
                    className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
                  >
                    House Rules
                  </label>
                  <textarea
                    id="house-rules"
                    placeholder="One house rule per line..."
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 shadow-whisper outline-none transition-all duration-300 focus:border-secondary/30 focus:ring-1 focus:ring-secondary/40"
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button type="submit" className="glow-gold-strong" disabled={loading}>
                    {loading ? "Forging..." : "Create Campaign"}
                  </Button>
                </div>
              </>
            )}

            {error && <p className="text-sm font-body text-error animate-fade-in">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
