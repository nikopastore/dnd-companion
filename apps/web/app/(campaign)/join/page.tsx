"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteCodeInput } from "@/components/campaign/invite-code-input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function JoinCampaignPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [campaign, setCampaign] = useState<{
    id: string;
    name: string;
    dm: { name: string };
    memberCount: number;
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
    setLoading(true);
    setError("");

    const res = await fetch(`/api/campaigns/${campaign.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 409) {
        // Already a member, redirect to lobby
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
      {/* Join Ritual Section */}
      <section className="relative p-8 md:p-12 bg-surface-container-low rounded-sm overflow-hidden border border-secondary/5">
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />

        {/* Decorative orbs */}
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
            {/* Glass background on code input section */}
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
                <Button onClick={handleJoin} className="w-full glow-gold-strong" disabled={loading}>
                  <span className="flex items-center gap-3">
                    Join Campaign
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
