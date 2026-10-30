"use client";

import { HelpCircle } from "lucide-react";

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
    <div className="flex items-center gap-1.5 sm:gap-2 z-40">
      {/* 60s Tour Button */}
      <button
        type="button"
        onClick={onOpenTour}
        className="flex items-center justify-center w-7 h-7 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 backdrop-blur-md text-[#F7F7D9]/80 hover:text-white transition-all text-xs font-sans cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
        title="Open interactive 60-second product tour"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#F7F7D9]/70" />
        <span className="hidden sm:inline font-medium ml-1.5">60s Tour</span>
      </button>

      {/* Clean Qloo Toggle Switch Button (No AI sparkle icon) */}
      <button
        id="tour-qloo-toggle"
        type="button"
        onClick={() => onToggleEngine(isQloo ? "base_llm" : "qloo")}
        className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-lg transition-all cursor-pointer shadow-sm active:scale-95 group flex-shrink-0"
        title={
          isQloo
            ? "Qloo Grounding is ON. Click to switch to Vanilla Base LLM."
            : "Qloo Grounding is OFF. Click to enable Qloo Grounding."
        }
      >
        <span className="text-[11px] sm:text-xs font-sans text-[#F7F7D9] font-medium flex items-center gap-1 sm:gap-1.5">
          <span className="hidden xs:inline">Qloo:</span>
          <strong className={`font-mono font-bold text-[10px] sm:text-xs ${isQloo ? "text-[#E06B55]" : "text-[#F7F7D9]/50"}`}>
            {isQloo ? "ON" : "OFF"}
          </strong>
        </span>

        {/* Toggle Track: Red when on, dark when off */}
        <div
          className={`w-7 sm:w-9 h-4 sm:h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
            isQloo ? "bg-[#E06B55]" : "bg-white/20"
          }`}
        >
          {/* White Thumb */}
          <div
            className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
              isQloo ? "translate-x-3 sm:translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
