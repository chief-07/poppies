# POPPIES
## Product & Design Bible — Qloo Agentic Hackathon Edition

**A culturally grounded character and world-building studio powered by Qloo.**  
**Product thesis:** Real cultural relationships can help creators build fictional people and worlds that feel specific, coherent, and lived-in instead of assembled from familiar tropes.

**This document is the source of truth for product decisions, design, agent behavior, technical implementation, evaluation, and the hackathon submission.** It preserves the full ambition of Poppies while making the core promise testable and the build priorities explicit.

---

# 0. The Hackathon Directives: Core Value, Inference Layer, Constraints, & Demo Architecture

> [!IMPORTANT]
> **HACKATHON CORE MANDATES (SOURCE OF TRUTH)**
> 1. **Beyond Barebones Lists:** Poppies does not serve raw Qloo API lists. An entity list with affinity percentages is a shopping recommendation, not a character. Cultural entities must be synthesized into **dramatic scene vignettes, tactile physical armor, and psychological subtext**.
> 2. **Anti-Cliché Value Proposition:** Base LLMs suffer from "cultural monoculture" (predicting the same top 0.1% internet tropes). Qloo provides the empirical affinity graph that discovers authentic, non-hallucinatory subcultural anchors.
> 3. **Deep Constraint Architecture:** Strict enforcement of **Era & Temporal Realism**, **Geographic Bounding**, **Socioeconomic Budget Realism**, and **Negative Curatorial Filters**.
> 4. **The Grounding Matrix:** Validated by 18 empirical benchmark runs proving Base LLM failure modes vs. Poppies depth.
> 5. **The Qloo Engine Toggle & Visual Metaphor:** Header switch desaturating the canvas (`grayscale(85%)`) in Base LLM mode to visually expose generic AI tropes.
> 6. **The 4-Step Interactive Tour Mode:** 60-second guided onboarding for hackathon judges.

---

## 0.1 The Core Problem: The AI Monoculture Trap vs. Cultural Intelligence

When screenwriters, novelists, or game narrative designers ask a frontier LLM (GPT-4, Claude, Gemini) to flesh out a character, they run into the **AI Monoculture Trap**:
- Every Japanese architect drinks from *Hasami porcelain*, reads *In Praise of Shadows*, and listens to *Erik Satie*.
- Every gritty detective drinks cheap whiskey, listens to *Miles Davis*, and wears a trench coat.
- Every young rebel skater listens to *The Sex Pistols* or *The Ramones*.

Language models operate on next-token probability, which inherently pulls toward the statistical mean of internet culture. When prompted with a character's archetype, the LLM collapses into the top 0.01% most stereotypical cultural tropes.

**What Qloo Solves:**
Qloo operates on an empirical graph of over 10 billion cross-domain affinities (music, literature, fashion, physical objects, venues, cinema). Instead of predicting what words commonly appear next to "architect", Qloo uncovers the **latent subcultural reality** of what people with those specific cultural tastes actually consume—surfacing Italian ambient composer *Roberto Musci*, Gaston Bachelard's *The Poetics of Space*, and heavy-duty *5.11 Tactical* or *Danner* boots.

---

## 0.2 The Auteur Inference Layer: Beyond Barebones Lists

Serving raw Qloo results with percentage badges creates an e-commerce or Spotify recommendation feed, not a character studio. A writer does not need a list of brands; they need to understand **how those objects function in human drama**.

### The 4 Functions of a Cultural Entity in Character Design
1. **Tactile Physical Armor:** The everyday tools, knives, pens, or garments that shield the character from the world or serve as extensions of their labor (e.g. *Opinel No. 8 carbon knife* used to scrape carbon deposits from a moped spark plug).
2. **Solitary Acoustic Shield:** The soundscape they put on when completely alone, marking the boundary between their public persona and private exhaustion (e.g. *Hiroshi Yoshimura* or *Emily A. Sprague* ambient tapes).
3. **Intellectual Lineage:** The dog-eared books or obscure essays that secretly underpin their philosophy (e.g. Gaston Bachelard's *The Poetics of Space* hidden behind train station schematics).
4. **The Behavioral Contradiction:** The jarring, lowbrow, or abrasive obsession that breaks the character's surface aesthetic and prevents them from feeling curated (e.g. a monastic station architect who obsessively restores battered 1970s pachinko cabinets at 2 AM to blistering Japanese harsh noise).

### The Primary Output is the Dramatic Scene
In the Poppies Studio, the **Dramatic Scene Vignette** is the hero artifact. Cultural entities are highlighted as interactive nodes woven directly into 2-sentence sensory scenes of physical action, damp stone, wood grain, analog tape hiss, and tactile friction.

---

## 0.3 The Deep Constraint Architecture

To prevent hallucinations, cultural incoherence, and geographic leaks, the Poppies Agent enforces four strict constraint boundaries:

### 1. Era & Temporal Anchor
- **Period-Accurate Historical:** Characters set in specific historical eras (e.g., 1970s London punk, 1980s bubble economy Tokyo, 1920s Harlem) must be strictly bound to entities and technologies that existed in that era.
- **Contemporary with Vintage Fixation (The Retrograde Trait):** Characters living in 2026 who obsess over vintage artifacts (e.g., 1970s pachinko cabinets, 1980s cassette decks). The agent must distinguish between *the era of the setting* and *the era of the obsession*—the character restores 1970s machines using modern Hakko soldering irons and drinks contemporary canned highballs.
- **Speculative / Near-Future:** Grounded in forward-projected subcultures rather than generic sci-fi tropes.

### 2. Geographic & Regional Bounding
- **Strict Spatial Bounding:** Night-walk inquiries, neighborhood haunts, and culinary spots must be constrained to the character's active city or region (e.g., Nagoya, Osaka, Berlin, Marseille).
- **Anti-Bleed Safeguard:** Qloo's collaborative filtering can associate jetset traveler tastes across continents (e.g., Kyoto travelers frequenting Tel Aviv bistros). The agent applies hard geographic filters to prevent international venue bleed for local characters.

### 3. Socioeconomic & Material Budget Realism
- Cultural objects must match the character's lived economic tier.
- A 27-year-old underground DIY skate builder with grease under his fingernails cannot be assigned luxury Danish tableware (*Royal Copenhagen*) or \$500 designer pens unless it is explicitly framed as an heirloom, stolen object, or deliberate contradiction.
- The profiler anchors objects in working-class craft brands (*Knipex, Tajima, Carhartt, Danner, Opinel*).

### 4. Negative Curatorial Filters
- **Worktable / Tool Inquiries:** Strict exclusion of automotive brands (Peugeot, Volvo, Opel), hair styling appliances (Babyliss), and random fashion accessories.
- **Literary Inquiries:** Strict exclusion of airport thrillers, mass-market crime series, and airport self-help paperbacks.

---

## 0.4 The Grounding Matrix: Empirical 18-Run Benchmark Evidence

To establish proof of value without bias or marketing exaggeration, Poppies was tested across 18 rigorous benchmark runs (Base LLM vs. Poppies/Qloo across 3 runs in 3 scenarios):

| Metric / Scenario | Scenario 1: Standard Tsukuru (Nagoya Station Architect) | Scenario 2: Weird Anchor Tsukuru (Pachinko & Harsh Noise) | Scenario 3: Divergence Test (Tsukuru vs. Kenji - Osaka Skate/DIY) |
| :--- | :--- | :--- | :--- |
| **Base LLM (Gemini Flash Lite)** | **Cliché Loop Collapse:** All 3 runs defaulted to *Hasami porcelain*, *Tanizaki's In Praise of Shadows*, *Erik Satie*, and *Glenn Gould*. Run 3 suffered a **meta-fictional leak**, recommending the character read the Murakami novel about himself. | **Isolated Gimmick:** Picked noise artists (*Merzbow*) and soldering tools, but failed cross-domain integration. Bookshelf remained 100% identical cliché (*Tanizaki* and *Murakami*). | **Monoculture Failure:** Gemini gave Kenji the **exact same books, pens, and ambient music** as Tsukuru (*Tanizaki, Rotring 600, Hiroshi Yoshimura*) because both are Japanese architects. |
| **Poppies (Qloo Engine + Auteur Agent)** | **Deep Latent Grounding:** Surfaced Gaston Bachelard's *The Poetics of Space*, Kōbō Abe, and Yasunari Kawabata; uncovered authentic Japanese ambient (*Meitei, Roberto Musci, Emily A. Sprague*); anchored in real Nagoya spots (*Guagliò, Malikafe*). | **Cross-Domain Friction:** Industrial grit shifted object taste into rugged craft (*Snow Peak titanium, Leatherman, 5.11 Tactical, Danner*) and electronic tape pioneers (*Ryuichi Sakamoto, Rei Harakami*). | **Subcultural Divergence:** Grounded Kenji in rugged workwear and moped repair (*Opinel knives, 5.11 Tactical, Danner, Rocky boots*), completely breaking out of Tsukuru's porcelain mold. |

---

## 0.5 The Qloo Engine Toggle & Visual Metaphor

To demonstrate the contrast to judges in real time:
- **Header Toggle Control:** Located at the top right of the application: `[ ✦ Qloo Taste Graph (Active) | Vanilla Base LLM ]`.
- **The "Lifeless AI" Visual Metaphor:** Switching to Vanilla Base LLM applies a global CSS desaturation filter (`filter: grayscale(85%) contrast(95%)`). The screen visibly loses its warmth and color, visually representing that generic LLM generation is culturally drained, flat, and repetitive.
- **Real-Time Pipeline Switching:** When toggled to Base LLM, the backend bypasses Qloo graph retrieval and generates ungrounded probabilistic responses, letting judges witness the cliché collapse with their own eyes.

---

## 0.6 The 4-Step Interactive Tour Mode (60-Second Judge Flow)

An onboarding spotlight system guides first-time visitors and judges through the core 4-step workflow:
1. **Stop 1: The Creative Spark (Prompt Capsule & Lenses):** Enter a loose character brief and select customizable psychological lenses (The Worktable, The Soundscape, The Contradiction).
2. **Stop 2: The Taste Graph (Resolving Engine):** Live visualization of Qloo traversing 10+ billion real-world entities across music, literature, fashion, objects, and places.
3. **Stop 3: The Auteur Studio (Scenes & Artifacts):** Discover how cultural entities are woven into dramatic narrative scenes and tactile psychological armor rather than bare shopping lists.
4. **Stop 4: The Evidence Inspector & Dossier:** Inspect verifiable canonical Qloo Entity IDs, seed pedigrees, affinity scores, and export a production-ready Character Lookbook.

---

# 1. The North Star

> **Characters don't feel fake because they have flaws. They feel fake because their choices feel generic.**

Writers are often forced into one of two unsatisfying workflows:

1. **Guesswork:** Leaning on familiar shorthand—the brooding detective's whiskey, the indie outsider's record collection, the wealthy antagonist's minimalist penthouse.
2. **Generic generation:** Asking a language model to invent a character's tastes, habits, references, and surroundings, then receiving the statistical middle of familiar cultural tropes.

Poppies is an artistic collaborator for creating culturally textured fictional characters and worlds. It uses Qloo's cultural-intelligence API to discover real entities and relationships across supported categories, then uses an AI agent to decide what to investigate next and how the evidence can inform a character.

Poppies does **not** claim that a taste graph can determine a fictional person's psychology. Qloo supplies real-world cultural signals; Poppies interprets those signals creatively; the creator decides what belongs in the story.

## The one-sentence pitch

**Poppies is an AI world-building studio that uses Qloo's cultural intelligence to help writers create specific, believable characters by discovering non-obvious cultural references and weaving them into editable narrative dossiers.**

## The product promise

Give Poppies a character seed, a setting, or even a vague creative instinct. Poppies will investigate the cultural anchors behind that idea, choose follow-up research based on what it discovers, turn supported references into a coherent character dossier, explain the evidence behind its choices, and adapt when the creator changes direction.

## The product is not

- A generic chatbot with a flower logo.
- A recommendation carousel dressed up as a writing tool.
- A random-name generator for artists, brands, books, and cafés.
- A fixed workflow that always runs the same Qloo calls regardless of the results.
- A system that presents cultural affinity as certain knowledge of a fictional character's inner life.
- A production sourcing database that promises current availability, exact prices, or verified product details unless those facts are independently sourced.

---

# 2. The Five Golden Principles

## 2.1 The creator holds the director's chair

Poppies proposes; the creator decides. Every generated detail can be accepted, edited, explored further, replaced, or discarded. The agent may offer an unexpected direction, but it must never confuse its suggestion with the creator's intent.

Creator constraints—such as location, era, budget, occupation, cultural context, tone, and explicit dislikes—must survive the research and writing process. A revision should change what needs changing without casually erasing established character facts.

## 2.2 Context before inventory

A list of ten brands and five musicians is not a person. Every cultural node should earn its place in a scene, habit, contradiction, memory, environment, or meaningful choice.

Weak output: “She likes ambient music and vintage workwear.”  
Stronger output: “She leaves a worn tape playing while she repairs a chair, not because she is nostalgic, but because silence makes every small mistake sound permanent.”

The cultural entities in the second example must be genuinely resolved and Qloo-grounded where claimed. The scene and its emotional interpretation are creative synthesis, not claims returned by Qloo.

## 2.3 Context first, then an adaptive research plan

The agent reads the creator's request and proposes an outline or research agenda tailored to the brief. The creator can request specific chapters, add inquiries, reorder priorities, or leave Poppies room to discover an unexpected thread.

The agent's research plan is not a hard-coded sequence. Each meaningful follow-up action depends on the previous call's results, the remaining unanswered questions, and the creator's constraints.

## 2.4 Specificity over consensus

Poppies should look for useful, non-obvious connections—not obscurity for its own sake. A surprising reference is valuable only if it fits the character's world and can be explained by actual evidence or an honest creative rationale.

The system must distinguish:
- a creator-supplied fact or preference;
- an entity actually resolved or returned by Qloo;
- an affinity or other signal actually present in the response;
- an LLM-generated interpretation or fictional detail;
- a fact verified by a separate source, if any.

Never fabricate Qloo results, entity metadata, affinity percentages, origins, explanations, or source links to make the dossier feel more authoritative.

## 2.5 Two modes of reading: poetic and practical

Every dossier must serve both:

- **Poetic mode:** A writer reads emotionally coherent prose with voice, rhythm, specificity, and subtext.
- **Utility mode:** A writer, game narrative designer, or production artist can inspect the real cultural nodes, understand the available evidence, revisit the source entity, and exchange a reference without rebuilding the entire chapter.

The utility layer should make the creative work more actionable, not turn the main artifact into a spreadsheet.

---

# 3. The User and the Problem

## Primary audience for the hackathon

**Screenwriters, novelists, and game narrative designers who need culturally specific characters and worlds.** They may be developing a lead, a supporting character, a faction, a neighborhood, or a fictional subculture—and want the details to feel lived-in rather than trope-driven.

## Secondary audiences

- Production designers and art departments using cultural references to inform wardrobe, props, sets, and environments.
- Creative directors exploring culturally grounded creative directions and audience-resonance hypotheses.
- Independent game and story teams that need rich narrative material without a large research staff.

The broader audience remains part of the long-term product vision. The first experience should nevertheless make the primary use case immediately legible.

## The concrete problem

A character can have a backstory, personality traits, and a dramatic arc yet still feel artificial because their tastes and everyday choices are interchangeable with hundreds of other generated characters. A creator has to research references manually, guess at connections across cultural categories, or accept plausible-sounding but generic suggestions.

Poppies helps the creator discover and use real cultural material across supported categories—such as music, books, film, brands, places, and other available entities—then weaves those references into a character whose choices make sense together.

## What success feels like to the user

The creator should finish a session thinking:

- “That reference would not have occurred to me.”
- “I can see why it fits this character.”
- “The detail feels specific without reducing the character to a stereotype.”
- “I can change my mind and the agent will follow the story I am trying to tell.”
- “I can separate what was found from what Poppies creatively inferred.”

---

# 4. Product Experience: From Raw Idea to Living Dossier

Poppies is a guided creative workflow, not a single prompt box that returns a long answer. The five stages form one connected experience.

## Stage 1 — The Raw Canvas

**Purpose:** Capture the creator's initial spark with as little friction as possible.

### Interface

A wide, distraction-free writing canvas on a warm paper surface. The product should feel like opening a writer's notebook rather than configuring enterprise software.

### Input

One open text field that accepts a loose character idea, scene, location, premise, or partial brief. The creator should not have to fill out a long form before seeing value.

Example:

> “Elena is an architectural conservator in Marseille. She has spent years repairing things other people overlook. I want to understand her worktable, her late-Sunday walks, and the old car she refuses to replace.”

### Optional inquiry lenses

Offer compact, editable shortcuts such as:

- Her Living Space
- Her Worktable
- Her Night Routine
- Her Secret Vice
- Her Childhood Remnants
- Her Local Haunts
- Her Cultural Contradiction
- Her Listening Habits

These are entry points, not mandatory templates. A section is generated only when it can be meaningfully tied to the specific brief and cultural research. Avoid generic filler sections whose only justification is that they are common in character profiles.

### Agent responsibilities

The parser extracts:

- fixed facts and user-provided constraints;
- explicit requested questions or chapters;
- location and era, where supplied;
- cultural anchors already named in the brief;
- tone and genre cues;
- open questions worth researching;
- explicit exclusions and things the creator does not want.

The parser must preserve uncertainty. If a location, date, or identity materially changes the research and cannot be inferred safely, ask a concise clarification instead of inventing it.

## Stage 2 — The Co-Curated Blueprint

**Purpose:** Let the creator direct the investigation before the agent commits to long-form output.

Poppies creates a tailored research agenda with a proposed table of contents. It should distinguish chapters requested by the creator from angles suggested by Poppies.

Example:

1. **The Worktable** — requested by the creator.
2. **The Port and the Sunday Walk** — requested by the creator.
3. **The Peugeot and the Tool Kit** — requested by the creator.
4. **The Contradiction** — suggested by Poppies after an unexpected cross-category cultural connection appears in the research.

### Creator controls

- Reorder chapters.
- Rename, add, or remove an inquiry.
- Mark a chapter as essential.
- Specify the desired emphasis or exclude a direction.
- Start generation when the plan feels right.

### Agent responsibilities

For each proposed chapter, the agent records:

- the creative question to answer;
- the creator constraints that apply;
- the cultural evidence it expects to investigate;
- whether the question appears answerable using Qloo's supported entity types and parameters;
- which parts will require creative synthesis rather than direct data retrieval.

The plan is an informed proposal, not a promise that Qloo contains every requested object. If a specific car model, local shop, garment, or household object cannot be resolved through the available API, Poppies must find a defensible route through related entities or clearly mark the resulting detail as creative extrapolation.

## Stage 3 — The Living Dossier

**Purpose:** Turn research into the central product artifact: a visually rich, editable editorial lookbook for a fictional person and their world.

The dossier should feel closer to a bespoke magazine feature or a carefully designed film reference bible than an analytics dashboard.

### A. The Master Brief: "The Cultural Dossier"
At the apex of the character investigation sits the foundational overview: **The Cultural Dossier**.

1. **The Taste Intersection Thesis**: Rather than simply listing isolated items, the agent articulates what the intersection of the creator's seeds in Qloo's graph reveals about how this person walks through the world.
2. **Built Upward from Real Evidence (Zero Slop)**: The thesis must be constructed upward from observable Qloo cluster patterns (e.g., "The graph around your seeds clusters heavily around solitary instrumental music and handmade tactile objects..."). The entity names are real, the cluster pattern is real, and the creative interpretation is explicitly labeled as the agent's synthesis.
3. **Angles You Might Not Have Considered (Grounded Surprises)**: Only surfaced when genuine second-order discoveries or unexpected cross-category affinities emerge from the Qloo graph. If no genuine surprise emerged, do not force an invented contradiction.
4. **Embedded Cultural Nodes**: The seeds and discovered anchors are woven into the master prose as interactive editorial nodes that link directly to the Evidence Drawer.

### B. Dual-Origin Inquiries Hierarchy (`[You]` vs `[Agent]`)
The left pane organizes the investigation into two clear tiers:
- **`[You]` (Creator-Directed)**: Inquiries directly fulfilling specific questions or scenes introduced in the creator's prompt (e.g., *Her 2 AM Soundscape*, *The Worktable*, *The Peugeot 205*).
- **`[Agent]` (Autonomous Discoveries)**: Inquiries opened independently by the agent when inspecting Qloo graph results (e.g., *The Solitary Haunt*, *The Friction / Contradiction*).

Selecting any inquiry focuses the entire studio on answering that specific question with grounded vignettes and resolved Qloo entities.

### C. Dynamic chapters

Generate three to five tailored chapters by default, based on the brief and research. Examples include:

- **The Morning Draft:** A morning ritual and its cultural anchors.
- **The Worktable:** Tools, books, materials, references, and work habits.
- **The Haunt:** A meaningful place or locality, supported by available location research.
- **The Friction:** A cultural contradiction that makes the character less predictable.
- **The Private Signal:** What the character returns to when nobody is watching.

These titles are illustrative, not a fixed set. Every chapter must answer a question specific to this character and have at least one traceable cultural anchor or explicitly identified research limitation. Do not imply that a generic model-invented scene was sourced from Qloo simply because the dossier contains Qloo data elsewhere.

### D. Narrative prose with embedded cultural nodes

Real entities discovered through supported Qloo requests appear naturally within the prose. Each node is clickable without interrupting the reading experience.

Example of the intended writing style:

> The light comes off the port flat and grey. Before touching the drafting table, she starts the tape deck by the sink. The music is not a declaration of taste; it is a way to make a room feel occupied while she works. On the back of her chair hangs the same battered jacket, its repaired cuff more important to her than the label inside it.

This is an illustration of tone, not a pre-approved Qloo result. A shipped dossier must use entity names and evidence that the actual run retrieves and records. Do not present example names, scores, or metadata as API facts unless verified in the run.

### C. Interactive cultural nodes

Nodes can represent the supported cultural references selected for a chapter, including artists, books, films, brands, places, and other API-supported types. A node must link to a resolved entity ID whenever one is available and applicable.

Visually, nodes should be quiet editorial annotations—warm red or another accessible accent, with a subtle underline, highlight, or side mark. Avoid loud badges that make the prose look like an SEO report.

### D. The Entity Node Drawer

Selecting a node opens a compact side panel with two clearly separated layers.

**Evidence layer**
- Canonical entity name and entity type as returned or resolved.
- Real source identifier and provider/source link when available.
- The query or seed context that led to this result.
- Actual affinity or explainability metadata when the API returns it and the app retains the exact semantics.
- A plain-language account of why Poppies selected it, grounded in those signals.
- Any notable uncertainty, unsupported field, or missing information.

**Creative layer**
- How the entity is being interpreted in this chapter.
- Production or writing notes that are explicitly labeled as Poppies' suggestions.
- Alternatives that could change the tone, era, class position, locality, or degree of obscurity.
- An action to replace the entity and revise the affected prose.

Never invent a “91% fit,” personal preference probability, audience percentage, origin, availability, or cultural explanation. A returned numeric score is not necessarily a probability. Explain what the API's actual field means before displaying it as a user-facing metric.

### E. The dossier's evidence discipline

Each section must make it possible to answer:

1. Which real cultural entities or signals informed this section?
2. Which facts came from the creator?
3. Which details are the LLM's creative interpretation?
4. What can be clicked or investigated further?
5. What would change if the creator rejected one of the anchors?

Evidence should be inspectable, not intrusive. The reader should be able to enjoy the prose without opening a technical drawer every few seconds.

## Stage 4 — Collaborative Tuning: Pulling on the Thread

**Purpose:** Treat the dossier as a living document, not a one-shot answer.

The creator can respond to the whole character or a particular section. Suggested inquiries appear contextually and should relate to the current character, not be identical generic chips on every dossier.

Examples:

- “What is in her glove compartment?”
- “What would she listen to when she is furious?”
- “Give her a guilty pleasure that complicates her minimalist aesthetic.”
- “She feels too wealthy. Make her wardrobe and habits reflect financial pressure.”
- “Keep the same emotional tone, but make the references less obvious.”
- “That reference feels too contemporary for the period. Find an alternative.”

### Targeted revision behavior

The agent should identify which character constraints changed, decide whether new Qloo research is needed, run the necessary query or queries, and revise the affected section. It should preserve unrelated chapters and accepted creator edits.

If the user changes an important global constraint—such as moving the character to another city or decade—the agent should identify the dependent chapters and ask permission or clearly show the scope of the update before rewriting widely.

### Alternatives and branching

For an embedded entity, the creator can request alternatives such as:

- more obscure;
- more contemporary or more period-appropriate;
- more utilitarian or more luxurious;
- closer to the locality;
- less expected;
- more consistent with a stated constraint.

The alternatives must be returned or validated through the real research workflow. A replacement should update the affected narrative and its evidence links, not only swap a name in the visible text.

## Stage 5 — The Thread: A Real-World Cultural Mirror

**Purpose:** Give the creator a careful insight into the broader cultural world the fictional character might evoke.

The Thread summarizes the strongest observable cultural relationships in the dossier and offers a short hypothesis about possible audience resonance. It may connect a character's cultural anchors to real-world clusters of interests when Qloo's actual supported response data justifies the connection.

Example of the intended tone:

> The character's references cluster around patient craft, architectural restraint, and music designed for attention rather than spectacle. Those details may resonate with audiences who recognize the pleasure of restoring, preserving, and using things carefully.

This is a creative interpretation, not a verified audience claim by itself.

### The Thread must not

- invent audience demographics or percentage estimates;
- imply Qloo has identified a real group unless a supported query actually returned that evidence;
- claim that every person in a taste cluster behaves alike;
- turn culture into deterministic stereotypes;
- use demographic or psychographic language to imply certainty about individuals.

When audience or demographic analysis is shown, label the evidence and limitations. If there is no reliable supporting data, make The Thread a grounded creative synthesis rather than presenting it as an empirical market report.

---

# 5. The Qloo Agent: Architecture and Behavior

This is the product's technical heart. Qloo must affect the agent's decisions, not merely decorate the output.

## 5.1 System architecture

Use a clean separation of responsibilities:

1. **Client experience:** Canvas, inquiry outline, dossier, evidence drawer, revision tools, and comparison view.
2. **Application server:** Authentication/session handling if needed, secure Qloo credentials, request validation, persistence, orchestration, rate handling, and structured responses to the client.
3. **Agent orchestrator:** Maintains the current brief, constraints, research state, tool history, unresolved questions, and stopping conditions.
4. **Qloo adapter:** Encapsulates the supported Qloo lookup and Insights requests. It validates parameters, normalizes responses without losing source fields, and returns structured evidence.
5. **Synthesis layer:** Turns selected evidence into prose and proposed chapters while preserving provenance labels.
6. **Evaluation and observability layer:** Records redacted agent events, query rationale, outcomes, failure states, and baseline-comparison metrics. Never log or expose API credentials.

The implementation language or framework is an engineering choice. The responsibilities and data contracts are the important invariants.

## 5.2 Use real, supported Qloo operations

Qloo's current public documentation identifies `/v2/insights` as the core Insights endpoint and provides supporting lookup APIs for resolving entity IDs and tags. The Insights API is parameter-driven: results depend on the supported entity type, seed entities or tags, location signals, exclusions, and other valid filters. Supported parameters vary by entity type.

Do not treat conceptual steps in this Bible as literal API routes. “Affinity mining,” “locality grounding,” and “negative constraints” describe Poppies capabilities, not guaranteed endpoint names. Use the actual Qloo API contract and the credentials/base URL specified in the hackathon's current developer instructions.

Technical references:
- [Qloo Agentic Hackathon](https://qloo.devpost.com/)
- [Official hackathon rules](https://qloo.devpost.com/rules)
- [Qloo public API overview](https://github.com/qloo/docs-public/blob/main/reference/api-overview.md)
- [Qloo Insights API Deep Dive](https://github.com/qloo/docs-public/blob/main/reference/insights-api-deep-dive.md)
- [Qloo public API documentation repository](https://github.com/qloo/docs-public)

## 5.3 Research cycle: plan, call, inspect, decide

Every Qloo-relevant chapter uses an explicit research cycle.

### Step A — Build the research state

The agent stores the current character brief, constraints, resolved anchors, rejected candidates, research questions, existing evidence, and generated chapters. The state should be structured and readable by both code and the model.

### Step B — Resolve the seeds

Search for entities mentioned by the creator or inferred as useful starting points. Disambiguate where necessary, especially for common names, multiple editions, ambiguous places, or different entities with the same title. Do not send guessed IDs to the Insights API.

### Step C — Form a valid query

Select a supported `filter.type`, seed entities or tags, and appropriate filters. Use location signals when the question truly depends on geography. Use exclusions for rejected or unsuitable entities where supported. Validate entity-specific parameters before making the request.

### Step D — Inspect results and evidence

Record which entities were returned, their IDs and types, the input signals used, relevant metadata, and any explainability information actually returned. The system may rank candidates for creative usefulness, but it must distinguish that application ranking from Qloo's own data.

### Step E — Choose the next action adaptively

The agent decides whether to:
- investigate a new category based on a previous result;
- refine a weak or overly broad query;
- resolve an ambiguous entity;
- apply a creator constraint;
- explore an unexpected relationship;
- write the section because there is sufficient evidence;
- ask the creator for a missing essential fact;
- stop and explain that the requested detail cannot be grounded through the available data.

The choice must be based on the current research state and prior tool results. The same fixed series of calls for every brief is not sufficient evidence of agentic behavior.

### Step F — Synthesize and attach provenance

The synthesis layer creates narrative prose with explicit links back to the research records. Each important cultural detail should have at least one supporting anchor or be labeled as creative inference. A chapter should not be described as “Qloo-backed” merely because a Qloo call happened earlier in the session.

### Step G — Validate against the brief

Before showing the result, check that the output respects fixed facts, requested chapters, era, locality, budget/class constraints where supplied, rejected entities, tone, and other creator decisions. Detect and remove unsupported claims about the API's data.

## 5.4 The agent needs bounded autonomy

Poppies should be agentic without being opaque or uncontrollably expensive.

- Give every research task a clear objective and maximum tool-call budget.
- Use bounded iterations and explicit stop conditions.
- Validate the model's proposed tool arguments in code before calling Qloo.
- Prefer a small number of high-value queries over many shallow queries.
- Cache safe, reusable entity-resolution results during a session when permitted.
- Retry transient failures selectively, not in infinite loops.
- If the API returns empty or ambiguous results, refine once or twice, try a supported alternative, then disclose the limitation.
- Do not silently replace a failed Qloo result with invented evidence.

The precise limits should be tuned against observed latency, key quotas, and output quality. They are configuration values—not claims about Qloo's guaranteed limits.

## 5.5 Evidence provenance data contract

At minimum, preserve structured records for:

### Character brief
- brief ID and revision;
- creator-provided facts and preferences;
- explicit constraints and exclusions;
- location and time period, when supplied;
- requested inquiries and output tone.

### Research event
- event ID and timestamp;
- question or purpose;
- tool name and endpoint category;
- validated request parameters, with secrets removed;
- seed entity IDs and types;
- returned entity IDs, types, and relevant response fields;
- error or empty-result state;
- the previous event or evidence that motivated the call;
- the agent's selected next action and rationale.

### Cultural node
- canonical name, Qloo entity ID, and returned entity type;
- source research event IDs;
- exact evidence fields relied upon;
- creator acceptance, rejection, or edit state;
- associated chapters and narrative passages;
- whether a displayed detail is source data, creator input, separately verified data, or creative synthesis.

### Dossier chapter
- chapter ID, title, and current revision;
- creative question;
- relevant brief constraints;
- referenced cultural node IDs;
- prose and creator edits;
- research limitations and provenance labels;
- dependencies that should be reconsidered if the chapter is revised.

This is not merely an audit trail. It enables the targeted revision workflow, prevents unsupported claims, and makes the evidence visible to judges.

## 5.6 Never filters and rejection handling

Poppies must remember explicit dislikes and rejected results. It can use supported entity exclusions, adjust query inputs, or search for alternatives. However, it must not claim that Qloo has discovered a person's “negative affinity” unless the API returns a signal that genuinely supports that interpretation.

The “Never” filter is primarily a creator-control feature: avoid what the creator said to avoid; do not bring a rejected reference back into the dossier; and use fresh evidence when the creator requests a different direction.

## 5.7 Reliability requirements

- Qloo API credentials stay server-side and out of the public repository.
- Validate and encode requests; do not trust arbitrary tool arguments from a model.
- Handle unsupported parameters, invalid IDs, 400 responses, timeouts, rate limits, and empty results.
- Distinguish missing data from failed requests.
- Do not show stale research as if it came from the most recent revision.
- Make retries idempotent where practical and prevent duplicate chapters after retries.
- Keep the app usable if one optional query fails, but never pass invented data off as Qloo evidence.
- Use user-friendly explanations for partial completion.
- Avoid retaining sensitive or unnecessary user inputs in diagnostic logs.

---

# 6. The Qloo Difference: What the Product Must Prove

A judge should be able to understand why Poppies needs Qloo after using it for only a few minutes.

## 6.1 The proof chain

Every strong demo should reveal this causal chain:

**Creator brief → resolved cultural anchors → Qloo-derived results → adaptive follow-up query → specific creative choice → traceable dossier detail.**

If removing Qloo changes only the names in the prose, the integration is too shallow. If it changes which questions the agent explores, which references it selects, what evidence can be inspected, and how the character is constructed, the API is central to the product.

## 6.2 The fair baseline comparison

Include a toggle or comparison view between:

- **Base model:** The same original character brief and comparable instructions, without Qloo research.
- **Poppies with Qloo:** The same brief, with the agent allowed to resolve entities, query Qloo adaptively, and cite returned evidence.

Keep the visual layout and reading conditions substantially consistent. The comparison must not bias the result through a deliberately inferior design or shorter baseline output. Poppies' branding can be expressive, but the product must win on its cultural specificity and grounded references—not on making the baseline look bad.

The baseline is a product-evaluation mode, not a claim that all language models behave identically. Record the model, prompt settings, output length, and evaluation procedure if making comparative claims.

## 6.3 What judges should be able to observe

- A real entity-resolution step, not an invented entity ID.
- Real Qloo requests and returned results.
- At least one follow-up query chosen because of prior findings.
- Multiple supported cultural categories when the brief warrants them.
- Prose that includes traceable Qloo-derived anchors.
- A revision that triggers targeted, relevant additional research.
- An honest distinction between evidence and literary interpretation.
- A clear base-model comparison on the same brief.

Do not expose secrets or overwhelm the judge with raw JSON. Provide a polished research trace with expandable technical detail.

---

# 7. Evaluation: Measure the Product, Not Just the Demo

A good story can make almost any generated output seem convincing. Poppies should test whether cultural grounding actually improves the result.

## 7.1 Internal evaluation set

Use at least three clearly different briefs, for example:

1. A craft-focused professional in a specific coastal city.
2. A young character whose cultural interests contradict their public persona.
3. A character with tight budget, time-period, or locality constraints.

The examples should differ in cultural anchors, genre, and constraints. Avoid selecting only briefs that happen to produce unusually strong Qloo responses.

## 7.2 Compare on consistent criteria

Review base-model and Qloo-enabled outputs using the same dimensions:

- **Cultural specificity:** Are the references concrete rather than interchangeable?
- **Coherence:** Do the details belong to the same person and world?
- **Non-obviousness:** Do any references create a meaningful discovery rather than an arbitrary surprise?
- **Evidence quality:** Can the reader trace claimed Qloo-derived material to real returned data?
- **Creative usefulness:** Does the output give the creator material worth keeping or developing?
- **Constraint fidelity:** Does the character respect the creator's brief, setting, era, budget, and dislikes?
- **Revision quality:** Does the agent respond to changes without damaging unrelated material?

If possible, ask a small number of actual writers or narrative designers to compare anonymized outputs. Keep their feedback and methodology honest: small qualitative feedback is useful product evidence, not proof of market-wide impact.

## 7.3 Engineering tests

Test at minimum:
- common and ambiguous entity names;
- a brief with no known entity anchors;
- unsupported or empty result cases;
- local queries with an ambiguous or unrecognized location;
- explicit creator exclusions;
- changing one constraint after the dossier exists;
- API timeout or failure during a multi-step workflow;
- repeated requests and refreshes;
- a baseline comparison with the same brief;
- a mobile-width session and a fresh judge session with no previous state.

## 7.4 What not to claim

Do not claim that Poppies is more accurate, more authentic, or improves creator productivity by a precise percentage unless the product has performed a defensible evaluation that supports the figure. The demo can strongly illustrate the difference without pretending a few examples constitute universal proof.

---

# 8. Visual Identity and Design System

## 8.1 Brand idea

Poppies should feel like an artist's field journal crossed with an intelligent cultural research studio: organic, expressive, literary, a little unexpected, but serious about craft.

The botanical visual metaphor gives the product warmth and recognition. The interface itself must remain clear and precise. The brand is not a florist, a gardening app, or a whimsical toy.

## 8.2 Core palette

The new direction supersedes the earlier crimson-and-indigo concept. Use these as starting tokens and check the final combinations for contrast before shipping.

| Token | Hex | Role |
|---|---|---|
| Forest Green | `#203D27` | Brand foundation, selected surfaces, key navigation moments |
| Poppy Red | `#E52F43` | Primary brand accent and important actions |
| Marigold Orange | `#F28B26` | Secondary accent, highlights, small expressive details |
| Warm Paper | `#F2EBDD` | Main reading surface and editorial background |
| Ink | `#1C1B1A` | Main text on light surfaces |
| Muted Ink | `#686663` | Secondary text, captions, quiet labels |
| Soft Border | `#D8D2C5` | Dividers and subtle interface structure |

### Color rules

- Use forest green as a strong anchor, not a mandatory background for every screen.
- Use red and orange sparingly enough that important actions remain easy to find.
- Use warm paper for long-form reading; avoid visual noise behind prose.
- Do not place small body text on busy illustrations.
- Check all important text and control states for accessible contrast.
- Do not communicate evidence status through color alone; pair it with readable labels or symbols.

## 8.3 Illustration direction

Use painterly or hand-made poppy-inspired florals, irregular botanical shapes, and tactile textures for brand moments, transitions, onboarding, landing sections, and empty states. The reference wallpaper's appeal is the saturated red and orange blossoms against deep green—not literal botanical accuracy.

Do not put flowers on every screen. The dossier's content and Qloo evidence must have visual priority. Illustrations should frame the creative work, not compete with it.

## 8.4 Typography

Build a restrained editorial type system:

- **Headlines:** A distinctive literary serif such as Newsreader or Fraunces.
- **Long-form prose:** A highly readable serif or warm sans-serif; choose one and maintain consistent line lengths and spacing.
- **Interface controls:** A clear contemporary sans-serif.
- **Evidence metadata:** A restrained monospace for IDs, entity types, and technical details only.

Avoid using too many typefaces. Expressiveness should come from hierarchy, spacing, and composition rather than constant stylistic changes.

## 8.5 Layout and interaction

- Prioritize readable line length and generous whitespace in the dossier.
- Use a stable grid and consistent chapter spacing.
- Make interactive cultural nodes discoverable without resembling advertising links.
- Open the entity drawer without losing the reader's place.
- Make the outline, chapter status, evidence links, and revision state understandable at a glance.
- Use loading states that explain what the agent is doing—resolving references, exploring relationships, writing a chapter—without pretending a call succeeded before it has.
- Support mobile and desktop layouts; the live submission must be functional at the width a judge is likely to use.
- Keep technical traces expandable rather than always visible.

## 8.6 Brand voice

Literary but not overwritten. Curious but not breathless. Intelligent without academic posturing. Never tell the creator that a character “would definitely” like something because of one affinity signal. Prefer language such as “This reference may fit because…” and explain the evidence.

---

# 9. Product Scope: Full Vision and Build Priorities

Poppies should retain the breadth of the product vision. The hackathon version should establish a polished, complete vertical slice while keeping the remaining features in the coherent product plan—not pretending the entire long-term roadmap has already been built.

## Tier 1 — Must work in the submission

- Raw Canvas for a freeform character brief.
- Extraction of creator constraints and requested questions.
- Co-Curated Blueprint with editable inquiry structure.
- Multi-step Qloo research using real supported endpoints.
- An adaptive follow-up decision based on previous tool results.
- Three to five tailored dossier chapters when evidence and latency permit.
- Traceable cultural nodes embedded in the prose.
- Evidence/creative-synthesis distinction in the entity drawer.
- At least one meaningful targeted revision that reuses the current state and reruns relevant research.
- A fair base-model vs. Qloo-enabled comparison on the same brief.
- One fully working end-to-end demo path, robust to empty results and common API errors.
- A polished brand, responsive layout, public repository, clear setup instructions, and visible open-source license.

## Tier 2 — Complete where it strengthens the core workflow

- Chapter reordering and removal.
- Alternative cultural nodes with inline replacement.
- Contextual suggested inquiries.
- Persisted research trace with expandable technical details.
- Multiple saved branches of a character.
- The Thread cultural mirror, with evidence-aware language.
- More detailed production and reference notes.
- Additional character examples and evaluation fixtures.

## Tier 3 — Natural extensions of the product

These remain part of the long-term vision but must not destabilize the core submission:

- Rich character and world projects with multiple linked characters.
- More elaborate production-design exports and reference packs.
- Shared dossiers and collaborative creator workflows.
- Expanded audience-resonance analysis when backed by supported queries and clear evaluation.
- Additional supported categories and deeper locality workflows.
- Historical and era-aware research with independent source verification where needed.
- Branch comparison, version history, and reusable story-world libraries.

Tiering is a build-order decision, not a reduction in ambition. A feature should move up only when its main path is reliable and contributes demonstrably to the judging criteria.

---

# 10. The Judge's Experience

The live product must guide the judge through the value proposition without requiring a tutorial, a demo video, or prior knowledge of Qloo.

## Suggested first-run journey

1. **Landing:** Explain in one sentence what Poppies does and why cultural grounding matters.
2. **Start a character:** Provide a concise, high-quality example brief the judge can run immediately, while allowing custom input.
3. **Co-curate:** Show the agent's proposed inquiries and let the judge confirm or edit them.
4. **Research:** Present a restrained status trail as the agent resolves entities and makes Qloo calls.
5. **Read the dossier:** Show the finished editorial artifact, with cultural nodes naturally embedded.
6. **Inspect evidence:** Open one node to reveal the real Qloo anchor, source signals, and distinction between returned data and creative interpretation.
7. **Change a constraint:** Let the judge make a meaningful intervention such as “make this character less wealthy” or “make the cultural references less obvious.”
8. **Observe adaptation:** Show that the agent changes its research where needed and revises the affected scene without rebuilding unrelated sections.
9. **Compare:** Make the Qloo-enabled result and fair baseline available using the same brief and comparable display.

## Judge experience principles

- The value proposition should be understood before the first API call finishes.
- The main demo must work without the judge creating an account, if practical and consistent with the app's security model.
- Provide a useful prefilled example, but do not hard-code its final results as if they were live agent output.
- Show real progress and meaningful agent decisions, not fake loading steps.
- If a live query fails, explain what failed and keep the rest of the app understandable. Do not silently substitute a canned result while implying it is live.
- Keep the demo compact enough to complete in a few minutes but deep enough that a judge can investigate the evidence.
- Make the live URL, repository, installation instructions, license, and project description easy to find.

---

# 11. Hackathon Strategy and Submission Compliance

The Qloo Agentic Hackathon judges four equally weighted criteria after a viability screen:

- Technological Implementation
- Design
- Potential Impact
- Quality of the Idea

Official source: [Qloo Agentic Hackathon rules](https://qloo.devpost.com/rules).

Every meaningful product choice should help one or more of these criteria. The strongest features usually support multiple criteria at once: the interactive evidence drawer improves design and makes Qloo's contribution visible; targeted revision demonstrates agent behavior and creator utility; the controlled baseline illustrates both the idea's originality and potential impact.

## Submission checklist

- [ ] Public, working, externally hosted demo.
- [ ] End-to-end flow tested in a fresh session.
- [ ] Public source repository containing the code, assets, and run instructions.
- [ ] A recognized open-source license file visible in the repository's top-level view/About context as required by Devpost.
- [ ] API key and secrets excluded from source control.
- [ ] Setup steps explain required environment variables without revealing values.
- [ ] Submission description makes the problem, agent behavior, Qloo contribution, and product value immediately clear.
- [ ] Relevant project updates made during the submission period are described accurately if the project existed beforehand.
- [ ] Any third-party APIs, models, code, fonts, and visual assets are used according to their applicable terms and licenses.
- [ ] All submitted screenshots and descriptions reflect the actual working product.
- [ ] The demo does not depend on a local development server, private access, or the team being present to explain it.
- [ ] Do not plan to edit the submitted material after the deadline; Devpost's rules restrict changes once the submission period has ended.

## How Poppies should be described to judges

Lead with the non-obvious application of cultural intelligence, not with a long list of features. Explain the agentic process in concrete terms: it resolves real anchors, uses Qloo to discover relationships, chooses follow-up research based on the results, and uses that evidence in an editable dossier. Then demonstrate the difference on the same brief.

Avoid unsupported claims such as “Qloo knows what every person likes,” “this character is 91% authentic,” or “Poppies eliminates bias.” Describe exactly what the app observes, infers, and cannot know.

---

# 12. Definition of Done

Poppies is ready to submit when all of the following are true:

## Product
- A first-time user can understand the purpose and start without explanation.
- The brief, co-curated plan, dossier, evidence drawer, and targeted revision work as one experience.
- Every dossier chapter has a traceable cultural anchor or an explicit limitation; no section is falsely labeled Qloo-backed.
- The creator can reject a reference and see that decision respected.
- The product distinguishes real returned entities from creative interpretation.

## Agent
- At least one next-step query is selected based on previous Qloo results in the live flow.
- The query uses valid, supported parameters and real resolved entity IDs when required.
- The agent has bounded iterations, validated tool arguments, and safe stop conditions.
- Empty results and failures are handled honestly.
- A meaningful revision can cause new research and targeted rewriting.

## Design
- The new forest-green, poppy-red, marigold-orange, and warm-paper identity is coherent.
- Typography and spacing support long-form reading.
- Nodes, buttons, drawers, and revision controls have real behavior.
- Mobile and desktop layouts are usable and readable.
- The visual design makes the evidence easier to inspect rather than hiding it.

## Proof
- A fair baseline comparison uses the same input brief.
- Several distinct briefs have been tested.
- The team can point to a concrete example where a prior Qloo result changed the agent's next action.
- The team can explain which dossier details came from Qloo and which were invented as creative synthesis.

## Submission
- Demo is externally hosted and public.
- Public repository and open-source license are present.
- Environment setup and testing instructions work from a clean checkout.
- No credentials are committed or displayed.
- Devpost text is clear and consistent with the actual implementation.

---

# 13. Final Product Principle

Poppies should feel like entering an artist's field journal that happens to contain a genuinely intelligent cultural research agent.

The flowers, paper, typography, and editorial layout give the brand its emotional world. The cultural graph gives the agent a richer material to work with. The adaptive research loop creates the technical substance. The dossier turns that substance into creative utility. The evidence layer makes the work trustworthy. The creator remains the author.

The standard is not “an AI wrote an evocative character.” The standard is:

> **Poppies discovered something real, followed the discovery intelligently, turned it into a useful creative possibility, showed its work, and let the creator make it their own.**

That is the product to build—and the proof the Qloo hackathon judges should be able to see.
