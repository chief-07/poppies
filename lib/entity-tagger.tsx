import React from "react";

export interface TaggableEntity {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  entityId?: string;
  entityType?: string;
  affinityScore?: number;
  imageUrl?: string;
  seedEntities?: string[];
  qlooReasoning?: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "over", "under", "about",
  "book", "album", "music", "park", "road", "city", "cafe", "shop", "knife", "knives",
  "boots", "shoes", "jacket", "coat", "pencil", "pen", "temple", "shrine", "museum",
  "station", "harbor", "port", "green", "blue", "black", "white", "vintage", "classic",
  "quiet", "night", "sound", "radio", "audio", "tools", "stone", "craft", "wood"
]);

const GENERIC_SUFFIXES = [
  /\s+(mechanical pencil|pencil|pens?|carbon knife|knives|knife|boots?|shoes?|jacket|coat|temple|shrine|sanctuary|museum|station|park|avenue|street|boulevard|cafe|bar|records|recordings|quartet|trio|ensemble|orchestra|project|studio|studios|laboratory|workshop|works|distillery|brewery|company|co\.|inc\.|ltd\.|limited)$/i,
  /\s+no\.\s*\d+.*$/i,
  /\s*[\(\[].*?[\)\]]/g,
  /\s*[-–—:]\s*.*$/
];

interface AliasEntry<T> {
  alias: string;
  entity: T;
}

function buildEntityLookup<T extends { id?: string; name: string }>(rawEntities: T[]): AliasEntry<T>[] {
  const lookup = new Map<string, AliasEntry<T>>();

  const register = (alias: string, entity: T) => {
    if (!alias) return;
    const clean = alias.trim().replace(/^['"“‘]+|['"”’]+$/g, "");
    const lower = clean.toLowerCase();
    if (lower.length < 3 || STOPWORDS.has(lower)) return;
    if (!lookup.has(lower)) {
      lookup.set(lower, { alias: clean, entity });
    }
  };

  rawEntities.forEach((ent) => {
    if (!ent || !ent.name) return;
    const raw = ent.name.trim();
    register(raw, ent);

    // 1. Subtitles after dash / colon (e.g. "Artist - Album" -> "Artist")
    if (raw.includes(" - ") || raw.includes(" – ") || raw.includes(": ")) {
      const parts = raw.split(/\s*[-–:]\s*/);
      parts.forEach((p) => register(p, ent));
    }

    // 2. Bracketed text (e.g. "Hiroshi Yoshimura (Ambient)" -> "Hiroshi Yoshimura")
    const noBrackets = raw.replace(/\s*[\(\[].*?[\)\]]/g, "").trim();
    if (noBrackets && noBrackets !== raw) {
      register(noBrackets, ent);
    }

    // 3. Trailing product/place descriptors (e.g. "Rotring 600 Mechanical Pencil" -> "Rotring 600")
    let stripped = raw;
    for (const suffixRegex of GENERIC_SUFFIXES) {
      const next = stripped.replace(suffixRegex, "").trim();
      if (next && next.length >= 3 && next !== stripped) {
        register(next, ent);
        stripped = next;
      }
    }

    // 4. Distinctive first/last words if >= 4 chars and not stop words (e.g. "Satie", "Opinel", "Tanizaki")
    const words = raw.split(/\s+/);
    if (words.length > 1) {
      const firstWord = words[0].replace(/[^a-zA-Z0-9\u00C0-\u024F\u3040-\u30FF\u4E00-\u9FFF]/g, "");
      if (firstWord.length >= 4 && !STOPWORDS.has(firstWord.toLowerCase())) {
        register(firstWord, ent);
      }
      const lastWord = words[words.length - 1].replace(/[^a-zA-Z0-9\u00C0-\u024F\u3040-\u30FF\u4E00-\u9FFF]/g, "");
      if (lastWord.length >= 4 && !STOPWORDS.has(lastWord.toLowerCase())) {
        register(lastWord, ent);
      }
    }
  });

  return Array.from(lookup.values()).sort((a, b) => b.alias.length - a.alias.length);
}

export function renderTextWithEntityTags<T extends { id?: string; name: string }>(
  text: string,
  entities: T[],
  onEntityClick: (entity: T) => void
): React.ReactNode {
  if (!text || !entities || entities.length === 0) return <span>{text}</span>;

  const entries = buildEntityLookup(entities);
  if (entries.length === 0) return <span>{text}</span>;

  // Escape special regex characters
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = entries.map((e) => esc(e.alias)).join("|");

  // Unicode-safe word boundaries using lookbehind and lookahead:
  // (?<=^|[^\p{L}\p{N}])(PATTERN)(?=[^\p{L}\p{N}]|$)
  const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${pattern})(?=[^\\p{L}\\p{N}]|$)`, "giu");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const matched = entries.find(
          (e) => e.alias.toLowerCase().trim() === part.toLowerCase().trim()
        );
        if (matched) {
          return (
            <button
              key={`${matched.entity.id || matched.alias}-${index}`}
              type="button"
              onClick={() => onEntityClick(matched.entity)}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-full bg-[#E06B55]/18 hover:bg-[#E06B55]/32 border border-[#E06B55]/40 hover:border-[#E06B55]/70 text-[#F7F7D9] font-sans font-medium text-xs sm:text-[13px] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group align-baseline"
              title={`Inspect Qloo taste graph evidence for ${matched.entity.name}`}
            >
              <span>{part}</span>
              <span className="text-[10px] text-[#E06B55] opacity-80 group-hover:opacity-100 transition-opacity">↗</span>
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function getEntityPhoto(entity: { domain?: string; imageUrl?: string; name?: string }): string {
  if (entity.imageUrl) return entity.imageUrl;
  switch (entity.domain) {
    case "MUSIC":
      return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80";
    case "BOOKS":
      return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";
    case "PLACES":
      return "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80";
    default:
      return "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80";
  }
}
