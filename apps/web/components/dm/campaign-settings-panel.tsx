"use client";

import { useState } from "react";
import { FormStatus } from "@/components/ui/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";

interface CampaignSettings {
  id: string;
  name: string;
  system: string;
  edition: string;
  setting: string | null;
  tone: string | null;
  onboardingMode: string;
  worldName: string | null;
  worldSummary: string | null;
  houseRules: unknown;
  worldCanon: unknown;
  playerCanon: unknown;
  rumors: unknown;
  factions: unknown;
  storyThreads: unknown;
  scheduledEvents: unknown;
  partyTreasury: unknown;
  groupReputation: number;
  groupRenown: number;
  stronghold: unknown;
  backups: unknown;
  sessionZero: unknown;
  accessibilityOptions: unknown;
}

interface Props {
  campaign: CampaignSettings;
  onSaved: () => void;
}

function toLines(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry)))
      .join("\n");
  }
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeBackups(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      return {
        id: String(item.id || crypto.randomUUID()),
        label: String(item.label || "Backup"),
        createdAt: String(item.createdAt || new Date(0).toISOString()),
        createdBy: String(item.createdBy || "Unknown"),
      };
    })
    .filter((entry): entry is { id: string; label: string; createdAt: string; createdBy: string } => Boolean(entry));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CampaignSettingsPanel({ campaign, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [backupLabel, setBackupLabel] = useState("");
  const [backupAction, setBackupAction] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    system: campaign.system,
    edition: campaign.edition,
    setting: campaign.setting || "",
    tone: campaign.tone || "",
    onboardingMode: campaign.onboardingMode || "beginner",
    worldName: campaign.worldName || "",
    worldSummary: campaign.worldSummary || "",
    groupReputation: campaign.groupReputation,
    groupRenown: campaign.groupRenown,
    stronghold: typeof campaign.stronghold === "string" ? campaign.stronghold : "",
    houseRules: toLines(campaign.houseRules),
    worldCanon: toLines(campaign.worldCanon),
    playerCanon: toLines(campaign.playerCanon),
    rumors: toLines(campaign.rumors),
    factions: toLines(campaign.factions),
    storyThreads: toLines(campaign.storyThreads),
    scheduledEvents: toLines(campaign.scheduledEvents),
    sessionZero: toLines(campaign.sessionZero),
    accessibilityOptions: toLines(campaign.accessibilityOptions),
    treasury: {
      cp: Number((campaign.partyTreasury as Record<string, unknown> | null)?.cp ?? 0),
      sp: Number((campaign.partyTreasury as Record<string, unknown> | null)?.sp ?? 0),
      ep: Number((campaign.partyTreasury as Record<string, unknown> | null)?.ep ?? 0),
      gp: Number((campaign.partyTreasury as Record<string, unknown> | null)?.gp ?? 0),
      pp: Number((campaign.partyTreasury as Record<string, unknown> | null)?.pp ?? 0),
    },
  });
  const backups = normalizeBackups(campaign.backups);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: form.system,
          edition: form.edition,
          setting: form.setting || null,
          tone: form.tone || null,
          onboardingMode: form.onboardingMode,
          worldName: form.worldName || null,
          worldSummary: form.worldSummary || null,
          groupReputation: Number(form.groupReputation) || 0,
          groupRenown: Number(form.groupRenown) || 0,
          stronghold: form.stronghold || null,
          houseRules: parseLines(form.houseRules),
          worldCanon: parseLines(form.worldCanon),
          playerCanon: parseLines(form.playerCanon),
          rumors: parseLines(form.rumors),
          factions: parseLines(form.factions),
          storyThreads: parseLines(form.storyThreads),
          scheduledEvents: parseLines(form.scheduledEvents),
          sessionZero: parseLines(form.sessionZero),
          accessibilityOptions: parseLines(form.accessibilityOptions),
          partyTreasury: form.treasury,
        }),
      });
      if (res.ok) {
        setStatus({ kind: "success", message: "Campaign foundations saved." });
        onSaved();
      } else {
        setStatus({ kind: "error", message: "Could not save campaign foundations." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    setBackupAction("create");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: backupLabel }),
      });

      if (res.ok) {
        setBackupLabel("");
        setStatus({ kind: "success", message: "Backup snapshot created." });
        onSaved();
      } else {
        setStatus({ kind: "error", message: "Could not create backup snapshot." });
      }
    } finally {
      setBackupAction(null);
    }
  }

  async function handleBackupAction(action: "restore" | "delete", backupId: string) {
    setBackupAction(`${action}-${backupId}`);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/backups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, backupId }),
      });

      if (res.ok) {
        setStatus({
          kind: "success",
          message: action === "restore" ? "Backup restored." : "Backup removed.",
        });
        onSaved();
      } else {
        setStatus({
          kind: "error",
          message: action === "restore" ? "Could not restore backup." : "Could not remove backup.",
        });
      }
    } finally {
      setBackupAction(null);
    }
  }

  async function handleExport() {
    setBackupAction("export");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/export`);
      if (!res.ok) {
        setStatus({ kind: "error", message: "Could not export campaign backup." });
        return;
      }

      const payload = await res.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "campaign"}-backup.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: "success", message: "Campaign export downloaded." });
    } finally {
      setBackupAction(null);
    }
  }

  async function handleDuplicate() {
    setBackupAction("duplicate");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${campaign.name} Sandbox` }),
      });

      if (!res.ok) {
        setStatus({ kind: "error", message: "Could not duplicate campaign." });
        return;
      }

      const duplicated = await res.json();
      if (duplicated?.id) {
        window.location.href = `/lobby/${duplicated.id}`;
        return;
      }
      setStatus({ kind: "success", message: "Campaign duplicated." });
    } finally {
      setBackupAction(null);
    }
  }

  return (
    <div className="space-y-5 rounded-sm border border-secondary/10 bg-surface-container-low p-6 shadow-whisper">
      {status && <FormStatus kind={status.kind} message={status.message} />}
      <div className="flex items-center gap-2">
        <Icon name="tune" size={18} className="text-secondary" />
        <h3 className="font-headline text-lg text-on-surface">Campaign Foundations</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input id="campaign-system" label="System" value={form.system} onChange={(e) => setForm((prev) => ({ ...prev, system: e.target.value }))} />
        <Input id="campaign-edition" label="Edition" value={form.edition} onChange={(e) => setForm((prev) => ({ ...prev, edition: e.target.value }))} />
        <Input id="campaign-setting" label="Setting" value={form.setting} onChange={(e) => setForm((prev) => ({ ...prev, setting: e.target.value }))} />
        <Input id="campaign-tone" label="Tone" value={form.tone} onChange={(e) => setForm((prev) => ({ ...prev, tone: e.target.value }))} />
        <Input id="campaign-world-name" label="World Name" value={form.worldName} onChange={(e) => setForm((prev) => ({ ...prev, worldName: e.target.value }))} />
        <Input id="campaign-onboarding" label="Onboarding Mode" value={form.onboardingMode} onChange={(e) => setForm((prev) => ({ ...prev, onboardingMode: e.target.value }))} />
      </div>

      <Textarea id="campaign-world-summary" label="World Summary" rows={4} value={form.worldSummary} onChange={(e) => setForm((prev) => ({ ...prev, worldSummary: e.target.value }))} />

      <div className="grid gap-4 md:grid-cols-2">
        <Textarea id="campaign-house-rules" label="House Rules" rows={5} value={form.houseRules} onChange={(e) => setForm((prev) => ({ ...prev, houseRules: e.target.value }))} placeholder="One rule per line" />
        <Textarea id="campaign-session-zero" label="Session Zero Agreements" rows={5} value={form.sessionZero} onChange={(e) => setForm((prev) => ({ ...prev, sessionZero: e.target.value }))} placeholder="Safety tools, table norms, consent notes..." />
        <Textarea id="campaign-factions" label="Factions In Motion" rows={5} value={form.factions} onChange={(e) => setForm((prev) => ({ ...prev, factions: e.target.value }))} placeholder="One faction move per line" />
        <Textarea id="campaign-threads" label="Loose Threads" rows={5} value={form.storyThreads} onChange={(e) => setForm((prev) => ({ ...prev, storyThreads: e.target.value }))} placeholder="One unresolved thread per line" />
        <Textarea id="campaign-events" label="Scheduled Events" rows={5} value={form.scheduledEvents} onChange={(e) => setForm((prev) => ({ ...prev, scheduledEvents: e.target.value }))} placeholder="Future event reminders" />
        <Textarea id="campaign-rumors" label="Rumors" rows={5} value={form.rumors} onChange={(e) => setForm((prev) => ({ ...prev, rumors: e.target.value }))} placeholder="Rumors and player-facing hooks" />
        <Textarea id="campaign-world-canon" label="DM Truth / Canon" rows={5} value={form.worldCanon} onChange={(e) => setForm((prev) => ({ ...prev, worldCanon: e.target.value }))} placeholder="What is actually true in the world" />
        <Textarea id="campaign-player-canon" label="Player Knowledge" rows={5} value={form.playerCanon} onChange={(e) => setForm((prev) => ({ ...prev, playerCanon: e.target.value }))} placeholder="What the party currently knows" />
        <Textarea id="campaign-accessibility" label="Accessibility Notes" rows={5} value={form.accessibilityOptions} onChange={(e) => setForm((prev) => ({ ...prev, accessibilityOptions: e.target.value }))} placeholder="Table accessibility and display preferences" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input id="campaign-reputation" label="Party Reputation" type="number" value={form.groupReputation} onChange={(e) => setForm((prev) => ({ ...prev, groupReputation: parseInt(e.target.value) || 0 }))} />
        <Input id="campaign-renown" label="Party Renown" type="number" value={form.groupRenown} onChange={(e) => setForm((prev) => ({ ...prev, groupRenown: parseInt(e.target.value) || 0 }))} />
      </div>

      <Textarea id="campaign-stronghold" label="Base / Ship / Stronghold" rows={4} value={form.stronghold} onChange={(e) => setForm((prev) => ({ ...prev, stronghold: e.target.value }))} placeholder="Stronghold state, upgrades, crew, ship details..." />

      <div className="space-y-3">
        <span className="font-label text-[10px] uppercase tracking-[0.18em] text-secondary">Party Treasury</span>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {(["cp", "sp", "ep", "gp", "pp"] as const).map((coin) => (
            <Input
              key={coin}
              id={`treasury-${coin}`}
              label={coin.toUpperCase()}
              type="number"
              min={0}
              value={form.treasury[coin]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  treasury: {
                    ...prev.treasury,
                    [coin]: Math.max(0, parseInt(e.target.value) || 0),
                  },
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={loading} className="glow-gold">
          <Icon name="save" size={16} />
          Save Foundations
        </Button>
      </div>

      <div className="decorative-line" />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="shield" size={18} className="text-secondary" />
          <h4 className="font-headline text-base text-on-surface">Backup and Recovery</h4>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <Input
            id="backup-label"
            label="Snapshot Label"
            value={backupLabel}
            onChange={(event) => setBackupLabel(event.target.value)}
            placeholder="Before finale arc changes"
          />
          <Button size="sm" loading={backupAction === "create"} onClick={handleCreateBackup}>
            <Icon name="backup" size={16} />
            Create Snapshot
          </Button>
          <Button variant="secondary" size="sm" loading={backupAction === "export"} onClick={handleExport}>
            <Icon name="download" size={16} />
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" loading={backupAction === "duplicate"} onClick={handleDuplicate}>
            <Icon name="content_copy" size={16} />
            Duplicate Sandbox
          </Button>
        </div>

        <div className="space-y-3">
          {backups.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No manual snapshots yet. Create one before major prep edits, sandbox testing, or lore rewrites.
            </p>
          ) : (
            backups.slice(0, 8).map((backup) => (
              <div key={backup.id} className="grid gap-3 rounded-sm border border-outline-variant/8 bg-surface-container p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-headline text-base text-on-surface">{backup.label}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {backup.createdBy} · {formatDate(backup.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={backupAction === `restore-${backup.id}`}
                    onClick={() => handleBackupAction("restore", backup.id)}
                  >
                    <Icon name="restore" size={16} />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={backupAction === `delete-${backup.id}`}
                    onClick={() => handleBackupAction("delete", backup.id)}
                  >
                    <Icon name="delete" size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
