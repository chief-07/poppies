"use client";

import { useState } from "react";
import { X, Copy, Check, Printer, LayoutGrid, List } from "lucide-react";

interface AssembledEntity {
  id: string;
  name: string;
  domain: string;
  description: string;
  affinityScore?: number;
  entityId?: string;
  imageUrl?: string;
}

interface AssembledInquiry {
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
}

function getEntityPhoto(entity: { domain?: string; imageUrl?: string }): string {
  if (entity.imageUrl) return entity.imageUrl;
  switch (entity.domain) {
    case "MUSIC":
      return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80";
    case "BOOKS":
      return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";
    case "PLACES":
      return "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80";
    default:
      return "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80";
  }
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
  acceptedEntityIds,
}: AssembledDossierModalProps) {
  const [copied, setCopied] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<"lookbook" | "list">("lookbook");

  if (!isOpen) return null;

  const filteredInquiries = inquiries.map((inq) => ({
    ...inq,
    entities: (inq.entities || []).filter((e) =>
      acceptedEntityIds ? acceptedEntityIds.includes(e.id) : true
    ),
  }));

  const totalAcceptedCount = filteredInquiries.reduce(
    (acc, inq) => acc + (inq.entities?.length || 0),
    0
  );

  // Show inquiries that have accepted entities or a curatorial vignette
  const relevantInquiries = filteredInquiries.filter(
    (inq) => (inq.entities && inq.entities.length > 0) || inq.vignette
  );

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
    md += `${culturalDossier.tasteThesis}\n\n`;

    if (culturalDossier.psychologicalWound) {
      md += `**Internal Tension:** ${culturalDossier.psychologicalWound}\n\n`;
    }
    if (culturalDossier.tactileArmor) {
      md += `**Tactile Armor:** ${culturalDossier.tactileArmor}\n\n`;
    }

    relevantInquiries.forEach((inq) => {
      md += `---\n\n`;
      md += `## ${inq.question}\n\n`;
      if (inq.vignette) {
        md += `${inq.vignette}\n\n`;
      }
      if (inq.entities && inq.entities.length > 0) {
        md += `### Accepted Canon Anchors\n\n`;
        inq.entities.forEach((e) => {
          md += `- **${e.name}** [${e.domain}]${e.affinityScore ? ` (${e.affinityScore}%)` : ""}: ${e.description}\n`;
        });
        md += `\n`;
      }
    });

    if (culturalDossier.unconsideredAngles?.[0]) {
      md += `---\n\n`;
      md += `**Latent Tension (${culturalDossier.unconsideredAngles[0].title}):** ${culturalDossier.unconsideredAngles[0].description}`;
      if (culturalDossier.unconsideredAngles[0].groundedEntity) {
        md += ` (Anchor: ${culturalDossier.unconsideredAngles[0].groundedEntity})`;
      }
      md += `\n\n`;
    }

    if (culturalDossier.observedClusters?.length > 0) {
      md += `**Observed Taste:** ${culturalDossier.observedClusters.join(" · ")}\n\n`;
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[920px] max-h-[94vh] sm:max-h-[92vh] rounded-[20px] sm:rounded-[24px] bg-[#112115] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: minimal actions, zero slop */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between bg-white/[0.03] border-b border-white/[0.08] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F7F7D9]/50">
              Film-Bible Lookbook · {totalAcceptedCount} accepted anchor{totalAcceptedCount !== 1 ? "s" : ""}
            </span>

            {/* View Switcher: Lookbook vs Catalog List */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.05] border border-white/10">
              <button
                type="button"
                onClick={() => setModalViewMode("lookbook")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  modalViewMode === "lookbook"
                    ? "bg-[#E06B55] text-white font-medium"
                    : "text-[#F7F7D9]/60 hover:text-[#F7F7D9]"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Lookbook</span>
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode("list")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  modalViewMode === "list"
                    ? "bg-[#E06B55] text-white font-medium"
                    : "text-[#F7F7D9]/60 hover:text-[#F7F7D9]"
                }`}
              >
                <List className="w-3 h-3" />
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
              title="Close Lookbook"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Lookbook Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-red">
          <div className="max-w-[760px] mx-auto px-4 sm:px-10 py-6 sm:py-12 flex flex-col gap-0">
            {/* 1. COVER SECTION: Character Title & Subtitle */}
            <h1 className="font-serif font-bold text-3xl sm:text-5xl text-[#F7F7D9] leading-tight tracking-tight">
              {characterName}
            </h1>

            <p className="font-serif italic text-base sm:text-lg text-[#F7F7D9]/70 mt-2 leading-relaxed">
              {characterSummary}
            </p>

            {/* Geographical & Trade Meta */}
            {constraintParts.length > 0 && (
              <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-[#E06B55]">
                  {constraintParts.join(" · ")}
                </span>
              </div>
            )}

            {/* Thin editorial divider */}
            <div className="w-full h-px bg-white/[0.08] mt-6 mb-8" />

            {/* Master Taste Thesis (Opening Editorial Paragraph) */}
            <p className="font-serif text-[16px] sm:text-[18px] leading-[1.85] text-[#F7F7D9]/95 font-light">
              {culturalDossier.tasteThesis}
            </p>

            {/* Internal Tension & Tactile Armor (Quiet Editorial Continuations) */}
            {(culturalDossier.psychologicalWound || culturalDossier.tactileArmor) && (
              <div className="flex flex-col gap-3.5 mt-6 pt-5 border-t border-white/[0.06]">
                {culturalDossier.psychologicalWound && (
                  <p className="font-serif text-[14px] sm:text-[15.5px] leading-[1.8] text-[#F7F7D9]/80 font-light">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55] font-semibold mr-2">
                      Internal Tension
                    </span>
                    {culturalDossier.psychologicalWound}
                  </p>
                )}
                {culturalDossier.tactileArmor && (
                  <p className="font-serif text-[14px] sm:text-[15.5px] leading-[1.8] text-[#F7F7D9]/80 font-light">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55] font-semibold mr-2">
                      Tactile Armor
                    </span>
                    {culturalDossier.tactileArmor}
                  </p>
                )}
              </div>
            )}

            {/* 2. INQUIRY SPREADS: Curatorial Prose + Photographic Canon Tiles */}
            {relevantInquiries.length > 0 ? (
              relevantInquiries.map((inq, idx) => (
                <div key={inq.id || idx} className="mt-12 flex flex-col gap-0">
                  {/* Subtle divider before each inquiry spread */}
                  <div className="w-full h-px bg-white/[0.08] mb-6" />

                  {/* Scene Question Headline */}
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F7F7D9] leading-snug">
                    {inq.question}
                  </h2>

                  {/* Curatorial Physical Deduction Prose */}
                  {inq.vignette && (
                    <div className="mt-4 flex flex-col gap-3">
                      {inq.vignette.split("\n\n").map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="font-serif text-[15px] sm:text-[16px] leading-[1.85] text-[#F7F7D9]/85 font-light"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Visual Canon Gallery: Photographic anchors for lookbook or clean table for catalog */}
                  {inq.entities && inq.entities.length > 0 && (
                    modalViewMode === "lookbook" ? (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {inq.entities.map((e) => (
                          <div
                            key={e.id}
                            className="rounded-[16px] bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col shadow-sm"
                          >
                            {/* Photographic Anchor Banner */}
                            <div className="relative w-full h-24 sm:h-28 bg-black/40 overflow-hidden">
                              <img
                                src={getEntityPhoto(e)}
                                alt={e.name}
                                className="w-full h-full object-cover opacity-85"
                                onError={(ev) => {
                                  (ev.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#112115] via-transparent to-transparent opacity-90" />
                              <div className="absolute bottom-2 left-2.5">
                                <span className="text-[9px] font-mono tracking-wider text-[#E06B55] uppercase font-bold">
                                  [{e.domain}]
                                </span>
                              </div>
                              {e.affinityScore !== undefined && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-sans font-medium text-[#F7F7D9]/90">
                                  {e.affinityScore}%
                                </div>
                              )}
                            </div>

                            {/* Entity Name & Context */}
                            <div className="p-3 flex flex-col gap-1">
                              <span className="font-serif italic font-bold text-sm text-[#F7F7D9] leading-tight">
                                {e.name}
                              </span>
                              <p className="font-sans text-[11px] text-[#F7F7D9]/70 leading-relaxed line-clamp-2">
                                {e.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-col gap-2">
                        {inq.entities.map((e) => (
                          <div
                            key={e.id}
                            className="p-3 rounded-[14px] bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[9px] font-mono uppercase text-[#E06B55] font-bold flex-shrink-0">
                                [{e.domain}]
                              </span>
                              <span className="font-serif italic font-medium text-sm text-[#F7F7D9] truncate">
                                {e.name}
                              </span>
                              <span className="font-sans text-xs text-[#F7F7D9]/60 truncate hidden sm:inline">
                                — {e.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {e.entityId && (
                                <code className="hidden md:inline font-mono text-[10.5px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                                  {e.entityId}
                                </code>
                              )}
                              {e.affinityScore !== undefined && (
                                <span className="font-mono text-xs text-[#F7F7D9]/80 px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                  {e.affinityScore}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Empty state for inquiry with prose but zero accepted entities */}
                  {(!inq.entities || inq.entities.length === 0) && (
                    <p className="mt-3 font-sans italic text-xs text-[#F7F7D9]/35">
                      No cultural anchors accepted for this inquiry yet.
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="mt-12 py-12 flex flex-col items-center text-center gap-3">
                <p className="font-serif text-lg text-[#F7F7D9]/70">
                  No cultural anchors accepted into canon yet.
                </p>
                <p className="font-sans text-xs text-[#F7F7D9]/40 max-w-sm leading-relaxed">
                  Review inquiries in the studio and click + to accept verified Qloo anchors into the character lookbook.
                </p>
              </div>
            )}

            {/* 3. CLOSING SECTION: Latent Tension & Observed Taste */}
            {culturalDossier.unconsideredAngles?.[0] && (
              <div className="mt-12 flex flex-col gap-0">
                <div className="w-full h-px bg-white/[0.08] mb-6" />
                <p className="font-serif text-[14px] sm:text-[15.5px] leading-[1.8] text-[#F7F7D9]/75 font-light">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55] font-semibold mr-2">
                    Latent Tension · {culturalDossier.unconsideredAngles[0].title}
                  </span>
                  {culturalDossier.unconsideredAngles[0].description}
                  {culturalDossier.unconsideredAngles[0].groundedEntity && (
                    <span className="font-mono text-xs text-[#E06B55]/70 ml-1.5">
                      → {culturalDossier.unconsideredAngles[0].groundedEntity}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Observed Taste Line */}
            {culturalDossier.observedClusters?.length > 0 && (
              <div className="mt-8 pt-4 border-t border-white/[0.06]">
                <span className="font-sans text-[11px] text-[#F7F7D9]/40 uppercase tracking-wider">
                  Observed Taste: {culturalDossier.observedClusters.join(" · ")}
                </span>
              </div>
            )}

            {/* Colophon */}
            <div className="mt-6 pb-2">
              <span className="font-sans text-[10px] text-[#F7F7D9]/25">
                Assembled via Poppies · Grounded by Qloo Cultural Taste Graph
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
