"use client";

import { useState } from "react";
import {
  Compass,
  Music,
  MapPin,
  Sparkles,
  Plus,
  BookOpen,
  Check,
  Search,
  X,
  Send,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
} from "lucide-react";

interface StudioScreenProps {
  initialData: any;
  onAssembleDossier?: () => void;
}

interface ThreadItem {
  id: string;
  title: string;
  iconType: "compass" | "music" | "mappin" | "sparkles";
  status: "exploring" | "accepted" | "open" | "suggested";
  statusLabel: string;
  headline: string;
  description: string;
  rationale: string;
  connections: {
    title: string;
    domain: string;
    description: string;
    imageUrl: string;
    qlooType: string;
    affinityScore?: number;
  }[];
}

export default function StudioScreen({ initialData, onAssembleDossier }: StudioScreenProps) {
  const characterName = initialData?.character?.name || "Shoujo A";
  const characterSummary = initialData?.character?.summary || "A character taking shape.";

  // Dynamic threads initialized from Qloo discoveries + mockup defaults
  const [threads, setThreads] = useState<ThreadItem[]>([
    {
      id: "inner-world",
      title: "Her inner world",
      iconType: "compass",
      status: "exploring",
      statusLabel: "Exploring",
      headline: "A thread worth following",
      description:
        "Her taste in quiet, atmospheric stories may connect to the music and places she returns to.",
      rationale:
        "These elements often appear together in the tastes of people who enjoy introspective stories, artistic spaces and atmospheric soundtracks.",
      connections: [
        {
          title: initialData?.discoveries?.music?.[0]?.name || "Ambient music",
          domain: "MUSIC",
          description: "Atmospheric soundscapes that create a sense of place and solitude.",
          imageUrl:
            initialData?.discoveries?.music?.[0]?.properties?.image?.url ||
            "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:artist",
          affinityScore: 94,
        },
        {
          title: initialData?.discoveries?.literature?.[0]?.name || "Independent cinema",
          domain: "FILM & TV",
          description: "Thoughtful, character-driven stories with a dreamlike tone.",
          imageUrl:
            initialData?.discoveries?.literature?.[0]?.properties?.image?.url ||
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:movie",
          affinityScore: 89,
        },
        {
          title: initialData?.discoveries?.wardrobeAndObjects?.[0]?.name || "Quiet spaces",
          domain: "PLACES",
          description: "Libraries, small cafes, and solitary corners that feel like a refuge.",
          imageUrl:
            initialData?.discoveries?.wardrobeAndObjects?.[0]?.properties?.image?.url ||
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:place",
          affinityScore: 92,
        },
      ],
    },
    {
      id: "music-taste",
      title: "Music & taste",
      iconType: "music",
      status: "accepted",
      statusLabel: "Accepted",
      headline: "The sonic frequency of her solitary hours",
      description: "Rooted in repetitive acoustic piano phrases and Japanese environmental tape music.",
      rationale: "Statistical co-occurrence in Qloo graph with architectural minimalism.",
      connections: [
        {
          title: "Hiroshi Yoshimura",
          domain: "MUSIC",
          description: "Pioneering Japanese ambient composer known for delicate synthesizer acoustics.",
          imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:artist",
          affinityScore: 96,
        },
        {
          title: "ECM Records",
          domain: "BRAND",
          description: "German record label famed for austere typography and spacious acoustics.",
          imageUrl: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:brand",
          affinityScore: 91,
        },
      ],
    },
    {
      id: "places-she-returns",
      title: "The places she returns to",
      iconType: "mappin",
      status: "open",
      statusLabel: "Open question",
      headline: "Sanctuaries away from the avenue",
      description: "Third spaces where silence is preserved and solitary patrons are left undisturbed.",
      rationale: "Correlated through Qloo locality index in historic residential quarters.",
      connections: [
        {
          title: "Sakae Kissaten",
          domain: "PLACES",
          description: "Old-world Japanese drip coffee parlor where classical music plays on vinyl.",
          imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:place",
          affinityScore: 88,
        },
      ],
    },
    {
      id: "contradictions",
      title: "Contradictions",
      iconType: "sparkles",
      status: "suggested",
      statusLabel: "Suggested by Poppies",
      headline: "The unexpected friction that makes her human",
      description: "A severe minimalist aesthetic punctured by an unapologetic, chaotic guilty pleasure.",
      rationale: "Identified via Qloo negative correlation filter to break cultural clichés.",
      connections: [
        {
          title: "Midnight Variety TV",
          domain: "FILM & TV",
          description: "Loud, nostalgic late-night variety broadcasts watched in the dark with instant noodles.",
          imageUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=400&q=80",
          qlooType: "urn:entity:tv_show",
          affinityScore: 84,
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>("inner-world");
  const [steeringInput, setSteeringInput] = useState<string>("");
  const [isSteering, setIsSteering] = useState<boolean>(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Render icons dynamically
  const renderThreadIcon = (type: string) => {
    switch (type) {
      case "compass":
        return <Compass className="w-5 h-5" />;
      case "music":
        return <Music className="w-5 h-5" />;
      case "mappin":
        return <MapPin className="w-5 h-5" />;
      case "sparkles":
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Compass className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case "exploring":
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-300/90 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {label}
          </span>
        );
      case "accepted":
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-300/90 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {label}
          </span>
        );
      case "open":
        return (
          <span className="flex items-center gap-1.5 text-xs text-sky-300/90 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            {label}
          </span>
        );
      case "suggested":
        return (
          <span className="flex items-center gap-1.5 text-xs text-purple-300/90 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            {label}
          </span>
        );
      default:
        return null;
    }
  };

  // Handle Steering / Directing the Agent
  const handleSteer = async () => {
    if (!steeringInput.trim()) return;
    setIsSteering(true);

    try {
      // In production calls Gemini Flash Lite + Qloo
      const updatedDescription = `Refined direction: ${steeringInput}`;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                description: updatedDescription,
                status: "exploring",
                statusLabel: "Exploring",
              }
            : t
        )
      );
      setSteeringInput("");
    } finally {
      setIsSteering(false);
    }
  };

  const handleAcceptThread = () => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, status: "accepted", statusLabel: "Accepted" } : t))
    );
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#101b13] p-4 sm:p-6 lg:p-8 select-none">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90 scale-[1.01]"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green (#28402A) Center Band with Tapered Fade */}
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px]"
        style={{
          backgroundColor: "#182a1d",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      />

      {/* 3. Main Workspace Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto flex flex-col gap-6 lg:gap-8 flex-1 justify-between">
        {/* Top Header Row */}
        <header className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full shadow-md border border-white/20 bg-cover bg-no-repeat"
              style={{
                backgroundImage: "url('/poppies-bg.jpg')",
                backgroundPosition: "42% 49%",
                backgroundSize: "650%",
              }}
            />
            <span className="font-serif italic font-bold text-xl text-[#F7F7D9] tracking-tight">
              Poppies
            </span>
          </div>

          {/* Character Identity */}
          <div className="flex-1 text-left pl-8 sm:pl-12">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F7F7D9] tracking-tight inline-block border-b-2 border-[#F7F7D9]/40 pb-0.5">
              {characterName}
            </h1>
            <p className="font-serif italic text-sm sm:text-base text-[#F7F7D9]/80 mt-1">
              {characterSummary}
            </p>
          </div>
        </header>

        {/* Studio Midsection: Sidebar + Current Thread Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* Left Sidebar: Threads / Questions */}
          <aside className="lg:col-span-3 flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              {threads.map((thread) => {
                const isActive = thread.id === activeThread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group w-full flex items-center justify-between p-3.5 sm:p-4 rounded-[22px] transition-all duration-200 text-left border ${
                      isActive
                        ? "bg-white/[0.12] border-white/30 backdrop-blur-xl shadow-lg"
                        : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] backdrop-blur-md"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-white/20 text-[#F7F7D9]"
                            : "bg-white/10 text-[#F7F7D9]/70 group-hover:text-white"
                        }`}
                      >
                        {renderThreadIcon(thread.iconType)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans font-bold text-sm sm:text-base text-[#F7F7D9]">
                          {thread.title}
                        </span>
                        {getStatusBadge(thread.status, thread.statusLabel)}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive
                          ? "text-[#F7F7D9] translate-x-0.5"
                          : "text-white/40 group-hover:text-white/80"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Add a thread button */}
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-3 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.07] border border-dashed border-white/20 text-[#F7F7D9]/80 hover:text-[#F7F7D9] text-sm font-sans font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add a thread</span>
            </button>

            {/* Assemble dossier action button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={onAssembleDossier}
                className="w-full flex items-center justify-between p-4 rounded-[22px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 backdrop-blur-md text-[#F7F7D9] transition-all shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#F7F7D9]" />
                  <span className="font-serif italic font-bold text-base">Assemble dossier</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </aside>

          {/* Right Main Canvas: Active Thread Card */}
          <main className="lg:col-span-9 rounded-[32px] sm:rounded-[36px] bg-[#15271a]/94 border border-white/15 backdrop-blur-2xl p-6 sm:p-8 lg:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.55)] flex flex-col justify-between gap-6 sm:gap-7">
            {/* Thread Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full bg-cover bg-no-repeat"
                    style={{
                      backgroundImage: "url('/poppies-bg.jpg')",
                      backgroundPosition: "42% 49%",
                      backgroundSize: "650%",
                    }}
                  />
                  <span className="text-[11px] font-sans font-bold tracking-[0.2em] text-[#F7F7D9]/60 uppercase">
                    CURRENT THREAD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-xs text-amber-300 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Candidate connections
                  </span>
                  <button className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[2rem] text-[#F7F7D9] tracking-tight mt-1">
                {activeThread.headline}
              </h2>
              <p className="font-serif text-base sm:text-lg text-[#F7F7D9]/85 leading-relaxed max-w-3xl">
                {activeThread.description}
              </p>
            </div>

            {/* Connected Sequence Cards & Qloo Rationale Box */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              {/* Linked Entity Cards (Left 9 cols on xl) */}
              <div className="xl:col-span-8 flex flex-col sm:flex-row items-stretch gap-4 relative">
                {activeThread.connections.map((conn, idx) => (
                  <div key={idx} className="flex-1 flex flex-col relative group">
                    {/* Connecting line between cards */}
                    {idx < activeThread.connections.length - 1 && (
                      <div className="hidden sm:block absolute top-[28%] -right-4 w-4 h-[2px] bg-white/20 z-10" />
                    )}

                    {/* Card Container */}
                    <div className="w-full h-full rounded-[24px] bg-white/[0.04] border border-white/10 hover:border-white/25 p-3.5 flex flex-col justify-between transition-all duration-200 shadow-md">
                      {/* Image Thumbnail */}
                      <div className="w-full h-32 rounded-[18px] overflow-hidden bg-black/40 relative">
                        <img
                          src={conn.imageUrl}
                          alt={conn.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-sans font-bold text-emerald-300">
                          {conn.affinityScore}% match
                        </span>
                      </div>

                      {/* Content */}
                      <div className="pt-3 flex flex-col gap-1 flex-1">
                        <span className="text-[10px] font-sans font-bold tracking-widest text-[#E06B55] uppercase">
                          {conn.domain}
                        </span>
                        <h3 className="font-serif italic font-bold text-lg text-[#F7F7D9]">
                          {conn.title}
                        </h3>
                        <p className="font-sans text-xs text-[#F7F7D9]/75 line-clamp-3 leading-relaxed mt-1">
                          {conn.description}
                        </p>
                      </div>

                      {/* Qloo connection trigger */}
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConnection(conn);
                            setEvidenceDrawerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-[#F7F7D9]/90 font-sans tracking-wide transition-all"
                        >
                          <span className="text-[11px]">🔗</span>
                          <span>Qloo connection</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rationale Box (Right 4 cols on xl) */}
              <div className="xl:col-span-4 rounded-[24px] bg-white/[0.03] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 text-sm">❀</span>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#F7F7D9]">
                      Why this connection?
                    </h3>
                  </div>
                  <p className="font-sans text-xs sm:text-[0.82rem] text-[#F7F7D9]/75 leading-relaxed">
                    {activeThread.rationale}
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConnection(activeThread.connections[0]);
                      setEvidenceDrawerOpen(true);
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-[#F7F7D9] font-sans tracking-wide transition-all group"
                  >
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-white/60" />
                      <span>Inspect Qloo evidence</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions inside Main Card */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
              {/* Accept button */}
              <button
                type="button"
                onClick={handleAcceptThread}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F7F7D9] hover:bg-white active:scale-95 text-[#1b2d20] font-sans font-bold text-sm tracking-wide shadow-md transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Accept</span>
              </button>

              {/* Explore alternatives */}
              <button
                type="button"
                onClick={() => handleSteer()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/20 text-[#F7F7D9] font-sans font-medium text-sm tracking-wide transition-all"
              >
                <Search className="w-4 h-4 text-[#F7F7D9]/80" />
                <span>Explore alternatives</span>
              </button>

              {/* Not quite */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 border border-white/15 text-[#F7F7D9]/70 hover:text-[#F7F7D9] font-sans font-medium text-sm tracking-wide transition-all"
              >
                <X className="w-4 h-4 text-white/50" />
                <span>Not quite</span>
              </button>
            </div>
          </main>
        </div>

        {/* Bottom Steering Input Capsule */}
        <div className="relative w-full rounded-[28px] sm:rounded-[34px] bg-[#F7F7D9] px-6 sm:px-8 py-3.5 sm:py-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col justify-center">
            <input
              type="text"
              value={steeringInput}
              onChange={(e) => setSteeringInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSteer()}
              placeholder="Tell Poppies what to explore, change, or investigate next..."
              className="w-full bg-transparent border-none outline-none font-serif text-base sm:text-lg text-[#1c2b1e] placeholder:text-[#1c2b1e]/60 placeholder:font-serif placeholder:font-normal"
            />
            <span className="text-[11px] text-[#1c2b1e]/65 font-sans font-medium mt-0.5">
              Applies to the selected thread ({activeThread.title}). You can also make changes to the whole character.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSteer}
            disabled={isSteering}
            className="w-11 h-11 rounded-full bg-[#1b2d20] hover:bg-[#283f2e] active:scale-95 text-[#F7F7D9] flex items-center justify-center transition-all shadow-md cursor-pointer flex-shrink-0"
            title="Send instruction to Poppies"
          >
            <Send className="w-4 h-4 text-[#F7F7D9] -translate-x-0.5 translate-y-0.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Slide-out / Modal Drawer: Qloo Evidence Inspector */}
      {evidenceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-lg h-full max-h-[90vh] rounded-[32px] bg-[#16271a] border border-white/20 p-6 sm:p-8 flex flex-col justify-between text-[#F7F7D9] shadow-2xl overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span className="font-serif italic font-bold text-xl">Qloo Taste Graph Evidence</span>
                </div>
                <button
                  onClick={() => setEvidenceDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase font-sans tracking-widest text-[#E06B55] font-bold">
                  {selectedConnection?.domain || "ENTITY"}
                </span>
                <h3 className="font-serif font-bold text-2xl text-[#F7F7D9]">
                  {selectedConnection?.title || "Entity Evidence"}
                </h3>
                <p className="font-sans text-sm text-[#F7F7D9]/80 leading-relaxed">
                  {selectedConnection?.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col gap-2">
                <span className="text-xs uppercase font-sans font-bold text-white/50 tracking-wider">
                  Verified Qloo URN
                </span>
                <code className="text-xs font-mono text-emerald-300 break-all">
                  {selectedConnection?.qlooType || "urn:entity:artist"}
                </code>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col gap-2">
                <span className="text-xs uppercase font-sans font-bold text-white/50 tracking-wider">
                  Cross-Domain Affinity Resonance
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans">Correlation with character taste seed:</span>
                  <span className="text-lg font-bold text-[#F7FFD9]">
                    {selectedConnection?.affinityScore || 92}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#F7FFD9] rounded-full"
                    style={{ width: `${selectedConnection?.affinityScore || 92}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setEvidenceDrawerOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#F7F7D9] text-[#1b2d20] font-sans font-bold text-sm tracking-wide"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
