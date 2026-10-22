"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowRight, RotateCcw } from "lucide-react";
import ResolvingScreen from "@/components/ResolvingScreen";

type ScreenState = "input" | "resolving" | "dossier";

export default function Home() {
  const [screenState, setScreenState] = useState<ScreenState>("input");
  const [characterText, setCharacterText] = useState("");
  const [resolvedData, setResolvedData] = useState<any>(null);

  const samplePrompts = [
    {
      label: "Meet Tsukuru the japanese architect",
      text: "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and spends his Sunday afternoons sitting on station benches observing passenger flow. He is haunted by an abrupt estrangement from his four closest childhood friends. What are his quiet habits, his secret bookshelf, and where does he walk at night?",
    },
    {
      label: "Meet Tsukuru the japanese architect",
      text: "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and spends his Sunday afternoons sitting on station benches observing passenger flow. He is haunted by an abrupt estrangement from his four closest childhood friends. What are his quiet habits, his secret bookshelf, and where does he walk at night?",
    },
  ];

  const handleCreate = () => {
    if (!characterText.trim()) {
      // Default to Tsukuru prompt if user clicks create with empty text
      setCharacterText(samplePrompts[0].text);
    }
    setScreenState("resolving");
  };

  const handleResolutionComplete = (data: any) => {
    setResolvedData(data);
    setScreenState("dossier");
  };

  // State 2: Resolving Screen (Matching mockup)
  if (screenState === "resolving") {
    return (
      <ResolvingScreen
        promptText={characterText || samplePrompts[0].text}
        onResolved={handleResolutionComplete}
      />
    );
  }

  // State 3: Dossier Placeholder (Next screen to design together)
  if (screenState === "dossier") {
    return (
      <main className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#28402a] py-12 px-4 sm:px-6">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-80"
          style={{ backgroundImage: "url('/poppies-bg.jpg')" }}
        />
        <div
          className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1240px]"
          style={{
            backgroundColor: "#28402a",
            maskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)",
          }}
        />
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-8 text-[#F7F7D9]">
          <div className="flex items-center justify-between border-b border-[#F7F7D9]/20 pb-4">
            <h1 className="font-serif italic font-bold text-3xl sm:text-4xl">Tsukuru's Cultural Dossier</h1>
            <button
              onClick={() => setScreenState("input")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-sans tracking-wide transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Character</span>
            </button>
          </div>

          <div className="p-8 rounded-[36px] bg-[#F7F7D9] text-[#28402a] shadow-2xl flex flex-col gap-6">
            <h2 className="font-serif font-bold text-2xl">Discovered Taste DNA via Qloo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#28402a]/10">
                <span className="text-xs uppercase font-bold tracking-wider opacity-75">Sonic Identity</span>
                <p className="font-serif text-lg font-bold mt-1">
                  {resolvedData?.discoveries?.music?.[0]?.name || "Ryuichi Sakamoto"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#28402a]/10">
                <span className="text-xs uppercase font-bold tracking-wider opacity-75">The Bookshelf</span>
                <p className="font-serif text-lg font-bold mt-1">
                  {resolvedData?.discoveries?.literature?.[0]?.name || "Post-war Existential Fiction"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#28402a]/10">
                <span className="text-xs uppercase font-bold tracking-wider opacity-75">The Objects</span>
                <p className="font-serif text-lg font-bold mt-1">
                  {resolvedData?.discoveries?.wardrobeAndObjects?.[0]?.name || "Hasami Porcelain & Raw Denim"}
                </p>
              </div>
            </div>
            <p className="font-serif italic text-base opacity-80 leading-relaxed">
              Ready for the next screen mockup! Tell me what layout you'd like for the full living dossier.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // State 1: Input Screen (Original)
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#28402a] py-12 px-4 sm:px-6">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green (#28402A) Center Band with Tapered Fade on Left & Right Edges */}
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

      {/* 3. Scaled Content Canvas */}
      <div className="relative z-10 w-full max-w-[880px] mx-auto flex flex-col justify-center gap-6">
        {/* Header with #F7F7D9 typography */}
        <div className="max-w-[820px]">
          <h1 className="font-serif font-bold text-lg sm:text-xl md:text-[1.85rem] text-[#F7F7D9] leading-[1.5] sm:leading-[1.52] tracking-tight">
            Write about your character.
            <br />
            <span className="font-bold text-[#F7F7D9]">
              Who they are, what they do, what they like, and anything else you want. Then write what you want to know
            </span>
          </h1>
        </div>

        {/* Compact Pills with High-End Crystal Glass Blur */}
        <div className="flex flex-wrap items-center gap-3">
          {samplePrompts.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCharacterText(preset.text)}
              className="group flex items-center justify-between gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.15] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 text-left cursor-pointer"
            >
              <span className="text-[#F7F7D9] text-xs sm:text-sm font-extrabold italic font-sans tracking-wide">
                {preset.label}
              </span>
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-[2.5px] border border-[#F7F7D9]/80 text-[#F7F7D9] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            </button>
          ))}
        </div>

        {/* Main Character Input Box with Crystal Glass Rim */}
        <div className="relative w-full rounded-[36px] sm:rounded-[44px] p-2 sm:p-2.5 bg-white/[0.05] backdrop-blur-xl border border-white/[0.14] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_16px_45px_rgba(0,0,0,0.35)]">
          {/* Inner Text Box (Color: #F7F7D9) */}
          <div className="relative w-full rounded-[30px] sm:rounded-[36px] bg-[#F7F7D9] px-6 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 flex flex-col justify-between min-h-[230px] sm:min-h-[260px] shadow-sm">
            {/* Textarea */}
            <div className="w-full flex-1">
              <textarea
                value={characterText}
                onChange={(e) => setCharacterText(e.target.value)}
                placeholder="Bring your character to life"
                rows={5}
                className="w-full bg-transparent resize-none border-none outline-none font-serif text-base sm:text-lg md:text-[1.25rem] text-[#28402a] placeholder:text-[#28402a]/55 placeholder:font-serif placeholder:font-normal leading-relaxed"
              />
            </div>

            {/* Bottom Row / Dark Pill Send Button with Create + Icon */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 sm:px-6 h-10 sm:h-11 rounded-full bg-[#28402a] hover:bg-[#1f3321] active:scale-95 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
                title="Bring your character to life"
              >
                <span className="text-[#F7F7D9] font-serif italic text-sm sm:text-base font-medium tracking-wide">
                  Create
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F7F7D9] group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
