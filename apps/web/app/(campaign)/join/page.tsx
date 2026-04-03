"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteCodeInput } from "@/components/campaign/invite-code-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function getViewerRoleLabel(role: string | null) {
  switch (role) {
    case "DM":
      return "the DM";
    case "CO_DM":
      return "a co-DM";
    case "SPECTATOR":
      return "a spectator";
    default:
      return "a player";
  }
}

export default function JoinCampaignPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joinRole, setJoinRole] = useState<"PLAYER" | "SPECTATOR">("PLAYER");
  const [campaign, setCampaign] = useState<{
    id: string;
    name: string;
    description?: string | null;
    status?: string;
    dm: { name: string };
    memberCount: number;
    viewerRole: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCodeComplete(inviteCode: string) {
    setCode(inviteCode);
    setError("");
    setLoading(true);

    const res = await fetch(`/api/campaigns/lookup?code=${inviteCode}`);
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Campaign not found");
      setCampaign(null);
      return;
    }

    const data = await res.json();
    setCampaign(data);
  }

  async function handleJoin() {
    if (!campaign) return;
    if (campaign.viewerRole) {
      router.push(`/lobby/${campaign.id}`);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/campaigns/${campaign.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code, role: joinRole }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409) {
        router.push(`/lobby/${campaign.id}`);
        return;
      }
      setError(data.error || "Failed to join");
      return;
    }

    router.push(`/lobby/${campaign.id}`);
  }

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-12">
      <section className="relative p-8 md:p-12 bg-surface-container-low rounded-sm overflow-hidden border border-secondary/5">
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />
        <div className="decorative-orb absolute -top-20 -left-20 w-60 h-60" />
        <div className="decorative-orb absolute -bottom-16 -right-16 w-48 h-48" />

        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-2 animate-fade-in-up">
            <h2 className="font-headline text-3xl md:text-4xl text-secondary tracking-tight">
              Enter the Fray
            </h2>
            <p className="font-body text-on-surface-variant max-w-md mx-auto text-sm md:text-base">
              Speak the secret cipher provided by your Dungeon Master to bind
              your soul to the party.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="glass rounded-sm p-6 md:p-8">
              <InviteCodeInput onComplete={handleCodeComplete} disabled={loading} />
            </div>

            {error && (
              <p className="text-error text-sm font-body animate-fade-in">{error}</p>
            )}

            {campaign && (
              <div className="bg-surface-container rounded-sm p-6 w-full max-w-sm space-y-4 animate-scale-in border border-secondary/10 shadow-elevated">
                <div className="text-center space-y-1">
                  <h3 className="font-headline text-xl text-primary">
                    {campaign.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
                    DM: {campaign.dm.name} · {campaign.memberCount} members
                  </p>
                </div>

                {campaign.viewerRole ? (
                  <div className="rounded-sm border border-secondary/10 bg-surface-container-high/50 p-3 text-center">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
                      Already Joined
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      You are currently in this campaign as {getViewerRoleLabel(campaign.viewerRole)}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/60 text-center">
                      Join As
                    </p>
                    <div className="grid gap-2">
                      {[
                        {
                          id: "PLAYER" as const,
                          title: "Player",
                          description: "Create and manage a character, inventory, and party actions.",
                        },
                        {
                          id: "SPECTATOR" as const,
                          title: "Spectator",
                          description: "Follow the campaign and lore without active player actions.",
                        },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setJoinRole(option.id)}
                          className={`rounded-sm border p-3 text-left transition-colors ${
                            joinRole === option.id
                              ? "border-secondary/40 bg-secondary/10"
                              : "border-outline-variant/10 bg-surface-container-high/40 hover:border-secondary/20"
                          }`}
                        >
                          <p className="font-headline text-base text-on-surface">{option.title}</p>
                          <p className="mt-1 text-sm text-on-surface-variant">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleJoin} className="w-full glow-gold-strong" disabled={loading}>
                  <span className="flex items-center gap-3">
                    {campaign.viewerRole ? "Open Campaign" : `Join as ${joinRole === "PLAYER" ? "Player" : "Spectator"}`}
                    <Icon name="auto_awesome" size={16} />
                  </span>
                </Button>
              </div>
            )}

            {!campaign && !error && code && loading && (
              <p className="text-on-surface-variant text-sm animate-pulse">
                Searching the archives...
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
