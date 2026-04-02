import { Icon } from "./icon";

interface EntityImageProps {
  imageUrl?: string | null;
  entityType: "character" | "npc" | "location" | "item" | "quest" | "encounter" | "race" | "class" | "spell";
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  character: "person",
  npc: "group",
  location: "map",
  item: "inventory_2",
  quest: "assignment",
  encounter: "swords",
  race: "diversity_3",
  class: "shield",
  spell: "auto_awesome",
};

const TYPE_COLORS: Record<string, string> = {
  character: "from-primary-container/20 to-primary/5",
  npc: "from-secondary-container/20 to-secondary/5",
  location: "from-green-900/20 to-green-500/5",
  item: "from-secondary-container/20 to-secondary/5",
  quest: "from-blue-900/20 to-blue-500/5",
  encounter: "from-error-container/20 to-error/5",
  race: "from-purple-900/20 to-purple-500/5",
  class: "from-primary-container/20 to-primary/5",
  spell: "from-violet-900/20 to-violet-500/5",
};

export function EntityImage({
  imageUrl,
  entityType,
  name,
  size = "md",
  className = "",
}: EntityImageProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  }[size];

  const iconSizes = { xs: 14, sm: 20, md: 28, lg: 40, xl: 56 }[size];

  if (imageUrl) {
    return (
      <div className={`${sizeClasses} rounded-sm overflow-hidden border border-outline-variant/10 ${className}`}>
        <img src={imageUrl} alt={name || entityType} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses} rounded-sm overflow-hidden
        bg-gradient-to-br ${TYPE_COLORS[entityType] || "from-surface-container-high to-surface-container"}
        border border-outline-variant/10
        flex items-center justify-center
        ${className}
      `}
    >
      <Icon
        name={TYPE_ICONS[entityType] || "image"}
        size={iconSizes}
        className="text-on-surface/15"
      />
    </div>
  );
}
