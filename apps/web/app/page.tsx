import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

      <div className="relative z-10 mx-auto max-w-5xl space-y-16">
        {/* Hero */}
        <section className="space-y-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-4 py-1.5">
            <Icon name="auto_stories" size={14} className="text-secondary" />
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">
              D&D 5e Campaign Companion
            </span>
          </div>

          <h1 className="font-headline text-4xl tracking-tight text-on-background sm:text-5xl md:text-6xl">
            Run your table like a mythic chronicle, not a spreadsheet.
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
            Character builders, DM prep, quest continuity, party logistics, and
            AI-assisted world management — all in one dark-fantasy workspace.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
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
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-5 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          {[
            {
              icon: "person",
              title: "Character Journeys",
              text: "Visual ancestry, class, and background builders with guided creation and living character sheets.",
            },
            {
              icon: "map",
              title: "Campaign Operations",
              text: "Locations, quests, encounters, continuity tracking, and shared party state — all in one place.",
            },
            {
              icon: "graphic_eq",
              title: "DM AI Tools",
              text: "AI-assisted worldbuilding, backstory generation, and encounter management to keep your table moving.",
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-outline-variant/10 bg-surface-container-low/80 p-6 shadow-elevated"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/10 text-secondary">
                <Icon name={feature.icon} size={20} />
              </div>
              <h3 className="mt-4 font-headline text-xl text-on-surface">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.text}</p>
            </article>
          ))}
        </section>

        {/* Pillars */}
        <section className="rounded-2xl border border-secondary/10 bg-surface-container-low/60 p-8 shadow-float animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <p className="mb-5 font-label text-[10px] uppercase tracking-[0.18em] text-secondary/80">
            Core Pillars
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Campaign Memory", "Track who was met, what changed, and what matters next across sessions."],
              ["Visual Builders", "Races, classes, backgrounds, quests, and encounters — all with curated options."],
              ["Shared Table Flow", "Party stash, treasury, handouts, live combat state, and real-time updates."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-outline-variant/10 bg-background/40 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Icon name="bookmark_added" size={16} className="text-secondary" />
                  <h3 className="font-headline text-lg text-on-surface">{title}</h3>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
