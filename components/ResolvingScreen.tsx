"use client";

import { useEffect, useState } from "react";

interface ResolvingScreenProps {
  promptText: string;
  onResolved: (data: any) => void;
}

export default function ResolvingScreen({ promptText, onResolved }: ResolvingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"enter" | "exit">("enter");
  // Start with ZERO pills - they only populate as the agent reasons
  const [visiblePills, setVisiblePills] = useState<string[]>([]);

  // Single clean narrative line per stage (no header/subheader clutter)
  const narrativeExplanations = [
    "Poppies extracts cultural anchors from your prompt",
    "Poppies resolves seeds against Qloo's taste graph",
    "Poppies reveals hidden connections across culture",
    "Poppies weaves an authentic life for your character",
  ];

  useEffect(() => {
    let isMounted = true;
    let timeoutIds: NodeJS.Timeout[] = [];

    async function runAgentAndQloo() {
      try {
        const res = await fetch("/api/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText }),
        });

        const data = await res.json();

        if (!isMounted) return;

        // Collect real resolved entities
        const discoveredEntities: string[] = [];
        if (data.seeds && data.seeds.length > 0) {
          data.seeds.forEach((s: any) => discoveredEntities.push(s.name));
        }
        if (data.discoveries?.music && data.discoveries.music.length > 0) {
          discoveredEntities.push(data.discoveries.music[0].name);
        }
        if (data.discoveries?.literature && data.discoveries.literature.length > 0) {
          discoveredEntities.push(data.discoveries.literature[0].name);
        }
        if (data.discoveries?.wardrobeAndObjects && data.discoveries.wardrobeAndObjects.length > 0) {
          discoveredEntities.push(data.discoveries.wardrobeAndObjects[0].name);
        }

        // Stagger pill appearance as agent works through stages
        if (discoveredEntities.length > 0) {
          // Pill 1 appears at 2.8s
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted && discoveredEntities[0]) {
                setVisiblePills((prev) => [...prev, discoveredEntities[0]]);
              }
            }, 2800)
          );

          // Pill 2 appears at 5.5s
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted && discoveredEntities[1]) {
                setVisiblePills((prev) => [...prev, discoveredEntities[1]]);
              }
            }, 5500)
          );

          // Pill 3 appears at 8.5s
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted && discoveredEntities[2]) {
                setVisiblePills((prev) => [...prev, discoveredEntities[2]]);
              }
            }, 8500)
          );

          // Pill 4 appears at 11s
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted && discoveredEntities[3]) {
                setVisiblePills((prev) => [...prev, discoveredEntities[3]]);
              }
            }, 11000)
          );
        }

        // Complete after ample reading time (~14.5s total)
        timeoutIds.push(
          setTimeout(() => {
            if (isMounted) onResolved(data);
          }, 14500)
        );
      } catch (err) {
        console.error("Resolution error:", err);
        timeoutIds.push(
          setTimeout(() => {
            if (isMounted) onResolved({ success: true, seeds: [] });
          }, 12000)
        );
      }
    }

    runAgentAndQloo();

    // Stage transition timer with smooth fade out/in (3.6s per stage)
    const stageInterval = setInterval(() => {
      setFadeState("exit");
      setTimeout(() => {
        setStageIndex((prev) => (prev < narrativeExplanations.length - 1 ? prev + 1 : prev));
        setFadeState("enter");
      }, 450); // fade out duration
    }, 3600);

    return () => {
      isMounted = false;
      clearInterval(stageInterval);
      timeoutIds.forEach(clearTimeout);
    };
  }, [promptText, onResolved]);

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
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.5)] border border-white/20 bg-cover bg-no-repeat transition-transform duration-1000 animate-pulse"
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
            className={`font-serif font-bold text-2xl sm:text-3xl md:text-[2.1rem] text-[#F7F7D9] tracking-tight leading-snug transition-all duration-500 transform ${
              fadeState === "enter"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
          >
            {narrativeExplanations[stageIndex]}
          </h2>
        </div>

        {/* Frosted Glass Pills (Populate dynamically one by one) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[48px] max-w-2xl mt-1">
          {visiblePills.map((pill, idx) => (
            <div
              key={idx}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/[0.06] border border-white/[0.15] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-500 animate-fade-in"
            >
              <span className="text-[#F7F7D9] text-sm sm:text-base font-extrabold italic font-sans tracking-wide">
                {pill}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
