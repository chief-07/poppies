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
  highlightedEntities?: string[];
  hasAudio: boolean;
  audioTrackName?: string;
  entities: AgentCulturalEntity[];
}

export interface CulturalDossierBrief {
  tasteThesis: string;
  psychologicalWound?: string;
  tactileArmor?: string;
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

  const rawInquiryPackages: AuteurPackageInput[] = [];
  const resolvedSeedRecords: { name: string; entityId: string; type?: string }[] = [];

  // Fallback pools if an obscure query fails to resolve in Qloo, tuned to character archetype
  const promptLower = (prompt + " " + profiling.summary).toLowerCase();
  const loc = (profiling.constraints.locality || "").toLowerCase();
  const isGritty = /mechanic|skate|club|grease|moped|diy|garage|punk|industrial|noise|bamboo/i.test(promptLower);

  const fallbackDomainSeedPools: Record<string, string[]> = {
    OBJECTS: isGritty
      ? ["Leatherman", "Knipex", "Tajima", "Makita", "Opinel Knives", "Danner", "Carhartt"]
      : ["Staedtler", "Rotring", "Midori MD", "Hario", "Faber-Castell", "Snow Peak", "Anglepoise"],
    MUSIC: isGritty
      ? ["Boredoms", "Merzbow", "Death Grips", "Sleaford Mods", "Lightning Bolt", "Squarepusher"]
      : ["Hiroshi Yoshimura", "Ryuichi Sakamoto", "Midori Takada", "Harold Budd", "Susumu Yokota", "Toshifumi Hinata"],
    PLACES: loc.includes("osaka")
      ? ["Shinsekai", "Dotonbori", "Amemura", "Nakazakicho"]
      : loc.includes("nagoya")
      ? ["Osu Kannon", "Sakae", "Nagoya Castle", "Endoji Shopping Street"]
      : loc.includes("tokyo")
      ? ["Shinjuku", "Shimokitazawa", "Daikanyama", "Yanaka", "Kichijoji"]
      : loc.includes("marseille")
      ? ["Le Panier", "Noailles", "Vallon des Auffes", "Cours Julien"]
      : loc.includes("berlin")
      ? ["Kreuzberg", "Neukölln", "Mitte", "Friedrichshain"]
      : ["Palais Longchamp", "Daikanyama", "Le Panier", "Kreuzberg"],
    BOOKS: isGritty
      ? ["Beautiful Star", "Hard-Boiled Wonderland", "The Woman in the Dunes", "Snow Country"]
      : ["The Poetics of Space", "In Praise of Shadows", "A Pattern Language", "Wabi-Sabi: for Artists", "Invisible Cities"],
    CONTRADICTION: isGritty
      ? ["Hasami porcelain", "Snow Peak", "Kaweco", "Hario V60"]
      : ["Snow Peak", "Hasami porcelain", "Porter Yoshida", "Muji Aluminum", "Casio G-Shock"],
  };

  const usedSeedNames = new Set<string>();
  const usedSeedIds = new Set<string>();

  for (const item of allInquiryPlans) {
    const { plan, source, id } = item;
    const filterType = getQlooFilterType(plan.domain);

    console.log(`- Resolving inquiry [${source.toUpperCase()}]: "${plan.question}"`);
    console.log(`  Domain: ${plan.domain} (${filterType}), Seed Query: "${plan.searchSeed}"`);

    // Typed search in Qloo with deduplication against previously used seeds
    let seedEntity: QlooEntity | null = null;
    const searchHits = await searchQloo(plan.searchSeed, filterType);
    for (const hit of searchHits) {
      const hitLower = hit.name.toLowerCase().trim();
      if (!usedSeedNames.has(hitLower) && !usedSeedIds.has(hit.entity_id)) {
        seedEntity = hit;
        console.log(`  ✓ Resolved Qloo Seed: "${seedEntity.name}" (ID: ${seedEntity.entity_id})`);
        break;
      }
    }

    // Fallback: If typed search failed or hit was duplicate, draw from domain seed pool
    if (!seedEntity) {
      const pool = fallbackDomainSeedPools[plan.domain] || ["Staedtler", "Midori MD", "Hario"];
      for (const fallbackQuery of pool) {
        if (usedSeedNames.has(fallbackQuery.toLowerCase().trim())) continue;
        const fbHits = await searchQloo(fallbackQuery, filterType);
        for (const hit of fbHits) {
          const hitLower = hit.name.toLowerCase().trim();
          if (!usedSeedNames.has(hitLower) && !usedSeedIds.has(hit.entity_id)) {
            seedEntity = hit;
            console.log(`  [Fresh Fallback Anchor] "${fallbackQuery}" -> "${seedEntity.name}" (ID: ${seedEntity.entity_id})`);
            break;
          }
        }
        if (seedEntity) break;
      }
    }

    if (seedEntity) {
      usedSeedNames.add(seedEntity.name.toLowerCase().trim());
      usedSeedIds.add(seedEntity.entity_id);
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

    rawInquiryPackages.push({
      id,
      question: plan.question,
      domain: plan.domain,
      source,
      seedName: seedEntity?.name || plan.searchSeed,
      candidates: normalizedCandidates,
    });
  }

  // Step 4: AGENTIC ADAPTIVE BRANCHING (Bible §5.3 Step E)
  console.log("\n[AGENT STEP 3: ADAPTIVE AUTONOMOUS BRANCHING]");
  let branchedDiscovery = "";
  const musicPackage = rawInquiryPackages.find((i) => i.domain === "MUSIC");
  const primaryMusicEntity = musicPackage?.candidates[0];

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
      const matchingAgentInq = rawInquiryPackages.find(
        (i) => i.source === "agent" && (i.domain === "PLACES" || i.domain === "CONTRADICTION")
      );
      if (matchingAgentInq) {
        const existingNames = new Set(matchingAgentInq.candidates.map((c) => c.name.toLowerCase()));
        const uniqueSecondOrder = secondOrderRaw
          .filter((e) => !existingNames.has(e.name.toLowerCase()))
          .map((e) => ({
            ...normalizeEntity(e, matchingAgentInq.domain, [primaryMusicEntity.name]),
            qlooReasoning: `Second-order cross-domain discovery branching from "${primaryMusicEntity.name}".`,
          }));
        matchingAgentInq.candidates = [
          ...uniqueSecondOrder,
          ...matchingAgentInq.candidates,
        ];
      }
    }
  }

  // Step 5: UNIFIED AUTEUR WORLD SYNTHESIS (Single Master Gemini Call - Immune to 429)
  console.log("\n[AGENT STEP 4: UNIFIED AUTEUR WORLD SYNTHESIS]");
  const masterSynthesis = await synthesizeAuteurWorld(
    profiling.characterName,
    prompt,
    profiling.summary,
    profiling.constraints,
    rawInquiryPackages,
    branchedDiscovery
  );

  const globalAssignedTopEntities = new Set<string>();

  const inquiries: AgentInquiry[] = rawInquiryPackages.map((pkg) => {
    const synthMatch = masterSynthesis.inquiries.find((s) => s.id === pkg.id);
    const curatedEntities = (synthMatch?.curated || []).map((cur) => {
      const match = pkg.candidates.find(
        (c) =>
          c.name.toLowerCase() === cur.name.toLowerCase() ||
          c.name.toLowerCase().includes(cur.name.toLowerCase()) ||
          cur.name.toLowerCase().includes(c.name.toLowerCase())
      );
      if (match) {
        return {
          ...match,
          description: cur.curatorialNote || match.description,
          qlooReasoning: cur.curatorialNote || match.qlooReasoning,
        };
      }
      return null;
    }).filter(Boolean) as AgentCulturalEntity[];

    let finalEntities: AgentCulturalEntity[] = [...curatedEntities];
    for (const c of pkg.candidates) {
      if (finalEntities.length >= 6) break;
      if (!finalEntities.some((e) => e.name.toLowerCase() === c.name.toLowerCase())) {
        finalEntities.push(c);
      }
    }
    if (finalEntities.length < 2 && pkg.candidates.length > 0) {
      finalEntities.push(...pkg.candidates.slice(0, 5));
    }

    // CROSS-INQUIRY TOP ENTITY DEDUPLICATION:
    // If finalEntities[0] was already assigned as top in a previous inquiry, swap in an unused entity!
    if (finalEntities.length > 1 && globalAssignedTopEntities.has(finalEntities[0].name.toLowerCase().trim())) {
      const freshIdx = finalEntities.findIndex(
        (e) => !globalAssignedTopEntities.has(e.name.toLowerCase().trim())
      );
      if (freshIdx > 0) {
        const [freshEntity] = finalEntities.splice(freshIdx, 1);
        finalEntities.unshift(freshEntity);
      } else {
        const freshCandidate = pkg.candidates.find(
          (c) => !globalAssignedTopEntities.has(c.name.toLowerCase().trim())
        );
        if (freshCandidate) {
          finalEntities.unshift(freshCandidate);
        }
      }
    }

    const primaryName = finalEntities[0]?.name || pkg.seedName;
    globalAssignedTopEntities.add(primaryName.toLowerCase().trim());

    const sceneText = synthMatch?.sceneAnswer || `Curating for ${profiling.characterName} in ${profiling.constraints.locality || "the city"}: ${primaryName} provides an intentional anchor deduced from their daily routine and craft.`;

    const highlighted = synthMatch?.highlightedEntities ? [...synthMatch.highlightedEntities] : [primaryName];
    if (!highlighted.some((h) => h.toLowerCase() === primaryName.toLowerCase())) {
      highlighted.unshift(primaryName);
    }

    return {
      id: pkg.id,
      question: pkg.question,
      source: pkg.source,
      domain: pkg.domain,
      vignette: sceneText,
      vignetteHighlightEntity: primaryName,
      highlightedEntities: highlighted,
      hasAudio: pkg.domain === "MUSIC",
      audioTrackName: pkg.domain === "MUSIC" ? `${primaryName} — Solitary Frequencies` : undefined,
      entities: finalEntities,
    };
  });

  const culturalDossier = masterSynthesis.dossier;

  console.log(`- Taste Thesis: "${culturalDossier.tasteThesis}"`);
  console.log(`- Observed Clusters: [${culturalDossier.observedClusters.join("; ")}]`);
  if (culturalDossier.unconsideredAngles[0]) {
    console.log(`- Unconsidered Angle: "${culturalDossier.unconsideredAngles[0].title}" -> ${culturalDossier.unconsideredAngles[0].description} (${culturalDossier.unconsideredAngles[0].groundedEntity})`);
  }
  console.log("=======================================================\n");

  agentDecisions.push("Targeted research cycle complete. Master synthesis grounded in Qloo taste graph.");

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
  existingSeeds: string[],
  characterContext?: {
    locality?: string;
    era?: string;
    occupation?: string;
    summary?: string;
  }
): Promise<AgentInquiry> {
  let searchTerms = ["A24", "post-rock", "minimalism"];
  let domain: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" = "MUSIC";
  let extractedQuestion = instruction.endsWith("?") ? instruction : `Exploring: ${instruction}`;

  if (ai) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `Given creator direction / question: "${instruction}" for character "${characterName}" (${characterContext?.summary || ""}) in "${characterContext?.locality || "Unspecified"}".
Accumulated character seeds so far: [${existingSeeds.slice(0, 5).join(", ")}].
Extract 2 specific real-world search terms for Qloo (artists, places, brands, or books).
Respond ONLY in JSON: { "terms": ["term1", "term2"], "question": "A concise inquiry question under 12 words", "domain": "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" }`,
        config: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const parsed = JSON.parse(res.text || "{}");
      if (parsed.terms && parsed.terms.length > 0) searchTerms = parsed.terms;
      if (parsed.domain) domain = parsed.domain;
      if (parsed.question) extractedQuestion = parsed.question;
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

  // If insights returned fewer than 2, include the resolved seed itself
  if (entities.length < 2 && resolved.length > 0) {
    entities.unshift({
      ...normalizeEntity(resolved[0], domain, [characterName]),
      qlooReasoning: `Primary anchor for creator inquiry: "${instruction}".`,
    });
  }

  const constraints = {
    locality: characterContext?.locality,
    era: characterContext?.era,
    occupation: characterContext?.occupation,
  };

  const curatorialResult = await generateCuratorialAnswer(
    characterName,
    extractedQuestion,
    domain,
    entities,
    constraints,
    characterContext?.summary
  );

  const highlight = curatorialResult.highlightedEntities[0] || entities[0]?.name || searchTerms[0];

  return {
    id: `inquiry-${Date.now()}`,
    question: extractedQuestion,
    source: "creator",
    domain,
    vignette: curatorialResult.text,
    vignetteHighlightEntity: highlight,
    highlightedEntities: curatorialResult.highlightedEntities,
    hasAudio: domain === "MUSIC",
    audioTrackName: domain === "MUSIC" ? `${highlight} — Studio Session` : undefined,
    entities,
  };
}

// ---------------- Helper LLM Functions ----------------

async function profileCharacter(prompt: string): Promise<ProfilingResult> {
  const promptWords = prompt.trim().split(/\s+/);
  const firstWord = promptWords[0]?.replace(/[^a-zA-Z]/g, "") || "Character";
  const name = firstWord.length > 1 ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Character";

  const lower = prompt.toLowerCase();
  const detectedLocality = lower.includes("lagos") ? "Lagos" : lower.includes("marseille") ? "Marseille" : lower.includes("nagoya") ? "Nagoya" : lower.includes("berlin") ? "Berlin" : lower.includes("osaka") ? "Osaka" : "Tokyo";
  const detectedOccupation = lower.includes("code") || lower.includes("software") || lower.includes("tech") ? "Systems Developer & Archivist" : lower.includes("architect") ? "Architect" : lower.includes("conservator") ? "Conservator" : "Designer";

  const fallbackResult: ProfilingResult = {
    characterName: name,
    summary: `${name}, a solitary ${detectedOccupation.toLowerCase()} in ${detectedLocality} navigating craft and deliberate everyday rituals.`,
    constraints: {
      locality: detectedLocality,
      era: "Contemporary",
      occupation: detectedOccupation,
    },
    explicitAnchors: ["Solitary lifestyle", `${detectedLocality} workspace`],
    globalSeeds: lower.includes("lagos") ? ["Hiroshi Yoshimura", "Anker", "Norwegian Wood"] : ["Ryuichi Sakamoto", "Tadao Ando", "Hasami porcelain"],
    creatorInquiries: [
      { question: "What tools and everyday objects rest on their worktable?", domain: "OBJECTS", searchSeed: lower.includes("lagos") ? "Anker" : "Hasami porcelain" },
      { question: "What music do they listen to while working late?", domain: "MUSIC", searchSeed: "Hiroshi Yoshimura" },
    ],
    agentInquiries: [
      { question: "Where do they go when they want to be alone?", domain: "PLACES", searchSeed: detectedLocality === "Lagos" ? "Yaba" : "Shinjuku" },
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
   - era: Specify precise temporal setting (e.g. "1970s", "1980s", "1990s", "Contemporary", "Contemporary with 1970s vintage obsession").
   - locality: Main city or district (e.g. "Osaka", "Nagoya", "Marseille", "Berlin", "Tokyo").
   - occupation: Professional craft or role.
4. explicitAnchors: 2-3 concrete facts directly stated in the prompt.
5. creatorInquiries: 1-3 concise questions (<12 words) directly fulfilling what the creator asked (e.g. her worktable tools, his secret bookshelf, 2 AM soundscape, where they walk).
   For EACH inquiry provide:
   - question: concise question title
   - domain: "OBJECTS" | "MUSIC" | "PLACES" | "BOOKS" | "CONTRADICTION"
   - searchSeed: A REAL, HIGH-TASTE CULTURAL ENTITY in Qloo:
     * For tools/industrial design: MUST match their subculture, budget, and physical labor!
       - For gritty, mechanic, DIY, underground, club, or skate characters: use rugged working tools/gear like "Leatherman", "Opinel Knives", "Knipex", "Tajima", "Makita", "Carhartt", "Danner". NEVER give a greasy moped mechanic delicate royal tableware like "Royal Copenhagen"!
       - For monastic, architectural, or clean studio designers: use "Rotring", "Staedtler", "Faber-castell", "Snow Peak", "Anglepoise", "Vitra", "Alessi".
     * For music/soundscapes: use real composers, bands, or ambient artists like "Erik Satie", "Claude Debussy", "Brian Eno", "Hiroshi Yoshimura", "Ryuichi Sakamoto", "Harold Budd", "Boredoms", "Merzbow".
     * For places/haunts: MUST strictly belong to the character's active city/locality! For Osaka: "Shinsekai", "Dotonbori", "Amemura". For Nagoya: "Osu Kannon", "Sakae". For Marseille: "Le Panier", "Noailles". NEVER pick foreign countries or unrelated distant cities!
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

interface AuteurPackageInput {
  id: string;
  question: string;
  domain: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION";
  source: "creator" | "agent";
  seedName: string;
  candidates: AgentCulturalEntity[];
}

interface AuteurSynthesisResult {
  inquiries: {
    id: string;
    sceneAnswer: string;
    highlightedEntities: string[];
    curated: { name: string; curatorialNote: string }[];
  }[];
  dossier: CulturalDossierBrief;
}

/**
 * UNIFIED MASTER AUTEUR WORLD SYNTHESIS:
 * Executes the entire qualitative synthesis (rich narrative scene answers + master cultural dossier)
 * in ONE single cohesive Gemini Flash Lite call.
 *
 * Eliminates 429 rate limit errors (reduces API calls per run from 7 to 1) and ensures cross-domain
 * scene coherence (e.g. music scoring late-night coding while hardware anchors power blackouts).
 */
async function synthesizeAuteurWorld(
  characterName: string,
  userBrief: string,
  characterSummary: string,
  constraints: { locality?: string; era?: string; occupation?: string },
  inquiries: AuteurPackageInput[],
  branchedDiscovery?: string
): Promise<AuteurSynthesisResult> {
  if (!ai) {
    return buildDynamicFallbackSynthesis(characterName, characterSummary, constraints, inquiries, userBrief);
  }

  try {
    const prompt = `You are a Cultural Advisor and Character Consultant for "Poppies", helping creators build authentic characters grounded in Qloo's taste graph.

Character Name: "${characterName}"
User Prompt / Creative Brief:
"""${userBrief}"""
Profile Summary: "${characterSummary}"
Constraints: Locality="${constraints.locality || "Unspecified"}", Era="${constraints.era || "Contemporary"}", Occupation="${constraints.occupation || "Unspecified"}"

DISCOVERED QLOO CULTURAL ANCHORS FOR EACH INQUIRY:
${inquiries.map((inq, i) => `
Inquiry #${i + 1} [ID: ${inq.id}] [Domain: ${inq.domain}] [Source: ${inq.source}]
Question: "${inq.question}"
Starting Seed / Taste Anchor: "${inq.seedName || "Character background"}"
Candidate Entities from Qloo Taste Graph:
${inq.candidates.slice(0, 7).map((c, ci) => `  ${ci + 1}. "${c.name}" (${c.domain}) - Raw context: ${c.description}`).join("\n")}
`).join("\n")}
${branchedDiscovery ? `Autonomous Latent Branch: "${branchedDiscovery}"` : ""}

YOUR TASK:
Synthesize both the inquiry connection writeups and the master cultural dossier in clear, straightforward language.

DELIVERABLE 1: CLEAR, STRAIGHTFORWARD CONNECTION WRITEUP (For EACH Inquiry)
Follow this exact 3-part structure in plain, everyday English (NO high-brow or curator-ish buzzwords like "acoustic architecture", "generative textures", "tactile armor", "phenomenological"):
  1. What type of stuff does ${characterName} usually like, read, or use in daily life? (e.g. books that talk about woodworking joinery and spatial history; repetitive instrumental tracks without vocals to block street noise; durable steel tools built for repairs).
  2. The seed or habit that guided the search (e.g. "Drawing from their interest in [Seed]...").
  3. The Qloo connections with MULTIPLE concrete examples (not just one "winner"): e.g. "...Qloo connects them to options like [Example 1], [Example 2], and [Example 3]."
- Mention AT LEAST 2 to 3 candidate entity names from the list as concrete options.
- Always include the seed name and all candidate names in highlightedEntities so they can be rendered as interactive tags.
- STRICT CROSS-INQUIRY DEDUPLICATION:
  * Each inquiry MUST focus on completely DISTINCT entities.
  * NEVER repeat the same top entity, seed, or primary example across multiple inquiries (e.g. if one section highlights "Hiroshi Yoshimura" or "Staedtler", subsequent sections MUST highlight completely different entities).
  * In the Qloo connections list for each inquiry, do NOT repeat the seed itself as a connection. Connect the seed to other distinct candidate entities (e.g. "Drawing from their interest in [Seed], Qloo connects them to options like [Entity 2], [Entity 3], and [Entity 4]").
- LENGTH: Exactly 1 tight, direct paragraph (2 to 3 sentences, ~40 to 60 words total).

DELIVERABLE 2: MASTER ACTIONABLE CULTURAL DOSSIER
- tasteThesis: 1 to 2 clear, straightforward sentences describing the character's real cultural profile in plain English. No art-critic jargon. (Third-person: "${characterName}...", strictly under 35 words).
- psychologicalWound: 1 plain sentence identifying their core vulnerability or quiet friction.
- tactileArmor: 1 plain sentence explaining what objects or routines they use to feel grounded against daily stress.
- observedClusters: 3-4 simple, authentic subcultural phrases describing their real taste patterns.
- unconsideredAngles: 1 genuine surprise or contradiction that emerged from the cultural graph:
  { "title": string, "description": string (1 plain sentence), "groundedEntity": string }
- highlightedNodes: Array of 3-5 real entity names for quick interactive inspection.

Respond ONLY with valid JSON:
{
  "inquiries": [
    {
      "id": string,
      "sceneAnswer": string,
      "highlightedEntities": string[],
      "curated": [
        { "name": string, "curatorialNote": string }
      ]
    }
  ],
  "dossier": {
    "tasteThesis": string,
    "psychologicalWound": string,
    "tactileArmor": string,
    "observedClusters": string[],
    "unconsideredAngles": [
      { "title": string, "description": string, "groundedEntity": string }
    ],
    "highlightedNodes": string[]
  }
}`;

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(res.text || "{}");
    if (parsed.inquiries && Array.isArray(parsed.inquiries) && parsed.dossier) {
      return {
        inquiries: parsed.inquiries,
        dossier: {
          tasteThesis: parsed.dossier.tasteThesis || "",
          psychologicalWound: parsed.dossier.psychologicalWound || "",
          tactileArmor: parsed.dossier.tactileArmor || "",
          observedClusters: parsed.dossier.observedClusters || [],
          unconsideredAngles: parsed.dossier.unconsideredAngles || [],
          highlightedNodes: parsed.dossier.highlightedNodes || [],
        },
      };
    }
  } catch (err) {
    console.warn("Unified auteur synthesis warning:", err);
  }

  // Dynamic fallback using character constraints and real Qloo discoveries
  return buildDynamicFallbackSynthesis(characterName, characterSummary, constraints, inquiries, userBrief);
}

/**
 * Intelligent, character-specific fallback synthesis.
 * Dynamically uses the character's real name, extracted locality, occupation, and candidate Qloo entities.
 * Returns direct curatorial explanations instead of fiction fanfiction.
 */
function buildDynamicFallbackSynthesis(
  characterName: string,
  summary: string,
  constraints: { locality?: string; era?: string; occupation?: string },
  inquiries: AuteurPackageInput[],
  prompt: string
): AuteurSynthesisResult {
  const loc = constraints.locality || "their neighborhood";
  const occ = constraints.occupation || "creative practice";
  const era = constraints.era || "contemporary";

  const usedFallbackTopEntities = new Set<string>();

  const synthInquiries = inquiries.map((inq) => {
    const seedLower = (inq.seedName || "").toLowerCase().trim();
    // Exclude the seed itself from the connections so it is not repeated twice in prose
    const freshCandidates = inq.candidates.filter(
      (c) => c.name.toLowerCase().trim() !== seedLower && !usedFallbackTopEntities.has(c.name.toLowerCase().trim())
    );
    const candidatePool = freshCandidates.length > 0
      ? freshCandidates
      : inq.candidates.filter((c) => c.name.toLowerCase().trim() !== seedLower);

    const primary = candidatePool[0]?.name || inq.candidates[0]?.name || "Tactile Anchor";
    usedFallbackTopEntities.add(primary.toLowerCase().trim());

    const secondary = candidatePool[1]?.name || inq.candidates[1]?.name || "Field Recordings";
    const tertiary = candidatePool[2]?.name || "";
    const seed = inq.seedName || "their craft";

    let sceneAnswer = "";

    if (inq.domain === "MUSIC") {
      sceneAnswer = tertiary
        ? `During late-night work in ${loc}, ${characterName} usually listens to repetitive instrumental tracks and ambient loops to block out street noise. Grounded in their appreciation for ${seed}, Qloo connects them to artists like ${primary}, ${secondary}, and ${tertiary}.`
        : `During late-night work in ${loc}, ${characterName} usually listens to repetitive instrumental tracks and ambient loops to block out street noise. Grounded in their appreciation for ${seed}, Qloo connects them to artists like ${primary} and ${secondary}.`;
    } else if (inq.domain === "OBJECTS") {
      sceneAnswer = tertiary
        ? `On their worktable, ${characterName} usually uses durable, straightforward tools built to handle daily wear and tear in ${loc}. Building on their affinity for ${seed}, Qloo surfaces practical essentials like ${primary}, ${secondary}, and ${tertiary}.`
        : `On their worktable, ${characterName} usually uses durable, straightforward tools built to handle daily wear and tear in ${loc}. Building on their affinity for ${seed}, Qloo surfaces practical essentials like ${primary} and ${secondary}.`;
    } else if (inq.domain === "BOOKS") {
      sceneAnswer = tertiary
        ? `For reading, ${characterName} usually looks for books that talk about practical spatial layout, material history, and honest craft rather than casual fiction. Starting from their interest in ${seed}, Qloo connects them to titles like ${primary}, ${secondary}, and ${tertiary}.`
        : `For reading, ${characterName} usually looks for books that talk about practical spatial layout, material history, and honest craft rather than casual fiction. Starting from their interest in ${seed}, Qloo connects them to titles like ${primary} and ${secondary}.`;
    } else if (inq.domain === "PLACES") {
      sceneAnswer = tertiary
        ? `When needing a quiet break in ${loc}, ${characterName} usually seeks out low-key, unpretentious spots where they can think without distraction. Guided by ${seed}, Qloo connects them to places like ${primary}, ${secondary}, and ${tertiary}.`
        : `When needing a quiet break in ${loc}, ${characterName} usually seeks out low-key, unpretentious spots where they can think without distraction. Guided by ${seed}, Qloo connects them to places like ${primary} and ${secondary}.`;
    } else {
      sceneAnswer = tertiary
        ? `Outside of work, ${characterName} usually enjoys unpretentious, nostalgic pastimes that contrast with their disciplined daily routine. Branching from ${seed}, Qloo surfaces unexpected favorites like ${primary}, ${secondary}, and ${tertiary}.`
        : `Outside of work, ${characterName} usually enjoys unpretentious, nostalgic pastimes that contrast with their disciplined daily routine. Branching from ${seed}, Qloo surfaces unexpected favorites like ${primary} and ${secondary}.`;
    }

    const baseHighlighted = tertiary ? [primary, secondary, tertiary] : [primary, secondary];
    const highlighted = inq.seedName ? [inq.seedName, ...baseHighlighted] : baseHighlighted;

    return {
      id: inq.id,
      sceneAnswer,
      highlightedEntities: highlighted,
      curated: candidatePool.slice(0, 5).map((c) => ({
        name: c.name,
        curatorialNote: `Selected for ${characterName}'s world as an authentic anchor of ${inq.domain.toLowerCase()}.`,
      })),
    };
  });

  const allTopNames = inquiries.flatMap((i) => i.candidates.slice(0, 2).map((c) => c.name));

  return {
    inquiries: synthInquiries,
    dossier: {
      tasteThesis: `${characterName}'s cultural world is defined by intentional utility in ${loc}. Moving between ${allTopNames.slice(0, 2).join(" and ") || "disciplined anchors"}, their daily rituals prioritize durable, unadorned anchors that insulate their craft.`,
      psychologicalWound: `An underlying struggle to balance solitary creative focus against the unpredictable noise and demands of ${loc}.`,
      tactileArmor: `Relies on trusted tools, physical objects, and specific acoustic atmospheres to erect a quiet boundary against outside interference.`,
      observedClusters: [
        `${loc} Subcultural Focus`,
        `Tactile Utility & Craft`,
        `Solitary Acoustic Isolation`,
      ],
      unconsideredAngles: [
        {
          title: "Protective Boundary",
          description: `The deliberate convergence of specific physical objects and audio textures functions as psychological insulation against external friction.`,
          groundedEntity: allTopNames[0] || "Cultural Anchor",
        },
      ],
      highlightedNodes: allTopNames.slice(0, 4),
    },
  };
}

async function generateCuratorialAnswer(
  characterName: string,
  question: string,
  domain: string,
  candidates: AgentCulturalEntity[],
  constraints: { locality?: string; era?: string; occupation?: string },
  contextSummary?: string
): Promise<{ text: string; highlightedEntities: string[] }> {
  const topNames = candidates.slice(0, 3).map((c) => c.name);
  const primary = topNames[0] || "Cultural Anchor";
  const secondary = topNames[1] || "Deliberate Ritual";
  const tertiary = topNames[2] || "";
  const loc = constraints.locality || "their city";

  const fallbackText = tertiary
    ? `For ${characterName} in ${loc}, answering "${question}" comes down to practical utility. Based on their daily routine, Qloo connects them to options like ${primary}, ${secondary}, and ${tertiary}.`
    : `For ${characterName} in ${loc}, answering "${question}" comes down to practical utility. Based on their daily routine, Qloo connects them to options like ${primary} and ${secondary}.`;

  if (!ai) {
    return { text: fallbackText, highlightedEntities: topNames.slice(0, 3) };
  }

  try {
    const prompt = `You are a Cultural Advisor for "Poppies", helping creators build authentic characters grounded in Qloo's taste graph.

Character: "${characterName}" (${contextSummary || ""})
Constraints: Locality="${loc}", Era="${constraints.era || "Contemporary"}", Occupation="${constraints.occupation || "Unspecified"}"
Inquiry / Question Asked: "${question}"
Domain: ${domain}
Discovered Qloo Entities:
${candidates.slice(0, 6).map((c, i) => `${i + 1}. "${c.name}" - ${c.description}`).join("\n")}

YOUR TASK:
Write a clear, straightforward explanation (exactly 1 focused paragraph, 2-3 sentences, ~40-60 words total) answering what type of stuff ${characterName} likes or uses, the seed that guided it, and the Qloo connections.

Follow this 3-part structure:
1. What type of stuff does ${characterName} usually like, read, or use in daily life in ${loc}?
2. The seed or habit that guided the search (e.g. "Drawing from their interest in [Seed]...").
3. Multiple concrete options from Qloo (e.g. "...Qloo connects them to options like [Example 1], [Example 2], and [Example 3]").

Rules:
1. Speak in plain, everyday English. DO NOT use curator-ish, technical, or high-brow buzzwords (no "acoustic architecture", "generative textures", "tactile armor", "phenomenological").
2. Give MULTIPLE concrete examples from the Qloo results.
3. Include the seed and all mentioned entity names in highlightedEntities so they are tappable tags.
4. Keep it punchy, direct, and under 60 words.

Respond ONLY with valid JSON:
{
  "text": string,
  "highlightedEntities": string[]
}`;

    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(res.text || "{}");
    if (parsed.text) {
      return {
        text: parsed.text.trim(),
        highlightedEntities: parsed.highlightedEntities || topNames.slice(0, 2),
      };
    }
  } catch (e) {
    console.warn("Curatorial answer generation fallback:", e);
  }

  return { text: fallbackText, highlightedEntities: topNames.slice(0, 2) };
}

/**
 * Runs the unconstrained Base LLM research cycle (Gemini Flash Lite without Qloo graph constraints).
 * Used when the user toggles to "Vanilla Base LLM" mode to visibly expose AI monoculture tropes.
 */
export async function runBaseLLMResearchCycle(prompt: string): Promise<AgentDossier> {
  const agentDecisions = [
    "Bypassed Qloo Taste Graph.",
    "Resolving purely via frontier LLM next-token probability (Base AI mode)...",
    "Warning: Susceptible to internet co-occurrence clichés and cultural monoculture.",
  ];

  const profiling = await profileCharacter(prompt);

  if (!ai) {
    return {
      characterName: profiling.characterName,
      summary: profiling.summary,
      constraints: profiling.constraints,
      explicitAnchors: profiling.explicitAnchors,
      resolvedSeeds: [],
      culturalDossier: {
        tasteThesis: `${profiling.characterName}'s aesthetic world is generated directly from base LLM statistical co-occurrence.`,
        observedClusters: ["Generic AI Co-occurrence", "Statistical Internet Mean"],
        unconsideredAngles: [
          {
            title: "AI Monoculture Warning",
            description: "Generated without empirical cultural graph grounding.",
            groundedEntity: "Vanilla LLM",
          },
        ],
        highlightedNodes: ["Vanilla LLM"],
      },
      inquiries: [],
      agentDecisions,
    };
  }

  const baseLLMPrompt = `You are a character designer in Vanilla LLM mode (WITHOUT taste graph grounding).
Character Brief: "${prompt}"
Name: "${profiling.characterName}"
Locality: "${profiling.constraints.locality}", Era: "${profiling.constraints.era}"

Generate 4 inquiry sections:
1. Worktable & Everyday Tools (Domain: OBJECTS, list 3 real brands/items)
2. Music & Soundscape (Domain: MUSIC, list 3 real artists/composers)
3. Secret Bookshelf (Domain: BOOKS, list 2 real books)
4. Night Haunts & Places (Domain: PLACES, list 2 real spots/neighborhoods)

For EACH inquiry, provide:
- question: creative question title
- domain: "OBJECTS" | "MUSIC" | "BOOKS" | "PLACES"
- items: [ { name: string, description: string } ]
- vignette: a 2-sentence scene naturally featuring one of the items.

Respond ONLY in JSON:
{
  "thesis": string,
  "inquiries": [
    {
      "question": string,
      "domain": "OBJECTS" | "MUSIC" | "BOOKS" | "PLACES",
      "items": [ { "name": string, "description": string } ],
      "vignette": string
    }
  ]
}`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: baseLLMPrompt,
      config: { responseMimeType: "application/json", temperature: 0.7 },
    });

    const parsed = JSON.parse(res.text || "{}");
    const inquiries: AgentInquiry[] = (parsed.inquiries || []).map((inq: any, idx: number) => {
      const highlight = inq.items?.[0]?.name || "Generic Artifact";
      return {
        id: `inquiry-base-${idx + 1}`,
        question: inq.question || `Inquiry ${idx + 1}`,
        source: idx < 2 ? "creator" : "agent",
        domain: inq.domain || "OBJECTS",
        vignette: inq.vignette || `${profiling.characterName} reaches for ${highlight}, surrounded by familiar tropes.`,
        vignetteHighlightEntity: highlight,
        hasAudio: inq.domain === "MUSIC",
        audioTrackName: inq.domain === "MUSIC" ? `${highlight} — Probabilistic Stream` : undefined,
        entities: (inq.items || []).map((item: any, iIdx: number) => ({
          id: `base-entity-${idx}-${iIdx}`,
          name: item.name,
          domain: inq.domain,
          description: item.description,
          entityId: `urn:ai:probabilistic:${encodeURIComponent(item.name.toLowerCase().replace(/[^a-z0-9]/g, "_"))}`,
          entityType: `urn:entity:${(inq.domain || "object").toLowerCase()}`,
          affinityScore: 50,
          tags: ["LLM Statistical Mean", "Unverified"],
          seedEntities: ["Frontier LLM Token Prior"],
          qlooReasoning: "Predicted purely from common internet training data without empirical taste graph verification.",
        })),
      };
    });

    return {
      characterName: profiling.characterName,
      summary: profiling.summary,
      constraints: profiling.constraints,
      explicitAnchors: profiling.explicitAnchors,
      resolvedSeeds: [],
      culturalDossier: {
        tasteThesis: parsed.thesis || `${profiling.characterName}'s world is assembled from high-frequency statistical internet tropes.`,
        observedClusters: ["Top 0.1% Internet Co-occurrence", "Predictive Token Frequency"],
        unconsideredAngles: [
          {
            title: "AI Monoculture Warning",
            description: "Base LLM mode lacks empirical graph distance, risking repetitive aesthetic clichés.",
            groundedEntity: "Vanilla Gemini",
          },
        ],
        highlightedNodes: ["Vanilla Gemini"],
      },
      inquiries,
      agentDecisions,
    };
  } catch (err: any) {
    console.error("Base LLM generation error:", err);
    return {
      characterName: profiling.characterName,
      summary: profiling.summary,
      constraints: profiling.constraints,
      explicitAnchors: profiling.explicitAnchors,
      resolvedSeeds: [],
      culturalDossier: {
        tasteThesis: `${profiling.characterName}'s aesthetic profile collapsed into generic tropes.`,
        observedClusters: ["AI Monoculture Trap"],
        unconsideredAngles: [],
        highlightedNodes: [],
      },
      inquiries: [],
      agentDecisions,
    };
  }
}
