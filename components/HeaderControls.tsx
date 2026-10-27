"use client";

import { Sparkles, HelpCircle } from "lucide-react";

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

      {/* Clean Qloo Toggle Switch Button */}
      <button
        id="tour-qloo-toggle"
        type="button"
        onClick={() => onToggleEngine(isQloo ? "base_llm" : "qloo")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-lg transition-all cursor-pointer shadow-sm active:scale-95 group"
        title={
          isQloo
            ? "Qloo Empirical Taste Graph Grounding is ACTIVE (Click to toggle Vanilla LLM mode)"
            : "Vanilla Base LLM mode active (Click to enable Qloo Grounding)"
        }
      >
        <span className="text-xs font-sans text-[#F7F7D9] font-medium flex items-center gap-1">
          <Sparkles className={`w-3 h-3 ${isQloo ? "text-[#E06B55]" : "text-white/40"}`} />
          <span>Qloo</span>
        </span>

        {/* Toggle Track: Red when on, dark when off */}
        <div
          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
            isQloo ? "bg-[#E06B55]" : "bg-white/20"
          }`}
        >
          {/* White Thumb */}
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
              isQloo ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>

        <span
          className={`text-[10px] font-mono font-bold tracking-tight ${
            isQloo ? "text-[#E06B55]" : "text-[#F7F7D9]/40"
          }`}
        >
          {isQloo ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}
