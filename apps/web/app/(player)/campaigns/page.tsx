"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface Campaign {
  id: string;
  name: string;
  status: string;
  system: string;
  edition: string;
  setting: string | null;
  dm: { name: string | null; image: string | null };
  members: Array<{
    user: { name: string | null; image: string | null };
  }>;
  _count: { members: number };
  viewerRole: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-6 pb-32 pt-24">
      <AtmosphericHero
        eyebrow="Campaign Library"
        title="Your campaign shelf should feel like a worldbook, not a file list."
        description="Jump back into active tables, scan your chronicles at a glance, and move between player and DM responsibilities from one richer campaign view."
        entityType="location"
        imageName="The Candlelit Atlas"
        chips={["Player View", "DM View", "Live Chronicle", "Shared World"]}
        highlights={[
          { icon: "auto_stories", label: "Campaigns", value: `${campaigns.length}` },
          {
            icon: "swords",
            label: "Active Tables",
            value: `${campaigns.filter((campaign) => campaign.status === "ACTIVE").length}`,
          },
          {
            icon: "group",
            label: "Roles",
            value:
              Array.from(
                new Set(campaigns.map((campaign) => campaign.viewerRole || "PLAYER")),
              ).join(" · ") || "Player",
          },
        ]}
        actions={
          <>
            <Link href="/join">
              <Button variant="secondary">
                <Icon name="login" size={16} />
                Join Campaign
              </Button>
            </Link>
            <Link href="/create">
              <Button>
                <Icon name="add" size={16} />
                Create Campaign
              </Button>
            </Link>
          </>
        }
        sideContent={
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Reading Room
            </p>
            <div className="grid gap-3 text-sm text-on-surface-variant">
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                Campaign cards now surface setting, system, party size, and visual
                identity faster.
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-3">
                The next layer of polish is making every campaign feel like its own
                illustrated dossier.
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3 animate-fade-in-up">
        {[
          {
            icon: "public",
            title: "Browse by world",
            text: "Settings and systems are visible immediately instead of buried under the title.",
          },
          {
            icon: "group",
            title: "Read party state",
            text: "Cards now emphasize role and party presence so the screen feels alive.",
          },
          {
            icon: "flare",
            title: "Jump into story",
            text: "Primary actions are promoted into the hero so new sessions start faster.",
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

      {loading ? (
        <p className="py-12 text-center text-on-surface-variant animate-pulse">
          Loading campaigns...
        </p>
      ) : campaigns.length === 0 ? (
        <section className="relative overflow-hidden rounded-xl border border-secondary/10 bg-surface-container-low px-6 py-16 text-center shadow-float">
          <div className="decorative-orb absolute inset-0 m-auto h-56 w-56" />
          <Icon
            name="auto_stories"
            size={60}
            className="relative z-10 mx-auto animate-float text-on-surface/10"
          />
          <h3 className="relative z-10 mt-4 font-headline text-2xl text-on-surface-variant">
            No campaigns on your shelf yet
          </h3>
          <p className="relative z-10 mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface/50">
            Start by joining an invite code or creating your own campaign. Once you
            do, this library becomes your illustrated hub for every table, story
            thread, and party.
          </p>
          <div className="relative z-10 flex justify-center gap-4 pt-6">
            <Link href="/join">
              <Button variant="secondary">Join a Campaign</Button>
            </Link>
            <Link href="/create">
              <Button>Create Campaign</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              dmName={campaign.dm.name || "Unknown"}
              memberCount={campaign._count.members}
              members={campaign.members.map((m) => m.user)}
              status={campaign.status}
              system={campaign.system}
              edition={campaign.edition}
              setting={campaign.setting}
              viewerRole={campaign.viewerRole}
            />
          ))}
        </section>
      )}
    </main>
  );
}
