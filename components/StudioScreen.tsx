"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  BookOpen,
  X,
  Send,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  MapPin,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";

interface StudioScreenProps {
  initialData: any;
  onAssembleDossier?: () => void;
}

interface Inquiry {
  id: string;
  question: string;
  source?: "creator" | "agent";
  domain?: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" | string;
  vignette?: string;
  vignetteHighlightEntity?: string;
  hasAudio?: boolean;
  audioTrackName?: string;
  entities?: CulturalEntity[];
}

interface CulturalEntity {
  id: string;
  name: string;
  domain: string;
  description: string;
  entityId?: string;
  entityType?: string;
  affinityScore?: number;
  imageUrl?: string;
  seedEntities?: string[];
  qlooReasoning?: string;
  tags?: string[];
}

interface CulturalDossierBrief {
  tasteThesis: string;
  observedClusters: string[];
  unconsideredAngles: {
    title: string;
    description: string;
    groundedEntity?: string;
  }[];
  highlightedNodes: string[];
}

const DEFAULT_DOSSIER: CulturalDossierBrief = {
  tasteThesis:
    "Organized around intentional craft, structural restraint, and music designed for focus rather than performance. Their material world rejects decorative clutter in favor of objects and texts that bear the marks of daily, disciplined utility.",
  observedClusters: [
    "French Impressionist Piano",
    "Heritage Woodwork & Cutlery",
    "Maritime Sanctuaries",
  ],
  unconsideredAngles: [
    {
      title: "Submerged Tension",
      description:
        "Listeners anchored in minimalist acoustic music cross-index into heavier ambient and drone, suggesting emotional weight concealed under clean surfaces.",
      groundedEntity: "Erik Satie",
    },
  ],
  highlightedNodes: ["Opinel Knives", "Erik Satie", "Marseille"],
};

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "tools",
    question: "What tools and everyday objects rest on her worktable?",
    source: "creator",
    domain: "OBJECTS",
    vignette:
      "On the cedar workbench, alongside drafting compasses and fine chisels, sits a well-worn folding knife from Opinel Knives, its carbon blade patinated dark from years of shaping stone and timber.",
    vignetteHighlightEntity: "Opinel Knives",
    hasAudio: false,
  },
  {
    id: "soundscape",
    question: "What does her 2 AM solitary soundscape sound like?",
    source: "creator",
    domain: "MUSIC",
    vignette:
      "At 2 AM, the apartment is quiet except for the wind off the port. She turns to Erik Satie not for background sound, but because spare acoustic piano phrases make the solitary hour feel intentional.",
    vignetteHighlightEntity: "Erik Satie",
    hasAudio: true,
    audioTrackName: "Erik Satie — Gymnopedies (1888)",
  },
  {
    id: "haunts",
    question: "Where does she disappear on Sunday afternoons?",
    source: "creator",
    domain: "PLACES",
    vignette:
      "When the stone dust settles, Elena walks along the limestone inlets of Marseille, watching water erode the quays with the patient eye of someone who repairs what others overlook.",
    vignetteHighlightEntity: "Marseille",
    hasAudio: false,
  },
];

const MOCK_ENTITIES_TOOLS: CulturalEntity[] = [
  {
    id: "t1",
    name: "Opinel Knives",
    domain: "OBJECTS",
    description: "Classic French folding knives from Savoie, prized by carpenters and sculptors.",
    entityId: "urn:qloo:entity:0D354EEB-E70E-4372-B8D8-39A73B658523",
    entityType: "urn:entity:brand",
    affinityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Elena", "woodwork"],
    qlooReasoning: "Heritage French hand-tool maker synonymous with tactile woodcraft and restraint.",
  },
  {
    id: "t2",
    name: "Danner",
    domain: "OBJECTS",
    description: "Handcrafted heritage boots built for rough stone, mortar, and long workshop days.",
    entityId: "urn:qloo:entity:danner_001",
    entityType: "urn:entity:brand",
    affinityScore: 92,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Opinel Knives"],
    qlooReasoning: "Strong cross-category affinity with artisan craftspeople and outdoor restoration workers.",
  },
  {
    id: "t3",
    name: "Leatherman",
    domain: "OBJECTS",
    description: "Multi-purpose steel tools favored for field inspections and quick repairs.",
    entityId: "urn:qloo:entity:leatherman_001",
    entityType: "urn:entity:brand",
    affinityScore: 89,
    imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Opinel Knives"],
    qlooReasoning: "Utilitarian mechanical tool brand indexing high among restoration professionals.",
  },
];

export default function StudioScreen({ initialData, onAssembleDossier }: StudioScreenProps) {
  const characterName = initialData?.character?.name || "Elena";
  const characterSummary =
    initialData?.character?.summary || "Restoring overlooked stone and woodwork in Marseille.";
  const constraints = initialData?.character?.constraints || {};

  const culturalDossier: CulturalDossierBrief =
    initialData?.culturalDossier || DEFAULT_DOSSIER;

  const liveInquiries: Inquiry[] =
    initialData?.inquiries && initialData.inquiries.length > 0
      ? initialData.inquiries
      : MOCK_INQUIRIES;

  const [inquiries, setInquiries] = useState<Inquiry[]>(liveInquiries);
  const [activeInquiryId, setActiveInquiryId] = useState<string>("cultural-dossier");
  const [viewMode, setViewMode] = useState<"lookbook" | "index">("lookbook");
  const [steeringInput, setSteeringInput] = useState<string>("");
  const [isSteering, setIsSteering] = useState<boolean>(false);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<CulturalEntity | null>(null);

  const promptInputRef = useRef<HTMLInputElement>(null);

  // Audio ambient player
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const isDossierSelected = activeInquiryId === "cultural-dossier";
  const activeInquiry = inquiries.find((i) => i.id === activeInquiryId) || inquiries[0];
  const activeEntities =
    activeInquiry?.entities && activeInquiry.entities.length > 0
      ? activeInquiry.entities
      : MOCK_ENTITIES_TOOLS;

  // Global key listener: typing activates prompt box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (evidenceDrawerOpen) return;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape") {
        setIsPromptFocused(false);
        promptInputRef.current?.blur();
        return;
      }

      if (!isInput) {
        if (
          e.key === "Enter" ||
          e.key === "/" ||
          (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
        ) {
          setIsPromptFocused(true);
          promptInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [evidenceDrawerOpen]);

  const handleActivatePrompt = () => {
    setIsPromptFocused(true);
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 50);
  };

  const toggleAmbientSoundscape = () => {
    if (isPlayingAudio) {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.3);
        setTimeout(() => {
          setIsPlayingAudio(false);
        }, 300);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      gainNodeRef.current = masterGain;
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.0);
      masterGain.connect(ctx.destination);

      // Impressionist chord harmonics (Satie / Debussy aesthetic)
      const freqs = [164.81, 220.0, 246.94, 329.63, 392.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(550 + idx * 70, ctx.currentTime);

        lfo.frequency.setValueAtTime(0.07 + idx * 0.02, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.2, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0.16, ctx.currentTime);

        osc.connect(filter);
        filter.connect(voiceGain);
        voiceGain.connect(masterGain);

        osc.start();
        lfo.start();
      });

      setIsPlayingAudio(true);
    } catch (e) {
      console.warn("WebAudio synthesis unavailable:", e);
    }
  };

  const handleSteer = async () => {
    if (!steeringInput.trim() || isSteering) return;
    const promptText = steeringInput.trim();
    setIsSteering(true);

    try {
      const res = await fetch("/api/steer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName,
          instruction: promptText,
          existingSeeds: [characterName],
        }),
      });

      const data = await res.json();
      if (data.inquiry) {
        setInquiries((prev) => [data.inquiry, ...prev]);
        setActiveInquiryId(data.inquiry.id);
      }
    } catch (err) {
      console.error("Live steering error:", err);
      const newInq: Inquiry = {
        id: `inquiry-${Date.now()}`,
        question: promptText.endsWith("?") ? promptText : `Exploring: ${promptText}`,
        source: "creator",
        domain: "OBJECTS",
        vignette: `Directed by creator: "${promptText}". Her space recalibrates around this quiet shift, subtly reorienting her daily routines.`,
        entities: MOCK_ENTITIES_TOOLS,
      };
      setInquiries((prev) => [newInq, ...prev]);
      setActiveInquiryId(newInq.id);
    } finally {
      setIsSteering(false);
      setSteeringInput("");
      setIsPromptFocused(false);
      promptInputRef.current?.blur();
    }
  };

  const handleEntityClick = (entity: CulturalEntity) => {
    setSelectedEntity(entity);
    setEvidenceDrawerOpen(true);
  };

  const findEntityByName = (name: string): CulturalEntity => {
    for (const inq of inquiries) {
      const match = inq.entities?.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (match) return match;
    }
    return (
      activeEntities.find((e) => e.name.toLowerCase() === name.toLowerCase()) || {
        id: `entity-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        domain: "CULTURE",
        description: `Direct cultural anchor discovered through Qloo graph traversal for ${characterName}.`,
        affinityScore: 92,
        seedEntities: [characterName],
        qlooReasoning: "Grounded node in character taste cluster.",
      }
    );
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#101b13] p-4 sm:p-6 lg:p-7 select-none">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90 scale-[1.01]"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green Clearing Extending to Right Edge */}
      <div
        className="pointer-events-none fixed inset-y-0 right-0 left-0 w-full"
        style={{
          backgroundColor: "#182a1d",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
        }}
      />

      {/* 3. Studio Main Stage */}
      <div className="relative w-full max-w-[1360px] h-full flex gap-7 lg:gap-9 items-stretch justify-center">
        {/* ================= LEFT COLUMN: Sidebar ================= */}
        <aside className="w-[250px] sm:w-[270px] flex-shrink-0 flex flex-col justify-between h-full min-h-0">
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pl-1 flex-shrink-0">
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

            {/* Cultural Dossier Overview Button (Quiet, confident, no sparkles) */}
            <button
              type="button"
              onClick={() => {
                setActiveInquiryId("cultural-dossier");
                if (isPlayingAudio) toggleAmbientSoundscape();
              }}
              className={`w-full p-3 rounded-[18px] transition-all duration-200 text-left cursor-pointer flex-shrink-0 flex items-center justify-between ${
                isDossierSelected
                  ? "bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                  : "bg-white/[0.05] hover:bg-white/[0.09] backdrop-blur-md border border-white/[0.12]"
              }`}
            >
              <span
                className={`font-serif italic text-[14.5px] ${
                  isDossierSelected
                    ? "font-bold text-[#F7F7D9]"
                    : "font-medium text-[#F7F7D9]/80"
                }`}
              >
                Cultural Dossier
              </span>
              <span className="text-[11px] font-sans text-[#F7F7D9]/50">
                Brief
              </span>
            </button>

            {/* Inquiries List (Clean and unadorned) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pt-1">
              {inquiries.map((inquiry) => {
                const isActive = !isDossierSelected && inquiry.id === activeInquiry?.id;
                const isCreator = inquiry.source === "creator";

                return (
                  <button
                    key={inquiry.id}
                    onClick={() => {
                      setActiveInquiryId(inquiry.id);
                      if (isPlayingAudio) toggleAmbientSoundscape();
                    }}
                    className={`group w-full p-3 rounded-[18px] transition-all duration-200 text-left cursor-pointer flex-shrink-0 flex flex-col gap-1 ${
                      isActive
                        ? "bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                        : "bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-[#F7F7D9]/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono tracking-tight ${
                          isCreator ? "text-[#F7F7D9]/60" : "text-[#E06B55]"
                        }`}
                      >
                        {isCreator ? "[You]" : "[Agent]"}
                      </span>
                    </div>

                    <span
                      className={`font-sans text-[12.5px] leading-snug line-clamp-2 ${
                        isActive
                          ? "font-medium text-[#F7F7D9]"
                          : "text-[#F7F7D9]/75 group-hover:text-[#F7F7D9]"
                      }`}
                    >
                      {inquiry.question}
                    </span>
                  </button>
                );
              })}

              {/* Add question button */}
              <button
                type="button"
                onClick={handleActivatePrompt}
                className="flex items-center gap-2 px-3 py-2 rounded-[16px] bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-dashed border-white/15 text-[#F7F7D9]/70 hover:text-[#F7F7D9] text-xs font-sans transition-all cursor-pointer flex-shrink-0 mt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ask a new question</span>
              </button>
            </div>
          </div>

          {/* Bottom Action: Assemble Dossier */}
          <div className="pt-2 flex-shrink-0">
            <button
              type="button"
              onClick={onAssembleDossier}
              className="w-full flex items-center justify-between p-3 rounded-[18px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] backdrop-blur-lg text-[#F7F7D9] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#F7F7D9]/80" />
                <span className="font-serif italic font-medium text-xs sm:text-sm">
                  Assemble dossier
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </aside>

        {/* ================= RIGHT COLUMN: Header + Main Card + Prompt ================= */}
        <div className="flex-1 flex flex-col gap-3 max-w-[1040px] h-full min-h-0">
          {/* Header Row: Character Name & Quiet Constraints */}
          <div className="flex-shrink-0 flex items-baseline justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F7F7D9] tracking-tight leading-tight">
                {characterName}
              </h1>
              <p className="font-serif italic text-sm text-[#F7F7D9]/60 max-w-lg truncate">
                {characterSummary}
              </p>
            </div>

            {/* Subtle Constraint Pills */}
            <div className="flex items-center gap-2">
              {constraints.locality && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.locality}
                </span>
              )}
              {constraints.era && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.era}
                </span>
              )}
              {constraints.occupation && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.occupation}
                </span>
              )}
            </div>
          </div>

          {/* Main Card */}
          <main className="w-full flex-1 min-h-0 rounded-[26px] bg-[#162a1c]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-7 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            {/* VIEW A: CULTURAL DOSSIER (Clean, quiet, zero marketing clutter) */}
            {isDossierSelected ? (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-6">
                {/* Dossier Literary Prose Card */}
                <div className="rounded-[20px] bg-white/[0.03] border border-white/[0.08] p-5 sm:p-6 shadow-sm">
                  <p className="font-serif text-base sm:text-[1.12rem] leading-[1.75] text-[#F7F7D9] font-light">
                    {culturalDossier.tasteThesis.split(new RegExp(`(${culturalDossier.highlightedNodes.join("|")})`, "g")).map((part, i) => {
                      const isNode = culturalDossier.highlightedNodes.some(
                        (node) => node.toLowerCase() === part.toLowerCase()
                      );
                      if (isNode) {
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleEntityClick(findEntityByName(part))}
                            className="inline-flex items-baseline font-normal italic text-[#F7F7D9] underline decoration-[#E06B55] decoration-1 underline-offset-4 hover:text-[#E06B55] transition-colors cursor-pointer"
                            title="Inspect Qloo evidence"
                          >
                            {part}
                          </button>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </p>
                </div>

                {/* Two-Column: Observed Patterns & Unconsidered Angle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Observed Clusters */}
                  <div className="rounded-[18px] bg-white/[0.03] border border-white/[0.07] p-4 sm:p-5 flex flex-col gap-2.5">
                    <span className="font-serif italic font-medium text-xs text-[#F7F7D9]/60">
                      Observed Clusters
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {culturalDossier.observedClusters.map((cluster, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-[12px] bg-white/[0.03] border border-white/[0.05] font-sans text-xs text-[#F7F7D9]/85"
                        >
                          {cluster}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unconsidered Angle (Subtle Callout) */}
                  {culturalDossier.unconsideredAngles[0] && (
                    <div className="rounded-[18px] bg-white/[0.03] border border-white/[0.07] p-4 sm:p-5 flex flex-col justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                          {culturalDossier.unconsideredAngles[0].title}
                        </span>
                        <p className="font-sans text-xs text-[#F7F7D9]/70 leading-relaxed">
                          {culturalDossier.unconsideredAngles[0].description}
                        </p>
                      </div>

                      {culturalDossier.unconsideredAngles[0].groundedEntity && (
                        <button
                          type="button"
                          onClick={() =>
                            handleEntityClick(
                              findEntityByName(
                                culturalDossier.unconsideredAngles[0].groundedEntity!
                              )
                            )
                          }
                          className="self-start inline-flex items-center gap-1 text-xs font-serif italic text-[#F7F7D9]/80 hover:text-[#E06B55] transition-colors cursor-pointer pt-1"
                        >
                          <span>Inspect {culturalDossier.unconsideredAngles[0].groundedEntity}</span>
                          <ChevronRight className="w-3 h-3 text-[#E06B55]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* VIEW B: SCENE INQUIRY VIEW (Lookbook & Index) */
              <div className="flex flex-col h-full min-h-0">
                {/* Header: Question + Mode Switcher */}
                <div className="flex-shrink-0 pb-3 border-b border-white/[0.08] mb-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-[#F7F7D9]/50 flex-shrink-0">
                      {activeInquiry.source === "creator" ? "[You]" : "[Agent]"}
                    </span>
                    <h2 className="font-serif font-medium text-base sm:text-lg text-[#F7F7D9] tracking-tight truncate">
                      {activeInquiry.question}
                    </h2>
                  </div>

                  {/* Lookbook vs Index Toggle */}
                  <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.05] border border-white/10 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode("lookbook")}
                      className={`px-3 py-0.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                        viewMode === "lookbook"
                          ? "bg-[#F7F7D9] text-[#162a1c] font-bold shadow-sm"
                          : "text-[#F7F7D9]/60 hover:text-[#F7F7D9] font-medium"
                      }`}
                    >
                      Lookbook
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("index")}
                      className={`px-3 py-0.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                        viewMode === "index"
                          ? "bg-[#F7F7D9] text-[#162a1c] font-bold shadow-sm"
                          : "text-[#F7F7D9]/60 hover:text-[#F7F7D9] font-medium"
                      }`}
                    >
                      Index
                    </button>
                  </div>
                </div>

                {/* View 1: Editorial Lookbook Mode */}
                {viewMode === "lookbook" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-4">
                    {/* Scene Vignette with Inline Clickable Node */}
                    {activeInquiry.vignette && (
                      <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.07] p-4 sm:p-5">
                        <p className="font-serif text-[15px] sm:text-base text-[#F7F7D9]/90 leading-relaxed font-light">
                          {activeInquiry.vignette.split(activeInquiry.vignetteHighlightEntity || "").map((part, i, arr) => (
                            <span key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const match = activeEntities.find(
                                      (e) => e.name === activeInquiry.vignetteHighlightEntity
                                    ) || activeEntities[0];
                                    handleEntityClick(match);
                                  }}
                                  className="inline-flex items-baseline font-normal italic text-[#F7F7D9] underline decoration-[#E06B55] decoration-1 underline-offset-4 hover:text-[#E06B55] transition-colors cursor-pointer"
                                  title="Inspect Qloo evidence"
                                >
                                  {activeInquiry.vignetteHighlightEntity}
                                </button>
                              )}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}

                    {/* Audio Capsule (Only when music inquiry) */}
                    {activeInquiry.hasAudio && (
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.1] backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={toggleAmbientSoundscape}
                            className="w-6 h-6 rounded-full bg-[#F7F7D9] hover:bg-white text-[#162a1c] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                            title={isPlayingAudio ? "Pause soundscape" : "Play soundscape"}
                          >
                            {isPlayingAudio ? (
                              <Pause className="w-2.5 h-2.5 fill-current stroke-[2]" />
                            ) : (
                              <Play className="w-2.5 h-2.5 fill-current translate-x-0.5 stroke-[2]" />
                            )}
                          </button>
                          <span className="font-serif italic text-xs text-[#F7F7D9]/90">
                            {activeInquiry.audioTrackName || "Solitary Ambient Frequencies"}
                          </span>
                        </div>

                        {/* Quiet indicator */}
                        <div className="flex items-center gap-1 pr-1">
                          <Volume2 className="w-3 h-3 text-[#F7F7D9]/40" />
                          <div className="flex items-center gap-0.5 h-3 pl-0.5">
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2.5 animate-pulse" : "h-1 opacity-30"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2 animate-pulse delay-100" : "h-1 opacity-30"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-3 animate-pulse delay-200" : "h-1 opacity-30"}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clean Lookbook Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {activeEntities.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => handleEntityClick(entity)}
                          className="group relative h-[165px] rounded-[18px] overflow-hidden border border-white/[0.1] hover:border-white/[0.24] transition-all duration-300 text-left cursor-pointer shadow-md bg-black/40 flex flex-col justify-between p-3.5"
                        >
                          {entity.imageUrl && (
                            <img
                              src={entity.imageUrl}
                              alt={entity.name}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                          {/* Top: Affinity Pill */}
                          <div className="relative z-10 flex items-center justify-end">
                            {entity.affinityScore !== undefined && (
                              <span className="px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[10px] font-sans font-bold text-[#F7F7D9]/90">
                                {entity.affinityScore}%
                              </span>
                            )}
                          </div>

                          {/* Bottom: Title & Description */}
                          <div className="relative z-10 flex flex-col gap-0.5">
                            <span className="font-serif italic font-bold text-sm sm:text-[15px] text-[#F7F7D9] group-hover:text-white transition-colors">
                              {entity.name}
                            </span>
                            <p className="font-sans text-[11px] text-[#F7F7D9]/70 line-clamp-1">
                              {entity.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View 2: Scannable Index Mode */}
                {viewMode === "index" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col divide-y divide-white/[0.05]">
                    {activeEntities.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                        className="group w-full flex items-center gap-4 px-3 py-2.5 text-left transition-all duration-150 cursor-pointer hover:bg-white/[0.05] rounded-xl flex-shrink-0"
                      >
                        <div className="min-w-[170px] flex-shrink-0">
                          <span className="font-serif italic font-medium text-sm text-[#F7F7D9] group-hover:text-white transition-colors">
                            {entity.name}
                          </span>
                        </div>

                        <p className="flex-1 font-sans text-xs text-[#F7F7D9]/65 leading-relaxed line-clamp-2 min-w-0">
                          {entity.description}
                        </p>

                        {entity.affinityScore !== undefined && (
                          <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                            <span className="font-sans text-[11px] font-medium text-[#F7F7D9]/80">
                              {entity.affinityScore}%
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Bottom Steering Input Capsule: Fixed at Bottom with Focus Mode */}
          <div
            className={`w-full flex-shrink-0 rounded-[22px] sm:rounded-[24px] p-1.5 backdrop-blur-md border transition-all duration-300 ease-out transform-gpu ${
              isPromptFocused
                ? "relative z-50 scale-[1.015] bg-white/[0.08] border-white/30 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20"
                : "relative z-20 bg-white/[0.05] border-white/[0.12] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.35)]"
            }`}
            style={{ willChange: "transform, box-shadow" }}
          >
            <div className="w-full rounded-[16px] sm:rounded-[18px] bg-[#F7F7D9] px-5 sm:px-6 py-2.5 sm:py-3 shadow-sm flex items-center justify-between gap-3">
              <input
                ref={promptInputRef}
                type="text"
                value={steeringInput}
                onChange={(e) => setSteeringInput(e.target.value)}
                onFocus={() => setIsPromptFocused(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSteer()}
                placeholder="Ask a question about their world or steer taste..."
                className="w-full bg-transparent border-none outline-none font-serif text-sm sm:text-base text-[#1c2b1e] placeholder:text-[#1c2b1e]/50"
              />

              <button
                type="button"
                onClick={handleSteer}
                disabled={isSteering}
                className="w-8 h-8 rounded-full bg-[#1b2d20] hover:bg-[#283f2e] active:scale-95 text-[#F7F7D9] flex items-center justify-center transition-all shadow-md cursor-pointer flex-shrink-0"
                title="Send instruction to Poppies"
              >
                <Send className="w-3.5 h-3.5 text-[#F7F7D9] -translate-x-0.5 translate-y-0.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Backdrop Overlay with Smooth Fade In/Out */}
      <div
        aria-hidden="true"
        onClick={() => {
          setIsPromptFocused(false);
          promptInputRef.current?.blur();
        }}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out cursor-pointer ${
          isPromptFocused ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ willChange: "opacity" }}
      />

      {/* Right Drawer: Entity Evidence Inspector */}
      {evidenceDrawerOpen && selectedEntity && (
        <div className="fixed inset-0 z-60 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg h-full max-h-[85vh] rounded-[24px] bg-[#16271a] border border-white/20 p-5 sm:p-6 flex flex-col justify-between text-[#F7F7D9] shadow-2xl overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#E06B55]">
                    {selectedEntity.domain}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-[#F7F7D9]">
                    {selectedEntity.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEvidenceDrawerOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-[#F7F7D9]" />
                </button>
              </div>

              {/* Description */}
              <p className="font-serif text-sm leading-relaxed text-[#F7F7D9]/85">
                {selectedEntity.description}
              </p>

              {/* Qloo Provenance Card */}
              <div className="rounded-[16px] bg-white/[0.04] border border-white/10 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans text-[#F7F7D9]/60">
                    Qloo Entity ID
                  </span>
                  <code className="font-mono text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    {selectedEntity.entityId || "urn:qloo:entity:resolved"}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans text-[#F7F7D9]/60">
                    Entity Type
                  </span>
                  <span className="font-mono text-xs text-[#F7F7D9]/75">
                    {selectedEntity.entityType || `urn:entity:${selectedEntity.domain.toLowerCase()}`}
                  </span>
                </div>

                {selectedEntity.seedEntities && selectedEntity.seedEntities.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.08]">
                    <span className="text-[10px] font-sans text-[#F7F7D9]/60">
                      Discovered via Seeds
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntity.seedEntities.map((seed, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[11px] font-sans text-[#F7F7D9]/85 border border-white/10"
                        >
                          {seed}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Affinity Score Bar */}
              {selectedEntity.affinityScore !== undefined && (
                <div className="rounded-[16px] bg-white/[0.04] border border-white/10 p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans text-[#F7F7D9]/60">
                      Latent Affinity Score
                    </span>
                    <span className="font-sans font-bold text-sm text-[#F7F7D9]">
                      {selectedEntity.affinityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E06B55] to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${selectedEntity.affinityScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Why Qloo Connected This */}
              {selectedEntity.qlooReasoning && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-sans text-[#E06B55]">
                    Why Qloo Connected This
                  </span>
                  <p className="font-sans text-xs text-[#F7F7D9]/75 leading-relaxed bg-white/[0.03] p-3 rounded-[12px] border border-white/[0.06]">
                    {selectedEntity.qlooReasoning}
                  </p>
                </div>
              )}

              {/* Alternatives / Branching Controls */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className="text-[10px] font-sans text-[#F7F7D9]/60">
                  Branch Alternatives
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSteeringInput(`Find an alternative to ${selectedEntity.name} that is more obscure`);
                      setEvidenceDrawerOpen(false);
                      handleActivatePrompt();
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/90 transition-colors cursor-pointer"
                  >
                    More obscure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSteeringInput(`Find an alternative to ${selectedEntity.name} from a different era`);
                      setEvidenceDrawerOpen(false);
                      handleActivatePrompt();
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/90 transition-colors cursor-pointer"
                  >
                    Different era
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSteeringInput(`Find a local variant of ${selectedEntity.name}`);
                      setEvidenceDrawerOpen(false);
                      handleActivatePrompt();
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/90 transition-colors cursor-pointer"
                  >
                    Local variant
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Done Button */}
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setEvidenceDrawerOpen(false)}
                className="px-5 py-1.5 rounded-full bg-[#F7F7D9] hover:bg-white text-[#16271a] font-sans font-medium text-xs transition-all shadow-md cursor-pointer"
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
