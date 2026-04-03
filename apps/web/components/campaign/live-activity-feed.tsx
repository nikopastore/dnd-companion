"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Icon } from "@/components/ui/icon";

interface Activity {
  id: string;
  type: "join" | "leave" | "hp" | "condition" | "dice" | "item" | "encounter" | "map";
  message: string;
  timestamp: string;
}

interface Props {
  campaignId: string;
}

const typeIcons: Record<Activity["type"], string> = {
  join: "login", leave: "logout", hp: "favorite",
  condition: "warning", dice: "casino", item: "inventory_2", encounter: "swords", map: "map",
};

const typeColors: Record<Activity["type"], string> = {
  join: "text-green-400",
  leave: "text-on-surface/40",
  hp: "text-primary",
  condition: "text-amber-400",
  dice: "text-secondary",
  item: "text-secondary",
  encounter: "text-error",
  map: "text-blue-400",
};

export function LiveActivityFeed({ campaignId }: Props) {
  const { connected, on } = useSocket();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!connected) return;

    const unsubs = [
      on("campaign:member-joined", (data: unknown) => {
        const d = data as { userName: string; timestamp: string };
        addActivity("join", `${d.userName} joined the session`, d.timestamp);
      }),
      on("campaign:member-left", (data: unknown) => {
        const d = data as { userName: string; timestamp: string };
        addActivity("leave", `${d.userName} left the session`, d.timestamp);
      }),
      on("character:hp-changed", (data: unknown) => {
        const d = data as { userName: string; characterName: string; changeType: string; amount: number; currentHP: number; maxHP: number; timestamp: string };
        const verb = d.changeType === "damage" ? "took" : "healed";
        addActivity("hp", `${d.characterName} ${verb} ${d.amount} (${d.currentHP}/${d.maxHP})`, d.timestamp);
      }),
      on("character:condition-changed", (data: unknown) => {
        const d = data as { characterName: string; condition: string; action: string; timestamp: string };
        addActivity("condition", `${d.characterName} ${d.action === "add" ? "gained" : "lost"} ${d.condition}`, d.timestamp);
      }),
      on("dice:rolled", (data: unknown) => {
        const d = data as { userName: string; dice: string; total: number; purpose?: string; timestamp: string };
        addActivity("dice", `${d.userName} rolled ${d.dice} → ${d.total}${d.purpose ? ` (${d.purpose})` : ""}`, d.timestamp);
      }),
      on("session-item:revealed", (data: unknown) => {
        const d = data as { itemName: string; timestamp: string };
        addActivity("item", `${d.itemName} was revealed!`, d.timestamp);
      }),
      on("encounter:updated", (data: unknown) => {
        const d = data as { encounterName: string; status: string; userName: string; timestamp: string };
        addActivity("encounter", `${d.userName} updated ${d.encounterName} (${d.status.toLowerCase()})`, d.timestamp);
      }),
      on("location:map-updated", (data: unknown) => {
        const d = data as { userName: string; location: { name?: string } | null; timestamp: string };
        addActivity("map", `${d.userName} updated ${d.location?.name || "a map"}`, d.timestamp);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub?.());
    };
  }, [connected, campaignId, on]);

  function addActivity(type: Activity["type"], message: string, timestamp: string) {
    setActivities((prev) => [
      { id: `${Date.now()}-${Math.random()}`, type, message, timestamp },
      ...prev.slice(0, 49), // Keep last 50
    ]);
  }

  return (
    <div className="glass p-6 rounded-sm border border-secondary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-error"}`} />
          {connected && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
          )}
        </div>
        <span className="font-headline text-secondary uppercase tracking-widest text-xs">
          Live Activity
        </span>
      </div>

      {activities.length === 0 ? (
        <p className="text-on-surface/30 font-body text-sm text-center py-4">
          {connected ? "Waiting for activity..." : "Connecting..."}
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 text-sm animate-fade-in-up">
              <Icon
                name={typeIcons[activity.type]}
                size={14}
                className={`${typeColors[activity.type]} mt-0.5 flex-shrink-0`}
              />
              <span className="font-body text-on-surface-variant">{activity.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
