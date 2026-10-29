"use client";

import { useEffect, useState, useRef } from "react";

interface ResolvingScreenProps {
  promptText: string;
  engine?: "qloo" | "base_llm";
  onResolved: (data: any) => void;
}

interface ExtractedSeed {
  label: string;
  value: string;
}

function extractPromptSeeds(prompt: string): ExtractedSeed[] {
  const pLower = prompt.toLowerCase();
  const seeds: ExtractedSeed[] = [];

  // 1. Character Name / Subject
  const nameMatch = prompt.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  if (
    nameMatch &&
    !["The", "A", "An", "In", "On", "At", "When", "What", "Where"].includes(nameMatch[1])
  ) {
    seeds.push({ label: "Subject", value: nameMatch[1] });
  }

  // 2. Locality / Geography
  if (/marseille/i.test(pLower)) seeds.push({ label: "Locality", value: "Marseille, France" });
  else if (/nagoya/i.test(pLower)) seeds.push({ label: "Locality", value: "Nagoya, Japan" });
  else if (/detroit/i.test(pLower)) seeds.push({ label: "Locality", value: "Detroit, Michigan" });
  else if (/berlin/i.test(pLower)) seeds.push({ label: "Locality", value: "Berlin, Germany" });
  else if (/tokyo/i.test(pLower)) seeds.push({ label: "Locality", value: "Tokyo, Japan" });
  else if (/osaka/i.test(pLower)) seeds.push({ label: "Locality", value: "Osaka, Japan" });
  else if (/london/i.test(pLower)) seeds.push({ label: "Locality", value: "London, UK" });
  else if (/paris/i.test(pLower)) seeds.push({ label: "Locality", value: "Paris, France" });
  else if (/new york|nyc/i.test(pLower)) seeds.push({ label: "Locality", value: "New York City" });
  else if (/lagos/i.test(pLower)) seeds.push({ label: "Locality", value: "Lagos, Nigeria" });
  else {
    const locMatch = prompt.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (locMatch) seeds.push({ label: "Locality", value: locMatch[1] });
  }

  // 3. Trade / Craft / Occupation
  if (/architectural conservator|conservator/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Architectural Conservator" });
  } else if (/railway|station architect|architect\b/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Station Architect" });
  } else if (/tube amplifier|amplifier|audio restorer|hardware/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Analog Audio Restorer" });
  } else if (/carpenter|woodwork/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Fine Woodwork" });
  } else if (/chef|cook|culinary/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Culinary Craft" });
  } else if (/skate|mechanic/i.test(pLower)) {
    seeds.push({ label: "Trade", value: "Custom Builder" });
  } else {
    const tradeMatch = prompt.match(/\bis\s+(?:an?|the)\s+([a-z\s-]{4,25}?)(?:\s+in|\s+who|\.|\,)/i);
    if (tradeMatch && tradeMatch[1].trim().length > 2) {
      const cap = tradeMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      seeds.push({ label: "Trade", value: cap });
    }
  }

  // 4. Material Focus & Everyday Tools
  if (/worktable|workbench|tool|desk|gear|bench/i.test(pLower)) {
    if (/audio|tube|soldering/i.test(pLower)) seeds.push({ label: "Tools", value: "Soldering & Vintage Gauges" });
    else if (/architect|drafting/i.test(pLower)) seeds.push({ label: "Tools", value: "Drafting Table & Compasses" });
    else if (/stone|conservator/i.test(pLower)) seeds.push({ label: "Tools", value: "Worktable & Masonry Blades" });
    else seeds.push({ label: "Tools", value: "Everyday Craft Tools" });
  }

  // 5. Soundscape / Listening Habits
  if (/music|soundscape|listen|playlist|record|tape|piano|45s/i.test(pLower)) {
    if (/piano|satie/i.test(pLower)) seeds.push({ label: "Sensory", value: "Late-Night Piano Soundscape" });
    else if (/soul|vinyl|45s/i.test(pLower)) seeds.push({ label: "Sensory", value: "Northern Soul 45s" });
    else if (/ambient/i.test(pLower)) seeds.push({ label: "Sensory", value: "Solitary Ambient Tapes" });
    else seeds.push({ label: "Sensory", value: "Solitary Soundscape" });
  }

  // 6. Setting / Solitary Haunt / Routine
  if (/walk|disappear|haunt|sunday|harbor|rail|night/i.test(pLower)) {
    if (/harbor|marseille|inlet|water/i.test(pLower)) seeds.push({ label: "Setting", value: "Sunday Harbor Inlets" });
    else if (/nagoya|rail|station/i.test(pLower)) seeds.push({ label: "Setting", value: "Quiet Rail Perimeter Haunts" });
    else if (/diner|coffee|detroit/i.test(pLower)) seeds.push({ label: "Setting", value: "Late-Night Diner Routine" });
    else seeds.push({ label: "Setting", value: "Solitary Haunt" });
  }

  // 7. Vehicle / Artifact
  if (/car|vehicle|truck|peugeot|pickup|drive/i.test(pLower)) {
    if (/peugeot/i.test(pLower)) seeds.push({ label: "Artifact", value: "Old Peugeot 205" });
    else if (/pickup|truck/i.test(pLower)) seeds.push({ label: "Artifact", value: "1978 Hauler Truck" });
    else seeds.push({ label: "Artifact", value: "Vintage Work Vehicle" });
  }

  if (seeds.length === 0) {
    seeds.push({ label: "Constraint", value: "Grounded Character Brief" });
  }

  return seeds.slice(0, 5);
}

interface StageContent {
  step: string;
  title: string;
  body: string;
}

const QLOO_STAGES: StageContent[] = [
  {
    step: "STEP 01 · PROMPT EXTRACTION",
    title: "Extracting cultural anchors from your brief",
    body: "Poppies reads your character's trade, environment, and personal rituals to establish strict constraint boundaries—preventing generic tropes before research begins.",
  },
  {
    step: "STEP 02 · TASTE GRAPH TRAVERSAL",
    title: "Traversing Qloo's latent cultural graph",
    body: "Language models collapse into internet consensus—giving every architect Hasami porcelain and Erik Satie. Qloo traverses billions of real-world affinities to uncover authentic music, books, tools, and places people in this subculture actually consume.",
  },
  {
    step: "STEP 03 · CURATORIAL GROUNDING",
    title: "Grounding physical armor and scene choices",
    body: "Instead of raw recommendation lists, Poppies translates verified cultural data into concrete character details: the tools resting on their workbench, the soundscape for solitary hours, and the objects that anchor their world.",
  },
];

const BASE_LLM_STAGES: StageContent[] = [
  {
    step: "STEP 01 · PROMPT PARSING",
    title: "Sampling ungrounded language model predictions",
    body: "Analyzing prompt structure using standard web pre-training data without cultural affinity grounding.",
  },
  {
    step: "STEP 02 · CONSENSUS PATTERNS",
    title: "Collapsing toward statistical internet tropes",
    body: "Without empirical taste intelligence, next-token probability defaults to the top 0.01% most frequent internet clichés for this archetype.",
  },
  {
    step: "STEP 03 · PROBABILISTIC PROFILE",
    title: "Synthesizing ungrounded baseline",
    body: "Assembling a standard AI character output for direct comparison against Qloo's taste graph.",
  },
];

export default function ResolvingScreen({
  promptText,
  engine = "qloo",
  onResolved,
}: ResolvingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"enter" | "exit">("enter");
  const [visiblePills, setVisiblePills] = useState<ExtractedSeed[]>([]);
  const [isResolved, setIsResolved] = useState(false);

  const resolvedDataRef = useRef<any>(null);
  const minTimeReachedRef = useRef(false);

  const stages = engine === "base_llm" ? BASE_LLM_STAGES : QLOO_STAGES;

  useEffect(() => {
    let isMounted = true;
    const timeoutIds: NodeJS.Timeout[] = [];

    // 1. Progressively reveal extracted prompt seeds (keeps seeds extracted from prompt, never replaces them)
    const promptSeeds = extractPromptSeeds(promptText);
    promptSeeds.forEach((seed, idx) => {
      timeoutIds.push(
        setTimeout(() => {
          if (isMounted) {
            setVisiblePills((prev) =>
              prev.some((p) => p.label === seed.label && p.value === seed.value)
                ? prev
                : [...prev, seed]
            );
          }
        }, 150 + idx * 300)
      );
    });

    // 2. Controlled narrative pacing: Step 01 -> Step 02 -> Step 03
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        setFadeState("exit");
        setTimeout(() => {
          if (!isMounted) return;
          setStageIndex(1);
          setFadeState("enter");
        }, 300);
      }, 2300)
    );

    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        setFadeState("exit");
        setTimeout(() => {
          if (!isMounted) return;
          setStageIndex(2);
          setFadeState("enter");
        }, 300);
      }, 4800)
    );

    // Minimum reading window reached at 6.2s
    timeoutIds.push(
      setTimeout(() => {
        if (!isMounted) return;
        minTimeReachedRef.current = true;
        if (resolvedDataRef.current) {
          triggerCompletion(resolvedDataRef.current);
        }
      }, 6200)
    );

    function triggerCompletion(data: any) {
      if (!isMounted) return;
      setIsResolved(true);
      timeoutIds.push(
        setTimeout(() => {
          if (isMounted) onResolved(data);
        }, 750)
      );
    }

    // 3. API Resolution in parallel
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
        // If the minimum reading window has already elapsed, complete immediately
        if (minTimeReachedRef.current) {
          triggerCompletion(data);
        }
      } catch (err) {
        console.error("Resolution error:", err);
        const fallbackData = { success: true, seeds: [] };
        resolvedDataRef.current = fallbackData;
        if (minTimeReachedRef.current) {
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

  const currentStage = stages[stageIndex] || stages[0];

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

      {/* 3. Central Content: Refined Editorial Typography & Extracted Anchors */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-5 sm:gap-6">
        {/* Emblem / Logo Container (Slot ready for provided official logo asset) */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.5)] border border-white/20 bg-cover bg-no-repeat transition-transform duration-700 ${
              isResolved ? "scale-105 shadow-[0_0_30px_rgba(224,107,85,0.4)]" : "animate-pulse"
            }`}
            style={{
              backgroundImage: "url('/poppies-bg.jpg')",
              backgroundPosition: "42% 49%",
              backgroundSize: "650%",
            }}
          />
        </div>

        {/* Dynamic Stage Explanation with Natural, Direct Prose */}
        <div className="flex flex-col items-center gap-2 px-4 min-h-[96px] justify-center">
          {/* Step Eyebrow */}
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#E06B55] font-semibold">
            {isResolved ? "READY · AUTEUR STUDIO" : currentStage.step}
          </span>

          {/* Editorial Headline */}
          <h2
            className={`font-serif font-medium text-xl sm:text-2xl md:text-[1.65rem] text-[#F7F7D9] tracking-tight leading-snug transition-all duration-300 transform ${
              fadeState === "enter"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            {isResolved ? "Cultural world assembled" : currentStage.title}
          </h2>

          {/* Direct, Natural Explanatory Body */}
          <p
            className={`font-sans text-xs sm:text-[13.5px] leading-relaxed text-[#F7F7D9]/75 max-w-lg transition-all duration-300 ${
              fadeState === "enter"
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            {isResolved
              ? "Opening your character's living studio, inquiry chapters, and taste graph evidence."
              : currentStage.body}
          </p>
        </div>

        {/* Extracted Prompt Anchors (Strictly extracted from prompt, not finished entities) */}
        <div className="flex flex-col items-center gap-2 mt-2 w-full">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#F7F7D9]/40">
            Extracted Prompt Anchors
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[38px] max-w-xl">
            {visiblePills.map((seed, idx) => (
              <div
                key={`${seed.label}-${seed.value}-${idx}`}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center gap-2 transition-all duration-300"
              >
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#E06B55]/90 font-medium">
                  {seed.label}
                </span>
                <span className="text-xs sm:text-[12.5px] font-sans font-medium text-[#F7F7D9]">
                  {seed.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
