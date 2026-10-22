import { NextRequest, NextResponse } from "next/server";
import { searchQloo, getQlooInsights, QlooEntity } from "@/lib/qloo";
import { extractCulturalSeeds } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A character prompt is required." }, { status: 400 });
    }

    // 1. Agent Reasoning Layer: Use Gemini to extract intelligent cultural search queries
    const profiling = await extractCulturalSeeds(prompt);

    // 2. Resolve entities against Qloo Knowledge Graph
    const resolvedSeeds: QlooEntity[] = [];
    for (const term of profiling.qlooSearchQueries.slice(0, 4)) {
      const results = await searchQloo(term);
      if (results && results.length > 0) {
        resolvedSeeds.push(results[0]);
      }
    }

    // Fallback if Qloo search terms returned empty
    if (resolvedSeeds.length === 0) {
      const fallback = await searchQloo("Ryuichi Sakamoto");
      if (fallback.length > 0) resolvedSeeds.push(fallback[0]);
    }

    const seedIds = resolvedSeeds.map((s) => s.entity_id);

    // 3. Query Qloo cross-domain affinities (Music, Books, Brands, Places)
    const [artists, books, brands] = await Promise.all([
      getQlooInsights(seedIds, "urn:entity:artist", 4),
      getQlooInsights(seedIds, "urn:entity:book", 4),
      getQlooInsights(seedIds, "urn:entity:brand", 4),
    ]);

    return NextResponse.json({
      success: true,
      character: {
        name: profiling.characterName,
        summary: profiling.summary,
        anchors: profiling.explicitAnchors,
        inquiries: profiling.inquiries,
      },
      seeds: resolvedSeeds,
      discoveries: {
        music: artists,
        literature: books,
        wardrobeAndObjects: brands,
      },
    });
  } catch (error: any) {
    console.error("API /api/resolve error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve against Qloo" }, { status: 500 });
  }
}
