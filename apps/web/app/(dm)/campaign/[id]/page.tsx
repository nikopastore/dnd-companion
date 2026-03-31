"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PartyOverview } from "@/components/dm/party-overview";
import { NPCTracker } from "@/components/dm/npc-tracker";
import { SessionItemTracker } from "@/components/dm/session-item-tracker";
import { LiveActivityFeed } from "@/components/campaign/live-activity-feed";

interface CampaignData {
  id: string;
  name: string;
  inviteCode: string;
  status: string;
  dm: { id: string; name: string | null };
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; image: string | null };
    character: {
      id: string;
      name: string;
      level: number;
      currentHP: number;
      maxHP: number;
      armorClass: number;
      initiative: number;
      speed: number;
      race: { name: string };
      class: { name: string };
    } | null;
  }>;
  npcs: Array<{ id: string; name: string; description: string | null; isEnemy: boolean; notes: string | null }>;
  sessionItems: Array<{ id: string; name: string; description: string | null; location: string | null; isHidden: boolean; claimedById: string | null }>;
}

export default function DMCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => { setCampaign(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddNPC = useCallback((npc: CampaignData["npcs"][0]) => {
    setCampaign((prev) => prev ? { ...prev, npcs: [...prev.npcs, npc] } : prev);
  }, []);

  const handleAddItem = useCallback((item: CampaignData["sessionItems"][0]) => {
    setCampaign((prev) => prev ? { ...prev, sessionItems: [...prev.sessionItems, item] } : prev);
  }, []);

  if (loading) {
    return (
      <main className="pt-20 pb-24 px-4 max-w-[1600px] mx-auto">
        <p className="text-center text-on-surface-variant animate-pulse py-12">Loading campaign...</p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="pt-20 pb-24 px-4 max-w-[1600px] mx-auto">
        <p className="text-center text-error py-12">Campaign not found</p>
      </main>
    );
  }

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Party Overview */}
      <section className="lg:col-span-8 space-y-6">
        <PartyOverview
          campaignName={campaign.name}
          members={campaign.members.map((m) => ({
            ...m,
            character: m.character ? { ...m.character, race: m.character.race, class: m.character.class } : null,
          }))}
          onViewCharacter={setSelectedCharId}
        />
      </section>

      {/* Right: DM Tools Sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Invite Code */}
        <div className="bg-surface-container-low p-6 rounded-sm">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface/40 block mb-2">
            Invite Code
          </span>
          <p className="font-headline text-2xl text-secondary tracking-[0.2em]">
            {campaign.inviteCode.slice(0, 3)}-{campaign.inviteCode.slice(3)}
          </p>
        </div>

        {/* NPCs */}
        <div className="bg-surface-container-low p-6 rounded-sm">
          <NPCTracker
            npcs={campaign.npcs}
            campaignId={campaign.id}
            onAdd={handleAddNPC}
          />
        </div>

        {/* Session Items */}
        <div className="bg-surface-container-low p-6 rounded-sm">
          <SessionItemTracker
            items={campaign.sessionItems}
            campaignId={campaign.id}
            onAdd={handleAddItem}
          />
        </div>

        {/* Live Activity Feed */}
        <LiveActivityFeed campaignId={campaign.id} />
      </aside>
    </main>
  );
}
