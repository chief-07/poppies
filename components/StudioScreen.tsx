"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
import HeaderControls from "@/components/HeaderControls";
import AssembledDossierModal from "@/components/AssembledDossierModal";

interface StudioScreenProps {
  initialData: any;
  engine?: "qloo" | "base_llm";
  onToggleEngine?: (engine: "qloo" | "base_llm") => void;
  onOpenTour?: () => void;
  onAssembleDossier?: () => void;
}

interface Inquiry {
  id: string;
  question: string;
  source?: "creator" | "agent";
  domain?: "MUSIC" | "BOOKS" | "OBJECTS" | "PLACES" | "CONTRADICTION" | string;
  vignette?: string;
  vignetteHighlightEntity?: string;
  highlightedEntities?: string[];
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
  psychologicalWound?: string;
  tactileArmor?: string;
  observedClusters: string[];
  unconsideredAngles: {
    title: string;
    description: string;
    groundedEntity?: string;
  }[];
  highlightedNodes: string[];
}

/**
 * Renders narrative text with real Qloo entities styled as clickable interactive terracotta tags.
 * Clicking any tag immediately opens the Qloo Evidence Inspector drawer.
 */
function renderTextWithEntityTags(
  text: string,
  entities: CulturalEntity[],
  onEntityClick: (entity: CulturalEntity) => void
) {
  if (!text || entities.length === 0) return <span>{text}</span>;

  const seen = new Set<string>();
  const validEntities = entities
    .filter((e) => {
      if (!e || !e.name || e.name.trim().length <= 1) return false;
      const lower = e.name.toLowerCase().trim();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .sort((a, b) => b.name.length - a.name.length);

  if (validEntities.length === 0) return <span>{text}</span>;

  const patterns = validEntities.map((e) => {
    const esc = e.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sb = /^\w/.test(e.name.trim()) ? "\\b" : "";
    const eb = /\w$/.test(e.name.trim()) ? "\\b" : "";
    return `${sb}${esc}${eb}`;
  });

  const regex = new RegExp(`(${patterns.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const matched = validEntities.find(
          (e) => e.name.toLowerCase() === part.toLowerCase()
        );
        if (matched) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onEntityClick(matched)}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-full bg-[#E06B55]/18 hover:bg-[#E06B55]/32 border border-[#E06B55]/40 hover:border-[#E06B55]/70 text-[#F7F7D9] font-sans font-medium text-xs sm:text-[13px] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group align-baseline"
              title={`Inspect Qloo taste graph evidence for ${matched.name}`}
            >
              <span>{part}</span>
              <span className="text-[10px] text-[#E06B55] opacity-80 group-hover:opacity-100 transition-opacity">↗</span>
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
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

export default function StudioScreen({
  initialData,
  engine = "qloo",
  onToggleEngine,
  onOpenTour,
  onAssembleDossier,
}: StudioScreenProps) {
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
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
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

  // Global pool of taggable entities (active inquiry + all inquiries + seeds + dossier nodes)
  const allTaggableEntities = useMemo(() => {
    const list: CulturalEntity[] = [];
    const seen = new Set<string>();

    const add = (ent: Partial<CulturalEntity> & { name: string }) => {
      if (!ent || !ent.name) return;
      const cleanName = ent.name.trim();
      const lower = cleanName.toLowerCase();
      if (!lower || lower.length <= 1 || seen.has(lower)) return;
      seen.add(lower);
      list.push({
        id: ent.id || `ent-${lower.replace(/[^a-z0-9]/g, "-")}`,
        name: cleanName,
        domain: ent.domain || "CULTURE",
        description: ent.description || `Cultural anchor connected with ${characterName}'s world.`,
        affinityScore: ent.affinityScore || 90,
        entityId: ent.entityId || `urn:qloo:entity:${lower.replace(/[^a-z0-9]/g, "_")}`,
        entityType: ent.entityType || "urn:entity:anchor",
        seedEntities: ent.seedEntities || [],
        qlooReasoning: ent.qlooReasoning || `Grounds ${characterName}'s taste pattern.`,
      });
    };

    // 1. Entities in active inquiry (highest priority)
    activeEntities.forEach(add);

    // 2. Entities across all inquiries
    inquiries.forEach((inq) => {
      inq.entities?.forEach(add);
      if (inq.vignetteHighlightEntity) {
        add({ name: inq.vignetteHighlightEntity, domain: inq.domain });
      }
    });

    // 3. Highlighted nodes from dossier
    culturalDossier.highlightedNodes?.forEach((name) => add({ name, domain: "CULTURE" }));

    // 4. Seeds from initialData
    if (initialData?.seeds) {
      initialData.seeds.forEach((s: any) => {
        if (typeof s === "string") add({ name: s, domain: "SEED" });
        else if (s?.name) add({ name: s.name, domain: s.domain || "SEED" });
      });
    }

    return list;
  }, [activeEntities, inquiries, culturalDossier, initialData, characterName]);

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

  const handleFetchMore = async () => {
    if (isFetchingMore || !activeInquiry) return;
    setIsFetchingMore(true);

    try {
      const res = await fetch("/api/fetch-more", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: activeInquiry.id,
          domain: activeInquiry.domain,
          characterName,
          locality: constraints.locality || "",
          seedName: activeInquiry.entities?.[0]?.name || activeInquiry.question,
          seedEntityId: activeInquiry.entities?.[0]?.entityId,
          existingEntityIds: (activeInquiry.entities || []).map((e) => e.entityId).filter(Boolean),
          existingNames: (activeInquiry.entities || []).map((e) => e.name),
          engine,
        }),
      });

      const data = await res.json();
      if (data.success && data.newEntities && data.newEntities.length > 0) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === activeInquiry.id
              ? { ...inq, entities: [...(inq.entities || []), ...data.newEntities] }
              : inq
          )
        );
      }
    } catch (err) {
      console.error("Error fetching more entities from Qloo:", err);
    } finally {
      setIsFetchingMore(false);
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
          characterSummary,
          constraints,
          instruction: promptText,
          existingSeeds: inquiries.flatMap((i) => (i.entities || []).slice(0, 2).map((e) => e.name)),
          engine,
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
        vignette: `Addressing "${promptText}" for ${characterName}: curated anchors establish deliberate utility suited to their craft.`,
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
    const found = allTaggableEntities.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
    if (found) return found;

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

              {/* Add question or explore scene button */}
              <button
                type="button"
                onClick={handleActivatePrompt}
                className="flex items-center gap-2 px-3 py-2 rounded-[16px] bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-dashed border-white/15 text-[#F7F7D9]/70 hover:text-[#F7F7D9] text-xs font-sans transition-all cursor-pointer flex-shrink-0 mt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ask a question or explore a scene</span>
              </button>
            </div>
          </div>

          {/* Bottom Action: Assemble Dossier */}
          <div className="pt-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsDossierModalOpen(true);
                onAssembleDossier?.();
              }}
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

            {/* Subtle Constraint Pills & Header Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden sm:flex items-center gap-2">
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

              {onToggleEngine && onOpenTour && (
                <HeaderControls
                  engine={engine}
                  onToggleEngine={onToggleEngine}
                  onOpenTour={onOpenTour}
                />
              )}
            </div>
          </div>

          {/* Main Card */}
          <main className="w-full flex-1 min-h-0 rounded-[26px] bg-[#162a1c]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-7 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            {/* VIEW A: CULTURAL DOSSIER (Clean, quiet, zero marketing clutter) */}
            {isDossierSelected ? (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-6">
                {/* Cultural Dossier Thesis Card */}
                <div className="rounded-[22px] bg-white/[0.04] border border-white/[0.1] p-6 sm:p-7 shadow-sm flex flex-col gap-4">
                  <p className="font-serif text-[16px] sm:text-[18px] leading-[1.8] text-[#F7F7D9] font-light">
                    {renderTextWithEntityTags(culturalDossier.tasteThesis, allTaggableEntities, handleEntityClick)}
                  </p>
                </div>

                {/* Two-Column: Psychological Wound & Tactile Armor */}
                {(culturalDossier.psychologicalWound || culturalDossier.tactileArmor) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {culturalDossier.psychologicalWound && (
                      <div className="rounded-[18px] bg-white/[0.03] border border-white/[0.07] p-5 flex flex-col gap-2">
                        <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                          Internal Tension & Vulnerability
                        </span>
                        <p className="font-sans text-xs text-[#F7F7D9]/75 leading-relaxed">
                          {culturalDossier.psychologicalWound}
                        </p>
                      </div>
                    )}

                    {culturalDossier.tactileArmor && (
                      <div className="rounded-[18px] bg-white/[0.03] border border-white/[0.07] p-5 flex flex-col gap-2">
                        <span className="font-serif italic font-bold text-sm text-[#F7F7D9]">
                          Tactile Armor & Material Defense
                        </span>
                        <p className="font-sans text-xs text-[#F7F7D9]/75 leading-relaxed">
                          {culturalDossier.tactileArmor}
                        </p>
                      </div>
                    )}
                  </div>
                )}

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

                  {/* Curation vs Index Toggle */}
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
                      Curation
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

                {/* View 1: Curatorial Answer & Ensemble */}
                {viewMode === "lookbook" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-5">
                    {/* Curatorial Explanation Card */}
                    <div className="rounded-[22px] bg-white/[0.04] border border-white/[0.1] p-6 sm:p-7 shadow-md flex flex-col gap-4">
                      {/* Audio Capsule (Only when music inquiry) */}
                      {activeInquiry.hasAudio && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-md">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={toggleAmbientSoundscape}
                              className="w-7 h-7 rounded-full bg-[#F7F7D9] hover:bg-white text-[#162a1c] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                              title={isPlayingAudio ? "Pause soundscape" : "Play soundscape"}
                            >
                              {isPlayingAudio ? (
                                <Pause className="w-3 h-3 fill-current stroke-[2]" />
                              ) : (
                                <Play className="w-3 h-3 fill-current translate-x-0.5 stroke-[2]" />
                              )}
                            </button>
                            <span className="font-serif italic text-xs sm:text-sm text-[#F7F7D9]/95">
                              {activeInquiry.audioTrackName || "Solitary Ambient Frequencies"}
                            </span>
                          </div>

                          {/* Sound wave activity */}
                          <div className="flex items-center gap-1.5 pr-1">
                            <Volume2 className="w-3.5 h-3.5 text-[#F7F7D9]/50" />
                            <div className="flex items-center gap-0.5 h-3 pl-0.5">
                              <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-3 animate-pulse" : "h-1 opacity-30"}`} />
                              <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2.5 animate-pulse delay-100" : "h-1 opacity-30"}`} />
                              <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-3.5 animate-pulse delay-200" : "h-1 opacity-30"}`} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multi-Paragraph Curatorial Writeup */}
                      <div className="flex flex-col gap-3.5 pt-0.5">
                        {(activeInquiry.vignette || "Curating cultural anchors...").split("\n\n").map((para, pIdx) => (
                          <p
                            key={pIdx}
                            className="font-serif text-[15.5px] sm:text-[17px] leading-[1.8] text-[#F7F7D9]/90 font-light"
                          >
                            {renderTextWithEntityTags(para.trim(), allTaggableEntities, handleEntityClick)}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Curated Ensemble Tray */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#F7F7D9]/70">
                          Curated Ensemble ({activeEntities.length} verified via Qloo)
                        </span>
                        <span className="text-[11px] font-sans text-[#F7F7D9]/40">
                          Click any item to inspect Qloo evidence
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {activeEntities.map((entity) => {
                          const roleLabel =
                            entity.domain === "OBJECTS" ? "Tactile Armor" :
                            entity.domain === "MUSIC" ? "Acoustic Shield" :
                            entity.domain === "BOOKS" ? "Hidden Shelf" :
                            entity.domain === "PLACES" ? "Sanctuary" : "Sub-Surface Friction";

                          return (
                            <button
                              key={entity.id}
                              onClick={() => handleEntityClick(entity)}
                              className="group p-3.5 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-[#E06B55]/40 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between gap-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[9px] font-mono tracking-tight text-[#E06B55] uppercase font-bold">
                                  {roleLabel}
                                </span>
                                {entity.affinityScore !== undefined && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] font-sans font-bold text-[#F7F7D9]/90">
                                    {entity.affinityScore}%
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="font-serif italic font-bold text-sm text-[#F7F7D9] group-hover:text-[#E06B55] transition-colors truncate">
                                  {entity.name}
                                </span>
                                <p className="font-sans text-[11px] text-[#F7F7D9]/70 line-clamp-2 leading-relaxed">
                                  {entity.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Fetch More from Qloo Button */}
                      <button
                        type="button"
                        onClick={handleFetchMore}
                        disabled={isFetchingMore}
                        className="w-full mt-2 py-3 px-4 rounded-[18px] bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 text-[#F7F7D9]/80 hover:text-[#F7F7D9] text-xs font-sans font-medium flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm disabled:opacity-50"
                      >
                        {isFetchingMore ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-[#E06B55] animate-spin" />
                            <span>Querying Qloo Graph for more {activeInquiry.domain?.toLowerCase() || "items"}...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#E06B55] group-hover:scale-110 transition-transform" />
                            <span>+ Fetch 4 More from Qloo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* View 2: Scannable Index Mode */}
                {viewMode === "index" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col divide-y divide-white/[0.05]">
                    {activeEntities.map((entity) => {
                      const roleLabel =
                        entity.domain === "OBJECTS" ? "Tactile Armor" :
                        entity.domain === "MUSIC" ? "Acoustic Shield" :
                        entity.domain === "BOOKS" ? "Hidden Shelf" :
                        entity.domain === "PLACES" ? "Sanctuary" : "Sub-Surface Friction";

                      return (
                        <button
                          key={entity.id}
                          onClick={() => handleEntityClick(entity)}
                          className="group w-full flex items-center gap-4 px-3 py-2.5 text-left transition-all duration-150 cursor-pointer hover:bg-white/[0.05] rounded-xl flex-shrink-0"
                        >
                          <div className="min-w-[170px] flex-shrink-0 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[9px] font-mono uppercase text-[#E06B55]">
                              {roleLabel}
                            </span>
                            <span className="font-serif italic font-medium text-sm text-[#F7F7D9] group-hover:text-white transition-colors truncate">
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
                      );
                    })}
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
                placeholder={`Ask a question or explore a scene for ${characterName}...`}
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

      {/* Assembled Cultural Dossier Modal (Printable / Exportable Full Lookbook) */}
      <AssembledDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        characterName={characterName}
        characterSummary={characterSummary}
        constraints={constraints}
        culturalDossier={culturalDossier}
        inquiries={inquiries}
      />
    </div>
  );
}
