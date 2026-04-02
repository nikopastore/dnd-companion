// AI Client Library with rate limiting for OpenRouter
// Uses free models to avoid costs while sharing API key across projects

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// In-memory rate limiter (per-user, per-hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || "30");

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600000 });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + 3600000 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export async function aiChat(
  messages: AIMessage[],
  options?: { model?: string; maxTokens?: number; stream?: boolean }
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const model = options?.model || process.env.AI_MODEL_CHAT || "meta-llama/llama-3.1-70b-instruct:free";

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "The Digital Tome - D&D Companion",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens || 1024,
      stream: options?.stream ?? false,
      temperature: 0.8,
    }),
  });

  return response;
}

export async function aiChatJSON<T = unknown>(
  messages: AIMessage[],
  options?: { model?: string; maxTokens?: number }
): Promise<T> {
  const response = await aiChat(messages, { ...options, stream: false });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Try to parse as JSON (strip markdown code blocks if present)
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Return raw content wrapped
    return { raw: content } as T;
  }
}

export async function aiVision(
  imageBase64: string,
  prompt: string,
  options?: { model?: string; maxTokens?: number }
): Promise<string> {
  const model = options?.model || process.env.AI_MODEL_VISION || "meta-llama/llama-3.2-11b-vision-instruct:free";

  const response = await aiChat([
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ], { model, maxTokens: options?.maxTokens || 2048, stream: false });

  if (!response.ok) {
    throw new Error(`Vision request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── D&D-Specific AI System Prompts ──

export const AI_PROMPTS = {
  npcGenerator: `You are a D&D 5e NPC generator. Create a detailed NPC with the following JSON structure:
{
  "name": "string",
  "race": "string (D&D 5e race)",
  "npcClass": "string (D&D 5e class or occupation)",
  "alignment": "string (e.g. Chaotic Good)",
  "personality": "string (2-3 sentences about personality traits, ideals, bonds, flaws)",
  "appearance": "string (2-3 sentences about physical appearance)",
  "voice": "string (brief voice/accent description for roleplay)",
  "faction": "string or null",
  "relationship": "string (ally, enemy, neutral, patron, or rival)",
  "description": "string (1-2 paragraph backstory)",
  "cr": "string (challenge rating if combat-relevant, or null)"
}
Respond ONLY with valid JSON. Make the NPC interesting, nuanced, and usable in a campaign.`,

  backstoryGenerator: `You are a D&D 5e character backstory writer. Given a character's race, class, and background, write a compelling 2-3 paragraph backstory. Include:
- Where they came from
- A defining moment that set them on their path
- A motivation or goal driving them
- A connection to the world (person, place, or event)
Write in second person ("You grew up..."). Be evocative and dramatic but concise.`,

  sessionStrongStart: `You are a D&D session planning assistant using the Lazy DM method. Generate a compelling "Strong Start" — an opening scene that immediately engages the players. It should:
- Start in the middle of action or tension
- Connect to ongoing plot threads when context is provided
- Be 2-3 sentences that set the scene
Respond with just the strong start text, no formatting.`,

  sessionScenes: `You are a D&D session planning assistant. Generate 3-5 potential scenes for an upcoming session. Each scene should have a title and 1-2 sentence description. Return as JSON array:
[{"title": "Scene Name", "description": "Brief description"}]
Make scenes varied: mix combat, roleplay, exploration, and puzzle/mystery.`,

  sessionSecrets: `You are a D&D session planning assistant. Generate 10 secrets and clues that players might discover during a session. Each should be a single sentence of discoverable information. Return as JSON array:
[{"secret": "The innkeeper is actually a retired assassin.", "discovered": false}]
Mix different types: NPC secrets, world lore, upcoming threats, hidden treasures.`,

  encounterBuilder: `You are a D&D 5e encounter designer. Given a party composition and desired difficulty, suggest an encounter. Return as JSON:
{
  "name": "Encounter Name",
  "description": "Brief narrative setup",
  "difficulty": "easy|medium|hard|deadly",
  "monsters": [{"name": "Monster Name", "cr": "1/2", "count": 3, "hp": 27, "ac": 13}],
  "notes": "Tactical notes for the DM"
}
Use only SRD monsters. Make encounters tactically interesting.`,

  questGenerator: `You are a D&D quest designer. Create an engaging quest with hooks, objectives, and rewards. Return as JSON:
{
  "title": "Quest Title",
  "description": "2-3 paragraph quest description with hooks and objectives",
  "priority": "normal",
  "notes": "DM notes about running this quest, potential complications"
}
Make quests multi-layered with moral complexity when appropriate.`,

  locationDescriber: `You are a D&D location describer. Write atmospheric, immersive descriptions of fantasy locations. Include sensory details (sights, sounds, smells). Be concise but evocative — 2-3 paragraphs maximum.`,

  magicItemGenerator: `You are a D&D 5e magic item designer. Create a unique magic item. Return as JSON:
{
  "name": "Item Name",
  "rarity": "common|uncommon|rare|very rare|legendary",
  "description": "Physical description and magical properties",
  "value": "estimated gp value"
}
Be creative but balanced. Include flavor text.`,

  characterSheetScanner: `You are analyzing a photo of a D&D character sheet. Extract all visible information and return as JSON:
{
  "name": "character name if visible",
  "race": "race if visible",
  "class": "class if visible",
  "level": number or null,
  "abilityScores": {"strength": number, "dexterity": number, ...} or null,
  "hp": {"current": number, "max": number} or null,
  "ac": number or null,
  "skills": ["list of proficient skills"] or null,
  "notes": "any other visible information"
}
Extract whatever is legible. Use null for anything unclear.`,
};
