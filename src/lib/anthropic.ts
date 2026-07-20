// Wrapper lato server per l'SDK ufficiale Anthropic.
// ⚠️ Da usare SOLO in codice server (API route). La chiave vive in
// process.env.ANTHROPIC_API_KEY e non deve mai raggiungere il client.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

/** true se una chiave API è configurata (altrimenti si usa la modalità demo). */
export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "";
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurata. Copia .env.example in .env e inserisci la chiave.",
    );
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

/** Invia un singolo prompt a Claude e restituisce il testo concatenato. */
export async function askClaude(prompt: string, maxTokens = 2000): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const parts: string[] = [];
  for (const block of res.content) {
    if (block.type === "text") parts.push(block.text);
  }
  return parts.join("\n");
}

/**
 * Estrae e valida il JSON restituito dall'AI: rimuove eventuali fence markdown,
 * individua il primo `[`/`{` e l'ultimo `]`/`}` corrispondente, poi fa il parse.
 * Lancia un errore chiaro se non trova JSON valido (gestito a monte con fallback).
 */
export function parseAiJson<T = unknown>(text: string): T {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const firstArr = clean.indexOf("[");
  const firstObj = clean.indexOf("{");
  const candidates = [firstArr, firstObj].filter((i) => i >= 0);
  if (candidates.length === 0) {
    throw new Error("Nessun JSON trovato nella risposta dell'AI");
  }
  const start = Math.min(...candidates);
  const openChar = clean[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = clean.lastIndexOf(closeChar);
  if (end <= start) {
    throw new Error("JSON incompleto nella risposta dell'AI");
  }

  return JSON.parse(clean.slice(start, end + 1)) as T;
}
