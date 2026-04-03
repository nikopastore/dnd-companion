"use client";

import { EntityImage } from "@/components/ui/entity-image";
import { Icon } from "@/components/ui/icon";
import type { CharacterNotification } from "@/lib/character-notifications";

interface Props {
  notifications: CharacterNotification[];
  onDismiss: (ids: string[]) => void;
  onViewInventory: () => void;
}

const TYPE_ICON: Record<CharacterNotification["type"], string> = {
  item_received: "inventory_2",
  rest_applied: "hotel",
  campaign_update: "campaign",
};

export function CharacterNotificationStack({ notifications, onDismiss, onViewInventory }: Props) {
  if (notifications.length === 0) return null;

  return (
    <section className="space-y-3 animate-fade-in-up">
      {notifications.map((notification) => {
        const quantity =
          typeof notification.metadata?.quantity === "number" ? notification.metadata.quantity : null;
        const restType =
          typeof notification.metadata?.restType === "string" ? notification.metadata.restType : null;

        return (
          <div
            key={notification.id}
            className="relative overflow-hidden rounded-sm border border-secondary/20 bg-surface-container-low p-4 shadow-elevated animate-scale-in"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-secondary" />
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {notification.imageUrl ? (
                  <EntityImage imageUrl={notification.imageUrl} entityType="item" name={notification.title} size="sm" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-secondary/15 bg-secondary/10">
                    <Icon name={TYPE_ICON[notification.type]} size={22} className="text-secondary" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline text-base text-secondary">{notification.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{notification.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {quantity !== null && (
                        <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-secondary">
                          x{quantity}
                        </span>
                      )}
                      {restType && (
                        <span className="rounded-full bg-primary-container/15 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                          {restType}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismiss([notification.id])}
                    className="text-on-surface-variant/50 transition-colors hover:text-on-surface"
                    aria-label="Dismiss notification"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  {notification.type === "item_received" && (
                    <button
                      type="button"
                      onClick={onViewInventory}
                      className="inline-flex items-center gap-1 rounded-sm border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-secondary transition-colors hover:bg-secondary/15"
                    >
                      <Icon name="inventory_2" size={14} />
                      View Inventory
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss([notification.id])}
                    className="inline-flex items-center gap-1 rounded-sm border border-outline-variant/10 bg-surface-container px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-on-surface-variant transition-colors hover:text-on-surface"
                  >
                    <Icon name="done" size={14} />
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
