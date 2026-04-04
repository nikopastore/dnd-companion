"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface Campaign {
  id: string;
  name: string;
  status: string;
  inviteCode: string;
  system: string;
  edition: string;
  setting: string | null;
  _count: { members: number };
  viewerRole: string | null;
  viewerCanManage: boolean;
}

function getRoleLabel(role: string | null) {
  return role === "CO_DM" ? "Co-DM" : "DM";
}

export default function DMDashboardPage() {
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

  const manageableCampaigns = campaigns.filter((campaign) => campaign.viewerCanManage);

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-6 pb-32 pt-24">
      <AtmosphericHero
        eyebrow="DM Command"
        title="Run the table from a screen that feels like a war room."
        description="Your dashboard should surface story pressure, campaign cadence, and active tables immediately. This pass shifts the DM surface from a plain list into a command deck with stronger visual identity."
        entityType="encounter"
        imageName="The Strategist's Ember Map"
        chips={["Campaign Prep", "Live Oversight", "Story Pressure", "Co-DM Ready"]}
        highlights={[
          { icon: "shield", label: "Manageable Tables", value: `${manageableCampaigns.length}` },
          {
            icon: "play_circle",
            label: "Active Campaigns",
            value: `${manageableCampaigns.filter((campaign) => campaign.status === "ACTIVE").length}`,
          },
          {
            icon: "badge",
            label: "Roles",
            value:
              Array.from(
                new Set(manageableCampaigns.map((campaign) => getRoleLabel(campaign.viewerRole))),
              ).join(" · ") || "DM",
          },
        ]}
        actions={
          <Link href="/create">
            <Button>
              <Icon name="add" size={16} />
              New Campaign
            </Button>
          </Link>
        }
        sideContent={
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Command Notes
            </p>
            <div className="rounded-xl border border-outline-variant/10 bg-background/40 p-4 text-sm leading-relaxed text-on-surface-variant">
              High-traffic DM surfaces now need to feel image-led and urgent, not
              like internal admin tables. This dashboard is now the top layer of that
              shift.
            </div>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3 animate-fade-in-up">
        {[
          {
            icon: "campaign",
            title: "At-a-glance roster",
            text: "Campaign counts, roles, and activity state are surfaced before you open a lobby.",
          },
          {
            icon: "auto_stories",
            title: "Story-first cards",
            text: "Each campaign card now reads like an illustrated dossier instead of a simple link row.",
          },
          {
            icon: "bolt",
            title: "Fast entry points",
            text: "The hero keeps creation and table resumption above the fold for repeat DM use.",
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
          Loading...
        </p>
      ) : manageableCampaigns.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl border border-secondary/10 bg-surface-container-low px-6 py-16 text-center shadow-float">
          <div className="decorative-orb absolute inset-0 m-auto w-48 h-48" />
          <Icon
            name="auto_stories"
            size={60}
            className="relative z-10 mx-auto animate-float text-on-surface/10"
          />
          <h3 className="relative z-10 font-headline text-2xl text-on-surface-variant">
            No campaigns to manage yet
          </h3>
          <p className="relative z-10 mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface/50">
            Forge a campaign and this command deck becomes your staging ground for
            prep, live control, continuity, and player-facing coordination.
          </p>
          <Link href="/create" className="relative z-10 inline-block pt-4">
            <Button>Create Your First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {manageableCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/lobby/${campaign.id}`}
              className="group relative block overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all duration-300 hover:border-secondary/20 hover:bg-surface-container interactive-glow"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(233,195,73,0.12),transparent_40%,rgba(150,45,45,0.18))]" />
              <div className="relative flex h-full flex-col justify-between gap-5">
                <div>
                  <h3 className="font-headline text-xl text-primary">{campaign.name}</h3>
                  <p className="mt-1 font-label text-xs uppercase tracking-tighter text-on-surface-variant">
                    {getRoleLabel(campaign.viewerRole)} · {campaign._count.members} members
                    {" · "}
                    {[campaign.system, campaign.edition, campaign.setting]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · "}Code: {campaign.inviteCode}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-sm px-2 py-1 font-label text-[10px] uppercase ${
                      campaign.status === "ACTIVE"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-surface-container-high text-on-surface/40"
                    }`}
                  >
                    {campaign.status}
                  </span>
                  <Icon
                    name="arrow_forward"
                    size={20}
                    className="text-secondary/60 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
