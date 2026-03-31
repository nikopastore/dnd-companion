import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="font-headline text-6xl font-bold text-primary">
          The Digital Tome
        </h1>
        <p className="font-body text-xl text-on-surface-variant max-w-lg mx-auto">
          A premium companion for your Dungeons & Dragons adventures.
          Create characters, manage campaigns, and forge legends.
        </p>

        {session?.user ? (
          <div className="space-y-4 pt-4">
            <p className="font-body text-on-surface">
              Welcome back,{" "}
              <span className="text-secondary font-semibold">
                {session.user.name || session.user.email}
              </span>
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/characters"
                className="gradient-crimson px-8 py-3 rounded-sm text-on-primary font-body font-semibold border-gold hover:glow-gold transition-all"
              >
                My Characters
              </Link>
              <Link
                href="/join"
                className="bg-surface-container-highest px-8 py-3 rounded-sm text-on-surface font-body font-semibold hover:bg-surface-bright transition-all"
              >
                Join Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="gradient-crimson px-8 py-3 rounded-sm text-on-primary font-body font-semibold border-gold hover:glow-gold transition-all"
            >
              Begin Your Journey
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
