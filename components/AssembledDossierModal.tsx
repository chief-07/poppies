"use client";

import { useState } from "react";
import { X, Copy, Check, Printer, BookOpen, Layers, ExternalLink } from "lucide-react";

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
}: AssembledDossierModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# Cultural Dossier: ${characterName}\n\n`;
    md += `**Summary:** ${characterSummary}\n`;
    md += `**Setting & Constraints:** Locality: ${constraints.locality || "Unspecified"} | Era: ${constraints.era || "Contemporary"} | Occupation: ${constraints.occupation || "Unspecified"}\n\n`;

    md += `## Master Cultural Thesis\n${culturalDossier.tasteThesis}\n\n`;

    if (culturalDossier.psychologicalWound || culturalDossier.tactileArmor) {
      md += `## Internal Friction & Tactile Armor\n`;
      if (culturalDossier.psychologicalWound) {
        md += `- **Internal Tension:** ${culturalDossier.psychologicalWound}\n`;
      }
      if (culturalDossier.tactileArmor) {
        md += `- **Tactile Armor:** ${culturalDossier.tactileArmor}\n`;
      }
      md += `\n`;
    }

    if (culturalDossier.observedClusters && culturalDossier.observedClusters.length > 0) {
      md += `## Observed Taste Clusters\n`;
      culturalDossier.observedClusters.forEach((c) => {
        md += `- ${c}\n`;
      });
      md += `\n`;
    }

    if (culturalDossier.unconsideredAngles && culturalDossier.unconsideredAngles.length > 0) {
      md += `## Latent Graph Discoveries\n`;
      culturalDossier.unconsideredAngles.forEach((a) => {
        md += `- **${a.title}** (${a.groundedEntity}): ${a.description}\n`;
      });
      md += `\n`;
    }

    md += `## Curated World Inquiries & Ensembles\n\n`;
    inquiries.forEach((inq) => {
      md += `### ${inq.question} [${inq.domain || "Ensemble"}]\n`;
      if (inq.vignette) {
        md += `${inq.vignette}\n\n`;
      }
      if (inq.entities && inq.entities.length > 0) {
        md += `**Verified Qloo Cultural Ensemble:**\n`;
        inq.entities.forEach((e) => {
          md += `- **${e.name}** (${e.domain}${e.affinityScore ? `, ${e.affinityScore}% affinity` : ""}): ${e.description}\n`;
        });
        md += `\n`;
      }
    });

    md += `\n---\n*Grounded via Poppies & Qloo Cultural Taste Graph*\n`;
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[920px] max-h-[90vh] rounded-[30px] bg-[#142619] border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#F7F7D9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-[#E06B55]" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#F7F7D9] truncate">
                Character Cultural Dossier — {characterName}
              </h2>
              <span className="text-xs font-sans text-[#F7F7D9]/60 truncate">
                Grounded via Qloo Cultural Taste Graph
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-sans text-[#F7F7D9] transition-all cursor-pointer shadow-sm active:scale-95"
              title="Copy entire dossier as formatted Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#F7F7D9]/80" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-sans text-[#F7F7D9] transition-all cursor-pointer shadow-sm active:scale-95"
              title="Print lookbook dossier"
            >
              <Printer className="w-3.5 h-3.5 text-[#F7F7D9]/80" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-[#F7F7D9] flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 flex flex-col gap-7 print:p-0">
          {/* Header Overview Card */}
          <div className="rounded-[22px] bg-white/[0.04] border border-white/10 p-5 sm:p-6 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#F7F7D9]">
                {characterName}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {constraints.locality && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-sans text-[#F7F7D9]/80">
                    {constraints.locality}
                  </span>
                )}
                {constraints.era && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-sans text-[#F7F7D9]/80">
                    {constraints.era}
                  </span>
                )}
                {constraints.occupation && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-sans text-[#F7F7D9]/80">
                    {constraints.occupation}
                  </span>
                )}
              </div>
            </div>
            <p className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/80 leading-relaxed">
              {characterSummary}
            </p>
          </div>

          {/* Master Cultural Thesis */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#E06B55] font-bold">
              Master Cultural Thesis
            </span>
            <div className="rounded-[20px] bg-white/[0.03] border border-white/10 p-5 sm:p-6">
              <p className="font-serif text-base sm:text-lg leading-[1.8] text-[#F7F7D9] font-light">
                {culturalDossier.tasteThesis}
              </p>
            </div>
          </div>

          {/* Psychological Wound & Tactile Armor */}
          {(culturalDossier.psychologicalWound || culturalDossier.tactileArmor) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {culturalDossier.psychologicalWound && (
                <div className="rounded-[18px] bg-white/[0.03] border border-white/10 p-5 flex flex-col gap-2">
                  <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                    Internal Tension & Vulnerability
                  </span>
                  <p className="font-sans text-xs sm:text-sm text-[#F7F7D9]/80 leading-relaxed">
                    {culturalDossier.psychologicalWound}
                  </p>
                </div>
              )}
              {culturalDossier.tactileArmor && (
                <div className="rounded-[18px] bg-white/[0.03] border border-white/10 p-5 flex flex-col gap-2">
                  <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                    Tactile Armor & Material Defense
                  </span>
                  <p className="font-sans text-xs sm:text-sm text-[#F7F7D9]/80 leading-relaxed">
                    {culturalDossier.tactileArmor}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Observed Clusters & Latent Discovery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {culturalDossier.observedClusters && culturalDossier.observedClusters.length > 0 && (
              <div className="rounded-[18px] bg-white/[0.03] border border-white/10 p-5 flex flex-col gap-2.5">
                <span className="font-serif italic font-medium text-xs text-[#F7F7D9]/60">
                  Observed Taste Clusters
                </span>
                <div className="flex flex-col gap-1.5">
                  {culturalDossier.observedClusters.map((cluster, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-[12px] bg-white/[0.03] border border-white/[0.05] font-sans text-xs text-[#F7F7D9]/85"
                    >
                      {cluster}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {culturalDossier.unconsideredAngles && culturalDossier.unconsideredAngles[0] && (
              <div className="rounded-[18px] bg-white/[0.03] border border-white/10 p-5 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                    Latent Graph Discovery: {culturalDossier.unconsideredAngles[0].title}
                  </span>
                  <p className="font-sans text-xs sm:text-sm text-[#F7F7D9]/75 leading-relaxed">
                    {culturalDossier.unconsideredAngles[0].description}
                  </p>
                </div>
                {culturalDossier.unconsideredAngles[0].groundedEntity && (
                  <span className="text-xs font-mono text-[#E06B55]">
                    Anchor: {culturalDossier.unconsideredAngles[0].groundedEntity}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Curated Inquiries & Cultural Ensembles */}
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#E06B55] font-bold">
                Curated Inquiries & Verified Ensembles ({inquiries.length})
              </span>
              <span className="text-[11px] font-sans text-[#F7F7D9]/50">
                Full Production Lookbook
              </span>
            </div>

            {inquiries.map((inq, idx) => (
              <div
                key={inq.id || idx}
                className="rounded-[22px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#F7F7D9]">
                    {inq.question}
                  </h3>
                  {inq.domain && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono uppercase text-[#E06B55] border border-white/10 flex-shrink-0">
                      {inq.domain}
                    </span>
                  )}
                </div>

                {inq.vignette && (
                  <div className="flex flex-col gap-2.5">
                    {inq.vignette.split("\n\n").map((p, pIdx) => (
                      <p
                        key={pIdx}
                        className="font-serif text-sm sm:text-base leading-relaxed text-[#F7F7D9]/85 font-light"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                )}

                {inq.entities && inq.entities.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-white/[0.08]">
                    {inq.entities.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-[16px] bg-white/[0.03] border border-white/[0.07] flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif italic font-bold text-xs sm:text-sm text-[#F7F7D9] truncate">
                            {e.name}
                          </span>
                          {e.affinityScore !== undefined && (
                            <span className="text-[10px] font-sans font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                              {e.affinityScore}%
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-[11px] text-[#F7F7D9]/70 line-clamp-2 leading-relaxed">
                          {e.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex-shrink-0 px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <span className="text-[11px] font-sans text-[#F7F7D9]/50">
            Exported from Poppies Cultural Intelligence Studio
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[#F7F7D9] hover:bg-white text-[#142619] font-sans font-medium text-xs transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
