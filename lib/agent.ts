import { GoogleGenAI } from "@google/genai";
import { searchQloo, getQlooInsights, normalizeEntity, QlooEntity } from "./qloo";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AgentCulturalEntity {
  id: string;
  name: string;
  domain: string; // "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION"
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
  source: "creator" | "agent";
  domain: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION";
  vignette: string;
  vignetteHighlightEntity?: string;
  hasAudio: boolean;
  audioTrackName?: string;
  entities: AgentCulturalEntity[];
}

export interface CulturalDossierBrief {
  tasteThesis: string;
  observedClusters: string[];
  unconsideredAngles: {
    title: string;
    description: string;
    groundedEntity?: string;
  }[];
  highlightedNodes: string[];
}

export interface AgentDossier {
  characterName: string;
  summary: string;
  constraints: {
    locality?: string;
    era?: string;
    occupation?: string;
  };
  explicitAnchors: string[];
  resolvedSeeds: { name: string; entityId: string; type?: string }[];
  culturalDossier: CulturalDossierBrief;
  inquiries: AgentInquiry[];
  agentDecisions: string[];
}

interface InquiryPlan {
  question: string;
  domain: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION";
  searchSeed: string;
}

interface ProfilingResult {
  characterName: string;
  summary: string;
  constraints: {
    locality?: string;
    era?: string;
    occupation?: string;
  };
  explicitAnchors: string[];
  globalSeeds: string[];
  creatorInquiries: InquiryPlan[];
  agentInquiries: InquiryPlan[];
}

/**
 * Domain to Qloo URN filter type mapping
 */
function getQlooFilterType(domain: string): string {
  switch (domain) {
    case "MUSIC":
      return "urn:entity:artist";
    case "BOOKS":
      return "urn:entity:book";
    case "OBJECTS":
      return "urn:entity:brand";
    case "PLACES":
      return "urn:entity:place";
    case "CONTRADICTION":
      return "urn:entity:brand";
    default:
      return "urn:entity:brand";
  }
}

/**
 * Runs the targeted agentic research cycle:
 * 1. Profile: Decompose prompt into constraints & targeted per-inquiry search seeds
 * 2. Resolve: Disambiguate each inquiry's seed using Qloo typed /search
 * 3. Query: Perform domain-targeted /v2/insights for each specific question
 * 4. Branch: Execute adaptive 2nd-order traversal on highest-affinity discovery
 * 5. Synthesize: Generate grounded 2-sentence scene vignettes & concise Cultural Dossier
 */
export async function runAgenticResearchCycle(prompt: string): Promise<AgentDossier> {
  const agentDecisions: string[] = [];

  console.log("\n=======================================================");
  console.log("[AGENT TRACE] INITIATING TARGETED AGENTIC RESEARCH CYCLE");
  console.log(`[AGENT TRACE] Prompt: "${prompt}"`);
  console.log("=======================================================\n");

  // Step 1: Character profiling, constraint extraction & inquiry planning
  agentDecisions.push("Deconstructing character brief into structured constraints and targeted per-inquiry seeds.");
  const profiling = await profileCharacter(prompt);
  console.log("[AGENT STEP 1: PROFILING & SEED FORMULATION]");
  console.log(`- Character: ${profiling.characterName}`);
  console.log(`- Summary: "${profiling.summary}"`);
  console.log(`- Constraints: Locality="${profiling.constraints.locality}", Era="${profiling.constraints.era}", Occupation="${profiling.constraints.occupation}"`);
  console.log(`- [You] Creator Inquiries: ${profiling.creatorInquiries.map((q) => `"${q.question}" -> Seed: "${q.searchSeed}" (${q.domain})`).join("; ")}`);
  console.log(`- [Agent] Discovery Inquiries: ${profiling.agentInquiries.map((q) => `"${q.question}" -> Seed: "${q.searchSeed}" (${q.domain})`).join("; ")}\n`);

  // Step 2: Resolve global seeds
  const resolvedGlobalSeeds: QlooEntity[] = [];
  for (const seedQuery of profiling.globalSeeds.slice(0, 3)) {
    const hits = await searchQloo(seedQuery);
    if (hits && hits.length > 0) resolvedGlobalSeeds.push(hits[0]);
  }

  // Step 3: Resolve each inquiry with its OWN specific targeted seed in Qloo
  console.log("[AGENT STEP 2: TARGETED PER-INQUIRY QLOO RESOLUTION]");
  const allInquiryPlans: { plan: InquiryPlan; source: "creator" | "agent"; id: string }[] = [
    ...profiling.creatorInquiries.map((plan, i) => ({
      plan,
      source: "creator" as const,
      id: `inquiry-creator-${i + 1}`,
    })),
    ...profiling.agentInquiries.map((plan, j) => ({
      plan,
      source: "agent" as const,
      id: `inquiry-agent-${j + 1}`,
    })),
  ];

  const inquiries: AgentInquiry[] = [];
  const allDiscoveredEntities: AgentCulturalEntity[] = [];
  const resolvedSeedRecords: { name: string; entityId: string; type?: string }[] = [];

  // Fallback map if an obscure query fails to resolve in Qloo
  const fallbackDomainSeeds: Record<string, string> = {
    OBJECTS: "Staedtler",
    MUSIC: "Erik Satie",
    PLACES: profiling.constraints.locality?.toLowerCase().includes("marseille")
      ? "Le Panier"
      : profiling.constraints.locality?.toLowerCase().includes("nagoya")
      ? "Osu Kannon"
      : "Palais Longchamp",
    BOOKS: "In Praise of Shadows",
    CONTRADICTION: "Snow Peak",
  };

  for (const item of allInquiryPlans) {
    const { plan, source, id } = item;
    const filterType = getQlooFilterType(plan.domain);

    console.log(`- Resolving inquiry [${source.toUpperCase()}]: "${plan.question}"`);
    console.log(`  Domain: ${plan.domain} (${filterType}), Seed Query: "${plan.searchSeed}"`);

    // Typed search in Qloo
    let seedEntity: QlooEntity | null = null;
    const searchHits = await searchQloo(plan.searchSeed, filterType);
    if (searchHits && searchHits.length > 0) {
      seedEntity = searchHits[0];
      console.log(`  ✓ Resolved Qloo Seed: "${seedEntity.name}" (ID: ${seedEntity.entity_id})`);
    } else {
      // Fallback: If typed search failed, use verified high-taste domain fallback anchor
      // CRITICAL: NEVER do an untyped search for OBJECTS or BOOKS, as Qloo untyped search returns pulp Goodreads books
      const fallbackQuery = fallbackDomainSeeds[plan.domain] || "Staedtler";
      const fbHits = await searchQloo(fallbackQuery, filterType);
      if (fbHits && fbHits.length > 0) {
        seedEntity = fbHits[0];
        console.log(`  [Fallback Anchor] "${fallbackQuery}" -> "${seedEntity.name}" (ID: ${seedEntity.entity_id})`);
      }
    }

    if (seedEntity) {
      resolvedSeedRecords.push({
        name: seedEntity.name,
        entityId: seedEntity.entity_id,
        type: seedEntity.type,
      });
    }

    // Query Qloo Insights with this specific seed ID (fetching up to 8 candidates)
    const seedIdsToUse = seedEntity
      ? [seedEntity.entity_id]
      : resolvedGlobalSeeds.map((s) => s.entity_id);

    let rawInsights: QlooEntity[] = [];
    if (seedIdsToUse.length > 0) {
      rawInsights = await getQlooInsights(seedIdsToUse, filterType, 8);
      console.log(`  ✓ /v2/insights returned ${rawInsights.length} candidates. Top: ${rawInsights.slice(0, 3).map((e) => e.name).join(", ")}`);
    }

    // Include the resolved seed itself as candidate #1, followed by Qloo graph discoveries
    const candidateRawEntities: QlooEntity[] = [];
    if (seedEntity) {
      candidateRawEntities.push(seedEntity);
    }
    rawInsights.forEach((item) => {
      if (!candidateRawEntities.some((e) => (e.entity_id && e.entity_id === item.entity_id) || e.name.toLowerCase() === item.name.toLowerCase())) {
        candidateRawEntities.push(item);
      }
    });

    const seedNames = seedEntity ? [seedEntity.name] : profiling.globalSeeds;
    const normalizedCandidates: AgentCulturalEntity[] = candidateRawEntities.map((e) => ({
      ...normalizeEntity(e, plan.domain, seedNames),
      qlooReasoning: `Correlated via Qloo taste graph with anchor "${seedNames[0]}" for ${plan.domain.toLowerCase()}.`,
    }));

    // AUTEUR CURATORIAL FILTER:
    // Have the Agent evaluate candidates against the character's soul and specific question intent.
    // Discards off-topic noise (e.g. cars for tools, pulp books) and writes bespoke editorial context.
    console.log(`  ⚡ Auteur Curation: Evaluating ${normalizedCandidates.length} Qloo candidates for "${plan.question}"...`);
    const curatedEntities = await curateEntitiesForInquiry(
      profiling.characterName,
      profiling.summary,
      plan.question,
      plan.domain,
      normalizedCandidates
    );
    console.log(`  ✓ Curated into ${curatedEntities.length} authentic entities: ${curatedEntities.map((c) => c.name).join(", ")}`);

    allDiscoveredEntities.push(...curatedEntities);

    const highlightName =
      curatedEntities[0]?.name || seedEntity?.name || seedNames[0] || "Cultural Anchor";

    inquiries.push({
      id,
      question: plan.question,
      source,
      domain: plan.domain,
      vignette: "", // Generated in step 5 via batch synthesis
      vignetteHighlightEntity: highlightName,
      hasAudio: plan.domain === "MUSIC",
      audioTrackName: plan.domain === "MUSIC" ? `${highlightName} — Solitary Frequencies` : undefined,
      entities: curatedEntities,
    });
  }

  // Step 4: AGENTIC ADAPTIVE BRANCHING (Bible §5.3 Step E)
  console.log("\n[AGENT STEP 3: ADAPTIVE AUTONOMOUS BRANCHING]");
  let branchedDiscovery = "";
  const primaryMusicEntity = inquiries.find((i) => i.domain === "MUSIC")?.entities[0];

  if (primaryMusicEntity && primaryMusicEntity.entityId) {
    const rawId = primaryMusicEntity.entityId.replace("urn:qloo:entity:", "");
    branchedDiscovery = primaryMusicEntity.name;
    agentDecisions.push(
      `Autonomous Decision: Discovered primary anchor "${primaryMusicEntity.name}". Branching into cross-domain query for correlated cultural spaces.`
    );
    console.log(`- Autonomous Branch: Primary anchor "${primaryMusicEntity.name}". Querying cross-domain place affinities...`);
    const secondOrderRaw = await getQlooInsights([rawId], "urn:entity:place", 4);
    if (secondOrderRaw.length > 0) {
      console.log(`  ✓ Second-order place discoveries: ${secondOrderRaw.map((e) => e.name).join(", ")}`);
      // ONLY enrich an inquiry whose domain is actually PLACES or CONTRADICTION! Never overwrite MUSIC!
      const matchingAgentInq = inquiries.find(
        (i) => i.source === "agent" && (i.domain === "PLACES" || i.domain === "CONTRADICTION")
      );
      if (matchingAgentInq) {
        matchingAgentInq.entities = [
          ...secondOrderRaw.map((e) => ({
            ...normalizeEntity(e, matchingAgentInq.domain, [primaryMusicEntity.name]),
            qlooReasoning: `Second-order cross-domain discovery branching from "${primaryMusicEntity.name}".`,
          })),
          ...matchingAgentInq.entities,
        ];
        matchingAgentInq.vignetteHighlightEntity = secondOrderRaw[0].name;
      }
    }
  }

  // Step 5: Batch Generate Scene Vignettes for all inquiries
  console.log("\n[AGENT STEP 4: GROUNDED SCENE VIGNETTES]");
  const vignetteInputs = inquiries.map((inq) => ({
    id: inq.id,
    question: inq.question,
    domain: inq.domain,
    highlight: inq.vignetteHighlightEntity || "Quiet Anchor",
  }));

  const allVignettes = await generateAllVignettes(profiling.characterName, vignetteInputs);
  inquiries.forEach((inq) => {
    inq.vignette = allVignettes[inq.id] || `Elena turns to ${inq.vignetteHighlightEntity}, where the quiet work makes the room feel grounded.`;
    console.log(`  - [${inq.source.toUpperCase()}] "${inq.question}"`);
    console.log(`    Highlight: "${inq.vignetteHighlightEntity}"`);
    console.log(`    Vignette: "${inq.vignette}"`);
  });

  // Step 6: Synthesize "Cultural Dossier" Master Brief (Upward from Evidence)
  console.log("\n[AGENT STEP 5: CULTURAL DOSSIER SYNTHESIS]");
  const topMusic = inquiries.find((i) => i.domain === "MUSIC")?.entities.slice(0, 3).map((e) => e.name) || [];
  const topObjects = inquiries.find((i) => i.domain === "OBJECTS")?.entities.slice(0, 3).map((e) => e.name) || [];
  const topPlaces = inquiries.find((i) => i.domain === "PLACES")?.entities.slice(0, 3).map((e) => e.name) || [];
  const topBooks = inquiries.find((i) => i.domain === "BOOKS")?.entities.slice(0, 3).map((e) => e.name) || [];

  const culturalDossier = await synthesizeCulturalDossier(
    profiling.characterName,
    profiling.summary,
    resolvedSeedRecords.map((s) => s.name),
    topMusic,
    topBooks,
    topObjects,
    topPlaces,
    branchedDiscovery
  );

  console.log(`- Taste Thesis: "${culturalDossier.tasteThesis}"`);
  console.log(`- Observed Clusters: [${culturalDossier.observedClusters.join("; ")}]`);
  if (culturalDossier.unconsideredAngles[0]) {
    console.log(`- Unconsidered Angle: "${culturalDossier.unconsideredAngles[0].title}" -> ${culturalDossier.unconsideredAngles[0].description} (${culturalDossier.unconsideredAngles[0].groundedEntity})`);
  }
  console.log("=======================================================\n");

  agentDecisions.push("Targeted research cycle complete. Dossier ready for steering.");

  return {
    characterName: profiling.characterName,
    summary: profiling.summary,
    constraints: profiling.constraints,
    explicitAnchors: profiling.explicitAnchors,
    resolvedSeeds: resolvedSeedRecords,
    culturalDossier,
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
  let searchTerms = ["A24", "post-rock", "minimalism"];
  let domain: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" = "MUSIC";

  if (ai) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `Given creator direction: "${instruction}" for character "${characterName}".
Extract 2 specific real-world search terms for Qloo (artists, places, brands, or books).
Respond ONLY in JSON: { "terms": ["term1", "term2"], "question": "A concise scene or inquiry question title under 12 words", "domain": "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" }`,
        config: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const parsed = JSON.parse(res.text || "{}");
      if (parsed.terms && parsed.terms.length > 0) searchTerms = parsed.terms;
      if (parsed.domain) domain = parsed.domain;
    } catch (e) {
      console.warn("Steering parsing fallback:", e);
    }
  }

  const filterType = getQlooFilterType(domain);
  const resolved = await searchQloo(searchTerms[0], filterType);
  let entities: AgentCulturalEntity[] = [];

  if (resolved.length > 0) {
    const rawInsights = await getQlooInsights([resolved[0].entity_id], filterType, 6);
    entities = rawInsights.map((e) => ({
      ...normalizeEntity(e, domain, [searchTerms[0]]),
      qlooReasoning: `Discovered based on creator direction: "${instruction}".`,
    }));
  }

  const highlight = entities[0]?.name || searchTerms[0];
  const vignette = await generateSingleVignette(
    characterName,
    instruction,
    domain,
    highlight
  );

  return {
    id: `inquiry-${Date.now()}`,
    question: instruction.endsWith("?") ? instruction : `Exploring: ${instruction}`,
    source: "creator",
    domain,
    vignette,
    vignetteHighlightEntity: highlight,
    hasAudio: domain === "MUSIC",
    audioTrackName: domain === "MUSIC" ? `${highlight} — Studio Session` : undefined,
    entities,
  };
}

// ---------------- Helper LLM Functions ----------------

async function profileCharacter(prompt: string): Promise<ProfilingResult> {
  const fallbackResult: ProfilingResult = {
    characterName: prompt.split(" ")[0]?.replace(/[^a-zA-Z]/g, "") || "Shoujo A",
    summary: "A solitary life structured around intentional habits and quiet craft.",
    constraints: {
      locality: "Tokyo",
      era: "Contemporary",
      occupation: "Designer",
    },
    explicitAnchors: ["Solitary lifestyle", "Distinctive morning ritual"],
    globalSeeds: ["Ryuichi Sakamoto", "Tadao Ando", "Hasami porcelain"],
    creatorInquiries: [
      { question: "What tools and everyday objects rest on their worktable?", domain: "OBJECTS", searchSeed: "Hasami porcelain" },
      { question: "What does their 2 AM solitary soundscape sound like?", domain: "MUSIC", searchSeed: "Hiroshi Yoshimura" },
    ],
    agentInquiries: [
      { question: "Where do they retreat when they need to disappear?", domain: "PLACES", searchSeed: "Shinjuku" },
    ],
  };

  if (!ai) return fallbackResult;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are the Lead Cultural Profiler for "Poppies", an agentic character studio grounded in Qloo's taste graph.
Analyze this character prompt:
"""${prompt}"""

CRITICAL RULES FOR CULTURAL ANCHORS (NO GOODREADS PULP, NO GENERIC CONCEPTS):
1. characterName: (e.g. Tsukuru, Elena, or a fitting name if unnamed).
2. summary: One crisp literary sentence defining their cultural soul without generic tropes.
3. constraints: { locality, era, occupation }
4. explicitAnchors: 2-3 concrete facts directly stated in the prompt.
5. creatorInquiries: 1-3 concise questions (<12 words) directly fulfilling what the creator asked (e.g. her worktable tools, his secret bookshelf, 2 AM soundscape, where they walk).
   For EACH inquiry provide:
   - question: concise question title
   - domain: "OBJECTS" | "MUSIC" | "PLACES" | "BOOKS" | "CONTRADICTION"
   - searchSeed: A REAL, HIGH-TASTE CULTURAL ENTITY in Qloo:
     * For tools/industrial design: use real makers like "Opinel Knives", "Staedtler", "Faber-castell", "Snow Peak", "Anglepoise", "Vitra", "Alessi", "FLOS", "Leatherman", "Bodum", "Royal Copenhagen".
     * For music/soundscapes: use real composers or ambient artists like "Erik Satie", "Claude Debussy", "Brian Eno", "Hiroshi Yoshimura", "Ryuichi Sakamoto", "Harold Budd".
     * For places/haunts: use real cities, famous districts, or station areas like "Marseille", "Calanques", "Le Panier", "Nagoya", "Kyoto", "Shinjuku".
     * For bookshelf/reading (ONLY when reading is asked): ALWAYS use EXACT CANONICAL BOOK TITLES (e.g. "In Praise of Shadows", "The Poetics of Space", "Snow Country", "The Woman in the Dunes", "Invisible Cities", "The Stranger"). NEVER search author last names (e.g. do NOT search "Kobo Abe" or "Gaston Bachelard" as Qloo fuzzy-matches series crime novels like "Guilt (Abe Glitsky)")!
       NEVER search for generic theme words like "Guilt", "Loneliness", or "Architecture" (this returns cheap airport thrillers)!
       NEVER use series novels or pulp fiction!
     * NEVER use abstract phrases like "architectural conservation" or "chicory coffee".
6. agentInquiries: 1 autonomous question (<12 words) testing a subtle habit, friction, or everyday ritual (e.g. vintage vehicle maintenance, late-night kissaten habit).
   IMPORTANT: DO NOT invent a "BOOKS" inquiry unless the creator prompt specifically mentioned reading, books, or literature!
7. globalSeeds: 2-3 general high-taste cultural figures or brands matching this character.

Respond ONLY with valid JSON:
{
  "characterName": string,
  "summary": string,
  "constraints": {
    "locality": string,
    "era": string,
    "occupation": string
  },
  "explicitAnchors": string[],
  "globalSeeds": string[],
  "creatorInquiries": [
    { "question": string, "domain": "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION", "searchSeed": string }
  ],
  "agentInquiries": [
    { "question": string, "domain": "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION", "searchSeed": string }
  ]
}`,
      config: { responseMimeType: "application/json", temperature: 0.2 },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      characterName: parsed.characterName || fallbackResult.characterName,
      summary: parsed.summary || fallbackResult.summary,
      constraints: parsed.constraints || fallbackResult.constraints,
      explicitAnchors: parsed.explicitAnchors || fallbackResult.explicitAnchors,
      globalSeeds: parsed.globalSeeds || fallbackResult.globalSeeds,
      creatorInquiries:
        parsed.creatorInquiries && parsed.creatorInquiries.length > 0
          ? parsed.creatorInquiries
          : fallbackResult.creatorInquiries,
      agentInquiries:
        parsed.agentInquiries && parsed.agentInquiries.length > 0
          ? parsed.agentInquiries
          : fallbackResult.agentInquiries,
    };
  } catch (err) {
    console.error("Gemini profiling error:", err);
    return fallbackResult;
  }
}

/**
 * AUTEUR CURATORIAL FILTER:
 * Evaluates candidate entities returned by Qloo's statistical taste graph against
 * the character's soul and the specific nuance of the question.
 *
 * Discards irrelevant noise (cars for tools, hair dryers, airport paperbacks)
 * and writes a bespoke 1-sentence curatorial note for each selected entity.
 */
async function curateEntitiesForInquiry(
  characterName: string,
  characterSummary: string,
  question: string,
  domain: string,
  candidateEntities: AgentCulturalEntity[]
): Promise<AgentCulturalEntity[]> {
  if (!ai || candidateEntities.length <= 2) {
    return candidateEntities.slice(0, 5);
  }

  try {
    const prompt = `You are the Lead Cultural Curator for "Poppies", a prestige auteur character studio.
Character: "${characterName}" (${characterSummary})
Inquiry Question: "${question}"
Domain: ${domain}

Candidate Entities from Qloo Taste Graph:
${candidateEntities.map((c, i) => `${i + 1}. "${c.name}" (${c.domain}): ${c.description} [tags: ${c.tags?.join(", ") || "none"}]`).join("\n")}

CURATORIAL MANDATE:
1. Understand the exact angle and tone of the question:
   - Is it asking about specific professional craft tools or instruments?
   - Is it asking for quiet domestic rituals?
   - Is it asking for something they love, or something they secretly despise/reject?
   - Is it an unexpected friction, contradiction, or guilty pleasure?
2. Rigorously filter and select the 3 to 5 MOST AUTHENTIC, TRUTHFUL entities.
   CRITICAL NEGATIVE FILTER:
   - For tools/worktable/industrial design: REJECT all cars/automotive brands (e.g. Peugeot, Opel, Volvo, Fiat), hair styling/grooming appliances (e.g. Babyliss), and random fashion.
   - For literature/books: REJECT all airport thrillers, series crime novels, and self-help paperbacks.
3. For EACH selected entity, write a bespoke 1-sentence curatorial note (editorial rationale) explaining its exact role or physical reality in this character's world.

Respond ONLY with valid JSON:
{
  "curated": [
    {
      "name": string,
      "curatorialNote": string
    }
  ]
}`;

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.25 },
    });

    const parsed = JSON.parse(res.text || "{}");
    if (parsed.curated && Array.isArray(parsed.curated) && parsed.curated.length > 0) {
      const curatedResults: AgentCulturalEntity[] = [];
      for (const item of parsed.curated) {
        const match = candidateEntities.find(
          (c) =>
            c.name.toLowerCase() === item.name.toLowerCase() ||
            c.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) {
          curatedResults.push({
            ...match,
            description: item.curatorialNote || match.description,
            qlooReasoning: item.curatorialNote || match.qlooReasoning,
          });
        }
      }
      if (curatedResults.length >= 2) {
        return curatedResults;
      }
    }
  } catch (err) {
    console.warn("Curator filter warning:", err);
  }
  return candidateEntities.slice(0, 5);
}

/**
 * Generates all inquiry scene vignettes in a single batched LLM call.
 * Eliminates 429 rate limit errors and ensures rich, cohesive physical textures across all scenes.
 */
async function generateAllVignettes(
  characterName: string,
  inquiries: { id: string; question: string; domain: string; highlight: string }[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  inquiries.forEach((inq) => {
    result[inq.id] = `At the end of a long day, ${characterName} turns to ${inq.highlight}, where the quiet consistency of the work makes the room feel grounded and intentional.`;
  });

  if (!ai || inquiries.length === 0) return result;

  try {
    const prompt = `You are an editorial novelist writing 2-sentence scene vignettes for character "${characterName}".
For EACH inquiry below, write exactly 2 concise, richly textured sentences naturally incorporating the specified cultural entity.

Inquiries:
${inquiries.map((q, i) => `${i + 1}. [ID: ${q.id}] [${q.domain}] Question: "${q.question}" -> Must feature: "${q.highlight}"`).join("\n")}

Rules:
- Exactly 2 sentences per inquiry.
- Grounded in physical textures (paper, wood, analog tape, damp stone, coffee, rain, iron, chalk).
- Third-person perspective only.
- Zero generic AI hype, zero cliches.

Respond ONLY in JSON:
{
  "vignettes": [
    { "id": string, "vignette": string }
  ]
}`;

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.35 },
    });

    const parsed = JSON.parse(res.text || "{}");
    if (parsed.vignettes && Array.isArray(parsed.vignettes)) {
      for (const v of parsed.vignettes) {
        if (v.id && v.vignette) {
          result[v.id] = v.vignette.replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  } catch (e) {
    console.warn("Batch vignette generation error:", e);
  }

  return result;
}

async function generateSingleVignette(
  characterName: string,
  question: string,
  domain: string,
  highlightEntity: string
): Promise<string> {
  const fallback = `At the end of a long day, ${characterName} turns to ${highlightEntity}, where the quiet consistency of the work makes the room feel grounded and intentional.`;

  if (!ai) return fallback;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are an editorial novelist writing a 2-sentence scene vignette for character "${characterName}".
Inquiry question: "${question}"
Cultural domain: ${domain}
The scene MUST naturally incorporate this real cultural entity: "${highlightEntity}".

Rules:
- Exactly 2 concise sentences.
- Grounded in physical textures (paper, wood, analog tape, damp stone, coffee, rain).
- Zero generic AI slop or sing-songy cliches.
- Do NOT add quotation marks around the output.`,
      config: { temperature: 0.4 },
    });

    return res.text?.trim() || fallback;
  } catch (e) {
    console.warn("Vignette generation fallback:", e);
    return fallback;
  }
}

async function synthesizeCulturalDossier(
  characterName: string,
  summary: string,
  seeds: string[],
  topArtists: string[],
  topBooks: string[],
  topBrands: string[],
  topPlaces: string[],
  branchedDiscovery?: string
): Promise<CulturalDossierBrief> {
  const fallback: CulturalDossierBrief = {
    tasteThesis: `Organized around intentional craft, structural restraint, and music designed for focus rather than performance. Their material world rejects decorative clutter in favor of objects and texts that bear the marks of daily, disciplined utility.`,
    observedClusters: [
      "Solitary Acoustic & Neoclassical Ambient",
      "Phenomenology of Space & Craft Monographs",
      "Tactile Unglazed Stoneware & Raw Tools",
    ],
    unconsideredAngles: [
      {
        title: "Submerged Tension",
        description: `Listeners anchored in minimalist acoustic music cross-index into heavier ambient and drone, suggesting emotional weight concealed under clean surfaces.`,
        groundedEntity: branchedDiscovery || topArtists[0] || "Cultural Anchor",
      },
    ],
    highlightedNodes: [
      ...seeds.slice(0, 2),
      ...(topArtists[0] ? [topArtists[0]] : []),
      ...(topBrands[0] ? [topBrands[0]] : []),
    ],
  };

  if (!ai) return fallback;

  try {
    const prompt = `You are the Lead Cultural Curator for "Poppies".
Character: "${characterName}" (${summary})
Active seeds: ${seeds.join(", ")}
Qloo graph discoveries:
- Music: ${topArtists.join(", ")}
- Objects: ${topBrands.join(", ")}
- Places: ${topPlaces.join(", ")}
- Books: ${topBooks.join(", ")}
${branchedDiscovery ? `- Autonomous Discovery: ${branchedDiscovery}` : ""}

TASK:
Write a quiet, literary Cultural Dossier summary:
1. tasteThesis: 2-3 sentences articulating how the character's taste hangs together from real cultural choices. Name at least 2 real discovered entities naturally.
   CRITICAL VOICE RULE: Must be written strictly in THIRD-PERSON (e.g. "${characterName}'s world is anchored by...", "Her daily routines are shaped by..."). NEVER use first-person pronouns ("I", "my", "we"). Zero hype, zero marketing slop.
2. observedClusters: 3 concise phrases describing the real cultural patterns (e.g. "French Impressionist Piano", "Heritage Woodwork Tools", "Maritime Sanctuaries").
3. unconsideredAngles: 1 genuine surprise or cultural friction that emerged from the graph. Provide: title, description (1-2 sentences in third person), and groundedEntity.
4. highlightedNodes: Array of 3-4 real entity names to make clickable.

Respond ONLY in JSON:
{
  "tasteThesis": string,
  "observedClusters": string[],
  "unconsideredAngles": [
    {
      "title": string,
      "description": string,
      "groundedEntity": string
    }
  ],
  "highlightedNodes": string[]
}`;

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(res.text || "{}");
    return {
      tasteThesis: parsed.tasteThesis || fallback.tasteThesis,
      observedClusters: parsed.observedClusters || fallback.observedClusters,
      unconsideredAngles: parsed.unconsideredAngles || fallback.unconsideredAngles,
      highlightedNodes: parsed.highlightedNodes || fallback.highlightedNodes,
    };
  } catch (e) {
    console.error("Dossier synthesis error:", e);
    return fallback;
  }
}
