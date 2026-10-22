import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ExtractedSeeds {
  characterName: string;
  summary: string;
  explicitAnchors: string[];
  qlooSearchQueries: string[];
  inquiries: string[];
}

export interface ThreadConnection {
  title: string;
  domain: string; // e.g. "MUSIC", "FILM & TV", "PLACES", "OBJECTS"
  description: string;
  imageUrl?: string;
  qlooEntityName?: string;
}

export interface CharacterThread {
  id: string;
  title: string;
  status: "exploring" | "accepted" | "open" | "suggested";
  statusLabel: string;
  headline: string;
  description: string;
  rationale: string;
  connections: ThreadConnection[];
}

/**
 * Stage 1: Deconstructs the creator's prompt into structured cultural search queries using Gemini Flash Lite.
 */
export async function extractCulturalSeeds(prompt: string): Promise<ExtractedSeeds> {
  if (!ai) {
    console.warn("GEMINI_API_KEY not configured. Using heuristic seed extraction.");
    return fallbackExtraction(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are the Cultural Profiler for "Poppies", a platform that grounds fictional characters in real human taste data.
Given this creator's character prompt:
"""${prompt}"""

Analyze the character and extract structured signals to query Qloo's taste graph.
Respond ONLY with a valid JSON object matching this schema:
{
  "characterName": "Name of character or archetype (e.g. Shoujo A, Tsukuru, Elena)",
  "summary": "One sentence summary of their cultural soul and core tension",
  "explicitAnchors": ["List of 3-5 concrete facts already decided by the creator, e.g. city, job, age"],
  "qlooSearchQueries": ["List of 3-5 specific real-world cultural entities or subcultures to look up in Qloo, e.g. specific artists, authors, designers, locations, or aesthetic movements"],
  "inquiries": ["3 creative questions about their habits, nightstand, or secrets to explore in the dossier"]
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return {
      characterName: parsed.characterName || "Shoujo A",
      summary: parsed.summary || "A character taking shape.",
      explicitAnchors: parsed.explicitAnchors || [],
      qlooSearchQueries: parsed.qlooSearchQueries || [],
      inquiries: parsed.inquiries || [],
    };
  } catch (err) {
    console.error("Gemini seed extraction error:", err);
    return fallbackExtraction(prompt);
  }
}

/**
 * Steers or refines a thread based on user feedback in the studio.
 */
export async function steerCharacterThread(
  characterName: string,
  threadTitle: string,
  userInstruction: string,
  existingQlooEntities: any[]
): Promise<{ headline: string; description: string; rationale: string; newQueries: string[] }> {
  if (!ai) {
    return {
      headline: `Exploring ${threadTitle}`,
      description: `Refined based on: "${userInstruction}"`,
      rationale: "Adjusted to reflect your artistic direction.",
      newQueries: ["Ambient Music", "Independent Cinema", "Quiet Spaces"],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are the Co-Development Agent in "Poppies".
Character: ${characterName}
Active Thread: "${threadTitle}"
User Direction: "${userInstruction}"
Available Qloo Context: ${JSON.stringify(existingQlooEntities.slice(0, 5))}

Adjust this thread's focus and recommend 3 new specific search terms for Qloo.
Respond ONLY with a JSON object:
{
  "headline": "A short poetic headline for the new direction (e.g. A solitary frequency, The morning ritual)",
  "description": "One sentence describing this shift in the character's taste and environment",
  "rationale": "Why these elements appear together in real human behavioral taste data",
  "newQueries": ["3 specific artists, books, or place types to query in Qloo"]
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Steering error:", err);
    return {
      headline: `Refining ${threadTitle}`,
      description: userInstruction,
      rationale: "Updated based on creator instruction.",
      newQueries: ["A24", "Mubi", "Post-Rock"],
    };
  }
}

function fallbackExtraction(prompt: string): ExtractedSeeds {
  const lower = prompt.toLowerCase();
  const queries: string[] = [];

  if (lower.includes("nagoya") || lower.includes("architect")) {
    queries.push("Nagoya", "Tadao Ando", "Hasami", "Ryuichi Sakamoto");
  } else if (lower.includes("marseille") || lower.includes("concrete")) {
    queries.push("Marseille", "Le Corbusier", "Hiroshi Yoshimura");
  } else {
    queries.push("Haruki Murakami", "Radiohead", "A24", "Ambient");
  }

  return {
    characterName: prompt.split(" ")[0]?.replace(/[^a-zA-Z]/g, "") || "Shoujo A",
    summary: "A character taking shape.",
    explicitAnchors: ["Solitary lifestyle", "Distinctive morning ritual"],
    qlooSearchQueries: queries,
    inquiries: ["What music plays in their room?", "What book sits on their nightstand?", "What is their private contradiction?"],
  };
}
