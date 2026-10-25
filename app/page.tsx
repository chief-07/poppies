"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { ArrowUpRight, ArrowRight, AlertTriangle } from "lucide-react";
import ResolvingScreen from "@/components/ResolvingScreen";
import StudioScreen from "@/components/StudioScreen";
import HeaderControls from "@/components/HeaderControls";
import TourGuide from "@/components/TourGuide";

type ScreenState = "input" | "resolving" | "studio";

interface Lens {
  label: string;
  query: string;
}

const DEFAULT_STARTER_LENSES: Lens[] = [
  { label: "+ 2 AM Soundscape?", query: "What does their 2 AM solitary playlist sound like?" },
  { label: "+ Worktable Tools?", query: "What tools and everyday objects rest on their worktable?" },
  { label: "+ The Local Haunt?", query: "Where do they disappear to when they need to be alone?" },
];

export default function Home() {
  const [screenState, setScreenState] = useState<ScreenState>("input");
  const [engine, setEngine] = useState<"qloo" | "base_llm">("qloo");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [characterText, setCharacterText] = useState("");
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [currentLens, setCurrentLens] = useState<Lens | null>(null);
  const [addedLensesCount, setAddedLensesCount] = useState(0);
  const [addedQueries, setAddedQueries] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [markerPos, setMarkerPos] = useState<{ top: number; left: number } | null>(null);

  const promptCardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lensCacheRef = useRef<Record<string, Lens>>({});

  const samplePrompts = [
    {
      label: "Meet Tsukuru the Japanese architect",
      text: "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and spends his Sunday afternoons sitting on station benches observing passenger flow. He is haunted by an abrupt estrangement from his four closest childhood friends. What are his quiet habits, his secret bookshelf, and where does he walk at night?",
    },
    {
      label: "Meet Elena the Marseille conservator",
      text: "Elena, 34, an architectural conservator in Marseille restoring 18th-century stone facades and overlooked woodwork. She lives in a drafty apartment near the old port, drinks bitter chicory tea, and refuses to sell her battered 1988 Peugeot 205. I want to understand her worktable tools, her 2 AM solitary soundscape, and where she disappears on Sunday afternoons.",
    },
  ];

  // Auto-resize textarea height as text changes so it never scrolls internally
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(160, textareaRef.current.scrollHeight)}px`;
    }
  }, [characterText]);

  // Dynamically sync lens count when text is cleared or replaced
  useEffect(() => {
    const trimmed = characterText.trim();
    if (trimmed.length < 8) {
      setAddedLensesCount(0);
      setAddedQueries([]);
      setCurrentLens(null);
      return;
    }
    // Count how many of our addedQueries are still present in characterText
    const stillPresentCount = addedQueries.filter((q) =>
      trimmed.toLowerCase().includes(q.toLowerCase())
    ).length;
    if (stillPresentCount !== addedLensesCount) {
      setAddedLensesCount(stillPresentCount);
    }
  }, [characterText, addedQueries, addedLensesCount]);

  // Update marker position using getBoundingClientRect relative to mirror container
  const updateMarkerPosition = () => {
    if (markerRef.current && mirrorRef.current) {
      const markerRect = markerRef.current.getBoundingClientRect();
      const mirrorRect = mirrorRef.current.getBoundingClientRect();
      const top = markerRect.top - mirrorRect.top;
      const left = markerRect.left - mirrorRect.left;
      setMarkerPos({ top, left });
    } else {
      setMarkerPos(null);
    }
  };

  useLayoutEffect(() => {
    updateMarkerPosition();
  }, [characterText, currentLens]);

  useEffect(() => {
    window.addEventListener("resize", updateMarkerPosition);
    return () => window.removeEventListener("resize", updateMarkerPosition);
  }, []);

  // Fetch ONE single contextual lens from the fast LLM as the user types (Throttled 1200ms)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = characterText.trim();

    // If capped or too short, clear lens
    if (trimmed.length < 8 || addedLensesCount >= 2) {
      setCurrentLens(null);
      return;
    }

    // Immediately provide an instant starter question on frame 0
    if (!currentLens) {
      const fallback = DEFAULT_STARTER_LENSES[addedLensesCount % DEFAULT_STARTER_LENSES.length];
      if (!trimmed.toLowerCase().includes(fallback.query.toLowerCase())) {
        setCurrentLens(fallback);
      }
    }

    // Check in-memory cache first
    const cacheKey = `${trimmed.slice(0, 100)}_${addedLensesCount}`;
    if (lensCacheRef.current[cacheKey]) {
      const cached = lensCacheRef.current[cacheKey];
      if (!trimmed.toLowerCase().includes(cached.query.toLowerCase())) {
        setCurrentLens(cached);
      }
      return;
    }

    // Conservative 1200ms debounced refinement so fast typing does not drain Gemini 15 RPM
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/suggest-lenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, alreadyAddedCount: addedLensesCount }),
        });
        const data = await res.json();
        if (data.lens && data.lens.label && data.lens.query) {
          lensCacheRef.current[cacheKey] = data.lens;
          if (!trimmed.toLowerCase().includes(data.lens.query.toLowerCase())) {
            setCurrentLens(data.lens);
          }
        }
      } catch (err) {
        console.warn("Lens suggestion notice:", err);
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [characterText, addedLensesCount]);

  // Click outside to disable spotlight and remove blur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isFocused &&
        promptCardRef.current &&
        !promptCardRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused]);

  // Global keydown: typing anywhere focuses prompt box; Escape cancels focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenState !== "input") return;
      if (e.key === "Escape") {
        setIsFocused(false);
        textareaRef.current?.blur();
        return;
      }
      if (
        !isFocused &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement !== textareaRef.current
      ) {
        setIsFocused(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, screenState]);

  const handleSelectPreset = (presetText: string) => {
    setCharacterText(presetText);
    setAddedLensesCount(0);
    setAddedQueries([]);
    // Instant initial question for preset on frame 0
    setCurrentLens(DEFAULT_STARTER_LENSES[0]);
    setIsFocused(true);
    textareaRef.current?.focus();
  };

  const handleAddLens = (lens: Lens) => {
    const queryToAppend = ` ${lens.query}`;
    setCharacterText((prev) => `${prev.trim()}${queryToAppend}`);
    setAddedQueries((prev) => [...prev, lens.query]);
    setAddedLensesCount((c) => c + 1);
    setCurrentLens(null); // Will trigger next question via useEffect
    textareaRef.current?.focus();
  };

  const handleCreate = () => {
    const finalPrompt = characterText.trim() || samplePrompts[0].text;
    setCharacterText(finalPrompt);
    setIsFocused(false);
    setScreenState("resolving");
  };

  const handleResolutionComplete = (data: any) => {
    setResolvedData(data);
    setScreenState("studio");
  };

  // State 2: Resolving Screen
  if (screenState === "resolving") {
    return (
      <div className={engine === "base_llm" ? "filter grayscale-[85%] contrast-[95%] transition-all duration-700" : "transition-all duration-700"}>
        <ResolvingScreen
          promptText={characterText || samplePrompts[0].text}
          engine={engine}
          onResolved={handleResolutionComplete}
        />
        <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    );
  }

  // State 3: Co-Development Studio Screen
  if (screenState === "studio") {
    return (
      <div className={engine === "base_llm" ? "filter grayscale-[85%] contrast-[95%] transition-all duration-700" : "transition-all duration-700"}>
        <StudioScreen
          initialData={resolvedData}
          engine={engine}
          onToggleEngine={setEngine}
          onOpenTour={() => setIsTourOpen(true)}
          onAssembleDossier={() => alert("Dossier compilation ready! Let me know if you want a printable lookbook view.")}
        />
        <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    );
  }

  // State 1: Input Screen
  return (
    <div className={engine === "base_llm" ? "filter grayscale-[85%] contrast-[95%] transition-all duration-700" : "transition-all duration-700"}>
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-sm bg-black/15 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-full shadow-md border border-white/20 bg-cover bg-no-repeat"
            style={{
              backgroundImage: "url('/poppies-bg.jpg')",
              backgroundPosition: "42% 49%",
              backgroundSize: "650%",
            }}
          />
          <span className="font-serif italic font-bold text-lg text-[#F7F7D9] tracking-tight">
            Poppies
          </span>
        </div>

        <HeaderControls
          engine={engine}
          onToggleEngine={setEngine}
          onOpenTour={() => setIsTourOpen(true)}
        />
      </header>

      <main className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden bg-[#28402a] pt-20 pb-8 sm:py-12 px-4 sm:px-6">
        {/* 1. Base Painted Poppy Background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/poppies-bg.jpg')",
          }}
        />

        {/* 2. Solid Green (#28402A) Center Band */}
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

        {/* 3. Dark Backdrop Spotlight Overlay with Smooth Fade In/Out */}
        <div
          aria-hidden="true"
          onClick={() => {
            setIsFocused(false);
            textareaRef.current?.blur();
          }}
          className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out cursor-pointer ${
            isFocused ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{ willChange: "opacity" }}
        />

        {/* 4. Scaled Content Canvas */}
        <div
          className={`w-full max-w-[880px] mx-auto flex flex-col justify-center gap-6 transition-all duration-300 ${
            isFocused ? "relative z-50" : "relative z-10"
          }`}
        >
          {/* Base LLM Mode Warning Banner */}
          {engine === "base_llm" && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/20 text-[#F7F7D9]/80 text-xs font-sans backdrop-blur-md animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Vanilla Base LLM Mode Active: High risk of generic internet clichés, cultural monoculture, and hallucinations.</span>
            </div>
          )}

          {/* Header with #F7F7D9 typography (dimmed in spotlight mode) */}
          <div
            className={`max-w-[820px] transition-opacity duration-300 ${
              isFocused ? "opacity-40" : "opacity-100"
            }`}
          >
            <h1 className="font-serif font-bold text-lg sm:text-xl md:text-[1.85rem] text-[#F7F7D9] leading-[1.5] sm:leading-[1.52] tracking-tight">
              Write about your character.
              <br />
              <span className="font-bold text-[#F7F7D9]">
                Who they are, what they do, what they like, and anything else you want. Then write what you want to know
              </span>
            </h1>
          </div>

          {/* Compact Preset Pills (dimmed in spotlight mode) */}
          <div
            className={`flex flex-wrap items-center gap-2.5 transition-opacity duration-300 ${
              isFocused ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}
          >
            {samplePrompts.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPreset(preset.text)}
                className="group flex items-center justify-between gap-2 px-4 py-1.5 sm:px-4.5 sm:py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.14] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 text-left cursor-pointer"
              >
                <span className="text-[#F7F7D9] text-xs sm:text-[13px] font-sans font-medium tracking-wide">
                  {preset.label}
                </span>
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-[2.5px] border border-[#F7F7D9]/70 text-[#F7F7D9] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
                </span>
              </button>
            ))}
          </div>

          {/* Main Character Input Box with Focus Scaling & Hardware Accelerated Elevation */}
          <div
            ref={promptCardRef}
            className={`relative w-full rounded-[36px] sm:rounded-[44px] p-2 sm:p-2.5 bg-white/[0.05] backdrop-blur-md border border-white/[0.14] transition-all duration-300 ease-out transform-gpu ${
              isFocused
                ? "scale-[1.015] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_24px_60px_rgba(0,0,0,0.7)]"
                : "scale-100 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_16px_45px_rgba(0,0,0,0.35)]"
            }`}
            style={{ willChange: "transform, box-shadow" }}
          >
            {/* Inner Text Box (Color: #F7F7D9) */}
            <div className="relative w-full rounded-[30px] sm:rounded-[36px] bg-[#F7F7D9] px-6 sm:px-8 pt-6 pb-4 sm:pb-5 flex flex-col justify-between min-h-[230px] sm:min-h-[260px] shadow-sm">
              {/* Input Surface Container */}
              <div
                className="relative w-full flex-1 cursor-text"
                onClick={() => {
                  setIsFocused(true);
                  textareaRef.current?.focus();
                }}
              >
                {/* Accurate Layout Mirror: Synchronized with textarea typography */}
                <div
                  ref={mirrorRef}
                  aria-hidden="true"
                  className="opacity-0 pointer-events-none absolute top-0 left-0 w-full whitespace-pre-wrap break-words font-serif font-light text-base sm:text-lg md:text-[1.2rem] leading-[1.75] tracking-normal text-[#28402a] p-0 m-0 select-none"
                >
                  <span>{characterText}</span>
                  {currentLens && addedLensesCount < 2 && (
                    <>
                      <span> </span>
                      <span
                        ref={markerRef}
                        className="inline-block"
                        style={{ width: 140, height: 26 }}
                      >
                        &nbsp;
                      </span>
                    </>
                  )}
                </div>

                {/* Real Native Textarea: Clean, natural literary serif typography (Light weight) */}
                <textarea
                  ref={textareaRef}
                  value={characterText}
                  onFocus={() => setIsFocused(true)}
                  onChange={(e) => setCharacterText(e.target.value)}
                  placeholder="Bring your character to life"
                  className="w-full bg-transparent resize-none border-none outline-none font-serif font-light text-base sm:text-lg md:text-[1.2rem] text-[#28402a] placeholder:text-[#28402a]/50 placeholder:font-serif placeholder:font-light placeholder:italic leading-[1.75] tracking-normal p-0 m-0 block"
                />

                {/* Reverted Clean Green Inquiry Pill: At Trailing End of Text */}
                {currentLens && addedLensesCount < 2 && markerPos && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddLens(currentLens);
                    }}
                    style={{
                      position: "absolute",
                      top: `${markerPos.top}px`,
                      left: `${markerPos.left}px`,
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28402a] hover:bg-[#1f3321] active:scale-95 text-[#F7F7D9] text-xs font-sans font-medium transition-all cursor-pointer shadow-sm border border-[#28402a]/30 whitespace-nowrap z-20"
                    title={currentLens.query}
                  >
                    <span>{currentLens.label}</span>
                  </button>
                )}
              </div>

              {/* Bottom Action Row: Refined Create Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="px-5 h-9 sm:h-10 rounded-full bg-[#243a27] hover:bg-[#1a2c1d] active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 transition-all cursor-pointer group flex-shrink-0"
                  title="Bring your character to life"
                >
                  <span className="text-[#F7F7D9] font-serif italic text-xs sm:text-sm font-medium tracking-wide">
                    Create
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F7F7D9] group-hover:translate-x-0.5 transition-transform stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 60-Second Guided Tour Modal */}
      <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}
