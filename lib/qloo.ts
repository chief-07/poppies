// Qloo API Client for Poppies Cultural Engine

const BASE_URL = process.env.QLOO_API_URL || "https://hackathon.api.qloo.com";
const API_KEY = process.env.QLOO_API_KEY || "";

export interface QlooEntity {
  name: string;
  entity_id: string;
  type?: string;
  subtype?: string;
  properties?: {
    image?: { url: string };
    description?: string;
    short_description?: string;
    aliases?: string[];
    [key: string]: any;
  };
  tags?: {
    name?: string;
    type?: string;
    tag_id?: string;
    [key: string]: any;
  }[];
  popularity?: number;
  disambiguation?: string;
  external?: {
    spotify?: { id: string; [key: string]: any }[];
    wikidata?: { id: string }[];
    [key: string]: any;
  };
  query?: {
    affinity?: number;
    measurements?: Record<string, any>;
  };
  affinity?: number;
}

export interface QlooSearchResponse {
  results?: QlooEntity[];
  success?: boolean;
}

export interface QlooInsightsResponse {
  success?: boolean;
  results?: {
    entities?: QlooEntity[];
  };
}

export function getQlooFilterType(domain: string): string {
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

function cleanMojibake(str: string): string {
  if (!str) return "";
  try {
    if (/[\u00C0-\u00FF]/.test(str)) {
      return decodeURIComponent(escape(str));
    }
  } catch (e) {
    // Fallback if escape/decode fails on broken multibyte sequences
  }
  return str
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã¯/g, "ï")
    .replace(/Ã´/g, "ô")
    .replace(/Ã§/g, "ç")
    .replace(/Ã«/g, "ë")
    .replace(/Ã¡/g, "á")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‰/g, "É")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/Å /g, "ō")
    .replace(/Â/g, "");
}

const NON_CULTURAL_REGEX =
  /insurance|cancer center|health system|hospital|medical center|diabetes association|clinic|mutual fund|pharmaceutical|healthcare|workday|automatic data processing|ziprecruiter|staffing|payroll|cloud platform|enterprise software|talent acquisition|\bmd\b|nutrition|supplements|vitamins|wellness center/i;

function isCleanCulturalEntity(e: QlooEntity): boolean {
  const name = e.name || "";
  const desc = e.properties?.description || "";
  return !NON_CULTURAL_REGEX.test(name) && !NON_CULTURAL_REGEX.test(desc);
}

/**
 * Normalizes an entity returned from Qloo so the UI has immediate access to
 * real image CDN URLs, clean descriptions, and computed affinity percentages.
 */
export function normalizeEntity(
  entity: QlooEntity,
  domain: string,
  seedNames: string[] = []
) {
  const entityId = entity.entity_id || "";
  // Check if Qloo provided a direct image URL; otherwise use canonical Qloo CDN format
  const imageUrl =
    entity.properties?.image?.url ||
    (entityId ? `https://images.qloo.com/i/${entityId}-420x-auto.jpg` : undefined);

  // Clean entity name of Goodreads series artifacts like "(Series, #1)" or publisher tags
  let cleanName = cleanMojibake((entity.name || "").trim());
  cleanName = cleanName.replace(/\s*\([^)]*#\d+[^)]*\)/g, "");
  cleanName = cleanName.replace(/\s*\((Vintage|Penguin|Oxford|Classic|Definitive)[^)]*\)/gi, "");
  cleanName = cleanName.trim();

  // Extract raw affinity float (e.g. 0.9639 -> 96%)
  const rawAffinity = entity.query?.affinity ?? entity.affinity ?? 0.88;
  const affinityScore = Math.min(99, Math.max(65, Math.round(rawAffinity * 100)));

  // Extract tags (genres, styles, moods)
  const tags = (entity.tags || [])
    .map((t) => cleanMojibake(t.name || ""))
    .filter((name): name is string => Boolean(name && name.length < 30))
    .slice(0, 5);

  let rawDesc = cleanMojibake(
    entity.properties?.short_description ||
      entity.properties?.description ||
      (tags.length > 0 ? tags.join(" · ") : `${domain} cultural anchor.`)
  );

  // Clean up overlong Goodreads blurb text
  if (rawDesc.length > 200) {
    const periodIdx = rawDesc.indexOf(". ", 80);
    if (periodIdx !== -1 && periodIdx < 220) {
      rawDesc = rawDesc.slice(0, periodIdx + 1);
    } else {
      rawDesc = rawDesc.slice(0, 180).trim() + "…";
    }
  }

  return {
    id: entityId || `entity-${Math.random().toString(36).slice(2, 9)}`,
    name: cleanName || entity.name,
    domain,
    description: rawDesc,
    entityId: entityId ? `urn:qloo:entity:${entityId}` : undefined,
    entityType: entity.type || `urn:entity:${domain.toLowerCase()}`,
    affinityScore,
    imageUrl,
    tags,
    seedEntities: seedNames,
    external: entity.external,
  };
}

/**
 * Searches Qloo for matching cultural entities by name / query string.
 */
export async function searchQloo(query: string, type?: string): Promise<QlooEntity[]> {
  try {
    const params = new URLSearchParams({ query });
    if (type) params.append("type", type);

    const res = await fetch(`${BASE_URL}/search?${params.toString()}`, {
      headers: {
        "X-Api-Key": API_KEY,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Qloo search failed: HTTP ${res.status}`);
      return [];
    }

    const data: QlooSearchResponse = await res.json();
    return (data.results || []).filter(isCleanCulturalEntity);
  } catch (err) {
    console.error("Qloo search network error:", err);
    return [];
  }
}

/**
 * Queries Qloo cross-domain taste insights for seed entity IDs.
 * @param entityIds - Array of seed entity IDs
 * @param filterType - Target domain, e.g. "urn:entity:artist", "urn:entity:book", "urn:entity:brand", "urn:entity:place"
 * @param take - Maximum items to return
 */
export async function getQlooInsights(
  entityIds: string[],
  filterType: string,
  take: number = 8
): Promise<QlooEntity[]> {
  try {
    if (!entityIds.length) return [];

    const params = new URLSearchParams();
    entityIds.forEach((id) => params.append("signal.interests.entities", id));
    params.append("filter.type", filterType);
    params.append("take", String(take));

    const res = await fetch(`${BASE_URL}/v2/insights?${params.toString()}`, {
      headers: {
        "X-Api-Key": API_KEY,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Qloo insights failed: HTTP ${res.status}`);
      return [];
    }

    const data: QlooInsightsResponse = await res.json();
    return (data.results?.entities || []).filter(isCleanCulturalEntity);
  } catch (err) {
    console.error("Qloo insights network error:", err);
    return [];
  }
}
