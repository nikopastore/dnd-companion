import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/start");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="decorative-orb fixed -right-24 top-0 h-[560px] w-[560px] bg-primary-container opacity-20" />
      <div className="decorative-orb fixed -left-24 bottom-0 h-[420px] w-[420px] bg-secondary opacity-15" />

      <div className="relative z-10 mx-auto max-w-2xl space-y-8 text-center">
        <h1 className="font-headline text-5xl tracking-tight text-on-background sm:text-6xl">
          The Digital Tome
        </h1>

        <p className="text-lg leading-relaxed text-on-surface-variant">
          A companion app for running D&D campaigns. Build characters,
          manage your world, and keep your table in sync.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button size="lg" className="glow-gold-strong">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
