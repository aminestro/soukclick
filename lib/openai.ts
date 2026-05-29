import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

export const MODEL = "gpt-4o"

// ─── Async client factory ─────────────────────────────────────────────────────
// Reads OPENAI_API_KEY from the Setting table first (set via admin UI),
// falls back to process.env so local dev still works without a DB entry.

export async function getOpenAIClient(): Promise<OpenAI> {
  let apiKey: string | undefined

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "OPENAI_API_KEY" },
    })
    if (setting?.value) apiKey = setting.value
  } catch {
    // DB unavailable — fall through to env
  }

  if (!apiKey) apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured. Add it in Settings → API Keys or as an environment variable.")
  }

  return new OpenAI({ apiKey })
}
