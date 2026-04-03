import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface CampaignCardProps {
  id: string;
  name: string;
  dmName: string;
  memberCount: number;
  members: Array<{ name: string | null; image: string | null }>;
  status: string;
  system?: string;
  edition?: string;
  setting?: string | null;
  viewerRole?: string | null;
}

const ROLE_BADGES: Record<string, string> = {
  DM: "bg-secondary/15 text-secondary border-secondary/20",
  CO_DM: "bg-primary/15 text-primary border-primary/20",
  PLAYER: "bg-surface-container-high text-on-surface-variant border-outline-variant/10",
  SPECTATOR: "bg-surface-container-high/60 text-on-surface-variant/70 border-outline-variant/10",
};

function getRoleLabel(role?: string | null) {
  switch (role) {
    case "DM":
      return "DM";
    case "CO_DM":
      return "Co-DM";
    case "PLAYER":
      return "Player";
    case "SPECTATOR":
      return "Spectator";
    default:
      return null;
  }
}

export function CampaignCard({
  id,
  name,
  dmName,
  memberCount,
  members,
  status,
  system,
  edition,
  setting,
  viewerRole,
}: CampaignCardProps) {
  const roleLabel = getRoleLabel(viewerRole);

  return (
    <Link
      href={`/lobby/${id}`}
      className="bg-surface-container-low group cursor-pointer border border-transparent hover:border-secondary/20 transition-all duration-300 block interactive-lift relative overflow-hidden"
    >
      {/* Decorative orb behind card */}
      <div className="decorative-orb absolute -top-16 -right-16 w-40 h-40 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Cover gradient with enhanced overlay */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-container/30 to-surface-container-lowest">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-6 -mt-8 relative z-10 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-headline text-xl text-primary">{name}</h4>
            {status === "ACTIVE" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
            {roleLabel && (
              <span
                className={`rounded-full border px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] ${ROLE_BADGES[viewerRole || "PLAYER"]}`}
              >
                {roleLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
            Dungeon Master: {dmName}
          </p>
          {(system || setting) && (
            <p className="text-[10px] text-on-surface-variant/60 font-label uppercase tracking-tighter">
              {[system, edition, setting].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] text-on-surface-variant font-bold shadow-whisper group-hover:border-secondary/20 transition-colors duration-300"
              >
                {member.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] text-on-surface-variant shadow-whisper">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <Icon
            name="arrow_forward"
            size={20}
            className="text-secondary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}
