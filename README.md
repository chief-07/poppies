# Poppies

**A culturally grounded character and world-building studio powered by Qloo.**

Poppies helps screenwriters, novelists, and game narrative designers build fictional characters and worlds that feel authentic, specific, and lived-in—using real-world cultural taste data rather than internet clichés.

---

## The Problem

When writers build characters, believable details make or break the world. The books on a nightstand, the tools on a workbench, the music playing in a kitchen at 2 AM, the neighborhood diner someone actually goes to—these specific choices signal who a person is.

Today, creators face a frustrating bottleneck:
1. **Manual research takes weeks**, often leading writers to lean on familiar tropes for subcultures they haven't personally lived in.
2. **Standard AI models make it worse.** Ask ChatGPT, Claude, or Gemini to flesh out a character, and you get the statistical middle of internet clichés.

Ask a base LLM to detail a **36-year-old train station architect in Nagoya**, and every single run gives you the same cardboard cutout:
- They drink from *Hasami porcelain*.
- They listen to *Erik Satie*.
- They read Jun'ichirō Tanizaki’s *In Praise of Shadows*.
- They draft with a *Rotring 600*.

Ask for a gritty detective, and you get cheap bourbon, Miles Davis, and a trench coat. Ask for an underground Berlin DJ, and you get all-black techwear, Club-Mate, and Berghain.

### Why a Base LLM Cannot Solve This

Large Language Models operate on next-token probability. They are trained to predict the most likely sequence of words based on web consensus. 

When you ask a model for cultural recommendations, its objective function pulls directly toward the top 0.01% most stereotypical representations online. The model does not know how human taste actually works in the physical world; it only knows which words appear near each other in text. 

Prompting harder or adding more instructions does not fix the issue—it simply produces the same generic clichés in more articulate prose.

---

## Why Qloo Matters

Qloo is not a language model. It is an empirical Taste Graph mapping over **10 billion cross-domain affinities across 250+ million entities** (music, literature, fashion, cinema, dining, everyday objects, and places).

Instead of guessing what sounds plausible, Qloo reflects how human preferences actually cluster:
- A person drawn to minimalist Japanese ambient music (*Roberto Musci*, *Meitei*) doesn't necessarily buy commercial designer stationery; they might carry an *Opinel No. 8 carbon knife* or read Gaston Bachelard's *The Poetics of Space*.
- A stone conservator in Marseille doesn't frequent tourist bistros along the Old Port; their habits cluster around working-class harbor haunts and rugged, repair-focused gear (*Knipex*, *Danner*).

Poppies combines Qloo's empirical taste graph with Gemini's reasoning to discover authentic cultural anchors and synthesize them into usable creative dossiers.

---

## Who It's For

- **Screenwriters & Showrunners:** Build character bibles and dialogue texture that feel earned and grounded rather than googled.
- **Game Narrative Designers:** Populate open worlds with NPCs, factions, and local haunts that have genuine regional and subcultural depth.
- **Novelists:** Research unfamiliar subcultures, trades, and environments with confidence, avoiding shallow caricatures.
- **Production & Wardrobe Designers:** Identify specific, period- and budget-accurate props, everyday gear, and clothing.

---

## How Poppies Works

Poppies is a creative studio, not a generic chatbot or a raw list generator. Every piece of the interface serves a specific part of the writing process:

### 1. The Character Canvas & Inquiry Lenses
Start with a short brief—a character's profession, a setting, or an emotional premise. As you type, dynamic inquiry lenses suggest specific angles to explore (their workspace, night routines, literary influences, or unexpected habits).

### 2. Dual Inquiries (`[You]` vs `[Agent]`)
Investigations are organized into two clear tracks:
- **`[You]` (Creator-Directed):** Inquiries directly answering questions from your prompt (e.g., *What drafting tools rest on his desk?*).
- **`[Agent]` (Autonomous Discoveries):** Questions opened independently by the agent when it uncovers an unexpected or interesting affinity in Qloo's graph.

### 3. Curated Cultural Trays
Rather than overwhelming you with raw data feeds, Poppies curates 3–4 grounded recommendations per inquiry. Each item is accompanied by a concise rationale explaining why it fits this character's background, era, and environment.

### 4. Inspectable Evidence
Click any cultural entity in the text to open the **Qloo Evidence Drawer**. You can view canonical Qloo entity IDs, source seeds, URN types, and latent affinity scores to verify where the recommendation came from.

### 5. Director's Curation
You retain final say over every detail. Recommendations start as proposals that you can accept into canon or discard. Need more options? Click `+ Fetch 4 More from Qloo` to expand the tray on demand.

### 6. Live Base LLM Comparison Switch
A toggle in the studio header lets you switch the backend pipeline between **Qloo Taste Graph** and **Vanilla Base LLM**. You can run the exact same character brief through both engines side-by-side to see the difference between empirical cultural data and generic model consensus.

### 7. Assembled Character Lookbook
Compile your accepted canon into a formatted reference lookbook. Ready to copy into a writer's room document, export to Markdown, or print.

---

## Tech Stack

- **Frontend & App Framework:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Cultural Intelligence:** Qloo REST API (`/search`, `/v2/insights`, Typed URN filtering)
- **Agentic Synthesis:** Google Gemini (`@google/genai`)
- **Icons & Animation:** Lucide React, Framer Motion

---

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- A valid **Qloo API Key**
- A valid **Google Gemini API Key**

### 1. Clone the Repository

```bash
git clone https://github.com/chief-07/poppies.git
cd poppies
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
QLOO_API_KEY="your_qloo_api_key_here"
QLOO_API_URL="https://hackathon.api.qloo.com"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm run start
```
