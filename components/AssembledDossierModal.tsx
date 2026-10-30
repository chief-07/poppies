"use client";

import { useState, useMemo } from "react";
import { X, Copy, Check, Printer, LayoutGrid, List } from "lucide-react";
import { getEntityPhoto } from "@/lib/entity-tagger";

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
  characterSummary?: string;
  userPrompt?: string;
  constraints?: { locality?: string; era?: string; occupation?: string };
  culturalDossier?: {
    tasteThesis?: string;
    psychologicalWound?: string;
    tactileArmor?: string;
    observedClusters?: string[];
    unconsideredAngles?: {
      title: string;
      description: string;
      groundedEntity?: string;
    }[];
    highlightedNodes?: string[];
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
  constraints = {},
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

  // Group accepted entities by inquiry question
  const groupedSections = useMemo(() => {
    const sections: { id: string; title: string; domain?: string; entities: AssembledEntity[] }[] = [];
    const assigned = new Set<string>();

    inquiries.forEach((inq) => {
      const inqEntities = (inq.entities || []).filter((e) => acceptedEntityIds.includes(e.id));
      if (inqEntities.length > 0) {
        inqEntities.forEach((e) => assigned.add(e.id));
        sections.push({
          id: inq.id,
          title: inq.question,
          domain: inq.domain,
          entities: inqEntities,
        });
      }
    });

    const remaining = acceptedEntities.filter((e) => !assigned.has(e.id));
    if (remaining.length > 0) {
      sections.unshift({
        id: "core-canon",
        title: "Curated Cultural Canon",
        domain: "CANON",
        entities: remaining,
      });
    }

    return sections;
  }, [inquiries, acceptedEntities, acceptedEntityIds]);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# ${characterName} — Lookbook\n\n`;
    groupedSections.forEach((sec) => {
      md += `## ${sec.title}\n\n`;
      sec.entities.forEach((e) => {
        md += `- **${e.name}** [${e.domain}]: ${e.description}\n`;
      });
      md += `\n`;
    });
    md += `*Assembled via Poppies · Grounded by Qloo Cultural Taste Graph*\n`;
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
        className="relative w-full max-w-[1100px] max-h-[94vh] sm:max-h-[92vh] rounded-[22px] sm:rounded-[26px] bg-[#112115] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Understated and focused */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 flex items-center justify-between bg-white/[0.03] border-b border-white/[0.08] flex-wrap gap-2.5">
          <div className="flex items-center gap-3">
            <span className="font-serif italic font-bold text-lg sm:text-xl text-[#F7F7D9] tracking-tight">
              {characterName}
            </span>
            <span className="text-xs font-mono text-[#E06B55] px-2.5 py-0.5 rounded-full bg-[#E06B55]/12 border border-[#E06B55]/30">
              {acceptedEntities.length} accepted media
            </span>

            {/* View Switcher: Lookbook Tight Grid vs Catalog List */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.05] border border-white/10">
              <button
                type="button"
                onClick={() => setModalViewMode("lookbook")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  modalViewMode === "lookbook"
                    ? "bg-[#E06B55] text-white font-medium shadow-sm"
                    : "text-[#F7F7D9]/60 hover:text-[#F7F7D9]"
                }`}
                title="Seamless Lookbook Grid"
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
                title="Catalog List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Catalog</span>
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
                  <span>Copy</span>
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
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-[#F7F7D9]/60 hover:text-[#F7F7D9] flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Body (Zero text fluff, zero slop headers) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-red p-4 sm:p-6 lg:p-8">
          {acceptedEntities.length === 0 ? (
            <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center gap-2">
              <h3 className="font-serif italic font-bold text-xl sm:text-2xl text-[#F7F7D9]">
                No media accepted yet
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#F7F7D9]/50 max-w-sm">
                In the studio, tap (+) on any cultural anchor to curate it into this lookbook.
              </p>
            </div>
          ) : modalViewMode === "lookbook" ? (
            /* ================= VIEW 1: SEAMLESS LOOKBOOK GRID (No spacing, no rounded corners) ================= */
            <div className="flex flex-col gap-8">
              {groupedSections.map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  {/* Clean section header based on scene question */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                    <span className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/80 font-medium">
                      {section.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#E06B55] uppercase tracking-wider font-semibold">
                      {section.entities.length} {section.entities.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* Seamless edge-to-edge photo grid: gap-0, rounded-none */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0 overflow-hidden rounded-[14px] border border-white/[0.12] bg-black">
                    {section.entities.map((entity) => {
                      const photoUrl = getEntityPhoto(entity);
                      return (
                        <div
                          key={entity.id}
                          onClick={() => onSelectEntity?.(entity)}
                          className="group relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-none cursor-pointer border-[0.5px] border-black/40"
                        >
                          {/* Image */}
                          <img
                            src={photoUrl}
                            alt={entity.name}
                            className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                          {/* Just the name on it, nothing more */}
                          <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-3 pointer-events-none flex flex-col justify-end">
                            <span className="font-serif italic font-bold text-xs sm:text-sm md:text-base text-[#F7F7D9] leading-snug drop-shadow-md truncate group-hover:text-white transition-colors">
                              {entity.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= VIEW 2: CATALOG LIST (Grouped, left image with right fade, name + deets) ================= */
            <div className="flex flex-col gap-8">
              {groupedSections.map((section) => (
                <div key={section.id} className="flex flex-col gap-3">
                  {/* Section Title */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
                    <span className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/80 font-medium">
                      {section.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#E06B55] uppercase tracking-wider font-semibold">
                      {section.entities.length} {section.entities.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {/* List Rows */}
                  <div className="flex flex-col gap-2">
                    {section.entities.map((entity) => {
                      const photoUrl = getEntityPhoto(entity);
                      return (
                        <div
                          key={entity.id}
                          onClick={() => onSelectEntity?.(entity)}
                          className="group relative rounded-[14px] overflow-hidden bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 flex items-stretch transition-all cursor-pointer shadow-sm min-h-[76px] sm:min-h-[88px]"
                        >
                          {/* Left: Image with right edge fade */}
                          <div className="relative w-24 sm:w-36 flex-shrink-0 overflow-hidden">
                            <img
                              src={photoUrl}
                              alt={entity.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            {/* Right edge fade gradient */}
                            <div className="absolute inset-y-0 right-0 w-10 sm:w-14 bg-gradient-to-r from-transparent to-[#112115] pointer-events-none" />
                          </div>

                          {/* Right: Name and the deets */}
                          <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-center gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-[#E06B55] font-bold">
                                [{entity.domain}]
                              </span>
                              <h4 className="font-serif italic font-bold text-sm sm:text-base text-[#F7F7D9] group-hover:text-white truncate">
                                {entity.name}
                              </h4>
                            </div>
                            <p className="font-sans text-xs sm:text-[13px] text-[#F7F7D9]/70 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                              {entity.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
