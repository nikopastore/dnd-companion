import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getBuilderRouteForMembership,
  getDefaultEntryRoute,
  getOnboardingState,
} from "@/lib/onboarding";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default async function StartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const state = await getOnboardingState(session.user.id);
  const entryRoute = getDefaultEntryRoute(state);

  if (entryRoute) {
    redirect(entryRoute);
  }

  const showCampaignChoice = state.memberships.length === 0 && state.characters.length === 0;
  const pendingCampaigns = state.incompletePlayerMemberships;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-6 pb-32 pt-24">
      <AtmosphericHero
        eyebrow="First Entry"
        title="Every first login should open a path, not a blank dashboard."
        description="New DMs should be taken into campaign founding. New players should be taken into character creation for the campaign they joined. This portal resolves that first decision and keeps the table moving."
        entityType="character"
        imageName="The Gate of First Light"
        chips={["Guided Entry", "Campaign Setup", "Character Builder", "No Dead Ends"]}
        highlights={[
          { icon: "groups", label: "Campaigns", value: `${state.memberships.length}` },
          { icon: "shield", label: "Managed Tables", value: `${state.manageableMemberships.length}` },
          { icon: "person", label: "Characters", value: `${state.characters.length}` },
        ]}
      />

      {showCampaignChoice && (
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-2xl border border-secondary/15 bg-surface-container-low p-7 shadow-float">
            <div className="decorative-orb absolute -right-12 -top-10 h-44 w-44 bg-secondary/20" />
            <div className="relative space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10 text-secondary">
                <Icon name="castle" size={22} />
              </div>
              <div>
                <h2 className="font-headline text-3xl text-on-surface">Start as a DM</h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Found a campaign first: name the world, define tone, house rules,
                  and onboarding style, then invite the party.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-on-surface-variant">
                {[
                  "Campaign name, system, edition, setting, and tone",
                  "Beginner or advanced onboarding posture",
                  "World seed, summary, and house rules",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-outline-variant/10 bg-background/40 px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/create">
                <Button size="lg" className="glow-gold-strong">
                  <Icon name="auto_stories" size={18} />
                  Create Campaign
                </Button>
              </Link>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-primary/15 bg-surface-container-low p-7 shadow-float">
            <div className="decorative-orb absolute -left-12 -top-10 h-44 w-44 bg-primary/15" />
            <div className="relative space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Icon name="swords" size={22} />
              </div>
              <div>
                <h2 className="font-headline text-3xl text-on-surface">Start as a Player</h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Join with an invite code, then the platform can route you directly
                  into a campaign-aware character builder instead of an empty shell.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-on-surface-variant">
                {[
                  "Join as a player or spectator",
                  "Bind a new hero to the joined campaign",
                  "Move straight into the race, class, and origin builder",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-outline-variant/10 bg-background/40 px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/join">
                <Button variant="secondary" size="lg">
                  <Icon name="login" size={18} />
                  Join Campaign
                </Button>
              </Link>
            </div>
          </article>
        </section>
      )}

      {pendingCampaigns.length > 1 && (
        <section className="space-y-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-7 shadow-elevated">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
              Character Creation Queue
            </p>
            <h2 className="mt-2 font-headline text-3xl text-on-surface">
              Choose which campaign needs a hero first
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              You have player memberships without linked characters. Pick a campaign
              below and the builder will open already attached to that table.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingCampaigns.map((membership) => (
              <article
                key={membership.id}
                className="rounded-2xl border border-outline-variant/10 bg-background/40 p-5"
              >
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/75">
                  {membership.campaign.system} {membership.campaign.edition}
                </p>
                <h3 className="mt-2 font-headline text-2xl text-on-surface">
                  {membership.campaign.name}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {membership.campaign.setting || membership.campaign.description || "Campaign ready for a new character."}
                </p>
                <Link href={getBuilderRouteForMembership(membership)} className="mt-5 inline-block">
                  <Button>
                    <Icon name="person_add" size={16} />
                    Build Character
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
