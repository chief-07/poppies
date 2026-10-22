import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

// Initialize Google Gen AI client if key is available
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ExtractedSeeds {
  characterName: string;
  summary: string;
  explicitAnchors: string[];
  qlooSearchQueries: string[];
  inquiries: string[];
}

/**
 * Stage 1: Deconstructs the creator's messy prompt into structured cultural search queries for Qloo.
 */
export async function extractCulturalSeeds(prompt: string): Promise<ExtractedSeeds> {
  if (!ai) {
    console.warn("GEMINI_API_KEY not configured. Using heuristic seed extraction.");
    return fallbackExtraction(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `You are the Cultural Profiler for "Poppies", a tool that grounds fictional characters in real human taste data.
Given this creator's character prompt:
"""${prompt}"""

Analyze the character and extract structured signals to query Qloo's taste graph.
Respond ONLY with a valid JSON object matching this schema:
{
  "characterName": "Name of character or archetype",
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
      characterName: parsed.characterName || "The Character",
      summary: parsed.summary || "",
      explicitAnchors: parsed.explicitAnchors || [],
      qlooSearchQueries: parsed.qlooSearchQueries || [],
      inquiries: parsed.inquiries || [],
    };
  } catch (err) {
    console.error("Gemini seed extraction error:", err);
    return fallbackExtraction(prompt);
  }
}

function fallbackExtraction(prompt: string): ExtractedSeeds {
  const lower = prompt.toLowerCase();
  const queries: string[] = [];

  if (lower.includes("nagoya") || lower.includes("architect")) {
    queries.push("Nagoya", "Tadao Ando", "Hasami", "Ryuichi Sakamoto");
  } else if (lower.includes("marseille") || lower.includes("concrete")) {
    queries.push("Marseille", "Le Corbusier", "Hiroshi Yoshimura");
  } else if (lower.includes("lisbon") || lower.includes("clock")) {
    queries.push("Lisbon", "Amalia Rodrigues", "Cesaria Evora");
  } else {
    queries.push("Haruki Murakami", "Radiohead", "A24");
  }

  return {
    characterName: prompt.split(" ")[0]?.replace(/[^a-zA-Z]/g, "") || "Character",
    summary: "A quiet soul navigating spaces and private rituals.",
    explicitAnchors: ["Solitary lifestyle", "Distinctive morning ritual"],
    qlooSearchQueries: queries,
    inquiries: ["What music plays in their room?", "What book sits on their nightstand?", "What is their private contradiction?"],
  };
}
