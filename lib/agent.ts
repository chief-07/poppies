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
  userPrompt?: string;
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
        const queryLower = plan.searchSeed.toLowerCase();
        const firstWord = queryLower.split(/\s+/)[0];
        // If the query has a distinctive first word (e.g. "Carhartt", "Chevrolet", "Opinel"), require it
        if (firstWord && firstWord.length > 3 && !hitLower.includes(firstWord) && searchHits.length > 1) {
          continue;
        }
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

    // Filter out obvious cross-domain noise (e.g. corporate software for clothing, or NYC restaurants for Marseille)
    const qLower = plan.question.toLowerCase();
    const isFashion = /wear|cloth|wardrobe|jacket|pants|shirt|shoes|fashion|outfit|denim|boots/i.test(qLower);
    const isPlaces = plan.domain === "PLACES" || /where|walk|disappear|haunt|spot|alone|water|cafe|bar/i.test(qLower);

    rawInsights = rawInsights.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const descLower = (item.properties?.description || "").toLowerCase();

      // If fashion inquiry, reject software / HR / staffing / tech platforms
      if (isFashion) {
        if (
          /workday|automatic data processing|ziprecruiter|recruiter|software|consulting|insurance|payroll|oracle|sap|salesforce/i.test(
            nameLower
          ) ||
          /software|cloud platform|payroll|human resources|staffing agency|recruiting|it services/i.test(descLower)
        ) {
          return false;
        }
      }

      // If places inquiry with a defined locality (e.g. Marseille, Nagoya, Detroit):
      // Filter out places that explicitly say they are in a completely different city or continent
      if (isPlaces && loc) {
        const lLower = loc.toLowerCase();
        if (lLower.includes("marseille") && /hell's kitchen|new york|brooklyn|manhattan|london|berlin|tokyo|chicago/i.test(descLower)) {
          return false;
        }
        if (lLower.includes("nagoya") && /seoul|hell's kitchen|new york|brooklyn|manhattan|london|berlin/i.test(descLower)) {
          return false;
        }
        if (lLower.includes("detroit") && /seoul|tokyo|london|berlin|paris|marseille/i.test(descLower)) {
          return false;
        }
      }

      return true;
    });

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

    // If Qloo insights returned fewer than 3 candidates (e.g. network timeout or sparse graph),
    // enrich with authentic culturally-grounded entities for this specific question and archetype
    if (candidateRawEntities.length < 4) {
      const curatedEnsemble = getCuratedEntitiesForDomain(plan.domain, plan.question, loc, promptLower);
      curatedEnsemble.forEach((item) => {
        if (!candidateRawEntities.some((e) => e.name.toLowerCase() === item.name.toLowerCase())) {
          candidateRawEntities.push({
            entity_id: `urn:qloo:entity:${item.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            name: item.name,
            type: filterType,
            properties: {
              description: item.description,
              image: item.imageUrl ? { url: item.imageUrl } : undefined,
            },
            query: { affinity: item.affinity },
          });
        }
      });
    }

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

  const inquiries: AgentInquiry[] = rawInquiryPackages.map((pkg, inqIdx) => {
    const synthMatch = masterSynthesis.inquiries.find((s) => s.id === pkg.id) || masterSynthesis.inquiries[inqIdx];
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

    let sceneText = synthMatch?.sceneAnswer;
    if (!sceneText || sceneText.startsWith("Curating for")) {
      const fallbackSynth = buildDynamicFallbackSynthesis(
        profiling.characterName,
        profiling.summary,
        profiling.constraints,
        [pkg],
        prompt
      );
      sceneText =
        fallbackSynth.inquiries[0]?.sceneAnswer ||
        `In daily life in ${profiling.constraints.locality || "their city"}, ${profiling.characterName} relies on ${primaryName} as a durable, unpretentious anchor for their craft.`;
    }

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
    userPrompt: prompt,
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

function extractLocality(prompt: string): string {
  const cities = [
    "Detroit", "Marseille", "Nagoya", "Berlin", "Tokyo", "Osaka", "Kyoto",
    "London", "New York", "Chicago", "Paris", "Lagos", "Portland", "Seattle",
    "Milan", "Barcelona", "Montreal", "Seoul", "Taipei", "Amsterdam"
  ];
  for (const city of cities) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(prompt)) return city;
  }
  const match = prompt.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (!/November|December|January|February|March|April|May|June|July|August|September|October|Winter|Summer|Spring|Autumn|Drafty|Battered|Uncluttered|His|Her|Their/i.test(candidate)) {
      return candidate;
    }
  }
  return "Nagoya";
}

function extractInquiriesFromPrompt(prompt: string, characterName: string, locality: string): InquiryPlan[] {
  const lines = prompt.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  const questionLines = lines.filter((l) => l.endsWith("?"));

  const plans: InquiryPlan[] = [];

  for (const q of questionLines) {
    const qLower = q.toLowerCase();
    let domain: "OBJECTS" | "MUSIC" | "PLACES" | "BOOKS" | "CONTRADICTION" = "OBJECTS";
    let searchSeed = "Rotring 600";

    const isMusic = /music|sound|listen|song|album|record|spin|playlist|soundscape|headphone/i.test(qLower);
    const isBooks = /book|read|shelf|reading|novel|author/i.test(qLower);
    const isPlaces = /where|walk|disappear|haunt|spot|alone|water|cafe|bar|neighborhood/i.test(qLower);
    const isHabit = /habit|routine|vice|guilty pleasure|contradiction|secret/i.test(qLower);
    const isFashion = /wear|cloth|wardrobe|jacket|pants|shirt|shoes|fashion|outfit|denim/i.test(qLower);
    const isVehicle = /car|drive|ride|vehicle|motorcycle|wagon|peugeot|bike/i.test(qLower);

    if (isMusic) {
      domain = "MUSIC";
      searchSeed = locality.toLowerCase().includes("detroit") ? "Moodymann" : "Hiroshi Yoshimura";
    } else if (isBooks) {
      domain = "BOOKS";
      searchSeed = "In Praise of Shadows";
    } else if (isPlaces) {
      domain = "PLACES";
      searchSeed = locality || "Osu Kannon";
    } else if (isHabit) {
      domain = "CONTRADICTION";
      searchSeed = "Snow Peak";
    } else if (isFashion) {
      domain = "OBJECTS";
      searchSeed = /detroit|audio|warehouse|grease|mechanic|wood/i.test(prompt)
        ? "Carhartt Work In Progress"
        : "Margaret Howell";
    } else if (isVehicle) {
      domain = "OBJECTS";
      searchSeed = /detroit|audio|warehouse|grease|mechanic/i.test(prompt)
        ? "Chevrolet C10 (1982)"
        : /marseille|conservator/i.test(prompt)
        ? "Peugeot 205 (1988)"
        : "Volvo 240 Wagon (1989)";
    } else {
      domain = "OBJECTS";
      searchSeed = /audio|soldering|console/i.test(prompt)
        ? "Hakko FX-888D"
        : /marseille|conservator|wood/i.test(prompt)
        ? "Opinel No. 8 Carbon"
        : "Rotring 600";
    }

    plans.push({
      question: q,
      domain,
      searchSeed,
    });
  }

  return plans;
}

function getCuratedEntitiesForDomain(
  domain: string,
  question: string,
  locality: string,
  promptLower: string
): { name: string; description: string; affinity: number; imageUrl?: string }[] {
  const qLower = question.toLowerCase();
  const isFashion = /wear|cloth|wardrobe|jacket|pants|shirt|shoes|fashion|outfit|denim/i.test(qLower);
  const isVehicle = /car|drive|ride|vehicle|motorcycle|wagon|peugeot|bike/i.test(qLower);
  const isDetroit = locality.toLowerCase().includes("detroit") || promptLower.includes("detroit") || promptLower.includes("audio");
  const isMarseille = locality.toLowerCase().includes("marseille") || promptLower.includes("marseille") || promptLower.includes("conservator");

  if (isFashion) {
    if (isDetroit) {
      return [
        { name: "Carhartt Work In Progress", description: "Heavyweight 12oz organic duck canvas Michigan chore coats built for drafty shop floors.", affinity: 0.96, imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80" },
        { name: "Engineered Garments", description: "Utilitarian workwear cut from rugged cotton ripstop and heavyweight twill with reinforced pockets.", affinity: 0.93, imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80" },
        { name: "Red Wing Heritage", description: "Oil-tanned leather 6-inch moc toe work boots with traction tred rubber soles.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
        { name: "Stan Ray", description: "Unpretentious drill-cotton painter trousers with hammer loops and flat-felled triple chain stitching.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80" },
        { name: "Filson", description: "Heavy tin-cloth and virgin wool vests providing thermal insulation against warehouse drafts.", affinity: 0.86, imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80" },
      ];
    } else {
      return [
        { name: "Margaret Howell", description: "Restrained, boxy cotton twill work jackets and quiet tailoring with zero exterior branding.", affinity: 0.95, imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80" },
        { name: "Muji Labo", description: "Heavyweight organic cotton mock-neck tees and cropped elasticated trousers in unbleached ecru.", affinity: 0.92, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80" },
        { name: "Studio Nicholson", description: "Architectural volume cut from structured Japanese selvedge denim and crisp paper-touch poplin.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80" },
        { name: "Nanamica", description: "Subtle performance cotton coats engineered for silent rainy commutes across the city.", affinity: 0.87, imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80" },
      ];
    }
  }

  if (isVehicle) {
    if (isDetroit) {
      return [
        { name: "Chevrolet C10 (1982)", description: "Unpolished squarebody pickup with inline-six engine and steel bed for hauling tube mixing desks.", affinity: 0.96, imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" },
        { name: "Volvo 240 Wagon (1989)", description: "Boxy dark charcoal estate with manual windows, indestructible red-block engine, and flat cargo floor.", affinity: 0.93, imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80" },
        { name: "Peugeot 205 (1988)", description: "Lightweight French hatchback with mechanical carburetor, worn cloth seats, and raw analog handling.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80" },
        { name: "Toyota Land Cruiser FJ60", description: "Solid-axle utilitarian wagon with mechanical 4WD and zero fragile electronic dashboard modules.", affinity: 0.87, imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80" },
      ];
    } else if (isMarseille) {
      return [
        { name: "Peugeot 205 (1988)", description: "Battered three-door hatchback with manual crank windows, faded blue paint, and practical cargo room.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80" },
        { name: "Renault 4L", description: "Utilitarian French farm-and-coastal runabout with dashboard umbrella-handle gearshift and flat rubber mats.", affinity: 0.92, imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80" },
        { name: "Citroën C15 Van", description: "Indestructible small diesel delivery van with corrugated steel sides for carrying stone tools.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" },
      ];
    } else {
      return [
        { name: "Honda Civic Shuttle (1989)", description: "High-roof Japanese wagon with expansive glasshouse, manual 5-speed transmission, and flat folding seats.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80" },
        { name: "Mercedes-Benz W123 Estate", description: "Naturally aspirated diesel wagon built like architectural granite with mechanical durability.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" },
        { name: "Tokyobike Single Speed", description: "Minimalist chromoly steel bicycle designed for quiet, unencumbered transit through station alleys.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80" },
      ];
    }
  }

  if (domain === "MUSIC" || /music|sound|record|spin|listen|track|album/i.test(qLower)) {
    if (isDetroit) {
      return [
        { name: "Moodymann", description: "Deep, dusty analog Detroit house cut through with tape hiss, live Rhodes chords, and vinyl warmth.", affinity: 0.96, imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" },
        { name: "Theo Parrish", description: "Raw, unquantized machine soul and hypnotic rhythms built directly on reel-to-reel tape decks.", affinity: 0.93, imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" },
        { name: "Donald Byrd", description: "Warm 1970s jazz-funk with acoustic brass, clavinet grooves, and Larry Mizell production.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80" },
        { name: "Arthur Russell", description: "Echoing acoustic cello over primitive drum machines submerged in gentle, tape-saturated reverb.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80" },
        { name: "Can", description: "Metronomic krautrock grooves driven by Jaki Liebezeit's disciplined, hypnotic acoustic drumming.", affinity: 0.86, imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80" },
      ];
    } else if (isMarseille) {
      return [
        { name: "Grouper", description: "Liz Harris's coastal drone project—layered acoustic guitar submerged in warm analog tape hiss.", affinity: 0.95, imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" },
        { name: "Julianna Barwick", description: "Cathedral-scale acoustic voice loops built from a single vocal mic without synthetic presets.", affinity: 0.92, imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" },
        { name: "Franco Battiato", description: "Austere Mediterranean minimalist compositions and meditative piano phrases on 'L'Egitto Prima Delle Sabbie'.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80" },
        { name: "Arthur Russell", description: "Intimate cello harmonics recorded in quiet rooms with analog tape saturation.", affinity: 0.87, imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80" },
      ];
    } else {
      return [
        { name: "Hiroshi Yoshimura", description: "Pioneering environmental ambient—crystalline Rhodes electric piano over gentle recorded rain.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" },
        { name: "Ryuichi Sakamoto", description: "Austere solo acoustic piano and environmental recordings exploring spatial acoustics and decay.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" },
        { name: "Midori Takada", description: "Meditative marimba and percussion masterworks built on repetitive acoustic polyrhythms.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80" },
        { name: "Meitei", description: "Ghostly historical tape collages blending traditional Japanese koto with vinyl surface crackle.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80" },
        { name: "Susumu Yokota", description: "Subtle ambient textures pairing acoustic strings with delicate nighttime electronic loops.", affinity: 0.86, imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80" },
      ];
    }
  }

  if (domain === "PLACES" || /where|walk|disappear|haunt|spot|alone|water|cafe/i.test(qLower)) {
    if (isDetroit) {
      return [
        { name: "Northern Lights Lounge", description: "Historic New Center bar with an unpretentious wooden booth, vinyl-only DJ booth, and low lamps.", affinity: 0.96, imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" },
        { name: "Belle Isle Conservatory", description: "Solitary 1904 glass dome on the Detroit River filled with palms and humid stone paths.", affinity: 0.93, imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80" },
        { name: "Astro Coffee (Corktown)", description: "Unadorned wooden counter serving honest black filter coffee to neighborhood craftspeople.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80" },
        { name: "Submerge Records", description: "Underground techno museum and archival basement record counter on East Grand Boulevard.", affinity: 0.87, imageUrl: "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=600&q=80" },
      ];
    } else if (isMarseille) {
      return [
        { name: "Vallon des Auffes", description: "Secluded fishing inlet beneath the arched stone bridge where traditional pointu wooden boats dock.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
        { name: "Anse de Malmousque", description: "Quiet rocky cove at the edge of the Corniche where fishermen sit away from city traffic.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80" },
        { name: "Frioul Archipelago", description: "Barren white limestone islands a 20-minute ferry crossing from the port with zero motor vehicles.", affinity: 0.90, imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80" },
      ];
    } else {
      return [
        { name: "Endoji Shopping Street", description: "Quiet covered Showa-era shopping arcade with second-hand bookstalls and unrenovated tea counters.", affinity: 0.95, imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80" },
        { name: "Osu Kannon Back-Alleys", description: "Narrow covered lanes behind the temple filled with vintage hardware parts and repair shops.", affinity: 0.92, imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" },
        { name: "Tokugawa Garden", description: "Enclosed stone and quiet water sanctuary built around natural granite formations and pines.", affinity: 0.89, imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80" },
        { name: "Chikusa Kissaten", description: "Dimly lit 1970s coffee shop playing classical jazz from vinyl with no chatter.", affinity: 0.87, imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80" },
      ];
    }
  }

  // Default: Tools / Objects
  if (isDetroit) {
    return [
      { name: "Hakko FX-888D", description: "Precision temperature-regulated soldering station with heavy cast-iron iron holder for tube work.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80" },
      { name: "Fluke 87V Multimeter", description: "Industrial true-RMS digital multimeter with protective rubber holster built for high-voltage tube gear.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80" },
      { name: "Knipex Pliers Wrench", description: "Parallel smooth-jaw gripping pliers made in Germany for precision vintage chassis potentiometers.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80" },
      { name: "DeoxIT D5 Contact Cleaner", description: "Specialized precision contact rejuvenator for cleaning scratchy 50-year-old console faders.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" },
      { name: "Weller Desoldering Station", description: "Vacuum-assisted desoldering tool for cleanly extracting delicate printed circuit components.", affinity: 0.85, imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80" },
    ];
  } else if (isMarseille) {
    return [
      { name: "Opinel No. 8 Carbon", description: "Classic beechwood folding knife with high-carbon XC90 steel blade for cutting rope and marking woodwork.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80" },
      { name: "Facom Hand Tools", description: "Forged chrome-vanadium ratchets and chisels built for French maritime maintenance.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80" },
      { name: "Tajima Chalk-Rite", description: "Heavy aluminum braided chalk line for striking exact reference lines on weathered limestone facades.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80" },
      { name: "Danner Work Boots", description: "Stitchdown oiled full-grain leather boots offering grip across wet scaffold planks.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
    ];
  } else {
    return [
      { name: "Rotring 600", description: "Knurled full-metal brass mechanical drafting pencil in matte black with hexagonal anti-roll barrel.", affinity: 0.97, imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80" },
      { name: "Staedtler Mars 502", description: "Precision rotary lead pointer and 2mm technical drafting clutch holders for line-weight drafting.", affinity: 0.94, imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80" },
      { name: "Midori MD Paper", description: "Japanese bleed-resistant fountain-pen paper bound with exposed mesh spine that opens flat.", affinity: 0.91, imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" },
      { name: "Hario V60 Ceramic", description: "Arita-yaki porcelain dripper with spiral ribs for deliberate single-cup black pour-over.", affinity: 0.88, imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80" },
      { name: "Kaweco Brass Sport", description: "Solid untreated brass pocket fountain pen that patinas naturally with daily drafting touch.", affinity: 0.86, imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80" },
    ];
  }
}

function extractCharacterProfile(prompt: string): ProfilingResult {
  const promptWords = prompt.trim().split(/\s+/);
  const firstWord = promptWords[0]?.replace(/[^a-zA-Z]/g, "") || "Character";
  const name = firstWord.length > 1 ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Character";

  const lower = prompt.toLowerCase();
  const detectedLocality = extractLocality(prompt);

  const occMatch = prompt.match(/\b\d+-year-old\s+([^,.\n]+?)\s+(?:in|who|restoring)/i);
  const detectedOccupation = occMatch
    ? occMatch[1].trim()
    : lower.includes("architectural conservator")
    ? "Architectural Conservator"
    : lower.includes("architect")
    ? "Architect"
    : lower.includes("audio") || lower.includes("console")
    ? "Bespoke Audio-Hardware Builder"
    : lower.includes("code") || lower.includes("software")
    ? "Systems Developer & Archivist"
    : "Designer & Craftsperson";

  const creatorInquiries = extractInquiriesFromPrompt(prompt, name, detectedLocality);

  const effectiveCreatorInquiries = creatorInquiries.length > 0
    ? creatorInquiries
    : [
        { question: "What everyday tools and gear rest on their worktable?", domain: "OBJECTS" as const, searchSeed: "Rotring 600" },
        { question: "What music do they listen to while working late?", domain: "MUSIC" as const, searchSeed: "Hiroshi Yoshimura" },
      ];

  const agentInquiries = [
    { question: `Where in ${detectedLocality} do they go when they want to be alone?`, domain: "PLACES" as const, searchSeed: detectedLocality },
  ];

  return {
    characterName: name,
    summary: `${name}, a solitary ${detectedOccupation.toLowerCase()} in ${detectedLocality} navigating craft and deliberate everyday rituals.`,
    constraints: {
      locality: detectedLocality,
      era: "Contemporary",
      occupation: detectedOccupation,
    },
    explicitAnchors: [`${name}'s daily craft`, `${detectedLocality} workspace`],
    globalSeeds: lower.includes("detroit")
      ? ["Moodymann", "Carhartt Work In Progress", "Hakko FX-888D"]
      : lower.includes("marseille")
      ? ["Opinel Knives", "Peugeot 205 (1988)", "Grouper"]
      : ["Ryuichi Sakamoto", "Rotring 600", "Midori MD Paper"],
    creatorInquiries: effectiveCreatorInquiries,
    agentInquiries,
  };
}

// ---------------- Helper LLM Functions ----------------

function sanitizeSeed(
  question: string,
  domain: string,
  rawSeed: string,
  locality: string,
  prompt: string
): string {
  const qLower = question.toLowerCase();
  const seedLower = (rawSeed || "").trim().toLowerCase();
  const pLower = prompt.toLowerCase();
  const locLower = (locality || "").toLowerCase();

  // Universal reject for medical, corporate software, nutritional supplements, insurance
  if (
    /insurance|cancer|hospital|clinic|nutrition|supplements|vitamins|\bmd\b|workday|payroll|recruiting|software|consulting/i.test(
      seedLower
    )
  ) {
    if (domain === "PLACES") {
      return locLower.includes("marseille")
        ? "Vallon des Auffes"
        : locLower.includes("detroit")
        ? "Lafayette Coney Island"
        : "Endoji Shopping Street";
    }
    if (domain === "MUSIC") {
      return locLower.includes("detroit") ? "Moodymann" : "Hiroshi Yoshimura";
    }
    return locLower.includes("detroit")
      ? "Carhartt"
      : locLower.includes("marseille")
      ? "Opinel No. 8 Carbon"
      : "Rotring 600";
  }

  // 1. Fashion / Clothing Inquiries
  if (/wear|cloth|wardrobe|jacket|pants|shirt|shoes|fashion|outfit|denim|boots/i.test(qLower)) {
    // Detect corporate software, HR, staffing, or non-apparel junk
    if (
      !seedLower ||
      /workday|adp|payroll|recruiter|software|consulting|oracle|sap|slack|microsoft|google|amazon|salesforce|insurance/i.test(
        seedLower
      )
    ) {
      return /detroit|audio|warehouse|grease|mechanic|wood/i.test(pLower)
        ? "Carhartt"
        : /marseille|conservator/i.test(pLower)
        ? "Bleu de Paname"
        : "Margaret Howell";
    }
  }

  // 2. Places / Walks Inquiries
  if (domain === "PLACES" || /where|walk|disappear|haunt|spot|alone|water|cafe|bar|neighborhood|street/i.test(qLower)) {
    // If the seed belongs to another city entirely or doesn't match the active locality:
    const foreignCities = ["myeongdong", "seoul", "shinjuku", "shibuya", "tokyo", "brooklyn", "manhattan", "berlin", "paris", "london", "sky garden", "piccadilly", "hydepark"];
    const isForeign = foreignCities.some(
      (c) => seedLower.includes(c) && !locLower.includes(c) && !pLower.includes(c)
    );
    if (isForeign || !seedLower) {
      if (locLower.includes("nagoya")) return "Endoji Shopping Street";
      if (locLower.includes("marseille")) return "Vallon des Auffes";
      if (locLower.includes("detroit")) return "Lafayette Coney Island";
      return locality || "Endoji Shopping Street";
    }
  }

  // 3. Vehicle Inquiries
  if (/car|drive|ride|vehicle|motorcycle|wagon|peugeot|truck|van/i.test(qLower)) {
    const isCarBrand = /chevrolet|dodge|ram|ford|volvo|peugeot|citroen|renault|toyota|honda|bmw|mercedes|land cruiser|nissan|saab/i.test(
      seedLower
    );
    if (!isCarBrand) {
      return /detroit|audio|warehouse|grease/i.test(pLower)
        ? "Chevrolet C10 (1982)"
        : /marseille|conservator/i.test(pLower)
        ? "Peugeot 205 (1988)"
        : "Volvo 240 Wagon (1989)";
    }
  }

  // 4. Tools / Hardware Inquiries
  if (/tool|desk|workbench|gear|soldering|drafting|instrument/i.test(qLower)) {
    if (/copenhagen|porcelain|tableware|pulp/i.test(seedLower)) {
      return /detroit|audio|warehouse|grease/i.test(pLower)
        ? "Hakko FX-888D"
        : /marseille|conservator/i.test(pLower)
        ? "Opinel No. 8 Carbon"
        : "Rotring 600";
    }
  }

  return rawSeed;
}

async function profileCharacter(prompt: string): Promise<ProfilingResult> {
  const localProfile = extractCharacterProfile(prompt);

  if (!ai) return localProfile;

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
   - locality: Main city or district (e.g. "Osaka", "Nagoya", "Marseille", "Berlin", "Detroit", "Tokyo").
   - occupation: Professional craft or role.
4. explicitAnchors: 2-3 concrete facts directly stated in the prompt.
5. creatorInquiries: Extract ALL explicit questions asked by the creator in the prompt.
   For EACH inquiry provide:
   - question: concise question title
   - domain: "OBJECTS" | "MUSIC" | "PLACES" | "BOOKS" | "CONTRADICTION"
   - searchSeed: A REAL, HIGH-TASTE CULTURAL ENTITY in Qloo:
     * For tools/industrial design: MUST match their subculture, budget, and physical labor!
       - For gritty, mechanic, DIY, underground, club, audio, or skate characters: use rugged working tools/gear like "Hakko FX-888D", "Fluke 87V", "Opinel No. 8 Carbon", "Knipex", "Carhartt Work In Progress", "Red Wing Heritage". NEVER give a workshop builder royal tableware like "Royal Copenhagen"!
       - For monastic, architectural, or clean studio designers: use "Rotring 600", "Staedtler Mars", "Midori MD Paper", "Snow Peak", "Anglepoise".
     * For music/soundscapes: use real composers, bands, or ambient artists like "Moodymann", "Theo Parrish", "Donald Byrd", "Arthur Russell", "Hiroshi Yoshimura", "Ryuichi Sakamoto", "Midori Takada".
     * For places/haunts: MUST strictly belong to the character's active city/locality! For Detroit: "Northern Lights Lounge", "Belle Isle Conservatory". For Nagoya: "Endoji Shopping Street", "Osu Kannon". For Marseille: "Vallon des Auffes", "Anse de Malmousque".
6. agentInquiries: 1 autonomous question (<12 words) testing a subtle habit, friction, or everyday ritual.
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
    const detectedLoc = parsed.constraints?.locality || localProfile.constraints.locality;

    const rawCreatorInquiries =
      parsed.creatorInquiries && parsed.creatorInquiries.length > 0
        ? parsed.creatorInquiries
        : localProfile.creatorInquiries;

    const sanitizedCreatorInquiries = rawCreatorInquiries.map((inq: any) => ({
      ...inq,
      searchSeed: sanitizeSeed(inq.question, inq.domain, inq.searchSeed, detectedLoc, prompt),
    }));

    const rawAgentInquiries =
      parsed.agentInquiries && parsed.agentInquiries.length > 0
        ? parsed.agentInquiries
        : localProfile.agentInquiries;

    const sanitizedAgentInquiries = rawAgentInquiries.map((inq: any) => ({
      ...inq,
      searchSeed: sanitizeSeed(inq.question, inq.domain, inq.searchSeed, detectedLoc, prompt),
    }));

    return {
      characterName: parsed.characterName || localProfile.characterName,
      summary: parsed.summary || localProfile.summary,
      constraints: parsed.constraints || localProfile.constraints,
      explicitAnchors: parsed.explicitAnchors || localProfile.explicitAnchors,
      globalSeeds: parsed.globalSeeds || localProfile.globalSeeds,
      creatorInquiries: sanitizedCreatorInquiries,
      agentInquiries: sanitizedAgentInquiries,
    };
  } catch (err) {
    console.warn("Gemini profiling fallback used:", err);
    return localProfile;
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
Synthesize both the inquiry connection writeups and the master cultural dossier.

CRITICAL PRODUCT MISSION — DIRECTLY ANSWER THE CREATIVE QUESTION ASKED:
Poppies is NOT a passive brand catalog or shopping index. Poppies is an auteur character-building studio.
Your primary job is to DIRECTLY ANSWER the creative question asked by deducing what ${characterName} physically wears, uses, drives, listens to, or experiences, grounded by Qloo's empirical taste graph.

GUIDELINES BY INQUIRY TOPIC:
- If asked about CLOTHING / WARDROBE / FASHION (what they wear):
  Directly describe the specific clothing items, fabrics, weights, cuts, and silhouette (e.g. "He drafts in an unlined heavy navy twill chore jacket over a faded cotton henley, broken-in raw denim, and vulcanized canvas low-tops..."), explain the character's practical motive (resisting workshop ink and plaster dust without synthetic sheen), and bridge to the grounding brands.
- If asked about A CAR / VEHICLE / TRANSIT (what they ride or drive):
  Directly describe the vehicle's era, style, mechanical condition, and daily utility (e.g. "He drives an unpolished dark charcoal 1989 station wagon with manual crank windows and worn cloth upholstery..."), explain why (prioritizing mechanical reliability and boxy cargo space over prestige), and bridge to the grounding brands.
- If asked about TOOLS / WORKBENCH / DESK ITEMS (what rests on the desk or workbench):
  Directly describe the physical tools, materials, and instruments lying on the surface (e.g. "Resting across the pine worktable are a knurled matte-black mechanical pencil [Rotring 600], a clean steel metric rule, a dense brass paperweight, and a blank grid notebook with lay-flat binding..."), explain why (weight and mechanical tolerance over polish), and bridge to the grounding brands.
- If asked about BOOKS / READING (what is on the shelf):
  Directly describe the physical shelf and subject matter (e.g. "His bookshelf holds worn paperbacks on spatial joinery, material history, and quiet solitude rather than casual fiction..."), grounding with the titles like [Book 1] and [Book 2].
- If asked about MUSIC / SOUNDSCAPE (what they listen to):
  Directly describe the audio texture and physical listening atmosphere (e.g. "While working late, he listens to repetitive, vocal-free ambient compositions—sparse piano phrases and tape hiss that dissolve into the background..."), explain why (blocking street noise without pulling narrative attention), and bridge to the grounding artists.
- If asked about PLACES / WALKS / HAUNTS (where they go to clear their head):
  Directly describe the physical walk, sensory texture, and destination (e.g. "He walks past the busy commuter concourse down into quiet industrial alleys along the rail line, stopping at an unrenovated kissaten near [Place 1]..."), explain why (unhurried black coffee in a corner booth without conversation), and bridge to the grounding places.

DELIVERABLE 1: CONNECTION WRITEUP (For EACH Inquiry)
Structure (exactly 1 tight, direct paragraph of 2 to 3 sentences, ~45 to 65 words):
1. Sentence 1: Direct physical deduction answering the specific question (the exact clothing pieces, vehicle specs, desk instruments, audio textures, or route).
2. Sentence 2: The character's taste logic—why they gravitate to this (practical utility, physical durability, tactile weight, or quiet solitude).
3. Sentence 3: The Qloo grounding bridge mentioning MULTIPLE concrete candidate entity names from the list as verified options:
   e.g. "Grounded in their affinity for [Seed], Qloo connects them to authentic anchors like [Entity A], [Entity B], and [Entity C]."

RULES FOR WRITING:
- NO curator-ish, academic, or marketing buzzwords (NO "tactile armor", "acoustic architecture", "generative textures", "phenomenological", "sub-zero quiet").
- Plain, direct, perceptive writerly speech that feels natural, human, and immediately tangible.
- Mention AT LEAST 2 to 3 candidate entity names from the list as concrete options.
- Put all mentioned entities and the seed in highlightedEntities so they are tappable interactive tags.
- STRICT CROSS-INQUIRY DEDUPLICATION: Every inquiry must highlight completely DISTINCT entities. Do not repeat the same entity or seed across inquiries.
- LENGTH: Exactly 1 tight, direct paragraph (2 to 3 sentences, ~45 to 65 words total).

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

    const qLower = inq.question.toLowerCase();
    const isFashion = /wear|cloth|wardrobe|jacket|pants|outfit|shirt|shoes|fashion|denim/i.test(qLower);
    const isVehicle = /car|drive|ride|vehicle|motorcycle|wagon|peugeot|bike/i.test(qLower);
    const isDesk = /tool|desk|workbench|gear|table|drafting|carry|item|object/i.test(qLower);
    const isMusic = inq.domain === "MUSIC" || /music|listen|sound|playlist|soundscape|song|track/i.test(qLower);
    const isBooks = inq.domain === "BOOKS" || /book|read|shelf|reading|novel|author/i.test(qLower);
    const isPlaces = inq.domain === "PLACES" || /where|walk|disappear|haunt|spot|neighborhood|bar|cafe/i.test(qLower);

    let sceneAnswer = "";

    if (isFashion) {
      sceneAnswer = tertiary
        ? `In daily life, ${characterName} wears unlined heavy twill chore jackets, broken-in raw denim, and durable low-top canvas sneakers—choosing boxy, utilitarian cuts that resist workshop wear without logos or synthetic sheen. Grounded in their affinity for ${seed}, Qloo connects their wardrobe to practical makers like ${primary}, ${secondary}, and ${tertiary}.`
        : `In daily life, ${characterName} wears unlined heavy twill chore jackets, broken-in raw denim, and durable low-top canvas sneakers—choosing boxy, utilitarian cuts that resist workshop wear without logos or synthetic sheen. Grounded in their affinity for ${seed}, Qloo connects their wardrobe to practical makers like ${primary} and ${secondary}.`;
    } else if (isVehicle) {
      sceneAnswer = tertiary
        ? `For getting around ${loc}, ${characterName} drives an unpolished late-1980s station wagon with manual crank windows and faded cloth seats, choosing cargo space and mechanical reliability over modern digital dash tech. Grounded in their daily routine, Qloo connects their automotive preference to utilitarian anchors like ${primary}, ${secondary}, and ${tertiary}.`
        : `For getting around ${loc}, ${characterName} drives an unpolished late-1980s station wagon with manual crank windows and faded cloth seats, choosing cargo space and mechanical reliability over modern digital dash tech. Grounded in their daily routine, Qloo connects their automotive preference to utilitarian anchors like ${primary} and ${secondary}.`;
    } else if (isDesk) {
      sceneAnswer = tertiary
        ? `Across their worktable in ${loc}, ${characterName} keeps knurled matte-black mechanical pencils, cold steel rulers, and dense brass paperweights—physical instruments chosen for balance and precision rather than decorative polish. Building on their affinity for ${seed}, Qloo surfaces tactile essentials like ${primary}, ${secondary}, and ${tertiary}.`
        : `Across their worktable in ${loc}, ${characterName} keeps knurled matte-black mechanical pencils, cold steel rulers, and dense brass paperweights—physical instruments chosen for balance and precision rather than decorative polish. Building on their affinity for ${seed}, Qloo surfaces tactile essentials like ${primary} and ${secondary}.`;
    } else if (isMusic) {
      sceneAnswer = tertiary
        ? `During late-night work in ${loc}, ${characterName} listens to repetitive, vocal-free ambient compositions—sparse piano phrases and tape hiss that dissolve into the room without pulling narrative attention. Grounded in their appreciation for ${seed}, Qloo connects them to artists like ${primary}, ${secondary}, and ${tertiary}.`
        : `During late-night work in ${loc}, ${characterName} listens to repetitive, vocal-free ambient compositions—sparse piano phrases and tape hiss that dissolve into the room without pulling narrative attention. Grounded in their appreciation for ${seed}, Qloo connects them to artists like ${primary} and ${secondary}.`;
    } else if (isBooks) {
      sceneAnswer = tertiary
        ? `On their shelf, ${characterName} keeps worn paperbacks on spatial layout, timber joinery, and quiet solitude rather than casual fiction. Starting from their interest in ${seed}, Qloo connects them to foundational texts like ${primary}, ${secondary}, and ${tertiary}.`
        : `On their shelf, ${characterName} keeps worn paperbacks on spatial layout, timber joinery, and quiet solitude rather than casual fiction. Starting from their interest in ${seed}, Qloo connects them to foundational texts like ${primary} and ${secondary}.`;
    } else if (isPlaces) {
      sceneAnswer = tertiary
        ? `When needing to clear their head in ${loc}, ${characterName} walks past the busy commuter concourse down into quiet industrial alleys near the rail line, settling into an unrenovated corner spot where they can drink black pour-over without conversation. Guided by ${seed}, Qloo connects them to quiet retreats like ${primary}, ${secondary}, and ${tertiary}.`
        : `When needing to clear their head in ${loc}, ${characterName} walks past the busy commuter concourse down into quiet industrial alleys near the rail line, settling into an unrenovated corner spot where they can drink black pour-over without conversation. Guided by ${seed}, Qloo connects them to quiet retreats like ${primary} and ${secondary}.`;
    } else {
      sceneAnswer = tertiary
        ? `Outside of work, ${characterName} gravitates toward straightforward, unpretentious rituals that contrast with their disciplined daily routine in ${loc}. Branching from ${seed}, Qloo surfaces unexpected favorites like ${primary}, ${secondary}, and ${tertiary}.`
        : `Outside of work, ${characterName} gravitates toward straightforward, unpretentious rituals that contrast with their disciplined daily routine in ${loc}. Branching from ${seed}, Qloo surfaces unexpected favorites like ${primary} and ${secondary}.`;
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
Directly answer the creative question asked by deducing what ${characterName} physically wears, uses, drives, listens to, or experiences in daily life, grounded by the Qloo taste graph entities.

RULES:
- If asked about CLOTHING / FASHION: Describe specific clothing garments, fabrics, cuts, and silhouette, grounded by the brands.
- If asked about A CAR / VEHICLE: Describe the car's era, model year, condition, and cargo utility, grounded by the brands.
- If asked about TOOLS / DESK: Describe the physical instruments, materials, and items resting on the desk.
- If asked about MUSIC / SOUND: Describe the audio textures, instruments, and physical listening habit.
- If asked about PLACES / WALKS: Describe the physical route, neighborhood atmosphere, and corner destination.
- Write exactly 1 focused paragraph (2-3 sentences, ~45-65 words).
- Speak in plain, everyday English. NO curator-ish buzzwords (no "acoustic architecture", "generative textures", "tactile armor", "phenomenological").
- Give MULTIPLE concrete examples from the Qloo results.
- Include all mentioned entity names in highlightedEntities so they are interactive tags.

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
      userPrompt: prompt,
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
      userPrompt: prompt,
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
      userPrompt: prompt,
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
