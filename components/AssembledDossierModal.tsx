"use client";

import { useState, useMemo } from "react";
import { X, Copy, Check, Printer, LayoutGrid, List, Sparkles } from "lucide-react";
import { renderTextWithEntityTags, getEntityPhoto, TaggableEntity } from "@/lib/entity-tagger";

export interface AssembledEntity {
  id: string;
  name: string;
  domain: string;
  description: string;
  affinityScore?: number;
  entityId?: string;
  imageUrl?: string;
  entityType?: string;
  seedEntities?: string[];
  qlooReasoning?: string;
}

export interface AssembledInquiry {
  id: string;
  question: string;
  domain?: string;
  vignette?: string;
  entities?: AssembledEntity[];
}

interface AssembledDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterSummary: string;
  userPrompt?: string;
  constraints: { locality?: string; era?: string; occupation?: string };
  culturalDossier: {
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
  };
  inquiries: AssembledInquiry[];
  acceptedEntityIds?: string[];
  onSelectEntity?: (entity: AssembledEntity) => void;
}

export default function AssembledDossierModal({
  isOpen,
  onClose,
  characterName,
  characterSummary,
  userPrompt,
  constraints,
  culturalDossier,
  inquiries,
  acceptedEntityIds = [],
  onSelectEntity,
}: AssembledDossierModalProps) {
  const [copied, setCopied] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<"lookbook" | "list">("lookbook");

  // ONLY show entities that were explicitly accepted into character canon
  const acceptedEntities = useMemo(() => {
    const list: AssembledEntity[] = [];
    const seen = new Set<string>();

    inquiries.forEach((inq) => {
      (inq.entities || []).forEach((ent) => {
        if (acceptedEntityIds.includes(ent.id)) {
          const lower = ent.name.toLowerCase().trim();
          if (!seen.has(lower)) {
            seen.add(lower);
            list.push(ent);
          }
        }
      });
    });

    return list;
  }, [inquiries, acceptedEntityIds]);

  // Pool of all taggable entities for interactive prose mentions
  const allTaggableEntities: TaggableEntity[] = useMemo(() => {
    const list: TaggableEntity[] = [];
    const seen = new Set<string>();

    const add = (e: Partial<TaggableEntity> & { name: string }) => {
      if (!e || !e.name) return;
      const lower = e.name.toLowerCase().trim();
      if (!lower || seen.has(lower)) return;
      seen.add(lower);
      list.push({
        id: e.id || `tag-${lower}`,
        name: e.name.trim(),
        domain: e.domain || "CULTURE",
        description: e.description,
        affinityScore: e.affinityScore,
        entityId: e.entityId,
      });
    };

    acceptedEntities.forEach(add);
    inquiries.forEach((inq) => (inq.entities || []).forEach(add));
    culturalDossier.highlightedNodes?.forEach((name) => add({ name }));

    return list;
  }, [acceptedEntities, inquiries, culturalDossier]);

  if (!isOpen) return null;

  const constraintParts = [
    constraints.locality,
    constraints.era,
    constraints.occupation,
  ].filter(Boolean);

  const generateMarkdown = () => {
    let md = `# ${characterName}\n\n`;
    md += `*${characterSummary}*\n`;
    if (constraintParts.length > 0) {
      md += `${constraintParts.join(" · ")}\n`;
    }
    md += `\n---\n\n`;
    md += `## Taste Thesis\n\n${culturalDossier.tasteThesis}\n\n`;

    if (culturalDossier.psychologicalWound) {
      md += `**Internal Tension:** ${culturalDossier.psychologicalWound}\n\n`;
    }
    if (culturalDossier.tactileArmor) {
      md += `**Tactile Armor:** ${culturalDossier.tactileArmor}\n\n`;
    }

    md += `---\n\n`;
    md += `## Accepted Canon Anchors (${acceptedEntities.length})\n\n`;
    if (acceptedEntities.length === 0) {
      md += `*No anchors accepted into canon yet.*\n\n`;
    } else {
      acceptedEntities.forEach((e) => {
        md += `- **${e.name}** [${e.domain}]${e.affinityScore ? ` (${e.affinityScore}% affinity)` : ""}: ${e.description}`;
        if (e.entityId) md += ` \`${e.entityId}\``;
        md += `\n`;
      });
      md += `\n`;
    }

    if (culturalDossier.unconsideredAngles?.[0]) {
      md += `---\n\n`;
      md += `**Latent Tension (${culturalDossier.unconsideredAngles[0].title}):** ${culturalDossier.unconsideredAngles[0].description}`;
      if (culturalDossier.unconsideredAngles[0].groundedEntity) {
        md += ` (Anchor: ${culturalDossier.unconsideredAngles[0].groundedEntity})`;
      }
      md += `\n\n`;
    }

    md += `---\n*Assembled via Poppies · Grounded by Qloo Cultural Taste Graph*\n`;
    return md;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy markdown:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1040px] max-h-[94vh] sm:max-h-[92vh] rounded-[22px] sm:rounded-[26px] bg-[#112115] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Clean, understated editorial masthead */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 flex items-center justify-between bg-white/[0.03] border-b border-white/[0.08] flex-wrap gap-2.5">
          <div className="flex items-center gap-3">
            <span className="font-serif italic font-bold text-lg sm:text-xl text-[#F7F7D9] tracking-tight">
              {characterName}
            </span>
            <span className="text-xs font-mono text-[#E06B55] px-2.5 py-0.5 rounded-full bg-[#E06B55]/12 border border-[#E06B55]/30">
              {acceptedEntities.length} accepted anchor{acceptedEntities.length !== 1 ? "s" : ""}
            </span>

            {/* View Switcher: Lookbook Minimalist Grid vs Archive List */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.05] border border-white/10">
              <button
                type="button"
                onClick={() => setModalViewMode("lookbook")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  modalViewMode === "lookbook"
                    ? "bg-[#E06B55] text-white font-medium shadow-sm"
                    : "text-[#F7F7D9]/60 hover:text-[#F7F7D9]"
                }`}
                title="Visual Lookbook Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lookbook</span>
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  modalViewMode === "list"
                    ? "bg-[#E06B55] text-white font-medium shadow-sm"
                    : "text-[#F7F7D9]/60 hover:text-[#F7F7D9]"
                }`}
                title="Archive Catalog List"
              >
                <List className="w-3.5 h-3.5" />
                <span>Catalog List</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-sans text-[#F7F7D9]/80 hover:text-[#F7F7D9] transition-all cursor-pointer active:scale-95"
              title="Copy as Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-sans text-[#F7F7D9]/80 hover:text-[#F7F7D9] transition-all cursor-pointer active:scale-95"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-[#F7F7D9]/60 hover:text-[#F7F7D9] flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-red p-4 sm:p-8">
          <div className="max-w-[940px] mx-auto flex flex-col gap-6">
            {/* Opening Masthead Meta & Brief Quote */}
            <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F7F7D9]/50 uppercase tracking-widest">
                <span>Director&apos;s Pitch Bible</span>
                {constraintParts.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#E06B55]">{constraintParts.join(" · ")}</span>
                  </>
                )}
              </div>

              <p className="font-serif italic text-base sm:text-lg text-[#F7F7D9]/80 leading-relaxed">
                {characterSummary}
              </p>

              {/* Master Taste Thesis with Interactive Tappable Qloo Pills */}
              <div className="relative pl-3.5 border-l-2 border-[#E06B55]/60 mt-2 py-0.5">
                <p className="font-serif text-sm sm:text-[15px] leading-relaxed text-[#F7F7D9]/90 font-light">
                  {renderTextWithEntityTags(
                    culturalDossier.tasteThesis,
                    allTaggableEntities,
                    (ent) => onSelectEntity?.(ent as AssembledEntity)
                  )}
                </p>
              </div>
            </div>

            {/* Empty State when zero entities have been accepted */}
            {acceptedEntities.length === 0 ? (
              <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-1">
                  <Sparkles className="w-5 h-5 text-[#E06B55]/70" />
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#F7F7D9]">
                  Character Canon is Currently Empty
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#F7F7D9]/60 max-w-md leading-relaxed">
                  In the studio, review cultural inquiries and tap <span className="text-[#F7F7D9] font-mono font-bold">+</span> to accept verified Qloo anchors into this character&apos;s lookbook.
                </p>
              </div>
            ) : modalViewMode === "lookbook" ? (
              /* ================= VIEW 1: CLEAN MINIMALIST LOOKBOOK GRID ================= */
              /* Images mostly, text overlay of the name, not gaudy, no useless titles */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
                {acceptedEntities.map((entity, index) => {
                  const photoUrl = getEntityPhoto(entity);
                  const isHero = index === 0 && acceptedEntities.length > 2;

                  return (
                    <div
                      key={entity.id}
                      onClick={() => onSelectEntity?.(entity)}
                      className={`group relative rounded-[20px] overflow-hidden border border-white/[0.12] hover:border-white/30 bg-[#16271a] shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                        isHero
                          ? "sm:col-span-2 aspect-[16/10] sm:aspect-[2.1/1]"
                          : "aspect-[4/3] sm:aspect-[1/1]"
                      }`}
                    >
                      {/* Full-bleed Editorial Photograph */}
                      <img
                        src={photoUrl}
                        alt={entity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />

                      {/* Deep Atmospheric Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10 group-hover:via-black/25 transition-all duration-300" />

                      {/* Top Badges: Domain tag + Latent Affinity */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#E06B55] px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-[#E06B55]/30 font-semibold shadow-sm">
                          {entity.domain}
                        </span>

                        {entity.affinityScore !== undefined && (
                          <span className="text-[10px] font-mono text-[#F7F7D9]/90 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                            {entity.affinityScore}% Qloo
                          </span>
                        )}
                      </div>

                      {/* Bottom Text Overlay: Name in serif italic + one-line context */}
                      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                        <h4 className="font-serif italic font-bold text-lg sm:text-2xl text-[#F7F7D9] leading-tight drop-shadow-md group-hover:text-white transition-colors">
                          {entity.name}
                        </h4>
                        <p className="font-sans text-xs text-[#F7F7D9]/75 line-clamp-2 mt-1 leading-relaxed drop-shadow">
                          {entity.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================= VIEW 2: ARCHIVE CATALOG LIST ================= */
              /* Clean, high-density, scannable table listing only the accepted items */
              <div className="flex flex-col gap-2.5 pt-1">
                {acceptedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => onSelectEntity?.(entity)}
                    className="p-3.5 rounded-[16px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E06B55] font-bold flex-shrink-0 px-2 py-0.5 rounded-full bg-[#E06B55]/10 border border-[#E06B55]/25">
                        {entity.domain}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-serif italic font-medium text-sm sm:text-base text-[#F7F7D9] group-hover:text-white truncate">
                          {entity.name}
                        </span>
                        <span className="font-sans text-xs text-[#F7F7D9]/60 line-clamp-1">
                          {entity.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
                      {entity.entityId && (
                        <code className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {entity.entityId}
                        </code>
                      )}
                      {entity.affinityScore !== undefined && (
                        <span className="font-mono text-xs text-[#F7F7D9]/80 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                          {entity.affinityScore}%
                        </span>
                      )}
                      <span className="text-xs font-sans text-[#E06B55] group-hover:translate-x-0.5 transition-transform">
                        Inspect ↗
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
