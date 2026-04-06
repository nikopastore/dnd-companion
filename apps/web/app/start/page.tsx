import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getBuilderRouteForMembership,
  getDefaultEntryRoute,
  getOnboardingState,
} from "@/lib/onboarding";
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
    <main className="mx-auto max-w-5xl space-y-10 px-6 pb-32 pt-24">
      {/* Welcome header */}
      <section className="space-y-4 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-4 py-1.5">
          <Icon name="flare" size={14} className="text-secondary" />
          <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
            Welcome, {session.user.name?.split(" ")[0] || "Adventurer"}
          </span>
        </div>

        <h1 className="font-headline text-4xl tracking-tight text-on-background sm:text-5xl">
          Choose Your Path
        </h1>

        <p className="mx-auto max-w-xl text-base leading-relaxed text-on-surface-variant">
          Are you here to run a campaign or join one? Pick a role to get started.
        </p>
      </section>

      {showCampaignChoice && (
        <section className="grid gap-6 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <article className="relative overflow-hidden rounded-2xl border border-secondary/15 bg-surface-container-low p-7 shadow-float">
            <div className="decorative-orb absolute -right-12 -top-10 h-44 w-44 bg-secondary/20" />
            <div className="relative space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10 text-secondary">
                <Icon name="castle" size={22} />
              </div>
              <div>
                <h2 className="font-headline text-3xl text-on-surface">Start as a DM</h2>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  Create a campaign, define the world, set house rules, then invite
                  your players.
                </p>
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
                  Join a campaign with an invite code, then build your character with
                  the guided creation wizard.
                </p>
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
            <h2 className="font-headline text-3xl text-on-surface">
              Choose which campaign needs a hero first
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              You&apos;ve joined multiple campaigns. Pick one below to start building
              your character.
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
