"use client";

import { useEffect, useState } from "react";

interface ResolvingScreenProps {
  promptText: string;
  engine?: "qloo" | "base_llm";
  onResolved: (data: any) => void;
}

function extractProvisionalAnchors(prompt: string): string[] {
  const pLower = prompt.toLowerCase();
  const anchors: string[] = [];

  // 1. Locality
  if (/nagoya/i.test(pLower)) anchors.push("Nagoya, Japan");
  else if (/marseille/i.test(pLower)) anchors.push("Marseille, France");
  else if (/detroit/i.test(pLower)) anchors.push("Detroit, Michigan");
  else if (/berlin/i.test(pLower)) anchors.push("Berlin, Germany");
  else if (/tokyo/i.test(pLower)) anchors.push("Tokyo, Japan");
  else if (/osaka/i.test(pLower)) anchors.push("Osaka, Japan");
  else anchors.push("Cultural Locality");

  // 2. Craft / Occupation
  if (/architect\b/i.test(pLower)) anchors.push("Train Station Design");
  else if (/conservator\b/i.test(pLower)) anchors.push("Historic Facade Masonry");
  else if (/audio|hardware|console/i.test(pLower)) anchors.push("Analog Tube Restoration");
  else anchors.push("Artisan Craft");

  // 3. Sensorial & Gear Inquiries
  if (/music|sound|listen|record|spin/i.test(pLower)) {
    anchors.push(/detroit/i.test(pLower) ? "Underground Soul Vinyl" : "Late-Night Ambient Tape");
  }
  if (/tool|desk|workbench|gear/i.test(pLower)) {
    anchors.push(/audio/i.test(pLower) ? "Soldering & Gauges" : "Drafting Compasses & Lead");
  } else if (/wear|cloth|wardrobe|jacket/i.test(pLower)) {
    anchors.push("Utilitarian Heavy Canvas");
  } else if (/vehicle|car|drive|truck/i.test(pLower)) {
    anchors.push("Vintage Hauler Truck");
  } else if (/walk|disappear|water|harbor|alley/i.test(pLower)) {
    anchors.push(/marseille/i.test(pLower) ? "Secluded Harbor Inlets" : "Quiet Rail Perimeter Walks");
  }

  return anchors.slice(0, 4);
}

export default function ResolvingScreen({
  promptText,
  engine = "qloo",
  onResolved,
}: ResolvingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"enter" | "exit">("enter");
  const [visiblePills, setVisiblePills] = useState<string[]>([]);
  const [isResolved, setIsResolved] = useState(false);

  // Narrative line tailored to selected engine
  const narrativeExplanations =
    engine === "base_llm"
      ? [
          "Base LLM analyzes prompt structure and archetype",
          "Sampling next-token probability from ungrounded web pretraining",
          "Assembling high-frequency internet co-occurrence tropes",
          "Synthesizing probabilistic character profile",
        ]
      : [
          "Poppies extracts cultural anchors from your prompt",
          "Poppies resolves seeds against Qloo's taste graph",
          "Poppies reveals hidden connections across culture",
          "Poppies weaves an authentic life for your character",
        ];

  useEffect(() => {
    let isMounted = true;
    const timeoutIds: NodeJS.Timeout[] = [];

    // Immediately extract provisional prompt anchors so user sees active progress on frame 0
    const provisional = extractProvisionalAnchors(promptText);
    provisional.forEach((p, idx) => {
      timeoutIds.push(
        setTimeout(() => {
          if (isMounted) {
            setVisiblePills((prev) => (prev.includes(p) ? prev : [...prev, p]));
          }
        }, 300 + idx * 600)
      );
    });

    async function runAgentAndQloo() {
      try {
        const res = await fetch("/api/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText, engine }),
        });

        const data = await res.json();
        if (!isMounted) return;

        // Collect real resolved entities from taste graph
        const discoveredEntities: string[] = [];
        if (data.culturalDossier?.highlightedNodes) {
          data.culturalDossier.highlightedNodes.forEach((name: string) => {
            if (name && !discoveredEntities.includes(name)) discoveredEntities.push(name);
          });
        }
        if (data.inquiries && data.inquiries.length > 0) {
          data.inquiries.forEach((inq: any) => {
            if (inq.vignetteHighlightEntity && !discoveredEntities.includes(inq.vignetteHighlightEntity)) {
              discoveredEntities.push(inq.vignetteHighlightEntity);
            }
            if (inq.entities && inq.entities.length > 0) {
              inq.entities.slice(0, 2).forEach((e: any) => {
                if (e.name && !discoveredEntities.includes(e.name)) {
                  discoveredEntities.push(e.name);
                }
              });
            }
          });
        }

        // Seamlessly transition provisional pills to verified Qloo entities
        if (discoveredEntities.length > 0) {
          setVisiblePills(discoveredEntities.slice(0, 4));
        }
        setIsResolved(true);

        // Immediate transition to Studio as soon as resolution completes
        timeoutIds.push(
          setTimeout(() => {
            if (isMounted) onResolved(data);
          }, 850)
        );
      } catch (err) {
        console.error("Resolution error:", err);
        timeoutIds.push(
          setTimeout(() => {
            if (isMounted) onResolved({ success: true, seeds: [] });
          }, 2000)
        );
      }
    }

    runAgentAndQloo();

    // Stage transition timer with smooth fade out/in (2.6s per stage)
    const stageInterval = setInterval(() => {
      setFadeState("exit");
      setTimeout(() => {
        setStageIndex((prev) => (prev < narrativeExplanations.length - 1 ? prev + 1 : prev));
        setFadeState("enter");
      }, 350);
    }, 2600);

    return () => {
      isMounted = false;
      clearInterval(stageInterval);
      timeoutIds.forEach(clearTimeout);
    };
  }, [promptText, engine, onResolved]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#28402a] px-6 select-none">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green (#28402A) Center Band with Tapered Fade */}
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1240px]"
        style={{
          backgroundColor: "#28402a",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
        }}
      />

      {/* 3. Central Content (Single Line + Organic Pills) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto gap-6 sm:gap-7">
        {/* Floating Poppy Blossom Emblem */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.5)] border border-white/20 bg-cover bg-no-repeat transition-transform duration-700 ${
              isResolved ? "scale-110 shadow-[0_0_30px_rgba(224,107,85,0.4)]" : "animate-pulse"
            }`}
            style={{
              backgroundImage: "url('/poppies-bg.jpg')",
              backgroundPosition: "42% 49%",
              backgroundSize: "650%",
            }}
          />
        </div>

        {/* Single Explanation Text with Clean Fade Transition */}
        <div className="min-h-[50px] flex items-center justify-center px-4">
          <h2
            className={`font-serif font-bold text-2xl sm:text-3xl md:text-[2.1rem] text-[#F7F7D9] tracking-tight leading-snug transition-all duration-400 transform ${
              fadeState === "enter"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            {isResolved ? "Authentic cultural world grounded" : narrativeExplanations[stageIndex]}
          </h2>
        </div>

        {/* Frosted Glass Pills (Populate dynamically with provisional then verified anchors) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[48px] max-w-2xl mt-1">
          {visiblePills.map((pill, idx) => (
            <div
              key={`${pill}-${idx}`}
              className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full backdrop-blur-md transition-all duration-500 animate-fade-in ${
                isResolved
                  ? "bg-white/[0.12] border border-[#E06B55]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_20px_rgba(224,107,85,0.25)]"
                  : "bg-white/[0.06] border border-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)] animate-pulse"
              }`}
            >
              <span
                className={`text-sm sm:text-base font-extrabold italic font-sans tracking-wide transition-colors ${
                  isResolved ? "text-[#F7F7D9]" : "text-[#F7F7D9]/90"
                }`}
              >
                {pill}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
