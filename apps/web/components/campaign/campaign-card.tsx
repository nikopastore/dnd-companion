import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface CampaignCardProps {
  id: string;
  name: string;
  dmName: string;
  memberCount: number;
  members: Array<{ name: string | null; image: string | null }>;
  status: string;
}

export function CampaignCard({
  id,
  name,
  dmName,
  memberCount,
  members,
  status,
}: CampaignCardProps) {
  return (
    <Link
      href={`/lobby/${id}`}
      className="bg-surface-container-low group cursor-pointer border border-transparent hover:border-secondary/20 transition-all duration-300 block"
    >
      {/* Placeholder cover gradient */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary-container/30 to-surface-container-lowest">
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
      </div>

      <div className="p-6 -mt-8 relative z-10 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-headline text-xl text-primary">{name}</h4>
            {status === "ACTIVE" && (
              <span className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-tighter">
            Dungeon Master: {dmName}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] text-on-surface-variant font-bold"
              >
                {member.name?.[0]?.toUpperCase() || "?"}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] text-on-surface-variant">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <Icon
            name="arrow_forward"
            size={20}
            className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </Link>
  );
}
