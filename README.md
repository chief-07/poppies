# Poppies

**A culturally grounded character and world-building agent powered by Qloo.**

Poppies helps creators, writers, and brand designers build characters, personas, and worlds that feel authentic, specific, and lived-in—using real-world cultural taste data rather than internet clichés.

---

## The Problem

Whether writing a screenplay, designing a game world, dressing a film set, or crafting a brand persona or mascot: believable details make or break the illusion. The books on a nightstand, the tools on a workbench, the music playing in a kitchen at 2 AM, the neighborhood diner someone actually visits—these specific choices signal who someone is.

When these choices are generic, characters feel flat and fail to connect with an audience. Creators either guess, lean on surface-level tropes, or spend weeks researching subcultures they haven't personally lived in.

Standard AI models make the problem worse. Ask ChatGPT, Claude, or Gemini to flesh out a character, and you get the statistical middle of internet clichés.

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

## The Grounding Difference

Instead of guessing what sounds plausible based on internet word associations, Poppies taps into how human taste and preferences actually cluster in the real world:
- A person drawn to minimalist Japanese ambient music (*Roberto Musci*, *Meitei*) doesn't necessarily buy commercial designer stationery; they might carry an *Opinel No. 8 carbon knife* or read Gaston Bachelard's *The Poetics of Space*.
- A stone conservator in Marseille doesn't frequent tourist bistros along the Old Port; their habits cluster around working-class harbor haunts and rugged, repair-focused gear (*Knipex*, *Danner*).

By querying real cross-domain affinities (music, literature, fashion, objects, dining, and places), the agent discovers authentic cultural anchors that no language model could deduce from text statistics alone.

---

## Who It's For

- **Screenwriters & Narrative Designers:** Build character bibles and dialogue texture that feel earned and grounded rather than googled.
- **Production Designers & Art Departments:** Select wardrobe, set dressing, everyday gear, and props that reflect true socioeconomic and regional reality.
- **Brand Strategists & Creative Directors:** Develop brand personas, brand mascots, and campaign archetypes with real subcultural resonance that genuinely connect with audiences instead of feeling manufactured.
- **Novelists & Storytellers:** Ground unfamiliar subcultures, trades, and environments with confidence, avoiding shallow caricatures.

---

## How Poppies Works

Poppies is a **collaborative creative agent**, not a generic chatbot or a raw list generator. It acts as an artistic partner—proposing grounded directions while leaving the creator firmly in the director's chair. Every component is designed to keep human direction and cultural data in sync:

### 1. The Character Canvas & Inquiry Lenses
Start with a short brief—a character's profession, a setting, a brand premise, or an emotional idea. As you type, dynamic inquiry lenses suggest specific angles to explore (their workspace, night routines, literary influences, or unexpected habits).

### 2. Dual Inquiries (`[You]` vs `[Agent]`)
Investigations are organized into two clear tracks:
- **`[You]` (Creator-Directed):** Inquiries directly answering questions from your prompt (e.g., *What drafting tools rest on his desk?*).
- **`[Agent]` (Autonomous Discoveries):** Questions opened independently by the agent when it uncovers an unexpected or interesting affinity in the taste graph.

### 3. Curated Cultural Trays
Rather than overwhelming you with raw data feeds, the agent curates 3–4 grounded recommendations per inquiry. Each item is accompanied by a concise rationale explaining why it fits this character's background, era, and environment.

### 4. Inspectable Evidence
Click any cultural entity in the text to open the **Qloo Evidence Drawer**. You can view canonical Qloo entity IDs, source seeds, URN types, and latent affinity scores to verify where the recommendation came from.

### 5. Director's Curation
You retain final say over every detail. Recommendations start as proposals that you can accept into canon or discard. Need more options? Click `+ Fetch 4 More from Qloo` to expand the tray on demand.

### 6. Live Base LLM Comparison Switch
A toggle in the header lets you switch the backend pipeline between **Qloo Taste Graph** and **Vanilla Base LLM**. You can run the exact same character brief through both engines side-by-side to see the difference between empirical cultural data and generic model consensus.

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

---

## License

This project is licensed under the [MIT License](LICENSE).

