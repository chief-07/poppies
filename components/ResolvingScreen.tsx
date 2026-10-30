"use client";

import { useEffect, useState, useRef } from "react";

interface ResolvingScreenProps {
  promptText: string;
  engine?: "qloo" | "base_llm";
  onResolved: (data: any) => void;
}

function extractPromptSeeds(prompt: string): string[] {
  const pLower = prompt.toLowerCase();
  const seeds: string[] = [];

  // 1. Character Name / Subject
  const nameMatch = prompt.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  if (
    nameMatch &&
    !["The", "A", "An", "In", "On", "At", "When", "What", "Where"].includes(nameMatch[1])
  ) {
    seeds.push(nameMatch[1]);
  }

  // 2. Locality / Geography
  if (/marseille/i.test(pLower)) seeds.push("Marseille");
  else if (/nagoya/i.test(pLower)) seeds.push("Nagoya");
  else if (/detroit/i.test(pLower)) seeds.push("Detroit");
  else if (/berlin/i.test(pLower)) seeds.push("Berlin");
  else if (/tokyo/i.test(pLower)) seeds.push("Tokyo");
  else if (/osaka/i.test(pLower)) seeds.push("Osaka");
  else if (/london/i.test(pLower)) seeds.push("London");
  else if (/paris/i.test(pLower)) seeds.push("Paris");
  else if (/new york|nyc/i.test(pLower)) seeds.push("New York");
  else if (/lagos/i.test(pLower)) seeds.push("Lagos");
  else {
    const locMatch = prompt.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (locMatch) seeds.push(locMatch[1]);
  }

  // 3. Trade / Craft / Occupation
  if (/architectural conservator|conservator/i.test(pLower)) {
    seeds.push("Architectural Conservator");
  } else if (/railway|station architect|architect\b/i.test(pLower)) {
    seeds.push("Station Architect");
  } else if (/tube amplifier|amplifier|audio restorer|hardware/i.test(pLower)) {
    seeds.push("Analog Audio Restorer");
  } else if (/carpenter|woodwork/i.test(pLower)) {
    seeds.push("Fine Woodwork");
  } else if (/chef|cook|culinary/i.test(pLower)) {
    seeds.push("Culinary Craft");
  } else if (/skate|mechanic/i.test(pLower)) {
    seeds.push("Custom Builder");
  } else {
    const tradeMatch = prompt.match(/\bis\s+(?:an?|the)\s+([a-z\s-]{4,25}?)(?:\s+in|\s+who|\.|\,)/i);
    if (tradeMatch && tradeMatch[1].trim().length > 2) {
      const cap = tradeMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      seeds.push(cap);
    }
  }

  // 4. Material Focus & Everyday Objects
  if (/worktable|workbench|tool|desk|gear|bench/i.test(pLower)) {
    if (/audio|tube|soldering/i.test(pLower)) seeds.push("Soldering & Vintage Gauges");
    else if (/architect|drafting/i.test(pLower)) seeds.push("Drafting Table & Compasses");
    else if (/stone|conservator/i.test(pLower)) seeds.push("Worktable & Masonry Tools");
    else seeds.push("Worktable & Tools");
  }

  // 5. Artifact / Specific Anchor
  if (/peugeot/i.test(pLower)) seeds.push("Peugeot 205");
  else if (/pickup|truck/i.test(pLower)) seeds.push("1978 Pickup Truck");
  else if (/clock/i.test(pLower)) seeds.push("Analog Clock Restoration");
  else if (/soul|vinyl|45s/i.test(pLower)) seeds.push("Northern Soul 45s");
  else if (/ambient|piano/i.test(pLower)) seeds.push("Late-Night Soundscape");

  return seeds.slice(0, 5);
}

const QLOO_LINES = [
  "Poppies builds specific, lived-in fictional characters.",
  "Because characters feel fake when built from generic AI tropes.",
  "Reading the anchors, craft, and setting from your brief.",
  "Traversing Qloo's taste graph to uncover authentic cultural relationships.",
];

const BASE_LLM_LINES = [
  "Sampling probabilistic word associations from web pretraining.",
  "Collapsing into the statistical mean of internet culture clichés.",
  "Reading archetype keywords from your brief.",
  "Synthesizing an ungrounded baseline for direct comparison.",
];

export default function ResolvingScreen({
  promptText,
  engine = "qloo",
  onResolved,
}: ResolvingScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"enter" | "exit">("enter");
  const [visiblePills, setVisiblePills] = useState<string[]>([]);
  const [isResolved, setIsResolved] = useState(false);

  const resolvedDataRef = useRef<any>(null);
  const sequenceFinishedRef = useRef(false);

  const lines = engine === "base_llm" ? BASE_LLM_LINES : QLOO_LINES;

  useEffect(() => {
    let isMounted = true;
    const timeoutIds: NodeJS.Timeout[] = [];
    const promptSeeds = extractPromptSeeds(promptText);

    function triggerCompletion(data: any) {
      if (!isMounted) return;
      setIsResolved(true);
      timeoutIds.push(
        setTimeout(() => {
          if (isMounted) onResolved(data);
        }, 450)
      );
    }

    // Phase 0 -> Phase 1 ("Because characters feel fake when built from generic AI tropes.")
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        setFadeState("exit");
        timeoutIds.push(
          setTimeout(() => {
            if (!isMounted) return;
            setPhaseIndex(1);
            setFadeState("enter");
          }, 240)
        );
      }, 1800)
    );

    // Phase 1 -> Phase 2 ("Reading the anchors, craft, and setting from your brief.")
    // Staggered pills appear during this phase with calm, deliberate pacing
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        setFadeState("exit");
        timeoutIds.push(
          setTimeout(() => {
            if (!isMounted) return;
            setPhaseIndex(2);
            setFadeState("enter");

            // Staggered pills reveal cleanly while reading brief
            promptSeeds.forEach((seed, idx) => {
              timeoutIds.push(
                setTimeout(() => {
                  if (isMounted) {
                    setVisiblePills((prev) => (prev.includes(seed) ? prev : [...prev, seed]));
                  }
                }, 300 + idx * 340)
              );
            });
          }, 240)
        );
      }, 3900)
    );

    // Phase 2 -> Phase 3 ("Traversing Qloo's taste graph to uncover authentic cultural relationships.")
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        setFadeState("exit");
        timeoutIds.push(
          setTimeout(() => {
            if (!isMounted) return;
            setPhaseIndex(3);
            setFadeState("enter");
          }, 240)
        );
      }, 6400)
    );

    // Sequence pacing complete at 7800ms
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        sequenceFinishedRef.current = true;
        if (resolvedDataRef.current) {
          triggerCompletion(resolvedDataRef.current);
        }
      }, 7800)
    );

    // Run resolution in parallel
    async function runResolution() {
      try {
        const res = await fetch("/api/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText, engine }),
        });

        const data = await res.json();
        if (!isMounted) return;

        resolvedDataRef.current = data;
        if (sequenceFinishedRef.current) {
          triggerCompletion(data);
        }
      } catch (err) {
        console.error("Resolution error:", err);
        const fallbackData = { success: true, seeds: [] };
        resolvedDataRef.current = fallbackData;
        if (sequenceFinishedRef.current) {
          triggerCompletion(fallbackData);
        }
      }
    }

    runResolution();

    return () => {
      isMounted = false;
      timeoutIds.forEach(clearTimeout);
    };
  }, [promptText, engine, onResolved]);

  const currentLine = lines[phaseIndex] || lines[0];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-transparent px-6 select-none">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 h-[calc(100dvh+96px)] -translate-y-24 sm:translate-y-0 sm:h-full bg-cover bg-[42%_center] sm:bg-center bg-no-repeat pointer-events-none opacity-100"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green (#28402A) Center Band with Tapered Fade (Top-to-bottom on mobile, left-to-right on desktop) */}
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1240px] input-stage-mask"
        style={{
          backgroundColor: "#28402a",
        }}
      />

      {/* 3. Central Content: Single Line of Text + Clean Staggered Pills */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto gap-6 sm:gap-7 px-4">
        {/* Emblem / Logo Container */}
        <div className="relative flex items-center justify-center">
          <img
            src="/poppy-logo.png"
            alt="Poppies"
            className={`w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_30px_rgba(224,107,85,0.4)] transition-transform duration-700 ${
              isResolved ? "scale-110 drop-shadow-[0_0_35px_rgba(224,107,85,0.6)]" : "animate-pulse"
            }`}
          />
        </div>

        {/* Exactly One Single Line of Text (Header-sized, stable min-h) */}
        <div className="min-h-[48px] flex items-center justify-center w-full">
          <h2
            className={`font-serif font-normal text-lg sm:text-xl md:text-2xl text-[#F7F7D9] tracking-tight text-center transition-all duration-300 transform sm:whitespace-nowrap ${
              fadeState === "enter"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            {currentLine}
          </h2>
        </div>

        {/* Clean Extracted Pills (Appear staggered during Phase 2) */}
        <div className="min-h-[42px] flex items-center justify-center">
          {visiblePills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-2xl">
              {visiblePills.map((seed, idx) => (
                <div
                  key={`${seed}-${idx}`}
                  className="px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 animate-fade-in"
                >
                  <span className="text-xs sm:text-[13px] font-sans font-medium text-[#F7F7D9]">
                    {seed}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
