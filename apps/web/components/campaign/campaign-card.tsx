import Link from "next/link";
import { EntityImage } from "@/components/ui/entity-image";
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
      className="group relative block cursor-pointer overflow-hidden rounded-xl border border-transparent bg-surface-container-low transition-all duration-300 interactive-lift hover:border-secondary/20"
    >
      <div className="decorative-orb absolute -right-16 -top-16 h-40 w-40 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative h-40 overflow-hidden">
        <EntityImage
          entityType="location"
          name={setting || name}
          size="xl"
          className="h-full w-full rounded-none border-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full border border-secondary/15 bg-background/55 px-3 py-1 font-label text-[9px] uppercase tracking-[0.16em] text-secondary/90 backdrop-blur-sm">
            {status === "ACTIVE" ? "In Play" : status}
          </span>
          {roleLabel && (
            <span
              className={`rounded-full border px-2 py-1 font-label text-[9px] uppercase tracking-[0.16em] backdrop-blur-sm ${ROLE_BADGES[viewerRole || "PLAYER"]}`}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 -mt-10 space-y-4 p-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-headline text-xl text-primary">{name}</h4>
            {status === "ACTIVE" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            )}
          </div>
          <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">
            Dungeon Master: {dmName}
          </p>
          {(system || setting) && (
            <p className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant/60">
              {[system, edition, setting].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high/70 px-3 py-2">
            <p className="font-label text-[9px] uppercase tracking-[0.16em] text-secondary/80">
              Party Size
            </p>
            <p className="mt-1 font-headline text-lg text-on-surface">{memberCount}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high/70 px-3 py-2">
            <p className="font-label text-[9px] uppercase tracking-[0.16em] text-secondary/80">
              Featured Setting
            </p>
            <p className="mt-1 truncate font-headline text-lg text-on-surface">
              {setting || "Custom World"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-highest text-[10px] font-bold text-on-surface-variant shadow-whisper transition-colors duration-300 group-hover:border-secondary/20"
              >
                {member.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-low bg-surface-container-highest text-[10px] text-on-surface-variant shadow-whisper">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <Icon
            name="arrow_forward"
            size={20}
            className="text-secondary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          />
        </div>
      </div>
    </Link>
  );
}
