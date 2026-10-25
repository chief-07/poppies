"use client";

import { Sparkles, Cpu, HelpCircle } from "lucide-react";

interface HeaderControlsProps {
  engine: "qloo" | "base_llm";
  onToggleEngine: (engine: "qloo" | "base_llm") => void;
  onOpenTour: () => void;
}

export default function HeaderControls({
  engine,
  onToggleEngine,
  onOpenTour,
}: HeaderControlsProps) {
  const isQloo = engine === "qloo";

  return (
    <div className="flex items-center gap-2.5 z-40">
      {/* 60s Tour Button */}
      <button
        type="button"
        onClick={onOpenTour}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md text-[#F7F7D9]/80 hover:text-white transition-all text-xs font-sans cursor-pointer shadow-sm active:scale-95"
        title="Open interactive 60-second product tour"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#F7F7D9]/70" />
        <span className="hidden sm:inline font-medium">60s Tour</span>
      </button>

      {/* Taste Engine Toggle Pill */}
      <div
        className="flex items-center p-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-lg shadow-inner"
        role="group"
        aria-label="Select Intelligence Engine"
      >
        {/* Option 1: Qloo Taste Graph */}
        <button
          type="button"
          onClick={() => onToggleEngine("qloo")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all duration-200 cursor-pointer ${
            isQloo
              ? "bg-[#28402a] text-[#F7F7D9] font-bold shadow-md border border-[#F7F7D9]/30"
              : "text-[#F7F7D9]/60 hover:text-[#F7F7D9] font-medium"
          }`}
          title="Powered by Qloo's 10-billion-entity empirical taste graph"
        >
          <Sparkles className={`w-3 h-3 ${isQloo ? "text-[#E06B55]" : "text-white/40"}`} />
          <span>Qloo Taste Graph</span>
        </button>

        {/* Option 2: Vanilla Base LLM */}
        <button
          type="button"
          onClick={() => onToggleEngine("base_llm")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all duration-200 cursor-pointer ${
            !isQloo
              ? "bg-[#333333] text-gray-200 font-bold shadow-md border border-white/30"
              : "text-[#F7F7D9]/60 hover:text-[#F7F7D9] font-medium"
          }`}
          title="Vanilla LLM mode without taste graph grounding (Demonstrates AI monoculture & clichés)"
        >
          <Cpu className="w-3 h-3 text-gray-400" />
          <span>Vanilla Base LLM</span>
        </button>
      </div>
    </div>
  );
}
