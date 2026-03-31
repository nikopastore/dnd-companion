"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create campaign");
      return;
    }

    const campaign = await res.json();
    router.push(`/lobby/${campaign.id}`);
  }

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-12">
      <section className="relative p-8 md:p-12 bg-surface-container-low rounded-sm overflow-hidden border border-secondary/5">
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-headline text-3xl text-secondary tracking-tight">
              Forge a New Chronicle
            </h2>
            <p className="font-body text-on-surface-variant text-sm">
              As Dungeon Master, name your campaign and invite your party.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <Input
              id="name"
              label="Campaign Name"
              type="text"
              placeholder="The Curse of Strahd..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                placeholder="A tale of darkness and redemption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface-container-highest rounded-sm px-4 py-3 font-body text-on-surface placeholder:text-on-surface/30 border-0 outline-none focus:ring-1 focus:ring-secondary/40 transition-all duration-300 resize-none"
              />
            </div>

            {error && (
              <p className="text-error text-sm font-body">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Forging..." : "Create Campaign"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
