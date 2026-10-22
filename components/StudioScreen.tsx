"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  BookOpen,
  X,
  Send,
  ChevronRight,
  Layers,
  Play,
  Pause,
  Volume2,
} from "lucide-react";

interface StudioScreenProps {
  initialData: any;
  onAssembleDossier?: () => void;
}

interface Inquiry {
  id: string;
  question: string;
  vignette?: string;
  vignetteHighlightEntity?: string;
  hasAudio?: boolean;
  audioTrackName?: string;
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
}

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "playlist",
    question: "What does her 2 AM playlist sound like?",
    vignette:
      "The light off the avenue comes through uncurtained glass. At 2 AM, the drafting table is clear except for an incandescent lamp, a chipped Hasami mug of black coffee, and an analog tape deck running on loop. She turns to Hiroshi Yoshimura not for background music, but because repetitive acoustic tape phrases make the solitary hour feel intentional.",
    vignetteHighlightEntity: "Hiroshi Yoshimura",
    hasAudio: true,
    audioTrackName: "Hiroshi Yoshimura — Blink (1986)",
  },
  {
    id: "bookshelf",
    question: "What's on her bookshelf?",
    vignette:
      "Three shelves of unvarnished pine, wedged tight without bookends. No decorative ornaments or literary trophies. Creased copies of In Praise of Shadows and The Poetics of Space lean against regional transit blueprints and worn urban topography maps, read in the quiet before sleep.",
    vignetteHighlightEntity: "In Praise of Shadows",
    hasAudio: false,
  },
  {
    id: "apartment",
    question: "What does her apartment look like?",
    vignette:
      "A fifth-floor corner unit facing the rail viaduct. Concrete ceilings left raw from construction, acoustic wool rugs muted in charcoal, and a single low armchair angled toward the window where passenger trains decelerate into the terminal.",
    hasAudio: false,
  },
  {
    id: "haunts",
    question: "Where does she go when she needs to disappear?",
    vignette:
      "A basement kissaten three blocks behind the station where the counter is polished dark cherry and conversations are held below the level of the tape hum.",
    hasAudio: false,
  },
  {
    id: "contradiction",
    question: "What's her guilty pleasure that doesn't fit?",
    vignette:
      "Behind an austere row of architecture monographs sits an unmarked tin of sour plum gummies and a clandestine VHS tape of chaotic midnight variety television.",
    hasAudio: false,
  },
];

const MOCK_ENTITIES_PLAYLIST: CulturalEntity[] = [
  {
    id: "e1",
    name: "Hiroshi Yoshimura",
    domain: "MUSIC",
    description: "Crystalline acoustic piano over field recordings of rain and machinery.",
    entityId: "urn:qloo:entity:hiro_yosh_001",
    entityType: "urn:entity:artist",
    affinityScore: 96,
    imageUrl: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Ryuichi Sakamoto", "Tadao Ando"],
    qlooReasoning: "High latent affinity with Japanese architectural minimalism and solitary creative professionals.",
  },
  {
    id: "e2",
    name: "Grouper",
    domain: "MUSIC",
    description: "Layered guitar drones submerged in tape hiss and cathedral reverb.",
    entityId: "urn:qloo:entity:grouper_001",
    entityType: "urn:entity:artist",
    affinityScore: 93,
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Hiroshi Yoshimura"],
    qlooReasoning: "Second-order discovery: fans of Japanese ambient over-index heavily on Pacific Northwest drone and shoegaze.",
  },
  {
    id: "e3",
    name: "Ryuichi Sakamoto",
    domain: "MUSIC",
    description: "Austere solo piano, sparse acoustic textures, and environmental soundscapes.",
    entityId: "urn:qloo:entity:saka_001",
    entityType: "urn:entity:artist",
    affinityScore: 91,
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Nagoya", "architecture"],
    qlooReasoning: "Direct seed from creator prompt — strong affinity with design professionals and East Asian minimalism.",
  },
  {
    id: "e4",
    name: "Visible Cloaks",
    domain: "MUSIC",
    description: "Portland duo blending gagaku court music with digital synthesis.",
    entityId: "urn:qloo:entity:vis_cloak_001",
    entityType: "urn:entity:artist",
    affinityScore: 88,
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Hiroshi Yoshimura", "Grouper"],
    qlooReasoning: "Cross-domain bridge between Japanese ambient and Pacific Northwest electronic scenes.",
  },
  {
    id: "e5",
    name: "Midori Takada",
    domain: "MUSIC",
    description: "Percussionist and composer — meditative marimba and spatial acoustics.",
    entityId: "urn:qloo:entity:takada_001",
    entityType: "urn:entity:artist",
    affinityScore: 87,
    imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Ryuichi Sakamoto"],
    qlooReasoning: "Co-occurrence with Japanese ambient and minimalist composition listeners.",
  },
  {
    id: "e6",
    name: "Julianna Barwick",
    domain: "MUSIC",
    description: "Voice-as-instrument ambient — looped harmonics building cathedral reverb.",
    entityId: "urn:qloo:entity:barwick_001",
    entityType: "urn:entity:artist",
    affinityScore: 85,
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Grouper"],
    qlooReasoning: "Strong co-occurrence with Grouper fans; overlap with architectural and spatial sound preferences.",
  },
];

const MOCK_ENTITIES_BOOKSHELF: CulturalEntity[] = [
  {
    id: "b1",
    name: "In Praise of Shadows",
    domain: "BOOKS",
    description: "Jun'ichirō Tanizaki's essay on Japanese aesthetics, darkness, and worn surfaces.",
    entityId: "urn:qloo:entity:tanizaki_001",
    entityType: "urn:entity:book",
    affinityScore: 94,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Nagoya", "architecture"],
    qlooReasoning: "Foundational aesthetic text strongly correlated with architectural and material preservation professionals.",
  },
  {
    id: "b2",
    name: "The Poetics of Space",
    domain: "BOOKS",
    description: "Gaston Bachelard's phenomenology of intimate architecture — attics, corners, nests.",
    entityId: "urn:qloo:entity:bachelard_001",
    entityType: "urn:entity:book",
    affinityScore: 91,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["In Praise of Shadows"],
    qlooReasoning: "Cross-domain affinity bridge between spatial design practitioners and contemplative literature readers.",
  },
  {
    id: "b3",
    name: "Convenience Store Woman",
    domain: "BOOKS",
    description: "Sayaka Murata's deadpan novel of finding belonging in the strict routines of a konbini.",
    entityId: "urn:qloo:entity:murata_001",
    entityType: "urn:entity:book",
    affinityScore: 88,
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Japanese contemporary fiction"],
    qlooReasoning: "High co-occurrence with readers exploring solitary urban existence and personal social friction.",
  },
  {
    id: "b4",
    name: "Norwegian Wood",
    domain: "BOOKS",
    description: "Murakami's intimate narrative of loss, memory, and the weight of quiet attachment.",
    entityId: "urn:qloo:entity:murakami_nw_001",
    entityType: "urn:entity:book",
    affinityScore: 86,
    imageUrl: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["Haruki Murakami"],
    qlooReasoning: "Classic cultural anchor correlating with introspective urban fiction readers.",
  },
  {
    id: "b5",
    name: "Dept. of Speculation",
    domain: "BOOKS",
    description: "Jenny Offill's fragmented novel exploring solitude, observation, and internal monologue.",
    entityId: "urn:qloo:entity:offill_001",
    entityType: "urn:entity:book",
    affinityScore: 83,
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["The Poetics of Space"],
    qlooReasoning: "Stylistic resonance with readers of austere, distilled contemporary prose.",
  },
  {
    id: "b6",
    name: "Wabi-Sabi",
    domain: "BOOKS",
    description: "Leonard Koren's compact manifesto on the beauty of things imperfect and transient.",
    entityId: "urn:qloo:entity:koren_001",
    entityType: "urn:entity:book",
    affinityScore: 80,
    imageUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
    seedEntities: ["In Praise of Shadows"],
    qlooReasoning: "Direct aesthetic co-occurrence with industrial and architectural design readers.",
  },
];

function getEntitiesForInquiry(inquiryId: string): CulturalEntity[] {
  switch (inquiryId) {
    case "playlist":
      return MOCK_ENTITIES_PLAYLIST;
    case "bookshelf":
      return MOCK_ENTITIES_BOOKSHELF;
    default:
      return [];
  }
}

export default function StudioScreen({ initialData, onAssembleDossier }: StudioScreenProps) {
  const characterName = initialData?.character?.name || "Shoujo A";

  const [inquiries, setInquiries] = useState<Inquiry[]>(MOCK_INQUIRIES);
  const [activeInquiryId, setActiveInquiryId] = useState<string>("playlist");
  const [viewMode, setViewMode] = useState<"lookbook" | "index">("lookbook");
  const [steeringInput, setSteeringInput] = useState<string>("");
  const [isSteering, setIsSteering] = useState<boolean>(false);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<CulturalEntity | null>(null);

  const promptInputRef = useRef<HTMLInputElement>(null);

  // Sensory audio ambient soundscape synthesizer
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const activeInquiry = inquiries.find((i) => i.id === activeInquiryId) || inquiries[0];
  const activeEntities = getEntitiesForInquiry(activeInquiry.id);

  // Global keyboard listener: tapping keyboard activates prompt box & focus mode
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
        // Any printable key, slash, or enter activates prompt box
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
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.4);
        setTimeout(() => {
          setIsPlayingAudio(false);
        }, 400);
      } else {
        setIsPlayingAudio(false);
      }
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Warm ambient fifth chord (A3 = 220Hz, E4 = 329.63Hz)
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(220, ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(329.63, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.2);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        gainNodeRef.current = gain;
        setIsPlayingAudio(true);
      } catch (e) {
        console.error("Audio synth error:", e);
      }
    }
  };

  const handleSteer = () => {
    if (!steeringInput.trim()) return;
    setIsSteering(true);
    const text = steeringInput.trim();
    // If entered as a question or scene directive, dynamically add to inquiries list
    if (
      text.endsWith("?") ||
      text.toLowerCase().startsWith("what") ||
      text.toLowerCase().startsWith("where") ||
      text.toLowerCase().startsWith("how") ||
      text.toLowerCase().startsWith("scene:") ||
      text.toLowerCase().startsWith("the ")
    ) {
      const cleanTitle = text.replace(/^scene:\s*/i, "");
      const newInquiry: Inquiry = {
        id: `inquiry-${Date.now()}`,
        question: cleanTitle,
        vignette: `Exploring a new scene: ${cleanTitle}`,
        hasAudio: false,
      };
      setInquiries((prev) => [...prev, newInquiry]);
      setActiveInquiryId(newInquiry.id);
    }
    setSteeringInput("");
    setIsSteering(false);
    setIsPromptFocused(false);
    promptInputRef.current?.blur();
  };

  const handleEntityClick = (entity: CulturalEntity) => {
    setSelectedEntity(entity);
    setEvidenceDrawerOpen(true);
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

      {/* 3. Studio Main Stage: Strictly Viewport Height */}
      <div className="relative w-full max-w-[1360px] h-full flex gap-7 lg:gap-9 items-stretch justify-center">
        {/* ================= LEFT COLUMN: Sidebar (Scrollable on its own) ================= */}
        <aside className="w-[250px] sm:w-[265px] flex-shrink-0 flex flex-col justify-between h-full min-h-0">
          {/* Top Section: Logo & Scrollable Inquiries */}
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pl-1 flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full shadow-md border border-white/20 bg-cover bg-no-repeat"
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

            {/* Inquiries Navigation List (Scrollable on its own) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
              {inquiries.map((inquiry) => {
                const isActive = inquiry.id === activeInquiry.id;
                return (
                  <button
                    key={inquiry.id}
                    onClick={() => {
                      setActiveInquiryId(inquiry.id);
                      if (isPlayingAudio) toggleAmbientSoundscape();
                    }}
                    className={`group w-full p-3 rounded-[20px] transition-all duration-200 text-left cursor-pointer flex-shrink-0 ${
                      isActive
                        ? "bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_8px_24px_rgba(0,0,0,0.35)]"
                        : "bg-white/[0.05] hover:bg-white/[0.09] backdrop-blur-md border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                    }`}
                  >
                    <span
                      className={`font-sans text-[13px] leading-snug ${
                        isActive
                          ? "font-bold text-[#F7F7D9]"
                          : "font-medium text-[#F7F7D9]/80 group-hover:text-[#F7F7D9]"
                      }`}
                    >
                      {inquiry.question}
                    </span>
                  </button>
                );
              })}

              {/* Add a new question or scene button */}
              <button
                type="button"
                onClick={handleActivatePrompt}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-dashed border-white/20 text-[#F7F7D9]/80 hover:text-[#F7F7D9] text-xs font-sans font-medium transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ask a question or new scene</span>
              </button>
            </div>
          </div>

          {/* Bottom Action: Assemble Dossier */}
          <div className="pt-3 flex-shrink-0">
            <button
              type="button"
              onClick={onAssembleDossier}
              className="w-full flex items-center justify-between p-3.5 rounded-[20px] bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.16] backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.3)] text-[#F7F7D9] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#F7F7D9]" />
                <span className="font-serif italic font-bold text-sm">
                  Assemble dossier
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </aside>

        {/* ================= RIGHT COLUMN: Character Name (Top) + Main Card + Fixed Bottom Prompt Box ================= */}
        <div className="flex-1 flex flex-col gap-3.5 max-w-[1040px] h-full min-h-0">
          {/* Character Name at the Top of the Page */}
          <div className="flex-shrink-0">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F7F7D9] tracking-tight leading-tight">
              {characterName}
            </h1>
          </div>

          {/* Main Card: Restrained, High-Taste Editorial Lookbook / Index */}
          <main className="w-full flex-1 min-h-0 rounded-[28px] bg-[#162a1c]/88 border border-white/[0.14] backdrop-blur-2xl p-6 sm:p-7 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22),0_20px_55px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden">
            {activeEntities.length > 0 ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Inquiry Question Title + Restrained Mode Switcher */}
                <div className="flex-shrink-0 pb-4 border-b border-white/[0.08] mb-3 flex items-center justify-between gap-4">
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#F7F7D9] tracking-tight leading-tight">
                    {activeInquiry.question}
                  </h2>

                  {/* Restrained Lookbook vs Index Toggle */}
                  <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode("lookbook")}
                      className={`px-3.5 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                        viewMode === "lookbook"
                          ? "bg-[#F7F7D9] text-[#162a1c] font-bold shadow-sm"
                          : "text-[#F7F7D9]/70 hover:text-[#F7F7D9] font-medium"
                      }`}
                    >
                      Lookbook
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("index")}
                      className={`px-3.5 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                        viewMode === "index"
                          ? "bg-[#F7F7D9] text-[#162a1c] font-bold shadow-sm"
                          : "text-[#F7F7D9]/70 hover:text-[#F7F7D9] font-medium"
                      }`}
                    >
                      Index
                    </button>
                  </div>
                </div>

                {/* View 1: Editorial Lookbook Mode (Sensory, Tactile, No Slop) */}
                {viewMode === "lookbook" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-4">
                    {/* Scene Vignette with Inline Clickable Node */}
                    {activeInquiry.vignette && (
                      <div className="rounded-[18px] bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5">
                        <p className="font-serif text-[15px] sm:text-base text-[#F7F7D9]/90 leading-relaxed">
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
                                  className="inline-flex items-baseline font-bold italic text-[#F7F7D9] underline decoration-[#E06B55] decoration-2 underline-offset-4 hover:text-[#E06B55] transition-colors cursor-pointer"
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
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={toggleAmbientSoundscape}
                            className="w-7 h-7 rounded-full bg-[#F7F7D9] hover:bg-white text-[#162a1c] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                            title={isPlayingAudio ? "Pause ambient soundscape" : "Play ambient soundscape"}
                          >
                            {isPlayingAudio ? (
                              <Pause className="w-3 h-3 fill-current stroke-[2.5]" />
                            ) : (
                              <Play className="w-3 h-3 fill-current translate-x-0.5 stroke-[2.5]" />
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="font-serif italic font-bold text-xs sm:text-sm text-[#F7F7D9]">
                              {activeInquiry.audioTrackName}
                            </span>
                            <span className="text-[9px] uppercase font-sans tracking-widest text-[#E06B55] font-bold">
                              Soundscape
                            </span>
                          </div>
                        </div>

                        {/* Animated waveform bars when playing */}
                        <div className="flex items-center gap-1 pr-1">
                          <Volume2 className="w-3.5 h-3.5 text-[#F7F7D9]/60" />
                          <div className="flex items-center gap-0.5 h-3.5 pl-1">
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-3 animate-pulse" : "h-1 opacity-40"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2.5 animate-pulse delay-100" : "h-1 opacity-40"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-3.5 animate-pulse delay-200" : "h-1 opacity-40"}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cinematic Lookbook Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                      {activeEntities.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => handleEntityClick(entity)}
                          className="group relative h-[175px] rounded-[20px] overflow-hidden border border-white/[0.12] hover:border-white/[0.28] transition-all duration-300 text-left cursor-pointer shadow-md bg-black/40 flex flex-col justify-between p-3.5"
                        >
                          {/* Background Image */}
                          {entity.imageUrl && (
                            <img
                              src={entity.imageUrl}
                              alt={entity.name}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                            />
                          )}

                          {/* Gradient Vignette for Readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                          {/* Top Row: Affinity Pill */}
                          <div className="relative z-10 flex items-center justify-end">
                            {entity.affinityScore !== undefined && (
                              <span className="px-2 py-0.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-[10px] font-sans font-bold text-[#F7F7D9]">
                                {entity.affinityScore}%
                              </span>
                            )}
                          </div>

                          {/* Bottom Row: Metadata & Title */}
                          <div className="relative z-10 flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-sans tracking-widest text-[#E06B55] font-bold">
                              {entity.domain}
                            </span>
                            <span className="font-serif italic font-bold text-sm sm:text-base text-[#F7F7D9] group-hover:text-white transition-colors">
                              {entity.name}
                            </span>
                            <p className="font-sans text-[11px] text-[#F7F7D9]/75 line-clamp-1 mt-0.5">
                              {entity.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View 2: Scannable Index Mode (The Clean Sourcing List) */}
                {viewMode === "index" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col divide-y divide-white/[0.06]">
                    {activeEntities.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                        className="group w-full flex items-center gap-4 px-3.5 py-3 text-left transition-all duration-150 cursor-pointer hover:bg-white/[0.06] rounded-xl flex-shrink-0"
                      >
                        {/* Left: Name + Domain Tag */}
                        <div className="flex flex-col gap-0.5 min-w-[180px] sm:min-w-[200px] flex-shrink-0">
                          <span className="font-serif italic font-bold text-[15px] text-[#F7F7D9] group-hover:text-white transition-colors">
                            {entity.name}
                          </span>
                          <span className="font-sans text-[9px] uppercase tracking-[0.12em] font-bold text-[#E06B55]">
                            {entity.domain}
                          </span>
                        </div>

                        {/* Center: Description */}
                        <p className="flex-1 font-sans text-xs text-[#F7F7D9]/70 leading-relaxed line-clamp-2 min-w-0">
                          {entity.description}
                        </p>

                        {/* Right: Affinity Score Pill */}
                        {entity.affinityScore !== undefined && (
                          <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm">
                            <span className="font-sans text-xs font-bold text-[#F7F7D9]/90">
                              {entity.affinityScore}%
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <p className="font-serif italic text-lg text-[#F7F7D9]/40">
                  Select an inquiry to begin investigating
                </p>
              </div>
            )}
          </main>

          {/* Bottom Steering Input Capsule: Fixed at Bottom with Spotlight Focus Mode */}
          <div
            className={`w-full flex-shrink-0 rounded-[24px] sm:rounded-[26px] p-1.5 backdrop-blur-xl border transition-all duration-300 ${
              isPromptFocused
                ? "relative z-50 scale-[1.025] sm:scale-[1.03] bg-white/[0.08] border-white/30 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20"
                : "relative z-20 bg-white/[0.05] border-white/[0.14] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_32px_rgba(0,0,0,0.35)]"
            }`}
          >
            <div className="w-full rounded-[18px] sm:rounded-[20px] bg-[#F7F7D9] px-5 sm:px-6 py-3 sm:py-3.5 shadow-sm flex items-center justify-between gap-3">
              <input
                ref={promptInputRef}
                type="text"
                value={steeringInput}
                onChange={(e) => setSteeringInput(e.target.value)}
                onFocus={() => setIsPromptFocused(true)}
                onKeyDown={(e) => e.key === "Enter" && handleSteer()}
                placeholder="Ask a question about her world, direct a new scene, or steer taste..."
                className="w-full bg-transparent border-none outline-none font-serif text-sm sm:text-base text-[#1c2b1e] placeholder:text-[#1c2b1e]/60 placeholder:font-serif placeholder:font-normal"
              />

              <button
                type="button"
                onClick={handleSteer}
                disabled={isSteering}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1b2d20] hover:bg-[#283f2e] active:scale-95 text-[#F7F7D9] flex items-center justify-center transition-all shadow-md cursor-pointer flex-shrink-0"
                title="Send instruction to Poppies"
              >
                <Send className="w-3.5 h-3.5 text-[#F7F7D9] -translate-x-0.5 translate-y-0.5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Backdrop Overlay when Prompt is Focused */}
      {isPromptFocused && (
        <div
          onClick={() => {
            setIsPromptFocused(false);
            promptInputRef.current?.blur();
          }}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] transition-all duration-300 animate-fade-in cursor-pointer"
        />
      )}

      {/* Right Drawer: Entity Evidence Inspector */}
      {evidenceDrawerOpen && selectedEntity && (
        <div className="fixed inset-0 z-60 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg h-full max-h-[85vh] rounded-[28px] bg-[#16271a] border border-white/20 p-5 sm:p-6 flex flex-col justify-between text-[#F7F7D9] shadow-2xl overflow-y-auto">
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-serif font-bold text-xl text-[#F7F7D9]">
                    {selectedEntity.name}
                  </h3>
                  <span className="font-sans text-[10px] uppercase tracking-[0.12em] font-bold text-[#E06B55]">
                    {selectedEntity.domain}
                  </span>
                </div>
                <button
                  onClick={() => setEvidenceDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Qloo Evidence */}
              <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-sans font-bold text-white/50 tracking-wider">
                  Verified Qloo URN
                </span>
                <code className="text-xs font-mono text-emerald-300 break-all">
                  {selectedEntity.entityId || "urn:qloo:entity:resolved"}
                </code>
                {selectedEntity.seedEntities && selectedEntity.seedEntities.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-sans font-bold text-white/50 tracking-wider">
                      Discovered via Seeds
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntity.seedEntities.map((seed, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-sans text-[#F7F7D9]/80"
                        >
                          {seed}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Affinity Score */}
              {selectedEntity.affinityScore !== undefined && (
                <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-sans font-bold text-white/50 tracking-wider">
                    Cross-Domain Affinity Resonance
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans text-white/70">Correlation with character taste:</span>
                    <span className="text-base font-bold text-[#F7FFD9]">
                      {selectedEntity.affinityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#F7FFD9] rounded-full"
                      style={{ width: `${selectedEntity.affinityScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Why this connection */}
              {selectedEntity.qlooReasoning && (
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-sans font-bold text-amber-300/80 tracking-wider">
                    Why this connection
                  </span>
                  <p className="font-sans text-xs text-[#F7F7D9]/80 leading-relaxed">
                    {selectedEntity.qlooReasoning}
                  </p>
                </div>
              )}

              {/* Alternatives */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-sans font-bold text-white/50 tracking-wider">
                  Alternatives
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/80 cursor-pointer"
                  >
                    More obscure
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/80 cursor-pointer"
                  >
                    Different era
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-[#F7F7D9]/80 cursor-pointer"
                  >
                    Local variant
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setEvidenceDrawerOpen(false)}
                className="px-5 py-2 rounded-full bg-[#F7F7D9] text-[#1b2d20] font-sans font-bold text-xs tracking-wide cursor-pointer hover:bg-white"
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