"use client";

import { useEffect, useState } from "react";

interface ResolvingScreenProps {
  promptText: string;
  onResolved: (data: any) => void;
}

export default function ResolvingScreen({ promptText, onResolved }: ResolvingScreenProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [pills, setPills] = useState<string[]>(["Nagoya", "Train Architecture", "Solitary Habits"]);

  const narrativeStates = [
    {
      title: "Poppies extracts cultural anchors",
      subtitle: "Parsing implicit psychographic signals from your prompt...",
    },
    {
      title: "Poppies resolves seeds against Qloo",
      subtitle: "Traversing 250M+ cultural entities without personal data...",
    },
    {
      title: "Poppies reveals hidden connections",
      subtitle: "Discovering latent taste bridges across literature, sound, and spaces...",
    },
    {
      title: "Poppies weaves an authentic life",
      subtitle: "Grounding your character in empirical human taste...",
    },
  ];

  useEffect(() => {
    // 1. Trigger the live API call to Qloo
    let isMounted = true;

    async function executeResolution() {
      try {
        const res = await fetch("/api/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText }),
        });

        const data = await res.json();

        if (isMounted && data.success) {
          // Extract discovered entity names for the pills
          const livePillNames: string[] = [];

          if (data.seeds && data.seeds.length > 0) {
            data.seeds.forEach((s: any) => livePillNames.push(s.name));
          }
          if (data.discoveries?.music && data.discoveries.music.length > 0) {
            livePillNames.push(data.discoveries.music[0].name);
          }
          if (data.discoveries?.literature && data.discoveries.literature.length > 0) {
            livePillNames.push(data.discoveries.literature[0].name);
          }
          if (data.discoveries?.wardrobeAndObjects && data.discoveries.wardrobeAndObjects.length > 0) {
            livePillNames.push(data.discoveries.wardrobeAndObjects[0].name);
          }

          if (livePillNames.length > 0) {
            setPills(livePillNames);
          }

          // Delay slightly so the user experiences the narrative progression
          setTimeout(() => {
            if (isMounted) onResolved(data);
          }, 6500);
        }
      } catch (err) {
        console.error("Resolution failed, using fallback:", err);
        setTimeout(() => {
          if (isMounted) onResolved({ success: true, seeds: [] });
        }, 5500);
      }
    }

    executeResolution();

    // 2. Cycle narrative stages
    const timer = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < narrativeStates.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1600);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [promptText, onResolved]);

  const currentStage = narrativeStates[stageIndex];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#28402a] px-6 select-none animate-fade-in">
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

      {/* 3. Central Content (Matching Mockup exactly) */}
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

        {/* Cycling Narrative Headline */}
        <div className="min-h-[70px] sm:min-h-[85px] flex flex-col items-center justify-center">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-[#F7F7D9] tracking-tight leading-snug transition-all duration-500">
            {currentStage.title}
          </h2>
          <p className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/75 mt-2 transition-opacity duration-300">
            {currentStage.subtitle}
          </p>
        </div>

        {/* Frosted Glass Pills (Resolved Seeds & Qloo Entities) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 max-w-2xl">
          {pills.map((pill, idx) => (
            <div
              key={idx}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white/[0.06] border border-white/[0.15] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)] transition-all duration-300 animate-fade-in"
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
