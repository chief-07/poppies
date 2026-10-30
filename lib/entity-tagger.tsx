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

export function renderTextWithEntityTags<T extends { id?: string; name: string }>(
  text: string,
  entities: T[],
  onEntityClick: (entity: T) => void
): React.ReactNode {
  if (!text || !entities || entities.length === 0) return <span>{text}</span>;

  // Deduplicate and filter valid entities by name length descending (longest names match first)
  const seen = new Set<string>();
  const validEntities = entities
    .filter((e) => {
      if (!e || !e.name || e.name.trim().length <= 1) return false;
      const lower = e.name.toLowerCase().trim();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .sort((a, b) => b.name.length - a.name.length);

  if (validEntities.length === 0) return <span>{text}</span>;

  // Escape special regex characters
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = validEntities.map((e) => esc(e.name.trim())).join("|");

  // Unicode-safe word boundaries using lookbehind and lookahead:
  // (?<=^|[^\p{L}\p{N}])(PATTERN)(?=[^\p{L}\p{N}]|$)
  const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])(${pattern})(?=[^\\p{L}\\p{N}]|$)`, "giu");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const matched = validEntities.find(
          (e) => e.name.toLowerCase().trim() === part.toLowerCase().trim()
        );
        if (matched) {
          return (
            <button
              key={`${matched.id || matched.name}-${index}`}
              type="button"
              onClick={() => onEntityClick(matched)}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-full bg-[#E06B55]/18 hover:bg-[#E06B55]/32 border border-[#E06B55]/40 hover:border-[#E06B55]/70 text-[#F7F7D9] font-sans font-medium text-xs sm:text-[13px] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group align-baseline"
              title={`Inspect Qloo taste graph evidence for ${matched.name}`}
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
