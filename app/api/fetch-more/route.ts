import { NextRequest, NextResponse } from "next/server";
import { getQlooInsights, searchQloo, normalizeEntity, getQlooFilterType, QlooEntity } from "@/lib/qloo";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: NextRequest) {
  try {
    const {
      inquiryId,
      domain = "OBJECTS",
      seedName,
      seedEntityId,
      existingEntityIds = [],
      existingNames = [],
      characterName = "Character",
      locality = "",
      engine = "qloo",
    } = await req.json();

    const existingIdSet = new Set<string>(
      (existingEntityIds || []).map((id: string) => id.toLowerCase())
    );
    const existingNameSet = new Set<string>(
      (existingNames || []).map((n: string) => n.toLowerCase().trim())
    );

    // 1. BASE LLM ENGINE MODE (Ungrounded / Probabilistic)
    if (engine === "base_llm" || !ai) {
      if (!ai) {
        return NextResponse.json({
          success: true,
          newEntities: [
            {
              id: `base-entity-more-${Date.now()}-1`,
              name: `Standard ${domain.toLowerCase()} item`,
              domain,
              description: `Generic baseline cultural artifact for ${characterName}.`,
              entityId: `urn:ai:probabilistic:generic_${Date.now()}`,
              entityType: `urn:entity:${domain.toLowerCase()}`,
              affinityScore: 50,
              seedEntities: ["Statistical Internet Prior"],
              qlooReasoning: "Generated without empirical Qloo graph backing.",
            },
          ],
        });
      }

      const prompt = `Generate 4 realistic items or figures for domain "${domain}" for character "${characterName}" in "${locality}".
Respond ONLY in JSON:
{
  "entities": [
    { "name": string, "description": string }
  ]
}`;
      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.7 },
      });

      const parsed = JSON.parse(res.text || "{}");
      const newEntities = (parsed.entities || []).slice(0, 4).map((item: any, idx: number) => ({
        id: `base-more-${Date.now()}-${idx}`,
        name: item.name,
        domain,
        description: item.description,
        entityId: `urn:ai:probabilistic:${encodeURIComponent(item.name.toLowerCase().replace(/[^a-z0-9]/g, "_"))}`,
        entityType: `urn:entity:${domain.toLowerCase()}`,
        affinityScore: 50,
        seedEntities: ["Statistical Internet Prior"],
        qlooReasoning: "Generated via Base LLM token priors without empirical taste graph verification.",
      }));

      return NextResponse.json({ success: true, newEntities });
    }

    // 2. QLOO GROUNDED ENGINE MODE
    const filterType = getQlooFilterType(domain);
    let resolvedId = seedEntityId ? seedEntityId.replace("urn:qloo:entity:", "") : "";

    // If no entity ID provided, search for seedName
    if (!resolvedId && seedName) {
      const hits = await searchQloo(seedName, filterType);
      if (hits.length > 0) {
        resolvedId = hits[0].entity_id;
      }
    }

    // If still no seed ID, fallback to reliable seeds by domain
    if (!resolvedId) {
      const domainFallbacks: Record<string, string> = {
        OBJECTS: "Anker",
        MUSIC: "Hiroshi Yoshimura",
        BOOKS: "The Poetics of Space",
        PLACES: locality.toLowerCase().includes("lagos") ? "Yaba" : "Shinjuku",
        CONTRADICTION: "Snow Peak",
      };
      const fallbackQuery = domainFallbacks[domain] || "Staedtler";
      const fbHits = await searchQloo(fallbackQuery, filterType);
      if (fbHits.length > 0) {
        resolvedId = fbHits[0].entity_id;
      }
    }

    let candidates: QlooEntity[] = [];
    if (resolvedId) {
      // Query higher number of insights to bypass previously loaded items
      const raw = await getQlooInsights([resolvedId], filterType, 16);
      candidates = raw.filter((c) => {
        const cId = (c.entity_id || "").toLowerCase();
        const cName = (c.name || "").toLowerCase().trim();
        return !existingIdSet.has(cId) && !existingNameSet.has(cName);
      });
    }

    // If still short of 4, try a secondary search on the domain
    if (candidates.length < 4) {
      const secondarySeeds: Record<string, string[]> = {
        OBJECTS: ["Seagate", "Vitra", "Makita", "Knipex", "Rotring"],
        MUSIC: ["Ryuichi Sakamoto", "Steve Reich", "Harold Budd", "Brian Eno", "Grouper"],
        BOOKS: ["Invisible Cities", "In Praise of Shadows", "Snow Country", "The Stranger"],
        PLACES: ["Surulere", "Ikoyi", "Victoria Island", "Shibuya", "Le Panier"],
        CONTRADICTION: ["Hasami porcelain", "Opinel Knives", "Alessi"],
      };
      const alternates = secondarySeeds[domain] || ["Muji"];
      for (const alt of alternates) {
        if (candidates.length >= 4) break;
        const altHits = await searchQloo(alt, filterType);
        if (altHits.length > 0) {
          const altId = altHits[0].entity_id;
          const altInsights = await getQlooInsights([altId], filterType, 8);
          for (const item of altInsights) {
            const cId = (item.entity_id || "").toLowerCase();
            const cName = (item.name || "").toLowerCase().trim();
            if (!existingIdSet.has(cId) && !existingNameSet.has(cName)) {
              candidates.push(item);
              existingIdSet.add(cId);
              existingNameSet.add(cName);
              if (candidates.length >= 4) break;
            }
          }
        }
      }
    }

    const picked = candidates.slice(0, 4);
    const newEntities = picked.map((entity, idx) => ({
      ...normalizeEntity(entity, domain, [seedName || "Qloo Taste Graph"]),
      id: `fetch-more-${Date.now()}-${idx}`,
      qlooReasoning: `Expanded discovery via Qloo taste graph for ${characterName}'s ${domain.toLowerCase()} collection.`,
    }));

    return NextResponse.json({
      success: true,
      newEntities,
    });
  } catch (error: any) {
    console.error("API /api/fetch-more error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch more entities from Qloo" },
      { status: 500 }
    );
  }
}
