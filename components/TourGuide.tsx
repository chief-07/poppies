"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Compass, Layers, ToggleRight, Check } from "lucide-react";

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  targetId: string;
  stepNumber: string;
  title: string;
  headline: string;
  body: string;
  icon: any;
  arrowPosition: "top" | "bottom" | "left" | "right";
  preferredOffset: { x: number; y: number };
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-prompt-bar",
    stepNumber: "01",
    title: "Prompt Bar",
    headline: "Ask a question or direct a scene.",
    body: "Type any question or scene here (e.g. 'What car does he drive?', 'How does he brew coffee during blackouts?'). Poppies traverses Qloo's taste graph to ground every answer.",
    icon: MessageSquare,
    arrowPosition: "bottom",
    preferredOffset: { x: 0, y: -16 },
  },
  {
    targetId: "tour-center-pane",
    stepNumber: "02",
    title: "Center Pane",
    headline: "Cultural investigation and grounded writeups.",
    body: "Poppies explains what type of stuff the character likes or uses in plain, direct English. No purple prose or art-critic jargon—just clear deductions and real Qloo options.",
    icon: Compass,
    arrowPosition: "top",
    preferredOffset: { x: 0, y: 24 },
  },
  {
    targetId: "tour-left-pane",
    stepNumber: "03",
    title: "Left Pane",
    headline: "Dynamic inquiries and assembled dossier.",
    body: "Navigate between your creative questions and autonomous agent inquiries. Click 'Cultural Dossier' anytime to view the character's complete cultural thesis and tensions.",
    icon: Layers,
    arrowPosition: "left",
    preferredOffset: { x: 18, y: 60 },
  },
  {
    targetId: "tour-tappable-objects",
    stepNumber: "04",
    title: "Tappable Qloo Objects",
    headline: "Every pick is grounded and verifiable.",
    body: "Every terracotta tag [Name ↗] and ensemble card is interactive. Tap any item to inspect Qloo entity IDs, latent affinities, and provenance. Use '+ Fetch 4 More' to expand.",
    icon: Sparkles,
    arrowPosition: "bottom",
    preferredOffset: { x: 0, y: -16 },
  },
  {
    targetId: "tour-qloo-toggle",
    stepNumber: "05",
    title: "Qloo Toggle",
    headline: "Empirical taste graph vs. AI monoculture.",
    body: "Toggle Qloo ON (red) to ground deductions in 10B+ real cultural data points, or toggle OFF to see how standard AI falls into generic tropes and clichés.",
    icon: ToggleRight,
    arrowPosition: "top",
    preferredOffset: { x: 0, y: 14 },
  },
];

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const targetEl = document.getElementById(step.targetId);
    if (!targetEl) {
      setTargetRect(null);
      setCardPos(null);
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    const cardWidth = 380;
    const cardHeight = 220;
    const padding = 16;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let left = 0;
    let top = 0;

    switch (step.arrowPosition) {
      case "bottom":
        // Card placed above target, arrow points down
        top = Math.max(padding, rect.top - cardHeight + step.preferredOffset.y);
        left = Math.max(
          padding,
          Math.min(winWidth - cardWidth - padding, rect.left + rect.width / 2 - cardWidth / 2)
        );
        break;

      case "top":
        // Card placed below target, arrow points up
        top = Math.min(winHeight - cardHeight - padding, rect.bottom + step.preferredOffset.y);
        left = Math.max(
          padding,
          Math.min(winWidth - cardWidth - padding, rect.left + rect.width / 2 - cardWidth / 2)
        );
        break;

      case "left":
        // Card placed to the right of target, arrow points left
        left = Math.min(winWidth - cardWidth - padding, rect.right + step.preferredOffset.x);
        top = Math.max(
          padding,
          Math.min(winHeight - cardHeight - padding, rect.top + step.preferredOffset.y)
        );
        break;

      case "right":
        // Card placed to the left of target, arrow points right
        left = Math.max(padding, rect.left - cardWidth - step.preferredOffset.x);
        top = Math.max(
          padding,
          Math.min(winHeight - cardHeight - padding, rect.top + step.preferredOffset.y)
        );
        break;
    }

    setCardPos({ top, left });
  }, [isOpen, step]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  // Global escape key to close tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[1.5px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Pulsing Spotlight Ring around the Target Element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-[24px] border-2 border-[#E06B55] shadow-[0_0_35px_rgba(224,107,85,0.45),inset_0_0_15px_rgba(224,107,85,0.2)] transition-all duration-300 ease-out z-[101]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Anchored Tooltip Card */}
      <div
        ref={cardRef}
        className={`fixed z-[102] w-full max-w-[380px] rounded-[24px] bg-[#16271a]/98 border border-white/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between transition-all duration-300 ease-out ${
          cardPos ? "" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
        style={
          cardPos
            ? {
                top: `${cardPos.top}px`,
                left: `${cardPos.left}px`,
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pointer Arrow */}
        {cardPos && targetRect && (
          <>
            {step.arrowPosition === "bottom" && (
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#16271a]" />
            )}
            {step.arrowPosition === "top" && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-[#16271a]" />
            )}
            {step.arrowPosition === "left" && (
              <div className="absolute -left-2.5 top-8 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#16271a]" />
            )}
            {step.arrowPosition === "right" && (
              <div className="absolute -right-2.5 top-8 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-[#16271a]" />
            )}
          </>
        )}

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[#F7F7D9]/80 font-bold">
              {step.stepNumber} / 05
            </span>
            <span className="font-serif italic font-medium text-xs text-[#E06B55] flex items-center gap-1">
              <StepIcon className="w-3 h-3" />
              {step.title}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F7F7D9]/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="py-3.5 flex flex-col gap-1.5">
          <h4 className="font-serif font-bold text-base text-[#F7F7D9] leading-snug tracking-tight">
            {step.headline}
          </h4>
          <p className="font-sans text-xs text-[#F7F7D9]/80 leading-relaxed font-light">
            {step.body}
          </p>
        </div>

        {/* Card Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-5 bg-[#E06B55]"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs font-sans text-[#F7F7D9]/80 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1 rounded-full bg-[#E06B55] hover:bg-[#E06B55]/90 text-xs font-sans font-bold text-white transition-all cursor-pointer shadow-md flex items-center gap-1 active:scale-95"
            >
              <span>{isLast ? "Done" : "Next"}</span>
              {isLast ? (
                <Check className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
