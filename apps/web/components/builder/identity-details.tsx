"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { AIAssistButton } from "@/components/ai/ai-assist-button";
import { AI_PROMPTS } from "@/lib/ai";
import type { useCharacterBuilder } from "@/hooks/use-character-builder";

interface Props {
  builder: ReturnType<typeof useCharacterBuilder>;
}

export function IdentityDetails({ builder }: Props) {
  const { state, update, nextStep, prevStep } = builder;

  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center md:text-left">
        <h2 className="mb-2 font-headline text-4xl tracking-tight text-primary md:text-5xl animate-fade-in-up">
          Face, Name, and Story
        </h2>
        <p
          className="max-w-2xl font-body text-lg italic text-on-surface-variant animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          Turn the stat block into a person: give the character a face, an identity,
          and enough history that the table understands who just entered the story.
        </p>
      </div>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-whisper">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ImageUpload
              currentImage={state.portraitUrl}
              onUpload={(url) => update({ portraitUrl: url })}
              size="md"
              label="Portrait"
            />
            <div className="min-w-0 flex-1 space-y-4">
              <Input
                id="builder-name"
                label="Character Name"
                placeholder="Seraphine Vale, Dorn Ashmantle..."
                value={state.name}
                onChange={(event) => update({ name: event.target.value })}
              />
              <div className="rounded-xl border border-secondary/10 bg-background/40 px-4 py-3 text-sm text-on-surface-variant">
                {state.campaignName
                  ? `This hero will be created directly inside ${state.campaignName}.`
                  : "You can create this hero now and bind them to a campaign later."}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="builder-backstory"
                className="font-label text-xs uppercase tracking-widest text-on-surface-variant"
              >
                Backstory
              </label>
              <AIAssistButton
                label="Draft with AI"
                systemPrompt={AI_PROMPTS.backstoryGenerator}
                userPrompt={`Write a backstory for ${state.name || "this character"}.`}
                context={`Race: ${state.raceName || "Unknown"}\nClass: ${state.className || "Unknown"}\nBackground: ${state.backgroundName || "Unknown"}`}
                onApply={(text) => update({ backstory: text })}
                size="sm"
              />
            </div>
            <textarea
              id="builder-backstory"
              rows={7}
              value={state.backstory}
              onChange={(event) => update({ backstory: event.target.value })}
              placeholder="Where did they come from, what do they want, and what still haunts them?"
              className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-sm text-on-surface outline-none transition-all duration-300 placeholder:text-on-surface/25 focus:border-secondary/35 focus:ring-1 focus:ring-secondary/35"
            />
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 shadow-whisper">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: "personalityTraits" as const, label: "Personality Traits", placeholder: "How do they speak, react, or carry themselves?", prompt: "Write 2 personality traits" },
              { key: "ideals" as const, label: "Ideals", placeholder: "What principle do they refuse to betray?", prompt: "Write an ideal or guiding principle" },
              { key: "bonds" as const, label: "Bonds", placeholder: "Who or what matters enough to change their choices?", prompt: "Write a bond connecting them to the world" },
              { key: "flaws" as const, label: "Flaws", placeholder: "What weakness or habit will create trouble at the table?", prompt: "Write a character flaw or weakness" },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                    {field.label}
                  </label>
                  <AIAssistButton
                    label="Suggest"
                    systemPrompt={AI_PROMPTS.backstoryGenerator}
                    userPrompt={`${field.prompt} for ${state.name || "this character"}.`}
                    context={`Race: ${state.raceName || "Unknown"}\nClass: ${state.className || "Unknown"}\nBackground: ${state.backgroundName || "Unknown"}\nBackstory: ${state.backstory || "None yet"}`}
                    onApply={(text) => update({ [field.key]: text })}
                    size="sm"
                  />
                </div>
                <textarea
                  rows={4}
                  value={state[field.key]}
                  onChange={(event) => update({ [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="w-full resize-none rounded-sm border border-outline-variant/10 bg-surface-container-highest px-4 py-3 font-body text-sm text-on-surface outline-none transition-all duration-300 placeholder:text-on-surface/25 focus:border-secondary/35 focus:ring-1 focus:ring-secondary/35"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-12 flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          <Icon name="arrow_back" size={16} />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!state.name.trim()}>
          Continue to Review
          <Icon name="arrow_forward" size={16} />
        </Button>
      </div>
    </div>
  );
}
