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
  Check,
  Menu,
} from "lucide-react";
import AssembledDossierModal from "@/components/AssembledDossierModal";
import HeaderControls from "@/components/HeaderControls";

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
    "In Marseille, Elena's work as an architectural conservator shapes a life bound to physical durability and patient repair. On her worktable, a carbon-bladed knife from Opinel Knives and heavy canvas workwear defend against the damp stone dust of the port. When solitude calls, she turns to the spare piano phrases of Erik Satie and the limestone inlets of the harbor, seeking quiet spaces untouched by modern renovation.",
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
      "On the cedar workbench in her Marseille studio, alongside drafting compasses, stone gouges, and fine brass calipers, rests a patinated folding knife from Opinel Knives and heavy-duty Danner boots caked in lime dust by the doorway. Her restoration trade demands physical endurance against salt spray and crumbly 18th-century limestone, favoring carbon steel that can be sharpened on a whetstone between tasks rather than modern disposable blades.\n\nHer choices reflect an aversion to sterile corporate architectural tools. Grounded in her background restoring forgotten coastal structures, Qloo identifies a cohesive material universe: pairing her French heritage cutlery with heavy canvas chore wear, unlined leather work aprons, and unlacquered measuring rules that age honestly alongside the architecture she repairs.",
    vignetteHighlightEntity: "Opinel Knives",
    hasAudio: false,
  },
  {
    id: "soundscape",
    question: "What does her 2 AM solitary soundscape sound like?",
    source: "creator",
    domain: "MUSIC",
    vignette:
      "At 2 AM, when the wind off the Old Port rattles the wooden sash frames, Elena works under the warm pool of an incandescent drafting lamp. Rather than modern electronic drone or background café jazz, she turns to the austere, repetitive piano phrases of Erik Satie and the quiet spatial field recordings of Hiroshi Yoshimura, letting sparse acoustic notes fill the cavernous room without demanding narrative attention.\n\nFor an architectural conservator spending daylight hours listening to stone dust and power tools, solitary sound serves as an acoustic boundary. Qloo's taste graph reveals that listeners who gravitate toward early French impressionist minimalism over-index heavily on Japanese environmental ambient and solitary acoustic compositions—creating a sonic sanctuary where silence feels deliberate rather than lonely.",
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
      "When the workshop dust settles on Sunday afternoons, Elena avoids the tourist promenades of Marseille and heads down into the limestone inlets and secluded coves near the harbor. She walks along the weathered stone sea-walls with an unhurried, diagnostic eye—watching how Mediterranean brine oxidizes iron railings and softens ancient masonry.\n\nHer weekend route connects quiet maritime sanctuaries with unpretentious local craft spots untouched by modern gentrification. Qloo bridges her appreciation for enduring stone craft to coastal sanctuaries and solitary harbors, where the slow erosion of salt and water mirrors the restorative patience she brings to her drafting table.",
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

const BASE_LLM_DEMO_PRESETS: Record<
  string,
  { culturalDossier: CulturalDossierBrief; inquiries: Inquiry[] }
> = {
  elena: {
    culturalDossier: {
      tasteThesis:
        "Elena is an architectural conservator in Marseille whose profile reflects predictable internet clichés for European artisans. Without cultural graph grounding, she drinks generic espresso in popular tourist squares and wears standard retail workwear. At night she listens to Claude Debussy's Clair de Lune, collapsing into statistical consensus rather than lived subcultural texture.",
      observedClusters: [
        "Generic French Tropes",
        "Statistical Token Consensus",
        "Predictable Classical Repertoire",
      ],
      unconsideredAngles: [
        {
          title: "AI Monoculture Trap",
          description:
            "Base LLM defaults to the top 0.01% internet associations for 'French artisan' without empirical affinity depth.",
          groundedEntity: "Generic Internet Tropes",
        },
      ],
      highlightedNodes: ["Claude Debussy", "Le Panier", "Muji Stationery"],
    },
    inquiries: [
      {
        id: "base-tools",
        question: "What tools and everyday objects rest on her worktable?",
        source: "creator",
        domain: "OBJECTS",
        vignette:
          "On her worktable, Elena keeps a clean metal ruler, generic steel chisels, and a notebook from Muji Stationery. The setup feels assembled from a minimalist moodboard rather than the gritty, lime-encrusted reality of coastal masonry.\n\nWithout empirical cultural grounding, standard language models default to predictable aesthetic shorthand: pairing French creative leads with Scandinavian or Japanese corporate minimalism rather than authentic regional craft.",
        vignetteHighlightEntity: "Muji Stationery",
        hasAudio: false,
        entities: [
          {
            id: "be-1",
            name: "Muji Stationery",
            domain: "OBJECTS",
            description: "Ubiquitous minimalist stationery brand predicted by standard LLM tokens.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:muji",
            entityType: "urn:entity:brand",
            qlooReasoning: "Predicted purely from common internet training data without empirical taste graph verification.",
          },
          {
            id: "be-2",
            name: "Opinel Standard Knife",
            domain: "OBJECTS",
            description: "Common French pocket knife predicted by basic keyword co-occurrence.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:opinel",
            entityType: "urn:entity:brand",
            qlooReasoning: "Standard statistical association for French artisans.",
          },
          {
            id: "be-3",
            name: "Moleskine Classic Notebook",
            domain: "OBJECTS",
            description: "High-frequency cliché notebook for any generic creative character.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:moleskine",
            entityType: "urn:entity:brand",
            qlooReasoning: "Top 0.01% statistical co-occurrence in creative writing prompts.",
          },
        ],
      },
      {
        id: "base-soundscape",
        question: "What does her 2 AM solitary soundscape sound like?",
        source: "creator",
        domain: "MUSIC",
        vignette:
          "At 2 AM, the apartment is filled with Claude Debussy's Clair de Lune and Frédéric Chopin, the default classical piano selections produced by language models for any reflective protagonist.\n\nThe algorithm equates contemplation with universal classical hits, failing to access the subcultural ambient tape networks and field recordings actually favored by architectural restoration practitioners.",
        vignetteHighlightEntity: "Claude Debussy",
        hasAudio: true,
        audioTrackName: "Claude Debussy — Clair de Lune (1905)",
        entities: [
          {
            id: "be-4",
            name: "Claude Debussy",
            domain: "MUSIC",
            description: "The single most common classical piano artist generated by language models.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:debussy",
            entityType: "urn:entity:artist",
            qlooReasoning: "Collapses to highest frequency token for French reflective character.",
          },
          {
            id: "be-5",
            name: "Frédéric Chopin",
            domain: "MUSIC",
            description: "Generic classical fallback for solitary nighttime listening.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:chopin",
            entityType: "urn:entity:artist",
            qlooReasoning: "High-frequency classical composer cliché.",
          },
        ],
      },
      {
        id: "base-haunts",
        question: "Where does she disappear on Sunday afternoons?",
        source: "creator",
        domain: "PLACES",
        vignette:
          "On Sunday afternoons, Elena visits a picturesque terrace café in Le Panier, drinking a café au lait while looking at postcard views of the Mediterranean.\n\nThis generic tourist postcard setting demonstrates the statistical collapse of ungrounded models, recommending high-traffic travel brochure destinations rather than the secluded limestone quarries and industrial inlets a conservator would seek out.",
        vignetteHighlightEntity: "Le Panier",
        hasAudio: false,
        entities: [
          {
            id: "be-6",
            name: "Le Panier",
            domain: "PLACES",
            description: "Most famous tourist district in Marseille, default destination for AI scripts.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:le_panier",
            entityType: "urn:entity:place",
            qlooReasoning: "Top tourist keyword for Marseille in internet pretraining data.",
          },
          {
            id: "be-7",
            name: "Vieux-Port Promenade",
            domain: "PLACES",
            description: "Standard waterfront tourist promenade.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:vieux_port",
            entityType: "urn:entity:place",
            qlooReasoning: "Generic harbor landmark keyword.",
          },
        ],
      },
    ],
  },
  tsukuru: {
    culturalDossier: {
      tasteThesis:
        "Tsukuru is a station architect in Nagoya whose world collapses into the most notorious AI stereotype: drinking green tea from Hasami Porcelain while listening to Erik Satie. In benchmark runs, the Base LLM even suggests he read the Murakami novel written about himself. His environment lacks any localized rail grit or authentic Japanese ambient depth.",
      observedClusters: [
        "Hasami Porcelain Cliché",
        "Erik Satie Monoculture",
        "Meta-Fictional Murakami Leak",
      ],
      unconsideredAngles: [
        {
          title: "The Cliché Loop Collapse",
          description:
            "Every Japanese architect prompt in GPT/Gemini defaults to identical ceramics and Tanizaki's In Praise of Shadows.",
          groundedEntity: "Hasami Porcelain",
        },
      ],
      highlightedNodes: ["Hasami Porcelain", "Erik Satie", "In Praise of Shadows"],
    },
    inquiries: [
      {
        id: "base-tsukuru-tools",
        question: "What tools and everyday objects rest on his worktable?",
        source: "creator",
        domain: "OBJECTS",
        vignette:
          "On his desk sits a cup of green tea in Hasami Porcelain alongside a black Rotring 600 drafting pencil. The objects read like a design magazine spread rather than the heavy engineering desk of an active terminal designer.\n\nAcross multiple benchmark runs, frontier models predict these identical two items for any Japanese architect prompt, reducing complex urban transit engineering to a sterile Scandinavian-Japanese lifestyle catalog.",
        vignetteHighlightEntity: "Hasami Porcelain",
        hasAudio: false,
        entities: [
          {
            id: "bte-1",
            name: "Hasami Porcelain",
            domain: "OBJECTS",
            description: "The universal default ceramic brand generated by language models for architects.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:hasami_porcelain",
            entityType: "urn:entity:brand",
            qlooReasoning: "Top 0.01% internet stereotype for minimalist Japanese design.",
          },
          {
            id: "bte-2",
            name: "Rotring 600",
            domain: "OBJECTS",
            description: "Standard AI default mechanical pencil for any architect persona.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:rotring_600",
            entityType: "urn:entity:brand",
            qlooReasoning: "Cliché design tool token.",
          },
        ],
      },
      {
        id: "base-tsukuru-soundscape",
        question: "What does his 2 AM solitary soundscape sound like?",
        source: "creator",
        domain: "MUSIC",
        vignette:
          "At 2 AM, Tsukuru plays Erik Satie's Gymnopédies, the universal AI default for solitary contemplation across every architectural prompt.\n\nLanguage models fail to separate contemplative mood from internet ubiquity, missing the localized Japanese train terminal field recordings and austere ambient works that an architect obsessed with acoustic dampening would actually play.",
        vignetteHighlightEntity: "Erik Satie",
        hasAudio: true,
        audioTrackName: "Erik Satie — Gymnopédies (1888)",
        entities: [
          {
            id: "bte-3",
            name: "Erik Satie",
            domain: "MUSIC",
            description: "Predictive mean composer for contemplative characters in generic AI outputs.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:erik_satie",
            entityType: "urn:entity:artist",
            qlooReasoning: "Identical across 18 benchmark runs in ungrounded LLM mode.",
          },
        ],
      },
      {
        id: "base-tsukuru-haunts",
        question: "Where does he disappear when he needs to disappear?",
        source: "creator",
        domain: "PLACES",
        vignette:
          "When work ends, Tsukuru sits at a Starbucks in Nagoya Station watching crowds through the glass, a generic urban setting lacking genuine localized texture.\n\nThe ungrounded model defaults to international retail chains instead of discovering authentic regional kissaten or subterranean railway corridors where solitary station designers genuinely spend off-hours.",
        vignetteHighlightEntity: "Nagoya Station Starbucks",
        hasAudio: false,
        entities: [
          {
            id: "bte-4",
            name: "Nagoya Station Starbucks",
            domain: "PLACES",
            description: "Default commercial chain predicted for modern urban transit.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:starbucks",
            entityType: "urn:entity:place",
            qlooReasoning: "Generic corporate chain co-occurrence.",
          },
        ],
      },
    ],
  },
  marcus: {
    culturalDossier: {
      tasteThesis:
        "Marcus is an analog tube audio restorer in Detroit who spends his days surrounded by familiar automotive city tropes. Without Qloo graph grounding, he drives a generic classic Ford Mustang, drinks commercial drip coffee, and listens to Motown hits like Marvin Gaye. His world collapses into popular tourist expectations rather than underground audio electronics.",
      observedClusters: [
        "Generic Motown Cliché",
        "Automotive City Stereotype",
        "Predictable Diner Tropes",
      ],
      unconsideredAngles: [
        {
          title: "AI Monoculture Trap",
          description:
            "Standard language models cannot separate Detroit's commercial Motown tourism from genuine subcultural Northern Soul and tube gear history.",
          groundedEntity: "Generic Motown Hits",
        },
      ],
      highlightedNodes: ["Marvin Gaye", "Ford Mustang", "Craftsman Tools"],
    },
    inquiries: [
      {
        id: "base-marcus-tools",
        question: "What tools and everyday objects rest on his workbench?",
        source: "creator",
        domain: "OBJECTS",
        vignette:
          "On his workbench, Marcus keeps a standard Craftsman soldering iron and a metal mug of black coffee. The equipment reads like a generic hardware store catalog rather than a vintage vacuum tube workshop.\n\nWithout Qloo's taste graph, language models cannot differentiate general DIY handymen from specialized analog audio engineers who rely on temperature-controlled Japanese irons and vintage flux cleaners.",
        vignetteHighlightEntity: "Craftsman Tools",
        hasAudio: false,
        entities: [
          {
            id: "bme-1",
            name: "Craftsman Tools",
            domain: "OBJECTS",
            description: "Generic retail tool brand predicted by standard training data.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:craftsman",
            entityType: "urn:entity:brand",
            qlooReasoning: "Top 0.01% co-occurrence for American mechanic/restorer prompts.",
          },
        ],
      },
      {
        id: "base-marcus-soundscape",
        question: "What music plays in his winter shop?",
        source: "creator",
        domain: "MUSIC",
        vignette:
          "In the winter shop, the radio plays Marvin Gaye's What's Going On, the most common AI prediction for any Detroit character regardless of their specific trade.\n\nThe model collapses into top 0.01% Motown tourist hits, unable to navigate Detroit's underground northern soul, proto-techno, and analog audio repair culture.",
        vignetteHighlightEntity: "Marvin Gaye",
        hasAudio: true,
        audioTrackName: "Marvin Gaye — What's Going On (1971)",
        entities: [
          {
            id: "bme-2",
            name: "Marvin Gaye",
            domain: "MUSIC",
            description: "Highest frequency token for any Detroit music query in frontier models.",
            affinityScore: 50,
            entityId: "urn:ai:probabilistic:marvin_gaye",
            entityType: "urn:entity:artist",
            qlooReasoning: "Universal statistical mean for Detroit music.",
          },
        ],
      },
    ],
  },
};

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
  const userPrompt: string =
    initialData?.userPrompt ||
    (typeof initialData?.character?.userPrompt === "string" ? initialData.character.userPrompt : "");

  const initialDossier: CulturalDossierBrief =
    initialData?.culturalDossier || DEFAULT_DOSSIER;

  const liveInquiries: Inquiry[] =
    initialData?.inquiries && initialData.inquiries.length > 0
      ? initialData.inquiries
      : MOCK_INQUIRIES;

  // Caches for comparative engine toggle
  const qlooDataCache = useRef<{
    culturalDossier: CulturalDossierBrief;
    inquiries: Inquiry[];
  }>({
    culturalDossier: initialDossier,
    inquiries: liveInquiries,
  });

  const baseLlmDataCache = useRef<{
    culturalDossier: CulturalDossierBrief;
    inquiries: Inquiry[];
  } | null>(null);

  const [activeDossier, setActiveDossier] = useState<CulturalDossierBrief>(initialDossier);
  const culturalDossier = activeDossier;

  // Director's Canon Curation: Starts completely empty so each anchor earns its place deliberately
  const [acceptedEntityIds, setAcceptedEntityIds] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const toggleAcceptEntity = (entityId: string, entityName?: string) => {
    setAcceptedEntityIds((prev) => {
      const isAccepted = prev.includes(entityId);
      const updated = isAccepted
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId];
      const name = entityName ? `"${entityName}"` : "Anchor";
      showToast(
        isAccepted
          ? `Removed ${name} from canon`
          : `Accepted ${name} into character canon`
      );
      return updated;
    });
  };

  const [inquiries, setInquiries] = useState<Inquiry[]>(liveInquiries);
  const [showDiagnosticCard, setShowDiagnosticCard] = useState<boolean>(false);
  const [isSwappingEngine, setIsSwappingEngine] = useState<boolean>(false);
  const [activeInquiryId, setActiveInquiryId] = useState<string>("cultural-dossier");
  const [isCreatingNewInquiry, setIsCreatingNewInquiry] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"lookbook" | "index">("lookbook");
  const [steeringInput, setSteeringInput] = useState<string>("");
  const [isSteering, setIsSteering] = useState<boolean>(false);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [isRefiningVignette, setIsRefiningVignette] = useState<boolean>(false);
  const [steeringToast, setSteeringToast] = useState<string | null>(null);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<CulturalEntity | null>(null);

  useEffect(() => {
    if (initialData?.culturalDossier) {
      qlooDataCache.current.culturalDossier = initialData.culturalDossier;
      if (engine === "qloo") setActiveDossier(initialData.culturalDossier);
    }
    if (initialData?.inquiries && initialData.inquiries.length > 0) {
      qlooDataCache.current.inquiries = initialData.inquiries;
      if (engine === "qloo") setInquiries(initialData.inquiries);
    }
  }, [initialData, engine]);

  const handleToggleEngine = async (nextEngine: "qloo" | "base_llm") => {
    onToggleEngine?.(nextEngine);

    if (nextEngine === "base_llm") {
      const lower = (characterName + " " + userPrompt).toLowerCase();
      let presetKey = "elena";
      if (lower.includes("tsukuru") || lower.includes("nagoya") || lower.includes("architect")) {
        presetKey = "tsukuru";
      } else if (lower.includes("marcus") || lower.includes("detroit") || lower.includes("amplifier")) {
        presetKey = "marcus";
      }

      if (baseLlmDataCache.current) {
        setActiveDossier(baseLlmDataCache.current.culturalDossier);
        setInquiries(baseLlmDataCache.current.inquiries);
        setShowDiagnosticCard(true);
      } else if (BASE_LLM_DEMO_PRESETS[presetKey]) {
        const preset = BASE_LLM_DEMO_PRESETS[presetKey];
        baseLlmDataCache.current = preset;
        setActiveDossier(preset.culturalDossier);
        setInquiries(preset.inquiries);
        setShowDiagnosticCard(true);
      } else {
        setIsSwappingEngine(true);
        try {
          const res = await fetch("/api/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userPrompt || characterName, engine: "base_llm" }),
          });
          const data = await res.json();
          if (data.culturalDossier && data.inquiries) {
            const baseData = {
              culturalDossier: data.culturalDossier,
              inquiries: data.inquiries,
            };
            baseLlmDataCache.current = baseData;
            setActiveDossier(baseData.culturalDossier);
            setInquiries(baseData.inquiries);
          }
        } catch (e) {
          console.error("Failed to fetch Base LLM comparison:", e);
        } finally {
          setIsSwappingEngine(false);
          setShowDiagnosticCard(true);
        }
      }
    } else {
      setActiveDossier(qlooDataCache.current.culturalDossier);
      setInquiries(qlooDataCache.current.inquiries);
      setShowDiagnosticCard(false);
    }
  };

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

  const handleAskNewQuestion = () => {
    setIsCreatingNewInquiry(true);
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

  const showToast = (msg: string) => {
    setSteeringToast(msg);
    setTimeout(() => setSteeringToast(null), 3500);
  };

  const handleSteer = async () => {
    if (!steeringInput.trim() || isSteering) return;
    const promptText = steeringInput.trim();
    const lower = promptText.toLowerCase();
    setIsSteering(true);

    // Present living canon seeds grounded in acceptedEntityIds to Qloo
    const allEntities = inquiries.flatMap((i) => i.entities || []);
    const livingSeedNames = Array.from(
      new Set(
        allEntities
          .filter((e) => acceptedEntityIds.includes(e.id))
          .map((e) => e.name)
      )
    );
    const fallbackSeeds = inquiries.flatMap((i) => (i.entities || []).slice(0, 1).map((e) => e.name));
    const livingSeeds = livingSeedNames.length > 0 ? livingSeedNames : fallbackSeeds;

    // 1. Intent: Ask for more entities / alternatives for current inquiry
    const isEntityRequest =
      activeInquiry &&
      !isDossierSelected &&
      !isCreatingNewInquiry &&
      /more entities|more items|more books|more music|more tools|more objects|more places|fetch more|show more|give me more entities|more alternatives|expand list/i.test(lower);

    if (isEntityRequest) {
      setSteeringInput("");
      setIsPromptFocused(false);
      promptInputRef.current?.blur();
      showToast("Querying Qloo Graph for 4 more verified entities...");
      await handleFetchMore();
      showToast("Added 4 verified Qloo entities to ensemble");
      setIsSteering(false);
      return;
    }

    // 2. Intent: Ask for more explanation / elaborate on current inquiry
    const isExplanationRequest =
      activeInquiry &&
      !isDossierSelected &&
      !isCreatingNewInquiry &&
      /more explanation|explain more|explain further|elaborate|tell me more|why this|why these|dive deeper|more context|more detail/i.test(lower);

    if (isExplanationRequest) {
      setIsRefiningVignette(true);
      setSteeringInput("");
      setIsPromptFocused(false);
      promptInputRef.current?.blur();
      showToast("Deepening curatorial reasoning across Qloo graph...");

      try {
        const res = await fetch("/api/steer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "explain",
            inquiryId: activeInquiry.id,
            currentQuestion: activeInquiry.question,
            currentVignette: activeInquiry.vignette,
            domain: activeInquiry.domain,
            instruction: promptText,
            characterName,
            characterSummary,
            constraints,
            livingSeeds,
            existingSeeds: livingSeeds,
            tasteThesis: culturalDossier?.tasteThesis,
            engine,
          }),
        });
        const data = await res.json();
        if (data.updatedVignette) {
          setInquiries((prev) =>
            prev.map((inq) =>
              inq.id === activeInquiry.id
                ? {
                    ...inq,
                    vignette: data.updatedVignette,
                    highlightedEntities: Array.from(
                      new Set([...(inq.highlightedEntities || []), ...(data.highlightedEntities || [])])
                    ),
                  }
                : inq
            )
          );
          showToast("Curatorial reasoning expanded");
        }
      } catch (e) {
        console.error("Failed to elaborate explanation:", e);
      } finally {
        setIsRefiningVignette(false);
        setIsSteering(false);
      }
      return;
    }

    // 3. Intent: Adapt current inquiry in-place (DEFAULT when inside an active inquiry)
    const shouldCreateNew = isDossierSelected || isCreatingNewInquiry;

    if (!shouldCreateNew && activeInquiry) {
      setIsRefiningVignette(true);
      setSteeringInput("");
      setIsPromptFocused(false);
      promptInputRef.current?.blur();
      showToast(`Adapting "${activeInquiry.question.slice(0, 24)}..." with Qloo...`);

      try {
        const res = await fetch("/api/steer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "adapt",
            inquiryId: activeInquiry.id,
            currentQuestion: activeInquiry.question,
            currentVignette: activeInquiry.vignette,
            domain: activeInquiry.domain,
            instruction: promptText,
            characterName,
            characterSummary,
            constraints,
            livingSeeds,
            existingSeeds: livingSeeds,
            tasteThesis: culturalDossier?.tasteThesis,
            engine,
          }),
        });
        const data = await res.json();
        if (data.inquiry) {
          setInquiries((prev) =>
            prev.map((inq) =>
              inq.id === activeInquiry.id ? { ...data.inquiry, id: inq.id } : inq
            )
          );
          showToast("Inquiry adapted with fresh Qloo grounding");
        }
      } catch (e) {
        console.error("Live adaptation error:", e);
      } finally {
        setIsRefiningVignette(false);
        setIsSteering(false);
      }
      return;
    }

    // 4. Intent: Brand New Inquiry / Scene Question (Adds a new thread)
    const tempId = `inquiry-${Date.now()}`;
    const newQuestion = promptText.endsWith("?") ? promptText : `What about ${promptText}?`;
    const provisionalInquiry: Inquiry = {
      id: tempId,
      question: newQuestion,
      source: "creator",
      domain: "OBJECTS",
      vignette: `Investigating cultural anchors across Qloo's taste graph for "${promptText}"...`,
      entities: [],
    };

    setInquiries((prev) => [provisionalInquiry, ...prev]);
    setActiveInquiryId(tempId);
    setIsCreatingNewInquiry(false);
    setSteeringInput("");
    setIsPromptFocused(false);
    promptInputRef.current?.blur();
    setIsRefiningVignette(true);
    showToast("Opened new inquiry thread...");

    try {
      const res = await fetch("/api/steer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "new_inquiry",
          instruction: promptText,
          characterName,
          characterSummary,
          constraints,
          livingSeeds,
          existingSeeds: livingSeeds,
          tasteThesis: culturalDossier?.tasteThesis,
          engine,
        }),
      });

      const data = await res.json();
      if (data.inquiry) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === tempId ? { ...data.inquiry, id: tempId } : inq))
        );
        showToast("New inquiry culturally grounded by Qloo");
      }
    } catch (err) {
      console.error("Live steering error:", err);
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === tempId
            ? {
                ...inq,
                vignette: `Addressing "${promptText}" for ${characterName}: grounded anchors establish deliberate utility suited to their craft.`,
                entities: MOCK_ENTITIES_TOOLS,
              }
            : inq
        )
      );
    } finally {
      setIsRefiningVignette(false);
      setIsSteering(false);
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
    <div className="relative h-[100dvh] min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#101b13] p-2 sm:p-4 lg:p-6 select-none">
      {/* 1. Base Painted Poppy Background */}
      <div
        className="fixed inset-0 bg-cover bg-top sm:bg-center bg-no-repeat pointer-events-none opacity-90 scale-[1.01]"
        style={{
          backgroundImage: "url('/poppies-bg.jpg')",
        }}
      />

      {/* 2. Solid Green Clearing Extending to Right Edge (Top-to-bottom fade on mobile, left-to-right on desktop) */}
      <div
        className="pointer-events-none fixed inset-y-0 right-0 left-0 w-full green-stage-mask"
        style={{
          backgroundColor: "#182a1d",
        }}
      />

      {/* Mobile Inquiries & Navigation Drawer (Responsive Slide-in) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-[290px] sm:w-[320px] h-full bg-[#132417] border-r border-white/20 p-4 sm:p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-3 min-h-0 flex-1">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 pl-1">
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
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F7D9] flex items-center justify-center transition-colors cursor-pointer"
                  title="Close navigation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cultural Dossier Overview Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveInquiryId("cultural-dossier");
                  setIsCreatingNewInquiry(false);
                  setMobileSidebarOpen(false);
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

              {/* Inquiries List */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pt-1 custom-scrollbar-red">
                {inquiries.map((inquiry) => {
                  const isActive = !isDossierSelected && inquiry.id === activeInquiry?.id;
                  const isCreator = inquiry.source === "creator";

                  return (
                    <button
                      key={inquiry.id}
                      onClick={() => {
                        setActiveInquiryId(inquiry.id);
                        setIsCreatingNewInquiry(false);
                        setMobileSidebarOpen(false);
                        if (isPlayingAudio) toggleAmbientSoundscape();
                      }}
                      className={`group w-full p-3 rounded-[18px] transition-all duration-200 text-left cursor-pointer flex-shrink-0 flex flex-col gap-1 ${
                        isActive
                          ? "bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                          : "bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-[#F7F7D9]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono tracking-tight ${
                              isCreator ? "text-[#F7F7D9]/60" : "text-[#E06B55]"
                            }`}
                          >
                            {isCreator ? "[You]" : "[Agent]"}
                          </span>
                          {isActive && isRefiningVignette && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E06B55] animate-ping" />
                          )}
                        </div>
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

                <button
                  type="button"
                  onClick={() => {
                    handleAskNewQuestion();
                    setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-[16px] bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-dashed border-white/15 text-[#F7F7D9]/70 hover:text-[#F7F7D9] text-xs font-sans transition-all cursor-pointer flex-shrink-0 mt-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ask a question or explore a scene</span>
                </button>
              </div>
            </div>

            {/* Assemble Dossier */}
            <div className="pt-2 flex-shrink-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-3 text-[10px] font-sans text-[#F7F7D9]/50">
                <span>Director&apos;s Canon:</span>
                <span className="font-mono text-[#E06B55] font-semibold">{acceptedEntityIds.length} accepted</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDossierModalOpen(true);
                  setMobileSidebarOpen(false);
                  onAssembleDossier?.();
                }}
                className="w-full flex items-center justify-between p-3 rounded-[18px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] backdrop-blur-lg text-[#F7F7D9] transition-all group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#F7F7D9]/80" />
                  <span className="font-serif italic font-medium text-xs sm:text-sm">
                    Assemble dossier ({acceptedEntityIds.length})
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Studio Main Stage */}
      <div className="relative w-full max-w-[1360px] h-full flex gap-5 lg:gap-8 items-stretch justify-center">
        {/* ================= LEFT COLUMN: Desktop Sidebar ================= */}
        <aside id="tour-left-pane" className="hidden lg:flex w-[260px] xl:w-[270px] flex-shrink-0 flex-col justify-between h-full min-h-0">
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
                setIsCreatingNewInquiry(false);
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
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 pt-1 custom-scrollbar-red">
              {inquiries.map((inquiry) => {
                const isActive = !isDossierSelected && inquiry.id === activeInquiry?.id;
                const isCreator = inquiry.source === "creator";

                return (
                  <button
                    key={inquiry.id}
                    onClick={() => {
                      setActiveInquiryId(inquiry.id);
                      setIsCreatingNewInquiry(false);
                      if (isPlayingAudio) toggleAmbientSoundscape();
                    }}
                    className={`group w-full p-3 rounded-[18px] transition-all duration-200 text-left cursor-pointer flex-shrink-0 flex flex-col gap-1 ${
                      isActive
                        ? "bg-white/[0.12] backdrop-blur-xl border border-white/[0.25] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                        : "bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-[#F7F7D9]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono tracking-tight ${
                            isCreator ? "text-[#F7F7D9]/60" : "text-[#E06B55]"
                          }`}
                        >
                          {isCreator ? "[You]" : "[Agent]"}
                        </span>
                        {isActive && isRefiningVignette && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E06B55] animate-ping" />
                        )}
                      </div>
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
                onClick={handleAskNewQuestion}
                className="flex items-center gap-2 px-3 py-2 rounded-[16px] bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-md border border-dashed border-white/15 text-[#F7F7D9]/70 hover:text-[#F7F7D9] text-xs font-sans transition-all cursor-pointer flex-shrink-0 mt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ask a question or explore a scene</span>
              </button>
            </div>
          </div>

          {/* Bottom Action: Assemble Dossier */}
          <div className="pt-2 flex-shrink-0 flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 text-[10px] font-sans text-[#F7F7D9]/50">
              <span>Director&apos;s Canon:</span>
              <span className="font-mono text-[#E06B55] font-semibold">{acceptedEntityIds.length} accepted</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDossierModalOpen(true);
                onAssembleDossier?.();
              }}
              className="w-full flex items-center justify-between p-3 rounded-[18px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] backdrop-blur-lg text-[#F7F7D9] transition-all group cursor-pointer active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#F7F7D9]/80" />
                <span className="font-serif italic font-medium text-xs sm:text-sm">
                  Assemble dossier ({acceptedEntityIds.length})
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </aside>

        {/* ================= RIGHT COLUMN: Header + Main Card + Prompt ================= */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2.5 sm:gap-3.5">
          {/* Top Bar: Character Title & Right Edge Controls */}
          <div className="flex-shrink-0 flex items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Inquiries Trigger Button */}
              <button
                type="button"
                id="tour-mobile-menu-btn"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-[#F7F7D9] text-xs font-sans transition-all active:scale-95 flex-shrink-0 shadow-sm cursor-pointer"
                title="Open inquiries and navigation"
              >
                <Menu className="w-3.5 h-3.5 text-[#E06B55]" />
                <span className="font-serif italic font-medium truncate max-w-[90px] sm:max-w-[140px]">
                  {isDossierSelected ? "Brief" : (activeInquiry?.question ? activeInquiry.question.slice(0, 18) + "…" : "Inquiries")}
                </span>
                <span className="font-mono text-[10px] text-[#E06B55] font-bold">
                  {inquiries.length}
                </span>
              </button>

              <h1 className="font-serif font-bold text-xl sm:text-3xl lg:text-4xl text-[#F7F7D9] tracking-tight leading-tight truncate">
                {characterName}
              </h1>
              <p className="font-serif italic text-xs sm:text-sm text-[#F7F7D9]/60 max-w-xs xl:max-w-md truncate hidden md:inline">
                {characterSummary}
              </p>
            </div>

            {/* Right Edge: Mobile Dossier Badge + Constraint Pills + Qloo Toggle & Tour */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Mobile Dossier Pill */}
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-sans text-[#F7F7D9] transition-all cursor-pointer shadow-sm active:scale-95"
                title="Assemble Character Dossier"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#E06B55]" />
                <span className="font-mono text-[11px] font-semibold text-[#F7F7D9]">{acceptedEntityIds.length}</span>
              </button>

              {constraints.locality && (
                <span className="hidden lg:inline px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.locality}
                </span>
              )}
              {constraints.era && (
                <span className="hidden xl:inline px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.era}
                </span>
              )}
              {constraints.occupation && (
                <span className="hidden xl:inline px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F7D9]/70 text-[11px] font-sans">
                  {constraints.occupation}
                </span>
              )}

              {onToggleEngine && onOpenTour && (
                <HeaderControls
                  engine={engine}
                  onToggleEngine={handleToggleEngine}
                  onOpenTour={onOpenTour}
                />
              )}
            </div>
          </div>

          {/* Main Card */}
          <main id="tour-center-pane" className="relative w-full flex-1 min-h-0 rounded-[20px] sm:rounded-[26px] bg-[#162a1c]/85 border border-white/[0.12] backdrop-blur-2xl p-4 sm:p-6 lg:p-7 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            {/* Swapping Engine Loading Indicator */}
            {isSwappingEngine && (
              <div className="mb-4 rounded-[18px] bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-center gap-3 text-xs font-sans text-[#F7F7D9]/80 animate-pulse flex-shrink-0">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-[#E06B55] animate-spin" />
                <span>Running ungrounded Base LLM research cycle to extract comparative baseline...</span>
              </div>
            )}

            {/* AI Monoculture Floating Spotlight Tour Card (Does not occupy center pane layout flow) */}
            {engine === "base_llm" && showDiagnosticCard && (
              <div className="absolute top-4 right-4 z-40 max-w-md rounded-[22px] bg-[#F7F7D9] border-[2.5px] border-[#182a1d] p-5 sm:p-6 text-[#142619] shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E06B55]" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#142619] font-bold">
                      AI Monoculture Breakdown · Qloo Grounding Disabled
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticCard(false)}
                    className="w-6 h-6 rounded-full bg-[#182a1d]/10 hover:bg-[#182a1d]/20 text-[#142619] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                    title="Dismiss Diagnostic"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 text-xs font-sans leading-relaxed text-[#142619]/90">
                  <div className="p-3 rounded-[12px] bg-[#182a1d]/[0.06] border border-[#182a1d]/15 flex flex-col gap-1">
                    <span className="font-serif italic font-bold text-xs text-[#142619]">
                      1. Statistical Tropes Collapse
                    </span>
                    <p className="text-[11px]">
                      Notice how curatorial answers collapse into generic internet tropes (Hasami porcelain, Erik Satie, generic French café). Without Qloo, the LLM cannot traverse authentic subcultural relationships.
                    </p>
                  </div>

                  <div className="p-3 rounded-[12px] bg-[#182a1d]/[0.06] border border-[#182a1d]/15 flex flex-col gap-1">
                    <span className="font-serif italic font-bold text-xs text-[#142619]">
                      2. Flat 50% Guessing
                    </span>
                    <p className="text-[11px]">
                      In Index mode, scores flatline at 50% with synthetic IDs (<code className="font-mono text-[9px] bg-black/10 px-1 rounded">urn:ai:probabilistic</code>) because the LLM is predicting tokens, not cultural affinity.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleEngine("qloo")}
                    className="px-3.5 py-1.5 rounded-full bg-[#182a1d] hover:bg-[#28402a] text-[#F7F7D9] text-xs font-sans font-medium transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <span>✦ Restore Qloo Grounding</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW A: CULTURAL DOSSIER (Laid out directly in main card, zero redundant headers or nested cards) */}
            {isDossierSelected ? (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col justify-between gap-6 custom-scrollbar-red">
                <div className="flex flex-col gap-6">
                  {/* Master 3-Sentence Connection (Direct, unencumbered prose) */}
                  <div className="flex flex-col gap-4">
                    <p className="font-serif text-[17px] sm:text-[19px] leading-[1.85] text-[#F7F7D9] font-light">
                      {renderTextWithEntityTags(culturalDossier.tasteThesis, allTaggableEntities, handleEntityClick)}
                    </p>
                  </div>

                  {/* Discovered Cultural Anchors (Director's Canon Selection) */}
                  {allTaggableEntities.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#F7F7D9]/50 font-semibold">
                          Character Canon ({acceptedEntityIds.length} accepted · {Math.max(0, allTaggableEntities.length - acceptedEntityIds.length)} proposed)
                        </span>
                        <span className="hidden sm:inline text-[11px] font-sans text-[#F7F7D9]/40">
                          Click pill to inspect evidence · Click +/✓ to toggle canon
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {allTaggableEntities.slice(0, 8).map((entity) => {
                          const isAccepted = acceptedEntityIds.includes(entity.id);
                          return (
                            <div
                              key={entity.id}
                              className={`px-3 py-1.5 rounded-full border text-xs font-sans flex items-center gap-2 transition-all shadow-sm ${
                                isAccepted
                                  ? "bg-white/[0.08] border-white/20 text-[#F7F7D9]"
                                  : "bg-white/[0.03] border-white/10 text-[#F7F7D9]/70 opacity-80 hover:opacity-100"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleEntityClick(entity)}
                                className="flex items-center gap-1.5 hover:text-white cursor-pointer"
                                title={`Inspect Qloo evidence for ${entity.name}`}
                              >
                                <span className="text-[9px] font-mono text-[#E06B55] font-bold">[{entity.domain}]</span>
                                <span className="font-medium">{entity.name}</span>
                                <span className="text-[10px] text-[#E06B55] opacity-60">↗</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAcceptEntity(entity.id, entity.name);
                                }}
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                  isAccepted
                                    ? "bg-emerald-500/30 text-emerald-300 hover:bg-red-500/30 hover:text-red-200"
                                    : "bg-white/10 text-[#F7F7D9]/60 hover:bg-[#E06B55]/30 hover:text-[#F7F7D9]"
                                }`}
                                title={isAccepted ? "Accepted in canon (click to remove)" : "Click to accept into canon"}
                              >
                                {isAccepted ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Latent Tension / Graph Discovery */}
                  {culturalDossier.unconsideredAngles?.[0] && (
                    <div className="p-4 rounded-[18px] bg-white/[0.03] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#E06B55] font-semibold">
                          Latent Tension · {culturalDossier.unconsideredAngles[0].title}
                        </span>
                        <p className="font-sans text-xs sm:text-[13px] text-[#F7F7D9]/80 leading-relaxed">
                          {culturalDossier.unconsideredAngles[0].description}
                        </p>
                      </div>
                      {culturalDossier.unconsideredAngles[0].groundedEntity && (
                        <button
                          type="button"
                          onClick={() => {
                            const match = allTaggableEntities.find(
                              (e) => e.name.toLowerCase() === culturalDossier.unconsideredAngles[0].groundedEntity?.toLowerCase()
                            );
                            if (match) handleEntityClick(match);
                          }}
                          className="flex-shrink-0 text-xs font-mono text-[#E06B55] hover:underline cursor-pointer"
                        >
                          Anchor: {culturalDossier.unconsideredAngles[0].groundedEntity} ↗
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Observed Clusters + Navigation CTAs */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap text-xs font-sans text-[#F7F7D9]/60">
                    <span className="font-serif italic text-[#F7F7D9]/80 mr-1">Observed taste:</span>
                    <span>{culturalDossier.observedClusters?.join(" · ") || "Intentional Craft · Solitary Acoustic Shield"}</span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {inquiries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstInq = inquiries[0];
                          if (firstInq) setActiveInquiryId(firstInq.id);
                        }}
                        className="px-4 py-1.5 rounded-full bg-[#E06B55] hover:bg-[#eb7b65] text-white text-xs font-sans font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <span>Explore Inquiries ({inquiries.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDossierModalOpen(true)}
                      className="px-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-xs font-sans text-[#F7F7D9] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm group"
                    >
                      <span>Assemble Lookbook ({acceptedEntityIds.length})</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#E06B55] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW B: SCENE INQUIRY VIEW (Lookbook & Index) */
              <div className="flex flex-col h-full min-h-0">
                {/* Header: Question + Mode Switcher */}
                <div className="flex-shrink-0 pb-3 border-b border-white/[0.08] mb-4 flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-[#F7F7D9]/50 flex-shrink-0">
                      {activeInquiry.source === "creator" ? "[You]" : "[Agent]"}
                    </span>
                    <h2 className="font-serif font-medium text-base sm:text-lg lg:text-xl text-[#F7F7D9] tracking-tight truncate sm:whitespace-normal">
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

                {/* View 1: Curatorial Answer & Ensemble (Uncompressed full-width layout, no nested inner card) */}
                {viewMode === "lookbook" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col gap-5 custom-scrollbar-red">
                    {/* Active Refinement or Feedback Banner */}
                    {isRefiningVignette && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E06B55]/15 border border-[#E06B55]/30 self-start animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-[#E06B55] animate-ping" />
                        <span className="text-[11px] font-sans text-[#F7F7D9] font-medium">
                          Poppies Agent is refining curatorial deductions across Qloo taste graph...
                        </span>
                      </div>
                    )}
                    {steeringToast && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 self-start animate-fade-in">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] font-sans text-emerald-300 font-medium">
                          {steeringToast}
                        </span>
                      </div>
                    )}

                    {/* Audio Capsule (Only when music inquiry) */}
                    {activeInquiry.hasAudio && (
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
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

                        {/* Sound wave activity */}
                        <div className="flex items-center gap-1.5 pr-1">
                          <Volume2 className="w-3 h-3 text-[#F7F7D9]/40" />
                          <div className="flex items-center gap-0.5 h-2.5 pl-0.5">
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2.5 animate-pulse" : "h-1 opacity-30"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2 animate-pulse delay-100" : "h-1 opacity-30"}`} />
                            <div className={`w-0.5 bg-[#F7F7D9] rounded-full transition-all duration-300 ${isPlayingAudio ? "h-2.5 animate-pulse delay-200" : "h-1 opacity-30"}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Multi-Paragraph Curatorial Writeup (Full width, full breathing room, elegant editorial prose) */}
                    <div className="flex flex-col gap-4">
                      {(activeInquiry.vignette || "Curating cultural anchors...").split("\n\n").map((para, pIdx) => (
                        <p
                          key={pIdx}
                          className="font-serif text-[16.5px] sm:text-[18px] leading-[1.85] text-[#F7F7D9]/95 font-light"
                        >
                          {renderTextWithEntityTags(para.trim(), allTaggableEntities, handleEntityClick)}
                        </p>
                      ))}
                    </div>

                    {/* Curated Ensemble Tray */}
                    <div id="tour-tappable-objects" className="flex flex-col gap-3 pt-3 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#F7F7D9]/75 font-semibold">
                          {engine === "qloo"
                            ? `Curated Ensemble (${activeEntities.length} verified via Qloo)`
                            : `Ungrounded Probabilistic Suggestions (${activeEntities.length} unverified)`}
                        </span>
                        <span className="text-[11px] font-sans text-[#F7F7D9]/40">
                          {engine === "qloo"
                            ? "Click card to inspect evidence · Click +/✓ to toggle canon"
                            : "Click card to inspect probabilistic tokens"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeEntities.map((entity) => {
                          const domainPhoto =
                            entity.domain === "MUSIC"
                              ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80"
                              : entity.domain === "BOOKS"
                              ? "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
                              : entity.domain === "PLACES"
                              ? "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80"
                              : "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80";

                          const photoSrc = entity.imageUrl || domainPhoto;
                          const isAccepted = acceptedEntityIds.includes(entity.id);

                          return (
                            <div
                              key={entity.id}
                              onClick={() => handleEntityClick(entity)}
                              className={`group rounded-[20px] transition-all duration-200 text-left cursor-pointer flex flex-col overflow-hidden shadow-sm hover:shadow-md border ${
                                isAccepted
                                  ? "bg-white/[0.07] border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] hover:border-[#E06B55]/40"
                              }`}
                            >
                              {/* Entity Photography Banner */}
                              <div className="relative w-full h-24 sm:h-28 bg-black/40 overflow-hidden">
                                <img
                                  src={photoSrc}
                                  alt={entity.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#162a1c] via-transparent to-transparent opacity-90" />

                                {/* Top-left: Canon toggle button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAcceptEntity(entity.id, entity.name);
                                  }}
                                  className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full backdrop-blur-md border text-[10px] font-sans font-medium flex items-center gap-1 transition-all cursor-pointer shadow-sm z-10 ${
                                    isAccepted
                                      ? "bg-emerald-950/85 border-emerald-400/60 text-emerald-300 hover:bg-red-950/85 hover:border-red-400/60 hover:text-red-200"
                                      : "bg-black/60 hover:bg-white/20 border-white/20 text-[#F7F7D9]/80 hover:text-white"
                                  }`}
                                  title={isAccepted ? "Accepted in Canon (click to remove)" : "Click to accept into Canon"}
                                >
                                  {isAccepted ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                      <span>In Canon</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                      <span>Accept</span>
                                    </>
                                  )}
                                </button>

                                {entity.affinityScore !== undefined && engine === "qloo" && (
                                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-sans font-bold text-[#F7F7D9] shadow-sm">
                                    {entity.affinityScore}%
                                  </div>
                                )}
                                <div className="absolute bottom-1.5 left-2.5">
                                  <span className="text-[9px] font-mono tracking-wider text-[#E06B55] uppercase font-bold">
                                    {entity.domain}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3.5 flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-serif italic font-bold text-sm text-[#F7F7D9] group-hover:text-[#E06B55] transition-colors truncate">
                                    {entity.name}
                                  </span>
                                  {isAccepted && (
                                    <span className="text-[9px] font-mono text-emerald-400/80 uppercase font-semibold">
                                      Canon
                                    </span>
                                  )}
                                </div>
                                <p className="font-sans text-[11px] text-[#F7F7D9]/75 line-clamp-2 leading-relaxed">
                                  {entity.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Fetch More from Qloo Button (Only in Qloo mode) */}
                      {engine === "qloo" && (
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
                      )}
                    </div>
                  </div>
                )}

                {/* View 2: Scannable Index Mode */}
                {viewMode === "index" && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 flex flex-col divide-y divide-white/[0.05] custom-scrollbar-red">
                    {activeEntities.map((entity) => {
                      const isAccepted = acceptedEntityIds.includes(entity.id);
                      return (
                        <div
                          key={entity.id}
                          onClick={() => handleEntityClick(entity)}
                          className={`group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-3 py-3 sm:py-2.5 text-left transition-all duration-150 cursor-pointer rounded-xl flex-shrink-0 ${
                            isAccepted
                              ? "bg-white/[0.06] hover:bg-white/[0.09]"
                              : "hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 sm:min-w-[150px] sm:max-w-[200px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[9px] font-mono tracking-wider text-[#E06B55] uppercase font-bold flex-shrink-0">
                                [{entity.domain}]
                              </span>
                              <span className="font-serif italic font-medium text-sm text-[#F7F7D9] group-hover:text-white transition-colors truncate">
                                {entity.name}
                              </span>
                            </div>

                            {/* Mobile action button & score right aligned in entity header */}
                            <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
                              {entity.affinityScore !== undefined && engine === "qloo" && (
                                <span className="font-sans text-[11px] font-bold text-[#F7F7D9]/80">
                                  {entity.affinityScore}%
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAcceptEntity(entity.id, entity.name);
                                }}
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-sans font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                  isAccepted
                                    ? "bg-emerald-950/70 border-emerald-400/50 text-emerald-300"
                                    : "bg-white/[0.05] border-white/15 text-[#F7F7D9]/70"
                                }`}
                              >
                                {isAccepted ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : <Plus className="w-2.5 h-2.5 stroke-[2.5]" />}
                              </button>
                            </div>
                          </div>

                          <p className="flex-1 font-sans text-xs text-[#F7F7D9]/65 leading-relaxed line-clamp-2 min-w-0">
                            {entity.description}
                          </p>

                          {/* Desktop score and button */}
                          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
                            {entity.affinityScore !== undefined && engine === "qloo" && (
                              <div className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                                <span className="font-sans text-[11px] font-medium text-[#F7F7D9]/80">
                                  {entity.affinityScore}%
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAcceptEntity(entity.id, entity.name);
                              }}
                              className={`px-2.5 py-1 rounded-full border text-[10px] font-sans font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                isAccepted
                                  ? "bg-emerald-950/70 border-emerald-400/50 text-emerald-300 hover:bg-red-950/70 hover:border-red-400/50 hover:text-red-200"
                                  : "bg-white/[0.05] hover:bg-white/[0.12] border-white/15 text-[#F7F7D9]/70 hover:text-white"
                              }`}
                              title={isAccepted ? "Accepted in Canon (click to remove)" : "Click to accept into Canon"}
                            >
                              {isAccepted ? (
                                <>
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Canon</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Fetch More from Qloo in Index Mode (Only in Qloo mode) */}
                    {engine === "qloo" && (
                      <div className="pt-3 pb-2 flex justify-center">
                        <button
                          type="button"
                          onClick={handleFetchMore}
                          disabled={isFetchingMore}
                          className="w-full py-2.5 px-4 rounded-[16px] bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 text-[#F7F7D9]/80 hover:text-[#F7F7D9] text-xs font-sans font-medium flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm disabled:opacity-50"
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
                    )}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Bottom Steering Input Capsule: Fixed at Bottom with Focus Mode */}
          <div
            id="tour-prompt-bar"
            className={`w-full flex-shrink-0 rounded-[22px] sm:rounded-[24px] p-1.5 backdrop-blur-md border transition-all duration-300 ease-out transform-gpu ${
              isPromptFocused
                ? "relative z-50 scale-[1.015] bg-white/[0.08] border-white/30 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20"
                : "relative z-20 bg-white/[0.05] border-white/[0.12] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_12px_32px_rgba(0,0,0,0.35)]"
            }`}
            style={{ willChange: "transform, box-shadow" }}
          >
            <div className="w-full rounded-[16px] sm:rounded-[18px] bg-[#F7F7D9] px-3.5 sm:px-6 py-2 sm:py-3 shadow-sm flex items-center justify-between gap-2.5 sm:gap-3">
              {isCreatingNewInquiry && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1b2d20] text-[#F7F7D9] text-[10px] sm:text-[11px] font-sans font-medium flex-shrink-0 animate-fade-in shadow-sm">
                  <span>New question</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreatingNewInquiry(false);
                    }}
                    className="hover:opacity-75 transition-opacity ml-0.5 cursor-pointer"
                    title="Cancel new question mode (Esc)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <input
                ref={promptInputRef}
                type="text"
                value={steeringInput}
                onChange={(e) => setSteeringInput(e.target.value)}
                onFocus={() => setIsPromptFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSteer();
                  if (e.key === "Escape") {
                    setIsCreatingNewInquiry(false);
                    setIsPromptFocused(false);
                    promptInputRef.current?.blur();
                  }
                }}
                placeholder={
                  isDossierSelected || isCreatingNewInquiry
                    ? `Ask a question or scene for ${characterName}...`
                    : `Adapt "${activeInquiry?.question ? (activeInquiry.question.length > 28 ? activeInquiry.question.slice(0, 28) + "…" : activeInquiry.question) : "this"}"...`
                }
                className="w-full bg-transparent border-none outline-none font-serif text-xs sm:text-base text-[#1c2b1e] placeholder:text-[#1c2b1e]/50"
              />

              <button
                type="button"
                onClick={handleSteer}
                disabled={isSteering}
                className="w-8 h-8 rounded-full bg-[#1b2d20] hover:bg-[#283f2e] active:scale-95 text-[#F7F7D9] flex items-center justify-center transition-all shadow-md cursor-pointer flex-shrink-0"
                title={isDossierSelected || isCreatingNewInquiry ? "Ask new question" : "Adapt current inquiry"}
              >
                <Send className="w-3.5 h-3.5 fill-[#F7F7D9] text-[#F7F7D9] stroke-[1.5]" />
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
          setIsCreatingNewInquiry(false);
          promptInputRef.current?.blur();
        }}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-all duration-300 ease-out cursor-pointer ${
          isPromptFocused ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ willChange: "opacity" }}
      />

      {/* Right Drawer: Entity Evidence Inspector */}
      {evidenceDrawerOpen && selectedEntity && (
        <div className="fixed inset-0 z-60 flex items-center justify-end bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-lg h-full max-h-[94vh] sm:max-h-[85vh] rounded-[20px] sm:rounded-[24px] bg-[#16271a] border border-white/20 p-4 sm:p-6 flex flex-col justify-between text-[#F7F7D9] shadow-2xl overflow-y-auto custom-scrollbar-red">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-[#E06B55]">
                    {selectedEntity.domain}
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F7F7D9]">
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

              {/* Director's Canon Curation Action */}
              {(() => {
                const isSelectedAccepted = acceptedEntityIds.includes(selectedEntity.id);
                return (
                  <div className="p-3 sm:p-3.5 rounded-[16px] bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#F7F7D9]/50">
                        Curation Status
                      </span>
                      <span className="text-xs font-sans text-[#F7F7D9] font-medium">
                        {isSelectedAccepted ? "Included in Character Canon" : "Proposed Discovery (Experimental)"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAcceptEntity(selectedEntity.id, selectedEntity.name)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isSelectedAccepted
                          ? "bg-emerald-950/80 border-emerald-400/50 text-emerald-300 hover:bg-red-950/70 hover:border-red-400/40 hover:text-red-200"
                          : "bg-[#F7F7D9] hover:bg-white text-[#16271a] border-transparent"
                      }`}
                    >
                      {isSelectedAccepted ? (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>In Canon (Remove)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Accept into Canon</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}

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
        userPrompt={userPrompt}
        constraints={constraints}
        culturalDossier={culturalDossier}
        inquiries={inquiries}
        acceptedEntityIds={acceptedEntityIds}
      />
    </div>
  );
}
