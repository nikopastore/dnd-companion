"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";

interface CampaignAiCommandPanelProps {
  campaignId: string;
  members: Array<{
    id: string;
    role: string;
    character: {
      id: string;
      name: string;
    } | null;
  }>;
  onApplied: () => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

interface BrowserWindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
}

export function CampaignAiCommandPanel({
  campaignId,
  members,
  onApplied,
}: CampaignAiCommandPanelProps) {
  const [command, setCommand] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const playerCharacters = useMemo(
    () =>
      members
        .filter((member) => member.role === "PLAYER" && member.character)
        .map((member) => member.character!)
        .filter(Boolean),
    [members]
  );

  const examples = useMemo(() => {
    const firstCharacter = playerCharacters[0]?.name;
    return [
      "Give all the players a short rest",
      "Give all players a long rest",
      firstCharacter
        ? `Give ${firstCharacter} 3 basic healing potions`
        : "Give the party 3 basic healing potions",
    ];
  }, [playerCharacters]);

  async function runCommand(nextCommand?: string) {
    const text = String(nextCommand ?? command).trim();
    if (!text) {
      setStatus({ kind: "error", message: "Enter a campaign command first." });
      return;
    }

    setSubmitting(true);
    setStatus({ kind: "info", message: "Running campaign AI command..." });
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/ai-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: text }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        summary?: string;
      };

      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error || "The campaign AI command failed.",
        });
        return;
      }

      setStatus({
        kind: "success",
        message: data.summary || "Campaign AI command applied.",
      });
      onApplied();
    } finally {
      setSubmitting(false);
    }
  }

  function handleSpeechInput() {
    const speechWindow = window as BrowserWindowWithSpeechRecognition;
    const Recognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus({
        kind: "error",
        message: "Speech input is not supported in this browser.",
      });
      return;
    }

    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.[0]?.transcript) {
          transcript += result[0].transcript;
        }
      }
      setCommand(transcript.trim());
    };

    recognition.onerror = (event) => {
      setStatus({
        kind: "error",
        message: event.error
          ? `Speech capture failed: ${event.error}.`
          : "Speech capture failed.",
      });
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setListening(true);
    setStatus({
      kind: "info",
      message: "Listening for a campaign command...",
    });
    recognition.start();
  }

  return (
    <section className="rounded-sm border border-outline-variant/8 bg-surface-container-low p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="graphic_eq" size={18} className="text-secondary" />
            <h3 className="font-headline text-lg text-on-surface">
              Campaign AI Command Center
            </h3>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Speak or type DM actions like short rests, long rests, and direct
            item grants. The command runs against this campaign and pushes the
            result onto each affected player sheet.
          </p>
        </div>
        <div className="rounded-sm border border-secondary/15 bg-secondary/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-secondary">
          {playerCharacters.length} player
          {playerCharacters.length === 1 ? "" : "s"} linked
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3">
          <Textarea
            id="campaign-ai-command"
            label="Command"
            rows={4}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Give all the players a short rest"
          />

          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setCommand(example)}
                className="rounded-full border border-outline-variant/10 bg-surface-container px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant transition-colors hover:border-secondary/20 hover:text-on-surface"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={submitting} onClick={() => runCommand()}>
              <Icon name="auto_awesome" size={16} />
              Run Command
            </Button>
            <Button
              variant={listening ? "danger" : "secondary"}
              size="sm"
              onClick={handleSpeechInput}
            >
              <Icon name={listening ? "mic_off" : "mic"} size={16} />
              {listening ? "Stop Listening" : "Speak Command"}
            </Button>
          </div>

          {status && <FormStatus kind={status.kind} message={status.message} />}
        </div>

        <div className="rounded-sm border border-outline-variant/8 bg-surface-container p-4">
          <p className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/60">
            Available Targets
          </p>
          <div className="mt-3 space-y-2">
            {playerCharacters.length === 0 ? (
              <p className="text-sm text-on-surface-variant/50">
                Add player characters to the campaign to enable direct grants.
              </p>
            ) : (
              playerCharacters.map((character) => (
                <div
                  key={character.id}
                  className="rounded-sm border border-outline-variant/8 bg-surface-container-low px-3 py-2"
                >
                  <p className="font-body text-sm text-on-surface">
                    {character.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
