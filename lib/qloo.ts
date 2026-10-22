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

  // Extract raw affinity float (e.g. 0.9639 -> 96%)
  const rawAffinity = entity.query?.affinity ?? entity.affinity ?? 0.88;
  const affinityScore = Math.min(99, Math.max(65, Math.round(rawAffinity * 100)));

  // Extract tags (genres, styles, moods)
  const tags = (entity.tags || [])
    .map((t) => t.name)
    .filter((name): name is string => Boolean(name && name.length < 30))
    .slice(0, 5);

  const description =
    entity.properties?.short_description ||
    entity.properties?.description ||
    (tags.length > 0 ? tags.join(" · ") : `${domain} cultural anchor.`);

  return {
    id: entityId || `entity-${Math.random().toString(36).slice(2, 9)}`,
    name: entity.name,
    domain,
    description,
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
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Qloo search failed: HTTP ${res.status}`);
      return [];
    }

    const data: QlooSearchResponse = await res.json();
    return data.results || [];
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
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Qloo insights failed: HTTP ${res.status}`);
      return [];
    }

    const data: QlooInsightsResponse = await res.json();
    return data.results?.entities || [];
  } catch (err) {
    console.error("Qloo insights network error:", err);
    return [];
  }
}
