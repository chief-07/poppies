import { GoogleGenAI } from "@google/genai";
import { searchQloo, getQlooInsights, normalizeEntity, QlooEntity } from "./qloo";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AgentCulturalEntity {
  id: string;
  name: string;
  domain: string;
  description: string;
  entityId?: string;
  entityType?: string;
  affinityScore?: number;
  imageUrl?: string;
  seedEntities?: string[];
  qlooReasoning?: string;
  tags?: string[];
}

export interface AgentInquiry {
  id: string;
  question: string;
  vignette: string;
  vignetteHighlightEntity?: string;
  hasAudio: boolean;
  audioTrackName?: string;
  entities: AgentCulturalEntity[];
}

export interface AgentDossier {
  characterName: string;
  summary: string;
  explicitAnchors: string[];
  inquiries: AgentInquiry[];
  agentDecisions: string[];
}

/**
 * Runs the autonomous research cycle defined in the Product Bible (§5.3):
 * 1. Plan: Profile prompt & formulate initial search seeds
 * 2. Resolve: Search Qloo for real entity IDs
 * 3. Call: Query Qloo cross-domain insights
 * 4. Inspect & Decide: Inspect results, make autonomous adaptive follow-up query
 * 5. Synthesize: Weave real Qloo entities into narrative scene vignettes
 */
export async function runAgenticResearchCycle(prompt: string): Promise<AgentDossier> {
  const agentDecisions: string[] = [];

  // Step 1: Character profiling & inquiry formulation
  agentDecisions.push("Deconstructing character brief into cultural hypotheses and narrative inquiries.");
  const profiling = await profileCharacter(prompt);

  // Step 2: Resolve initial seeds against Qloo
  agentDecisions.push(`Resolving cultural seeds against Qloo graph: ${profiling.qlooSearchQueries.join(", ")}`);
  const resolvedSeeds: QlooEntity[] = [];
  for (const query of profiling.qlooSearchQueries.slice(0, 4)) {
    const hits = await searchQloo(query);
    if (hits && hits.length > 0) {
      resolvedSeeds.push(hits[0]);
    }
  }

  // Fallback seed if nothing matched
  if (resolvedSeeds.length === 0) {
    const fallback = await searchQloo("Ryuichi Sakamoto");
    if (fallback.length > 0) resolvedSeeds.push(fallback[0]);
  }

  const seedIds = resolvedSeeds.map((s) => s.entity_id);
  const seedNames = resolvedSeeds.map((s) => s.name);

  // Step 3: First-Order Discovery across core domains
  agentDecisions.push(`Querying Qloo insights for seeds [${seedNames.join(", ")}] across music, literature, and objects.`);
  const [artistsRaw, booksRaw, brandsRaw, placesRaw] = await Promise.all([
    getQlooInsights(seedIds, "urn:entity:artist", 8),
    getQlooInsights(seedIds, "urn:entity:book", 8),
    getQlooInsights(seedIds, "urn:entity:brand", 8),
    getQlooInsights(seedIds, "urn:entity:place", 8),
  ]);

  // Step 4: AGENTIC ADAPTIVE BRANCHING (Bible §5.3 Step E & §6.1)
  // The agent inspects first-round discoveries. If a high-affinity entity appears,
  // it uses that entity as a secondary seed for a targeted second-order query.
  let adaptiveEntities: QlooEntity[] = [];
  const topArtist = artistsRaw[0];
  if (topArtist && topArtist.entity_id) {
    agentDecisions.push(
      `Autonomous Decision: Qloo discovered high-affinity anchor "${topArtist.name}". Branching into second-order query to find cross-domain affinities specifically clustered around this discovery.`
    );
    const secondOrderPlaces = await getQlooInsights([topArtist.entity_id], "urn:entity:place", 4);
    adaptiveEntities = secondOrderPlaces;
  }

  // Normalize entities with real image URLs & computed affinities
  const musicEntities = artistsRaw.map((e) => ({
    ...normalizeEntity(e, "MUSIC", seedNames),
    qlooReasoning: `Correlated via Qloo taste graph with character seeds ${seedNames.slice(0, 2).join(" & ")}.`,
  }));

  const bookEntities = booksRaw.map((e) => ({
    ...normalizeEntity(e, "BOOKS", seedNames),
    qlooReasoning: `High cross-domain literary affinity with architectural restraint and reflective habits.`,
  }));

  const brandEntities = brandsRaw.map((e) => ({
    ...normalizeEntity(e, "OBJECTS", seedNames),
    qlooReasoning: `Material affinity with tactile, functional everyday objects and design heritage.`,
  }));

  const placeEntities = [...placesRaw, ...adaptiveEntities].map((e) => ({
    ...normalizeEntity(e, "PLACES", seedNames),
    qlooReasoning: `Locality and spatial sanctuary index clustered around solitary aesthetic routines.`,
  }));

  // Step 5: Synthesize into 4 tailored Inquiries with Scene Vignettes
  const topMusicName = musicEntities[0]?.name || "Hiroshi Yoshimura";
  const topBookName = bookEntities[0]?.name || "In Praise of Shadows";
  const topBrandName = brandEntities[0]?.name || "Hasami Porcelain";
  const topPlaceName = placeEntities[0]?.name || "Quiet corner sanctuary";

  // Synthesize scene vignettes using Gemini with embedded entity anchors
  const vignettes = await generateVignettes(
    profiling.characterName,
    topMusicName,
    topBookName,
    topBrandName,
    topPlaceName
  );

  const inquiries: AgentInquiry[] = [
    {
      id: "playlist",
      question: profiling.inquiries[0] || "What does her 2 AM solitary soundscape sound like?",
      vignette: vignettes.playlist,
      vignetteHighlightEntity: topMusicName,
      hasAudio: true,
      audioTrackName: `${topMusicName} — Solitary Frequencies`,
      entities: musicEntities,
    },
    {
      id: "bookshelf",
      question: profiling.inquiries[1] || "What books are on her worktable?",
      vignette: vignettes.bookshelf,
      vignetteHighlightEntity: topBookName,
      hasAudio: false,
      entities: bookEntities,
    },
    {
      id: "objects",
      question: profiling.inquiries[2] || "What objects and wardrobe define her space?",
      vignette: vignettes.objects,
      vignetteHighlightEntity: topBrandName,
      hasAudio: false,
      entities: brandEntities,
    },
    {
      id: "haunts",
      question: "Where does she go when she needs to disappear?",
      vignette: vignettes.haunts,
      vignetteHighlightEntity: topPlaceName,
      hasAudio: false,
      entities: placeEntities,
    },
  ];

  agentDecisions.push("Dossier synthesis complete. Ready for creator steering.");

  return {
    characterName: profiling.characterName,
    summary: profiling.summary,
    explicitAnchors: profiling.explicitAnchors,
    inquiries,
    agentDecisions,
  };
}

/**
 * Handles live steering in the Studio:
 * Takes the user's prompt instruction, decides whether to query Qloo for a new domain/direction,
 * and synthesizes an updated or newly added inquiry.
 */
export async function steerAgenticResearch(
  characterName: string,
  instruction: string,
  existingSeeds: string[]
): Promise<AgentInquiry> {
  // 1. Ask Gemini to extract new search anchors from user direction
  let searchTerms = ["A24", "post-rock", "minimalism"];
  if (ai) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `Given creator direction: "${instruction}" for character "${characterName}".
Extract 2 specific real-world search terms for Qloo (artists, places, brands, or books).
Respond ONLY in JSON: { "terms": ["term1", "term2"], "question": "A concise scene or inquiry question title", "domain": "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" }`,
        config: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const parsed = JSON.parse(res.text || "{}");
      if (parsed.terms && parsed.terms.length > 0) searchTerms = parsed.terms;
    } catch (e) {
      console.warn("Steering parsing fallback:", e);
    }
  }

  // 2. Query Qloo with the new direction
  const resolved = await searchQloo(searchTerms[0]);
  let entities: AgentCulturalEntity[] = [];
  if (resolved.length > 0) {
    const rawInsights = await getQlooInsights([resolved[0].entity_id], "urn:entity:artist", 6);
    entities = rawInsights.map((e) => ({
      ...normalizeEntity(e, "DISCOVERIES", [searchTerms[0]]),
      qlooReasoning: `Directly discovered based on creator instruction: "${instruction}".`,
    }));
  }

  const highlight = entities[0]?.name || searchTerms[0];

  return {
    id: `inquiry-${Date.now()}`,
    question: instruction.endsWith("?") ? instruction : `Exploring: ${instruction}`,
    vignette: `Directed by creator: "${instruction}". The character's environment recalibrates around ${highlight}, shifting the emotional and material atmosphere of the scene.`,
    vignetteHighlightEntity: highlight,
    hasAudio: false,
    entities,
  };
}

// ---------------- Helper LLM Functions ----------------

async function profileCharacter(prompt: string) {
  if (!ai) {
    return {
      characterName: prompt.split(" ")[0]?.replace(/[^a-zA-Z]/g, "") || "Shoujo A",
      summary: "A solitary life defined by quiet observation and tactile habits.",
      explicitAnchors: ["Solitary lifestyle", "Distinctive morning ritual"],
      qlooSearchQueries: ["Ryuichi Sakamoto", "Tadao Ando", "Hasami porcelain"],
      inquiries: [
        "What does her 2 AM solitary soundscape sound like?",
        "What books lean on her worktable?",
        "What objects define her physical space?",
      ],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are the Lead Cultural Profiler for "Poppies", an agentic studio grounded in Qloo's taste graph.
Analyze this character prompt:
"""${prompt}"""

Extract:
1. characterName: (e.g. Tsukuru, Elena, Shoujo A)
2. summary: One crisp literary sentence defining their cultural soul.
3. explicitAnchors: 3-4 concrete facts (profession, city, habits).
4. qlooSearchQueries: 3-4 specific real-world cultural entities to look up in Qloo (specific artists, authors, movements, places).
5. inquiries: 3 evocative inquiry questions about their solitary hours, worktable, or secrets.

Respond ONLY with valid JSON:
{
  "characterName": string,
  "summary": string,
  "explicitAnchors": string[],
  "qlooSearchQueries": string[],
  "inquiries": string[]
}`,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      characterName: parsed.characterName || "Shoujo A",
      summary: parsed.summary || "A character taking shape in the quiet.",
      explicitAnchors: parsed.explicitAnchors || ["Solitary lifestyle"],
      qlooSearchQueries: parsed.qlooSearchQueries || ["Hiroshi Yoshimura", "Hasami"],
      inquiries: parsed.inquiries || [
        "What does her 2 AM solitary soundscape sound like?",
        "What books lean on her worktable?",
        "What objects define her physical space?",
      ],
    };
  } catch (err) {
    console.error("Gemini profiling error:", err);
    return {
      characterName: "Shoujo A",
      summary: "A quiet life structured around intentional habits.",
      explicitAnchors: ["Architecture", "Nagoya"],
      qlooSearchQueries: ["Hiroshi Yoshimura", "Tadao Ando"],
      inquiries: [
        "What does her 2 AM solitary soundscape sound like?",
        "What books lean on her worktable?",
        "What objects define her physical space?",
      ],
    };
  }
}

async function generateVignettes(
  characterName: string,
  musicName: string,
  bookName: string,
  brandName: string,
  placeName: string
) {
  if (!ai) {
    return {
      playlist: `The light off the avenue comes through uncurtained glass. At 2 AM, the drafting table is clear except for an incandescent lamp and a tape deck running on loop. She turns to ${musicName} not for background sound, but because repetitive acoustic tape phrases make the solitary room feel intentional.`,
      bookshelf: `Three shelves of unvarnished pine, wedged tight without bookends. Creased copies of ${bookName} lean against transit timetables and structural handbooks, read in the silence before sleep.`,
      objects: `On the worktable, alongside drafting compasses and ink bottles, sits an understated piece from ${brandName}, worn from years of daily use without ever being polished.`,
      haunts: `When evening crowds dissipate, she steps into ${placeName}, where conversations remain below the hum of the espresso machine and solitary visitors are left undisturbed.`,
    };
  }

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are writing cinematic A24-style production bible vignettes for character "${characterName}".
Write four distinct, atmospheric 2-sentence scene vignettes. Each must naturally incorporate one cultural entity name:
1. playlist: must mention "${musicName}" (listening at 2 AM)
2. bookshelf: must mention "${bookName}" (reading on nightstand/worktable)
3. objects: must mention "${brandName}" (a physical object in daily use)
4. haunts: must mention "${placeName}" (a sanctuary space visited alone)

Keep the prose evocative, literary, and grounded in physical textures (paper, concrete, tape hiss, coffee).
Respond ONLY in JSON:
{
  "playlist": string,
  "bookshelf": string,
  "objects": string,
  "haunts": string
}`,
      config: { responseMimeType: "application/json", temperature: 0.4 },
    });

    const parsed = JSON.parse(res.text || "{}");
    return {
      playlist: parsed.playlist || `At 2 AM, the tape deck loops ${musicName}, making the quiet room feel intentional.`,
      bookshelf: parsed.bookshelf || `Dog-eared copies of ${bookName} lean against structural notebooks on the table.`,
      objects: parsed.objects || `A worn piece from ${brandName} rests by the ink bottles, valued for its unadorned utility.`,
      haunts: parsed.haunts || `She retreats to ${placeName} when passenger flow slows, watching the city through rain on glass.`,
    };
  } catch (err) {
    console.error("Vignette generation error:", err);
    return {
      playlist: `At 2 AM, the tape deck loops ${musicName}, making the quiet room feel intentional.`,
      bookshelf: `Dog-eared copies of ${bookName} lean against structural notebooks on the table.`,
      objects: `A worn piece from ${brandName} rests by the ink bottles, valued for its unadorned utility.`,
      haunts: `She retreats to ${placeName} when passenger flow slows, watching the city through rain on glass.`,
    };
  }
}
