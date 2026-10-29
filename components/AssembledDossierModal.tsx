"use client";

import { useState } from "react";
import { X, Copy, Check, Printer } from "lucide-react";

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
  inquiries: {
    id: string;
    question: string;
    domain?: string;
    vignette?: string;
    entities?: {
      id: string;
      name: string;
      domain: string;
      description: string;
      affinityScore?: number;
      entityId?: string;
    }[];
  }[];
  acceptedEntityIds?: string[];
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

  // Only show inquiries that have accepted entities or a vignette
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
        inq.entities.forEach((e) => {
          md += `- **${e.name}** [${e.domain}]${e.affinityScore ? ` — ${e.affinityScore}%` : ""}: ${e.description}\n`;
        });
        md += `\n`;
      }
    });

    if (culturalDossier.unconsideredAngles?.[0]) {
      md += `---\n\n`;
      md += `**${culturalDossier.unconsideredAngles[0].title}:** ${culturalDossier.unconsideredAngles[0].description}\n\n`;
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] max-h-[92vh] rounded-[24px] bg-[#0f1f14] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact top bar: just actions, no redundant title */}
        <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#F7F7D9]/40">
            Character Dossier · {totalAcceptedCount} accepted node{totalAcceptedCount !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[11px] font-sans text-[#F7F7D9]/80 hover:text-[#F7F7D9] transition-all cursor-pointer active:scale-95"
              title="Copy as Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[11px] font-sans text-[#F7F7D9]/80 hover:text-[#F7F7D9] transition-all cursor-pointer active:scale-95"
              title="Print"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-[#F7F7D9]/60 hover:text-[#F7F7D9] flex items-center justify-center transition-all cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable editorial body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-red">
          <div className="max-w-[680px] mx-auto px-6 sm:px-8 py-8 sm:py-12 flex flex-col gap-0">

            {/* Character name — the anchor of the whole document */}
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F7F7D9] leading-tight tracking-tight">
              {characterName}
            </h1>

            {/* Summary as a quiet italic line beneath */}
            <p className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/60 mt-2 leading-relaxed">
              {characterSummary}
            </p>

            {/* Constraint tags inline */}
            {constraintParts.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {constraintParts.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono uppercase tracking-wider text-[#E06B55]/80"
                  >
                    {c}{i < constraintParts.length - 1 ? " ·" : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Thin rule */}
            <div className="w-full h-px bg-white/[0.08] mt-6 mb-8" />

            {/* Taste thesis — the opening editorial paragraph, no label needed */}
            <p className="font-serif text-[15px] sm:text-[17px] leading-[1.9] text-[#F7F7D9]/90 font-light">
              {culturalDossier.tasteThesis}
            </p>

            {/* Internal tension and tactile armor as quiet prose continuations */}
            {(culturalDossier.psychologicalWound || culturalDossier.tactileArmor) && (
              <div className="flex flex-col gap-4 mt-6">
                {culturalDossier.psychologicalWound && (
                  <p className="font-serif text-[14px] sm:text-[15px] leading-[1.85] text-[#F7F7D9]/75 font-light">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55]/70 font-semibold mr-2">
                      Internal Tension
                    </span>
                    {culturalDossier.psychologicalWound}
                  </p>
                )}
                {culturalDossier.tactileArmor && (
                  <p className="font-serif text-[14px] sm:text-[15px] leading-[1.85] text-[#F7F7D9]/75 font-light">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55]/70 font-semibold mr-2">
                      Tactile Armor
                    </span>
                    {culturalDossier.tactileArmor}
                  </p>
                )}
              </div>
            )}

            {/* Inquiries — each reads like a short magazine column */}
            {relevantInquiries.length > 0 ? (
              relevantInquiries.map((inq, idx) => (
                <div key={inq.id || idx} className="mt-10 flex flex-col gap-0">
                  {/* Thin rule before each inquiry */}
                  <div className="w-full h-px bg-white/[0.06] mb-6" />

                  {/* The question as a section heading */}
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-[#F7F7D9] leading-snug">
                    {inq.question}
                  </h2>

                  {inq.domain && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#E06B55]/70 mt-1.5">
                      {inq.domain}
                    </span>
                  )}

                  {/* Vignette prose */}
                  {inq.vignette && (
                    <div className="mt-4 flex flex-col gap-3">
                      {inq.vignette.split("\n\n").map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="font-serif text-[14px] sm:text-[15px] leading-[1.85] text-[#F7F7D9]/80 font-light"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Accepted entities — a clean, scannable list (not a grid of cards) */}
                  {inq.entities && inq.entities.length > 0 && (
                    <div className="mt-5 flex flex-col gap-0 border-l-2 border-[#E06B55]/30 pl-4">
                      {inq.entities.map((e) => (
                        <div
                          key={e.id}
                          className="py-2.5 flex flex-col gap-0.5 border-b border-white/[0.04] last:border-b-0"
                        >
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                              {e.name}
                            </span>
                            <span className="text-[9px] font-mono text-[#E06B55]/70 uppercase">
                              {e.domain}
                            </span>
                            {e.affinityScore !== undefined && (
                              <span className="text-[10px] font-mono text-[#F7F7D9]/40">
                                {e.affinityScore}%
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs text-[#F7F7D9]/55 leading-relaxed">
                            {e.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state for inquiry with vignette but no accepted entities */}
                  {(!inq.entities || inq.entities.length === 0) && (
                    <p className="mt-3 font-sans italic text-xs text-[#F7F7D9]/30">
                      No anchors accepted for this inquiry yet.
                    </p>
                  )}
                </div>
              ))
            ) : (
              /* Global empty state when nothing is accepted anywhere */
              <div className="mt-10 py-12 flex flex-col items-center text-center gap-3">
                <p className="font-serif text-lg text-[#F7F7D9]/70">
                  No cultural anchors accepted into canon yet.
                </p>
                <p className="font-sans text-xs text-[#F7F7D9]/40 max-w-sm leading-relaxed">
                  Review your inquiries in the studio and accept verified Qloo
                  anchors to assemble the character lookbook.
                </p>
              </div>
            )}

            {/* Latent discovery — only if present, as a quiet closing note */}
            {culturalDossier.unconsideredAngles?.[0] && (
              <div className="mt-10 flex flex-col gap-0">
                <div className="w-full h-px bg-white/[0.06] mb-6" />
                <p className="font-serif text-[14px] sm:text-[15px] leading-[1.85] text-[#F7F7D9]/70 font-light">
                  <span className="font-sans text-[10px] uppercase tracking-widest text-[#E06B55]/70 font-semibold mr-2">
                    {culturalDossier.unconsideredAngles[0].title}
                  </span>
                  {culturalDossier.unconsideredAngles[0].description}
                  {culturalDossier.unconsideredAngles[0].groundedEntity && (
                    <span className="font-mono text-xs text-[#E06B55]/60 ml-1.5">
                      → {culturalDossier.unconsideredAngles[0].groundedEntity}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Observed taste clusters as a quiet footer line */}
            {culturalDossier.observedClusters && culturalDossier.observedClusters.length > 0 && (
              <div className="mt-8 pt-4 border-t border-white/[0.06]">
                <span className="font-sans text-[10px] text-[#F7F7D9]/30 uppercase tracking-wider">
                  Observed taste: {culturalDossier.observedClusters.join(" · ")}
                </span>
              </div>
            )}

            {/* Colophon */}
            <div className="mt-6 pb-4">
              <span className="font-sans text-[10px] text-[#F7F7D9]/20">
                Assembled via Poppies · Grounded by Qloo Cultural Taste Graph
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
