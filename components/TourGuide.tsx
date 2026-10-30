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
  const [arrowInfo, setArrowInfo] = useState<{
    position: "top" | "bottom" | "left" | "right";
    offset: number;
  } | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Resolve target on mobile: step 3 points to mobile menu bar button
  const resolvedTargetId =
    step.targetId === "tour-left-pane" && isMobileViewport
      ? "tour-mobile-menu-btn"
      : step.targetId;

  const displayTitle =
    step.targetId === "tour-left-pane" && isMobileViewport
      ? "Inquiries Menu"
      : step.title;

  const displayHeadline =
    step.targetId === "tour-left-pane" && isMobileViewport
      ? "Navigate inquiries & character brief."
      : step.headline;

  const displayBody =
    step.targetId === "tour-left-pane" && isMobileViewport
      ? "Tap this menu button in the top bar to open your inquiries drawer, investigate scenes, or assemble the complete character dossier."
      : step.body;

  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const isMobile = winWidth < 1024;
    setIsMobileViewport(isMobile);

    const activeTargetId =
      step.targetId === "tour-left-pane" && isMobile
        ? "tour-mobile-menu-btn"
        : step.targetId;

    const targetEl = document.getElementById(activeTargetId);
    if (!targetEl) {
      setTargetRect(null);
      setCardPos(null);
      setArrowInfo(null);
      return;
    }

    // Smooth-scroll element into view if needed (especially for ensemble cards)
    if (step.targetId === "tour-tappable-objects") {
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const rect = targetEl.getBoundingClientRect();
    setTargetRect(rect);

    const padding = 12;
    const cardWidth = Math.min(360, winWidth - 24);
    const cardHeight = cardRef.current?.offsetHeight || 220;

    let top = 0;
    let left = 0;
    let arrowPos: "top" | "bottom" | "left" | "right" = "bottom";
    let arrowOffset = cardWidth / 2;

    if (isMobile) {
      // MOBILE: Dynamic non-stationary placement that NEVER blocks the target
      const targetCenterX = rect.left + rect.width / 2;
      const rawLeft = targetCenterX - cardWidth / 2;
      left = Math.max(padding, Math.min(winWidth - cardWidth - padding, rawLeft));
      arrowOffset = Math.min(cardWidth - 28, Math.max(28, targetCenterX - left));

      if (step.targetId === "tour-prompt-bar") {
        // Prompt bar at bottom: card hovers ABOVE prompt bar, arrow points DOWN
        top = Math.max(padding, rect.top - cardHeight - 14);
        arrowPos = "bottom";
      } else if (activeTargetId === "tour-mobile-menu-btn" || step.targetId === "tour-qloo-toggle") {
        // Items in top menu bar: card hovers BELOW menu item, arrow points UP
        top = Math.min(winHeight - cardHeight - padding, rect.bottom + 14);
        arrowPos = "top";
      } else if (step.targetId === "tour-center-pane") {
        // Center pane: place inside upper region of center card, arrow points UP
        top = Math.max(padding + 52, rect.top + 16);
        arrowPos = "top";
      } else if (step.targetId === "tour-tappable-objects") {
        // Tappable objects: check available vertical space
        if (rect.top > cardHeight + padding + 30) {
          top = rect.top - cardHeight - 14;
          arrowPos = "bottom";
        } else {
          top = Math.min(winHeight - cardHeight - padding, rect.bottom + 14);
          arrowPos = "top";
        }
      } else {
        if (rect.bottom + cardHeight + 20 < winHeight) {
          top = rect.bottom + 14;
          arrowPos = "top";
        } else {
          top = Math.max(padding, rect.top - cardHeight - 14);
          arrowPos = "bottom";
        }
      }
    } else {
      // DESKTOP: Dynamic adjacent placement
      if (step.targetId === "tour-center-pane") {
        top = Math.max(padding, rect.top + 30);
        left = Math.max(
          padding,
          Math.min(winWidth - cardWidth - padding, rect.left + 35)
        );
        arrowPos = "top";
        arrowOffset = 40;
      } else if (step.targetId === "tour-left-pane") {
        left = Math.min(winWidth - cardWidth - padding, rect.right + 20);
        top = Math.max(
          padding,
          Math.min(winHeight - cardHeight - padding, rect.top + 60)
        );
        arrowPos = "left";
        arrowOffset = Math.min(cardHeight - 28, Math.max(28, rect.top + 70 - top));
      } else if (step.targetId === "tour-qloo-toggle") {
        top = rect.bottom + 14;
        left = Math.max(padding, rect.right - cardWidth);
        arrowPos = "top";
        arrowOffset = Math.min(cardWidth - 28, Math.max(28, rect.left + rect.width / 2 - left));
      } else {
        // Prompt bar or tappable objects
        const targetCenterX = rect.left + rect.width / 2;
        left = Math.max(
          padding,
          Math.min(winWidth - cardWidth - padding, targetCenterX - cardWidth / 2)
        );
        top = Math.max(padding, rect.top - cardHeight - 14);
        arrowPos = "bottom";
        arrowOffset = Math.min(cardWidth - 28, Math.max(28, targetCenterX - left));
      }
    }

    setCardPos({ top, left });
    setArrowInfo({ position: arrowPos, offset: arrowOffset });
  }, [isOpen, step]);

  useEffect(() => {
    updatePosition();
    const timer = setTimeout(updatePosition, 80);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition, currentStepIndex]);

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
      {/* Dimmed overlay with SVG mask cutout: Target element is 100% un-dimmed and un-blurred */}
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
                rx="18"
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
        className={`fixed z-[102] w-full max-w-[360px] rounded-[24px] bg-[#F7F7D9] border-[2.5px] border-[#182a1d] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-col justify-between transition-all duration-300 ease-out select-none ${
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
        {/* Dynamic Pointer Arrow in matching cream color (Active on both Mobile and Desktop) */}
        {cardPos && targetRect && arrowInfo && (
          <div>
            {arrowInfo.position === "bottom" && (
              <div
                style={{
                  left: `${arrowInfo.offset}px`,
                }}
                className="absolute -bottom-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#F7F7D9] filter drop-shadow-[0_2px_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {arrowInfo.position === "top" && (
              <div
                style={{
                  left: `${arrowInfo.offset}px`,
                }}
                className="absolute -top-2.5 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-[#F7F7D9] filter drop-shadow-[0_-2px_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {arrowInfo.position === "left" && (
              <div
                style={{
                  top: `${arrowInfo.offset}px`,
                }}
                className="absolute -left-2.5 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#F7F7D9] filter drop-shadow-[-2px_0_1px_rgba(24,42,29,0.4)]"
              />
            )}
            {arrowInfo.position === "right" && (
              <div
                style={{
                  top: `${arrowInfo.offset}px`,
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
              {displayTitle}
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
            {displayHeadline}
          </h4>
          <p className="font-sans text-xs sm:text-[12.5px] text-[#182a1d]/85 leading-relaxed font-normal">
            {displayBody}
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
