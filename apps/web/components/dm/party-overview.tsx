"use client";

import { HealthBar } from "@/components/ui/health-bar";
import { Icon } from "@/components/ui/icon";

interface PartyMember {
  id: string;
  user: { name: string | null };
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
}

interface Props {
  campaignName: string;
  members: PartyMember[];
  onViewCharacter: (characterId: string) => void;
}

export function PartyOverview({ campaignName, members, onViewCharacter }: Props) {
  const withCharacters = members.filter((m) => m.character);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end border-b border-secondary/10 pb-2">
        <h2 className="font-headline text-3xl font-bold text-on-background">Active Party</h2>
        <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary">
          {campaignName}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {withCharacters.map((member) => {
          const char = member.character!;
          const hpPercent = char.maxHP > 0 ? (char.currentHP / char.maxHP) * 100 : 0;
          const isLowHP = hpPercent < 50;

          return (
            <button
              key={member.id}
              onClick={() => onViewCharacter(char.id)}
              className={`bg-surface-container-low p-5 relative overflow-hidden group text-left interactive-lift paper-texture transition-all duration-300 ${
                isLowHP ? "border border-error/20 glow-danger" : "border border-transparent"
              }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-tighter text-secondary mb-1">
                    {char.race.name} {char.class.name} · Level {char.level}
                  </p>
                  <h3 className="font-headline text-2xl font-bold text-on-surface">
                    {char.name}
                  </h3>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-secondary bg-surface-container-highest flex items-center justify-center animate-pulse-glow">
                    <span className="font-headline text-xl font-bold text-secondary">
                      {char.armorClass}
                    </span>
                  </div>
                  <span className="font-label text-[10px] uppercase mt-1 text-on-surface/40">
                    AC
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-1 relative z-10">
                <HealthBar current={char.currentHP} max={char.maxHP} showLabel />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 relative z-10">
                <div className="bg-surface-container p-2 text-center border-l border-secondary/20">
                  <p className="font-label text-[10px] uppercase text-on-surface/40">Initiative</p>
                  <p className="font-headline text-lg text-secondary">
                    {char.initiative >= 0 ? "+" : ""}{char.initiative}
                  </p>
                </div>
                <div className="bg-surface-container p-2 text-center border-l border-secondary/20">
                  <p className="font-label text-[10px] uppercase text-on-surface/40">Speed</p>
                  <p className="font-headline text-lg text-secondary">{char.speed}ft</p>
                </div>
                <div className="bg-surface-container p-2 text-center border-l border-secondary/20">
                  <p className="font-label text-[10px] uppercase text-on-surface/40">Player</p>
                  <p className="font-body text-sm text-on-surface-variant truncate">
                    {member.user.name}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {withCharacters.length === 0 && (
        <div className="text-center py-12">
          <Icon name="group" size={48} className="text-on-surface/10 mx-auto mb-3" />
          <p className="text-on-surface-variant font-body">No characters in this campaign yet</p>
        </div>
      )}
    </section>
  );
}
