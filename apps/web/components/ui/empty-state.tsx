import { Icon } from "./icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 relative">
      <div className="decorative-orb absolute inset-0 m-auto w-48 h-48" />
      <div className="relative z-10 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-high/30 border border-outline-variant/10 flex items-center justify-center animate-float">
          <Icon name={icon} size={32} className="text-on-surface/15" />
        </div>
        <h3 className="font-headline text-xl text-on-surface-variant">{title}</h3>
        {description && (
          <p className="font-body text-sm text-on-surface/30 max-w-sm mx-auto">{description}</p>
        )}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
