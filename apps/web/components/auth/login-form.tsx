"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/start");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          icon="mail"
          placeholder="adventurer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ? " " : undefined}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          icon="lock"
          placeholder="Your secret passphrase"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container/10 rounded-sm border border-error/15 animate-fade-in">
            <span className="material-symbols-outlined text-error text-[16px]">warning</span>
            <p className="text-error text-sm font-body">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Enter the Realm
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full decorative-line" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-surface-container-low font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/30">
            or continue with
          </span>
        </div>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/start" })}
        className="w-full flex items-center justify-center gap-3 bg-surface-container-highest/60 hover:bg-surface-container-highest rounded-sm px-6 py-3 font-body text-sm text-on-surface border border-outline-variant/15 hover:border-outline-variant/30 transition-all duration-300 active:scale-[0.97]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
