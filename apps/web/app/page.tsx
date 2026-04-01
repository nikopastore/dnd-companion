import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background decorative elements */}
      <div className="decorative-orb w-[600px] h-[600px] bg-primary-container -top-40 -right-40 fixed" />
      <div className="decorative-orb w-[400px] h-[400px] bg-secondary -bottom-20 -left-20 fixed" />
      <div className="decorative-orb w-[300px] h-[300px] bg-tertiary-container top-1/3 left-1/4 fixed" />

      <div className="relative z-10 text-center space-y-8 max-w-2xl animate-fade-in-up">
        {/* Logo mark */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-lg bg-surface-container-low border border-secondary/20 flex items-center justify-center glow-gold animate-float">
            <span className="material-symbols-outlined text-4xl text-secondary">auto_stories</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tight leading-[1.1]">
            The Digital
            <br />
            <span className="text-secondary">Tome</span>
          </h1>
          <div className="decorative-line w-32 mx-auto" />
          <p className="font-body text-lg md:text-xl text-on-surface-variant/80 max-w-lg mx-auto leading-relaxed">
            A premium companion for your Dungeons & Dragons adventures.
            Create characters, manage campaigns, and forge legends.
          </p>
        </div>

        {session?.user ? (
          <div className="space-y-6 pt-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <p className="font-body text-on-surface/70">
              Welcome back,{" "}
              <span className="text-secondary font-semibold font-headline">
                {session.user.name || session.user.email}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/campaigns"
                className="gradient-crimson px-8 py-3.5 rounded-sm text-on-primary-container font-body font-semibold border border-secondary/30 shadow-whisper hover:shadow-elevated hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                My Campaigns
              </Link>
              <Link
                href="/builder"
                className="bg-surface-container-highest/80 px-8 py-3.5 rounded-sm text-on-surface font-body font-semibold border border-outline-variant/20 hover:border-secondary/30 hover:bg-surface-bright transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                New Character
              </Link>
              <Link
                href="/join"
                className="bg-surface-container-highest/80 px-8 py-3.5 rounded-sm text-on-surface font-body font-semibold border border-outline-variant/20 hover:border-secondary/30 hover:bg-surface-bright transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Join Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <Link
              href="/login"
              className="gradient-crimson px-10 py-4 rounded-sm text-on-primary-container font-body font-semibold text-lg border border-secondary/30 shadow-elevated hover:shadow-float hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Begin Your Journey
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Feature hints */}
        {!session?.user && (
          <div className="grid grid-cols-3 gap-6 pt-8 max-w-md mx-auto animate-fade-in" style={{ animationDelay: "400ms" }}>
            {[
              { icon: "person", label: "Characters" },
              { icon: "groups", label: "Campaigns" },
              { icon: "casino", label: "Dice Roller" },
            ].map((feat) => (
              <div key={feat.label} className="text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-surface-container-high/50 border border-outline-variant/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-on-surface/30">{feat.icon}</span>
                </div>
                <span className="font-label text-[9px] uppercase tracking-widest text-on-surface/30">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
