"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { ArrowUpRight, ArrowRight, AlertTriangle } from "lucide-react";
import ResolvingScreen from "@/components/ResolvingScreen";
import StudioScreen from "@/components/StudioScreen";
import TourGuide from "@/components/TourGuide";

type ScreenState = "input" | "resolving" | "studio";

interface Lens {
  label: string;
  query: string;
}

const DEFAULT_STARTER_LENSES: Lens[] = [
  { label: "+ What books are on their shelf?", query: "What books rest on their shelf?" },
  { label: "+ What unlikely habit breaks their routine?", query: "What unlikely habit breaks their quiet routine?" },
  { label: "+ What clothes do they feel most comfortable in?", query: "What everyday clothes do they feel most comfortable in?" },
  { label: "+ What music do they listen to while working late?", query: "What music do they listen to while working late?" },
  { label: "+ What everyday tools rest on their desk?", query: "What everyday tools and gear rest on their desk?" },
  { label: "+ Where do they go when they want to be alone?", query: "Where do they go in the city when they want to be alone?" },
];

// Deduplication engine: Detects domains already asked in prompt and yields completely unasked questions
function getUnaskedLens(promptText: string, alreadyAdded: number = 0): Lens | null {
  if (alreadyAdded >= 2) return null;
  const lower = promptText.toLowerCase();

  const candidates: { domain: string; lens: Lens; matchKeywords: string[] }[] = [
    {
      domain: "books",
      lens: {
        label: "+ What books are on their shelf?",
        query: "What books rest on their shelf?",
      },
      matchKeywords: ["book", "bookshelf", "reading", "shelf", "novel", "author", "tanizaki"],
    },
    {
      domain: "routine",
      lens: {
        label: "+ What unlikely habit breaks their routine?",
        query: "What unlikely habit breaks their quiet routine?",
      },
      matchKeywords: ["habit", "routine", "contradiction", "vice", "guilty pleasure"],
    },
    {
      domain: "wardrobe",
      lens: {
        label: "+ What clothes do they feel most comfortable in?",
        query: "What everyday clothes do they feel most comfortable in?",
      },
      matchKeywords: ["clothes", "wardrobe", "jacket", "shoes", "wear", "pants", "coat", "denim"],
    },
    {
      domain: "morning",
      lens: {
        label: "+ What does their first hour of the morning look like?",
        query: "What does their first hour of the morning look like?",
      },
      matchKeywords: ["first hour", "wakes up", "breakfast", "morning routine"],
    },
    {
      domain: "music",
      lens: {
        label: "+ What music do they listen to while working late?",
        query: "What music do they listen to while working late?",
      },
      matchKeywords: ["music", "listen", "soundscape", "song", "playlist", "album", "headphones"],
    },
    {
      domain: "tools",
      lens: {
        label: "+ What everyday tools rest on their desk?",
        query: "What everyday tools and gear rest on their desk?",
      },
      matchKeywords: ["tool", "tools", "desk", "gear", "workbench", "drafting", "everyday items"],
    },
    {
      domain: "places",
      lens: {
        label: "+ Where do they go when they want to be alone?",
        query: "Where do they go in the city when they want to be alone?",
      },
      matchKeywords: ["where", "walk", "disappear", "alone", "harbor", "station", "haunt", "sanctuary"],
    },
  ];

  const available = candidates.filter((item) => {
    if (lower.includes(item.lens.query.toLowerCase())) return false;
    return !item.matchKeywords.some((kw) => lower.includes(kw));
  });

  if (available.length === 0) return null;
  return available[0].lens;
}

export default function Home() {
  const [screenState, setScreenState] = useState<ScreenState>("input");
  const [engine, setEngine] = useState<"qloo" | "base_llm">("qloo");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [characterText, setCharacterText] = useState("");
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [currentLens, setCurrentLens] = useState<Lens | null>(null);
  const [isLensLoading, setIsLensLoading] = useState(false);
  const [addedLensesCount, setAddedLensesCount] = useState(0);
  const [addedQueries, setAddedQueries] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [markerPos, setMarkerPos] = useState<{ top: number; left: number } | null>(null);

  // Initial Entrance Splash Screen with soft fade out
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [entranceStarted, setEntranceStarted] = useState(false);

  // Smooth Crossfade Transitions between Screen States
  const [isExitingInput, setIsExitingInput] = useState(false);
  const [isExitingResolving, setIsExitingResolving] = useState(false);

  useEffect(() => {
    // 1. Hold splash screen for ~1.3s, then initiate soft fade out
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 1300);

    // 2. As splash fades, trigger the staggered drop entrance of input elements
    const entranceTimer = setTimeout(() => {
      setEntranceStarted(true);
    }, 1600);

    // 3. Unmount splash completely once fully transparent
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(entranceTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const promptCardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lensCacheRef = useRef<Record<string, Lens>>({});

  const samplePrompts = [
    {
      label: "Meet Tsukuru the Japanese architect",
      text: "Tsukuru is a 36-year-old architect in Nagoya who designs train stations. He lives a quiet, solitary life in an uncluttered apartment, drinks black pour-over coffee, and is still carrying the quiet weight of four close childhood friends who abruptly cut him off years ago.\n\nWhat music does he listen to when sketching late at night?\nWhat drafting tools and everyday items rest on his work desk?\nWhere in Nagoya does he walk when he wants to clear his head?\nDescribe a quiet scene of him sitting on a station platform bench on a rainy Sunday morning.",
    },
    {
      label: "Meet Elena the Marseille conservator",
      text: "Elena is a 34-year-old architectural conservator in Marseille restoring 18th-century stone facades and maritime woodwork. She drives a battered 1988 Peugeot 205, lives near the old port, and prefers practical, well-worn tools over anything polished or decorative.\n\nWhat everyday tools and gear rest on her workbench?\nWhat music does she listen to in her car after a long day of restoration work?\nWhere does she go by the water when she needs to disappear?\nDescribe a quiet scene of her working late in her drafty studio as the sun sets over the harbor.",
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

    // Immediately provide an instant starter question on frame 0 using deduplicated unasked domain
    const instantUnasked = getUnaskedLens(trimmed, addedLensesCount);
    if (!currentLens || trimmed.toLowerCase().includes(currentLens.query.toLowerCase())) {
      if (instantUnasked) {
        setCurrentLens(instantUnasked);
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
        setIsLensLoading(true);
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
      } finally {
        setIsLensLoading(false);
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
    // Instant unasked initial question for preset on frame 0 (never repeats what's already in the prompt)
    const initialLens = getUnaskedLens(presetText, 0);
    setCurrentLens(initialLens);
    setIsFocused(true);
    textareaRef.current?.focus();
  };

  const handleAddLens = (lens: Lens) => {
    const separator = characterText.includes("\n") ? "\n" : " ";
    const newText = `${characterText.trim()}${separator}${lens.query}`;
    setCharacterText(newText);
    setAddedQueries((prev) => [...prev, lens.query]);
    const nextCount = addedLensesCount + 1;
    setAddedLensesCount(nextCount);
    // Yield the next unasked lens immediately
    setCurrentLens(getUnaskedLens(newText, nextCount));
    textareaRef.current?.focus();
  };

  const handleCreate = () => {
    const finalPrompt = characterText.trim() || samplePrompts[0].text;
    setCharacterText(finalPrompt);
    setIsFocused(false);
    // Smooth transition: fade & glide input screen out, then mount resolving screen
    setIsExitingInput(true);
    setTimeout(() => {
      setScreenState("resolving");
      setIsExitingInput(false);
    }, 450);
  };

  const handleResolutionComplete = (data: any) => {
    setResolvedData(data);
    // Smooth transition: fade resolving screen out, then crossfade to studio screen
    setIsExitingResolving(true);
    setTimeout(() => {
      setScreenState("studio");
      setIsExitingResolving(false);
      // Gentle pause before guided tour opens so the user can take in the studio layout
      setTimeout(() => {
        setIsTourOpen(true);
      }, 600);
    }, 500);
  };

  // State 2: Resolving Screen with smooth crossfade
  if (screenState === "resolving") {
    return (
      <div
        className={`w-full min-h-screen transition-all duration-500 ease-out ${
          isExitingResolving
            ? "opacity-0 scale-[1.015] filter blur-[0.5px]"
            : "opacity-100 scale-100 animate-smooth-fade"
        } ${
          engine === "base_llm"
            ? "filter grayscale-[40%] contrast-[96%]"
            : ""
        }`}
      >
        <ResolvingScreen
          promptText={characterText || samplePrompts[0].text}
          engine={engine}
          onResolved={handleResolutionComplete}
        />
      </div>
    );
  }

  // State 3: Co-Development Studio Screen with smooth crossfade
  if (screenState === "studio") {
    return (
      <div
        className={`w-full h-full animate-smooth-fade transition-all duration-700 ease-out ${
          engine === "base_llm"
            ? "filter grayscale-[40%] contrast-[96%]"
            : ""
        }`}
      >
        <StudioScreen
          initialData={resolvedData}
          engine={engine}
          onToggleEngine={setEngine}
          onOpenTour={() => setIsTourOpen(true)}
          onAssembleDossier={() => {}}
        />
        <TourGuide isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    );
  }

  // State 1: Input Screen (Clean canvas, unencumbered by header)
  return (
    <div className={engine === "base_llm" ? "filter grayscale-[40%] contrast-[96%] transition-all duration-700" : "transition-all duration-700"}>
      {/* Initial Entrance Splash Screen — Crisp centered artwork, soft tapered edges into #132317 */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-[500] flex items-center justify-center bg-[#132317] select-none overflow-hidden transition-opacity duration-800 ease-in-out ${
            splashFading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="relative w-full max-w-[1040px] aspect-[1024/661] max-h-[85vh] p-4 flex items-center justify-center">
            <img
              src="/poppies-splash.jpg"
              alt="Poppies"
              className="w-full h-full object-contain crisp-splash-vignette select-none pointer-events-none filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      )}

      <main className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden bg-transparent py-8 sm:py-12 px-4 sm:px-6">
        {/* 1. Base Painted Poppy Background — Crisp center scale, softly tapered into #182a1d */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden bg-[#182a1d]">
          <div className="relative w-full max-w-[1100px] aspect-[1024/661] max-h-[88vh] opacity-90 sm:opacity-95">
            <img
              src="/poppies-bg.jpg"
              alt=""
              className="w-full h-full object-contain crisp-artwork-vignette"
            />
          </div>
        </div>

        {/* 2. Solid Green (#28402A) Center Band (Top-and-bottom fade across mobile & desktop) */}
        <div
          className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1240px] input-stage-mask"
          style={{
            backgroundColor: "#28402a",
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

        {/* 4. Scaled Content Canvas with smooth exit and drop choreography */}
        <div
          className={`w-full max-w-[880px] mx-auto flex flex-col justify-center gap-6 transition-all duration-500 ease-out ${
            isExitingInput
              ? "opacity-0 translate-y-4 scale-[0.985]"
              : "opacity-100 translate-y-0 scale-100"
          } ${isFocused ? "relative z-50" : "relative z-10"}`}
        >
          {/* Base LLM Mode Warning Banner */}
          {engine === "base_llm" && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/20 text-[#F7F7D9]/80 text-xs font-sans backdrop-blur-md animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Vanilla Base LLM Mode Active: High risk of generic internet clichés, cultural monoculture, and hallucinations.</span>
            </div>
          )}

          {/* Header with #F7F7D9 typography (drops in first with gentle momentum) */}
          <div
            className={`max-w-[820px] transition-all duration-300 ${
              isFocused ? "opacity-40" : "opacity-100"
            } ${entranceStarted ? "animate-elegant-drop" : "opacity-0 -translate-y-5"}`}
            style={{ animationDelay: "60ms" }}
          >
            <h1 className="font-serif font-bold text-lg sm:text-xl md:text-[1.85rem] text-[#F7F7D9] leading-[1.5] sm:leading-[1.52] tracking-tight">
              Write about your character.
              <br />
              <span className="font-bold text-[#F7F7D9]">
                Who they are, what they do, what they like, and anything else you want. Then write what you want to know
              </span>
            </h1>
          </div>

          {/* Compact Preset Pills (drops in staggered, one at a time) */}
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
                className={`group flex items-center justify-between gap-2 px-4 py-1.5 sm:px-4.5 sm:py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.14] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-200 text-left cursor-pointer ${
                  entranceStarted ? "animate-pill-drop" : "opacity-0 -translate-y-4"
                }`}
                style={{
                  animationDelay: `${240 + index * 120}ms`,
                }}
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

          {/* Main Character Input Box with Focus Scaling & Hardware Accelerated Elevation (glides down into position) */}
          <div
            ref={promptCardRef}
            className={`relative w-full rounded-[36px] sm:rounded-[44px] p-2 sm:p-2.5 bg-white/[0.05] backdrop-blur-md border border-white/[0.14] transition-all duration-300 ease-out transform-gpu ${
              entranceStarted ? "animate-capsule-glide" : "opacity-0 -translate-y-7"
            } ${
              isFocused
                ? "scale-[1.015] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_24px_60px_rgba(0,0,0,0.7)]"
                : "scale-100 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_16px_45px_rgba(0,0,0,0.35)]"
            }`}
            style={{
              animationDelay: "540ms",
              willChange: "transform, box-shadow, opacity",
            }}
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
                        style={{ width: Math.min(320, Math.max(160, currentLens.label.length * 7.5)), height: 26 }}
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28402a] hover:bg-[#1f3321] active:scale-95 text-[#F7F7D9] text-xs font-sans font-medium transition-all cursor-pointer shadow-sm border border-[#28402a]/30 whitespace-nowrap z-20 ${
                      isLensLoading ? "opacity-75 animate-pulse" : "opacity-100"
                    }`}
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
