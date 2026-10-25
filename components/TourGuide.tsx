"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Layers, BookOpen, Compass, CheckCircle2 } from "lucide-react";

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  stepNumber: string;
  icon: any;
  headline: string;
  body: string;
  highlight: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: "01",
    title: "The Creative Spark",
    icon: Compass,
    headline: "Loose instincts, zero corporate forms.",
    body: "Begin with a fragment of character: a job, a habit, or a hometown. As you write, Poppies quietly suggests contextual inquiry lenses without breaking your creative flow.",
    highlight: "Input Canvas & Adaptive Lenses",
  },
  {
    stepNumber: "02",
    title: "The Taste Graph Engine",
    icon: Sparkles,
    headline: "Bypassing the AI Monoculture Trap.",
    body: "Frontier LLMs always predict the top 0.1% internet cliché (e.g. Japanese architect = Tanizaki + Hasami porcelain + Erik Satie). Poppies queries Qloo's 10-billion-entity empirical taste graph to discover the authentic subcultural artifacts that AI statistically flattens.",
    highlight: "Qloo Empirical Graph Traversal",
  },
  {
    stepNumber: "03",
    title: "The Auteur Studio",
    icon: BookOpen,
    headline: "Dramatic scenes over raw shopping lists.",
    body: "An entity list with affinity percentages is an e-commerce catalog, not a person. Poppies synthesizes Qloo's empirical data into dramatic 2-sentence scene vignettes, psychological armor, and tactile rituals that make characters feel alive.",
    highlight: "Tactile Physical Armor & Scenes",
  },
  {
    stepNumber: "04",
    title: "The Evidence Inspector",
    icon: Layers,
    headline: "Verifiable pedigree & full creative control.",
    body: "Every cultural reference links directly to canonical Qloo Entity IDs, seed pedigrees, and curatorial notes. Steer the agent in real time, swap references, and compile a production-ready Character Lookbook.",
    highlight: "Grounding Pedigree & Dossier Compilation",
  },
];

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[560px] rounded-[32px] bg-[#162a1c]/95 border border-white/20 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between min-h-[380px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[#F7F7D9]/80">
              Stop {step.stepNumber} of 04
            </span>
            <span className="font-serif italic text-xs text-[#E06B55]">
              {step.title}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F7F7D9]/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 py-6 flex flex-col justify-center gap-3">
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#F7F7D9] tracking-tight leading-snug">
            {step.headline}
          </h3>
          <p className="font-sans text-sm sm:text-[15px] text-[#F7F7D9]/80 leading-relaxed font-light">
            {step.body}
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-[#F7F7D9]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E06B55]" />
              Core Mechanism: {step.highlight}
            </span>
          </div>
        </div>

        {/* Step Progress Indicators & Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-6 bg-[#F7F7D9]"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs font-sans text-[#F7F7D9]/80 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-1.5 rounded-full bg-[#F7F7D9] hover:bg-white text-[#162a1c] text-xs font-sans font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>{isLast ? "Begin Creating" : "Next"}</span>
              {isLast ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
