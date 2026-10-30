"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, MessageSquare, Compass, Layers, ToggleRight, Bookmark, Check } from "lucide-react";

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
    icon: Bookmark,
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

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const isMobile = winWidth < 640;
    const cardWidth = Math.min(360, winWidth - 32);
    const cardHeight = 220;
    const padding = 16;

    // On mobile or if target element is hidden/collapsed, position tour card safely at bottom center
    if (!targetEl || rect.width === 0 || rect.height === 0 || isMobile) {
      setTargetRect(targetEl && rect.width > 0 ? rect : null);
      const mTop = Math.max(padding, winHeight - cardHeight - 24);
      const mLeft = Math.max(padding, winWidth / 2 - cardWidth / 2);
      setCardPos({ top: mTop, left: mLeft });
      return;
    }

    let left = 0;
    let top = 0;

    // Special placement for large elements like the center pane
    if (step.targetId === "tour-center-pane") {
      top = Math.max(padding, rect.top + 30);
      left = Math.max(
        padding,
        Math.min(winWidth - cardWidth - padding, rect.left + 35)
      );
    } else {
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
          if (rect.right > winWidth - cardWidth) {
            left = Math.max(padding, rect.right - cardWidth);
          } else {
            left = Math.max(
              padding,
              Math.min(winWidth - cardWidth - padding, rect.left + rect.width / 2 - cardWidth / 2)
            );
          }
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
      {/* Dimmed overlay with SVG mask cutout: Target element is 100% un-dimmed and un-blurred, no glowing border */}
      <svg
        className="fixed inset-0 w-full h-full z-[100] cursor-pointer"
        onClick={onClose}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White dims the background screen */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout keeps the target section completely crisp, clear, and unblurred */}
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="20"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.45)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Cream Tour Card with Thick Green Border */}
      <div
        ref={cardRef}
        className={`fixed z-[102] w-full max-w-[380px] rounded-[24px] bg-[#F7F7D9] border-[2.5px] border-[#182a1d] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col justify-between transition-all duration-300 ease-out select-none ${
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
        {/* Pointer Arrow in matching cream color (Desktop only) */}
        {cardPos && targetRect && (
          <div className="hidden sm:block">
            {step.arrowPosition === "bottom" && (
              <div
                style={{
                  left: `${Math.min(350, Math.max(30, targetRect.left + targetRect.width / 2 - cardPos.left))}px`,
                }}
                className="absolute -bottom-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#F7F7D9] filter drop-shadow-[0_2px_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {step.arrowPosition === "top" && (
              <div
                style={{
                  left: `${Math.min(350, Math.max(30, targetRect.left + targetRect.width / 2 - cardPos.left))}px`,
                }}
                className="absolute -top-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-[#F7F7D9] filter drop-shadow-[0_-2px_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {step.arrowPosition === "left" && (
              <div
                style={{
                  top: `${Math.min(190, Math.max(25, targetRect.top + 30 - cardPos.top))}px`,
                }}
                className="absolute -left-2.5 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#F7F7D9] filter drop-shadow-[-2px_0_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {step.arrowPosition === "right" && (
              <div
                style={{
                  top: `${Math.min(190, Math.max(25, targetRect.top + 30 - cardPos.top))}px`,
                }}
                className="absolute -right-2.5 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-[#F7F7D9] filter drop-shadow-[2px_0_1px_rgba(24,42,29,0.4)]"
              />
            )}
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#182a1d]/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#182a1d]/10 border border-[#182a1d]/20 text-[#182a1d] font-bold">
              {step.stepNumber} / 05
            </span>
            <span className="font-serif italic font-bold text-xs text-[#E06B55] flex items-center gap-1.5">
              <StepIcon className="w-3.5 h-3.5" />
              {step.title}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[#182a1d]/10 hover:bg-[#182a1d]/20 text-[#182a1d]/70 hover:text-[#182a1d] flex items-center justify-center transition-all cursor-pointer"
            title="Close tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="py-3.5 flex flex-col gap-1.5">
          <h4 className="font-serif font-bold text-base sm:text-[17px] text-[#182a1d] leading-snug tracking-tight">
            {step.headline}
          </h4>
          <p className="font-sans text-xs sm:text-[12.5px] text-[#182a1d]/85 leading-relaxed font-normal">
            {step.body}
          </p>
        </div>

        {/* Card Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#182a1d]/15 pt-3 mt-1">
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
                    : "w-1.5 bg-[#182a1d]/20 hover:bg-[#182a1d]/40"
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
                className="px-2.5 py-1 rounded-full bg-[#182a1d]/10 hover:bg-[#182a1d]/15 text-xs font-sans font-medium text-[#182a1d] transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1 rounded-full bg-[#182a1d] hover:bg-[#253f2c] active:scale-95 text-xs font-sans font-bold text-[#F7F7D9] transition-all cursor-pointer shadow-md flex items-center gap-1"
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
