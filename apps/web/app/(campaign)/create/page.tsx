"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-12">
      <section className="relative p-8 md:p-12 bg-surface-container-low rounded-sm overflow-hidden border border-secondary/5">
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />

        {/* Decorative orbs */}
        <div className="decorative-orb absolute -top-20 -right-20 w-56 h-56" />
        <div className="decorative-orb absolute -bottom-16 -left-16 w-40 h-40" />

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2 animate-fade-in-up">
            <h2 className="font-headline text-3xl text-secondary tracking-tight">
              Forge a New Chronicle
            </h2>
            <p className="font-body text-on-surface-variant text-sm">
              Set campaign identity, world foundations, and onboarding before inviting the party.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
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
                  <Input id="setting" label="Setting" value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="Forgotten Realms, custom world..." />
                  <Input id="tone" label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Heroic, grim, political, surreal..." />
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
                    className="w-full bg-surface-container-highest rounded-sm px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 border border-outline-variant/10 outline-none focus:ring-1 focus:ring-secondary/40 focus:border-secondary/30 transition-all duration-300 resize-none shadow-whisper"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                    Onboarding Mode
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { id: "beginner", title: "Beginner-Friendly", text: "Guide players with simpler defaults, support, and onboarding cues." },
                      { id: "advanced", title: "Advanced Table", text: "Assume experienced players and expose denser prep and rules structure." },
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
                        <div className="font-headline text-lg text-on-surface">{option.title}</div>
                        <div className="mt-1 text-sm text-on-surface-variant">{option.text}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={!name.trim()}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input id="world-name" label="World / Region Name" value={worldName} onChange={(e) => setWorldName(e.target.value)} placeholder="Barovia, Elaris, The Shattered Coast..." />
                  <Input id="setting-echo" label="Setting Summary" value={`${system} ${edition}${setting ? ` · ${setting}` : ""}`} readOnly />
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
                    className="w-full bg-surface-container-highest rounded-sm px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 border border-outline-variant/10 outline-none focus:ring-1 focus:ring-secondary/40 focus:border-secondary/30 transition-all duration-300 resize-none shadow-whisper"
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
                    className="w-full bg-surface-container-highest rounded-sm px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 border border-outline-variant/10 outline-none focus:ring-1 focus:ring-secondary/40 focus:border-secondary/30 transition-all duration-300 resize-none shadow-whisper"
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

            {error && (
              <p className="text-error text-sm font-body animate-fade-in">{error}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
