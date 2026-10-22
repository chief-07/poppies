import { NextRequest, NextResponse } from "next/server";
import { searchQloo, getQlooInsights, QlooEntity } from "@/lib/qloo";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A character prompt is required." }, { status: 400 });
    }

    // 1. Identify candidate search terms from the prompt
    // We look for capitalized proper nouns, known cities/domains, or key cultural phrases
    const candidateTerms: string[] = [];

    // Check for recognizable cultural anchors in text
    const lower = prompt.toLowerCase();
    if (lower.includes("nagoya")) candidateTerms.push("Nagoya");
    if (lower.includes("japan")) candidateTerms.push("Tokyo");
    if (lower.includes("hasami")) candidateTerms.push("Hasami");
    if (lower.includes("tsukuru")) candidateTerms.push("Haruki Murakami");
    if (lower.includes("architect")) candidateTerms.push("Tadao Ando");
    if (lower.includes("train")) candidateTerms.push("Shinkansen");
    if (lower.includes("radiohead")) candidateTerms.push("Radiohead");
    if (lower.includes("marseille")) candidateTerms.push("Marseille");
    if (lower.includes("lisbon")) candidateTerms.push("Lisbon");
    if (lower.includes("portland")) candidateTerms.push("Portland");

    // Extract potential proper nouns (capitalized words)
    const words = prompt.match(/\b[A-Z][a-z]{3,}\b/g) || [];
    words.forEach((w) => {
      if (!candidateTerms.includes(w) && !["When", "Then", "What", "Who", "They", "This", "Meet"].includes(w)) {
        candidateTerms.push(w);
      }
    });

    if (candidateTerms.length === 0) {
      candidateTerms.push("Haruki Murakami", "Ryuichi Sakamoto");
    }

    // 2. Resolve entities against Qloo Knowledge Graph
    const resolvedSeeds: QlooEntity[] = [];
    for (const term of candidateTerms.slice(0, 3)) {
      const results = await searchQloo(term);
      if (results && results.length > 0) {
        resolvedSeeds.push(results[0]);
      }
    }

    // If no direct entities matched, fallback to foundational cultural anchors
    if (resolvedSeeds.length === 0) {
      const fallbackResults = await searchQloo("Ryuichi Sakamoto");
      if (fallbackResults.length > 0) resolvedSeeds.push(fallbackResults[0]);
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
