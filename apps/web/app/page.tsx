import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AtmosphericHero } from "@/components/ui/atmospheric-hero";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/start");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-28 md:px-8">
      <div className="decorative-orb fixed -right-24 top-0 h-[560px] w-[560px] bg-primary-container opacity-20" />
      <div className="decorative-orb fixed -left-24 bottom-0 h-[420px] w-[420px] bg-secondary opacity-15" />
      <div className="decorative-orb fixed left-1/3 top-1/3 h-[280px] w-[280px] bg-tertiary-container opacity-10" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <AtmosphericHero
          eyebrow="Living Campaign Companion"
          title="Run your table like a mythic chronicle, not a spreadsheet."
          description="The Digital Tome gives your campaign a cinematic command center: character builders, DM prep, quest continuity, map tools, party logistics, and AI-assisted world management in one dark-fantasy workspace."
          entityType="location"
          imageName="The Ember Archive"
          chips={["D&D 5e", "Campaign Memory", "Builder-Driven", "DM + Player Views"]}
          highlights={[
            { icon: "auto_stories", label: "Story Depth", value: "World, lore, factions, continuity" },
            { icon: "inventory_2", label: "Live Systems", value: "Loot, trade, crafting, treasury" },
            { icon: "graphic_eq", label: "DM AI", value: "Voice commands and guided actions" },
          ]}
          actions={
            session?.user ? (
              <>
                <Link href="/campaigns">
                  <Button size="lg">
                    <Icon name="groups" size={18} />
                    Open Campaigns
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button variant="secondary" size="lg">
                    <Icon name="person_add" size={18} />
                    Create Character
                  </Button>
                </Link>
                <Link href="/join">
                  <Button variant="ghost" size="lg">
                    <Icon name="login" size={18} />
                    Join Campaign
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="glow-gold-strong">
                    <Icon name="arrow_forward" size={18} />
                    Begin Your Journey
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="lg">
                    <Icon name="person_add" size={18} />
                    Create Account
                  </Button>
                </Link>
              </>
            )
          }
          sideContent={
            <div className="space-y-4">
              <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                What it feels like
              </p>
              <div className="space-y-3">
                {[
                  "Players get guided builders and living character sheets.",
                  "DMs get prep, world-state, encounters, and campaign continuity.",
                  "Every major object becomes a visual artifact instead of a bare form.",
                ].map((line) => (
                  <div
                    key={line}
                    className="rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant"
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low/80 p-6 shadow-elevated">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/10">
                <Icon name="workspace_premium" size={20} className="text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-on-background">Designed Like a Worldbook</h2>
                <p className="text-sm text-on-surface-variant">
                  The strongest parts of the current UI are the theme and the builder system. The weakest parts were that the high-level pages still looked too flat and abstract.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  icon: "person",
                  title: "Character Journeys",
                  text: "Builder-first ancestry, class, spellbook, inventory, and story surfaces.",
                },
                {
                  icon: "map",
                  title: "Campaign Operations",
                  text: "Locations, quests, encounters, continuity, and map-driven live play.",
                },
                {
                  icon: "graphic_eq",
                  title: "Reactive DM Tools",
                  text: "Voice/text AI commands, live grants, rests, and shared party updates.",
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Icon name={feature.icon} size={18} />
                  </div>
                  <h3 className="mt-4 font-headline text-lg text-on-surface">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-secondary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 shadow-float">
            <div className="space-y-4">
              <p className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
                Core Pillars
              </p>
              {[
                ["Campaign Memory", "Who was met, what changed, what the party forgot, and what matters next."],
                ["Visual Builders", "Races, classes, quests, locations, encounters, and loot all start with curated options."],
                ["Shared Table Flow", "Party stash, treasury, scheduling, handouts, chat, and live map/combat state."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Icon name="bookmark_added" size={16} className="text-secondary" />
                    <h3 className="font-headline text-lg text-on-surface">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
