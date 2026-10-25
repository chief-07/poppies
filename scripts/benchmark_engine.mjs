import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const PROMPTS = {
  tsukuru_standard: {
    label: "Scenario 1: Standard Tsukuru",
    prompt: "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and spends his Sunday afternoons sitting on station benches observing passenger flow. He is haunted by an abrupt estrangement from his four closest childhood friends. What are his quiet habits, his secret bookshelf, and where does he walk at night?"
  },
  tsukuru_weird: {
    label: "Scenario 2: Weird Anchor Tsukuru (Pachinko & Harsh Noise)",
    prompt: "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and is haunted by an abrupt estrangement from his childhood friends. But at night, he has an obsessive secret ritual: he restores battered 1970s Japanese Pachinko and arcade cabinets with soldering iron and chrome polish, and listens to aggressive Japanese harsh noise and industrial electronics. What are his midnight tools, his secret bookshelf, and where does he disappear?"
  },
  kenji_osaka: {
    label: "Scenario 3: Kenji (Osaka DIY Club & Skate Architect)",
    prompt: "Kenji, 35, an architect in Osaka who designs underground DIY sound-system clubs, temporary bamboo skate pavilions, and community bathhouse conversions. He rides a rusted two-stroke Yamaha moped, drinks cheap canned Highballs, and has grease under his nails. What are his worktable tools, his secret bookshelf, his late-night soundscape, and where does he hang out?"
  }
};

async function runBaseLLM(promptText) {
  const systemPrompt = `You are an AI character designer.
Character brief: "${promptText}"

Generate the character's cultural profile:
1. Tools & Everyday Objects (list 3-4 specific real-world brands/products)
2. Music & Soundscape (list 3-4 specific real-world artists/composers)
3. Secret Bookshelf (list 2-3 specific real-world books/essays)
4. Places & Haunts (list 2-3 specific real-world places/neighborhoods)
5. A 2-sentence scene vignette.

Respond ONLY in valid JSON:
{
  "tools": [ { "name": string, "reason": string } ],
  "music": [ { "name": string, "reason": string } ],
  "books": [ { "name": string, "reason": string } ],
  "places": [ { "name": string, "reason": string } ],
  "vignette": string
}`;

  const res = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: systemPrompt,
    config: { responseMimeType: "application/json", temperature: 0.7 }
  });

  return JSON.parse(res.text || "{}");
}

async function runPoppies(promptText) {
  const res = await fetch("http://localhost:3000/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptText }),
  });

  if (!res.ok) {
    throw new Error(`Poppies API returned HTTP ${res.status}`);
  }

  return await res.json();
}

async function main() {
  console.log("=======================================================");
  console.log("STARTING ZERO-BIAS BENCHMARK ENGINE");
  console.log("Comparing Base LLM (Vanilla) vs Poppies (Qloo Engine)");
  console.log("=======================================================\n");

  const results = {
    meta: { timestamp: new Date().toISOString() },
    scenarios: {}
  };

  for (const [key, scenario] of Object.entries(PROMPTS)) {
    console.log(`\n>>> EXECUTING: ${scenario.label} <<<`);
    results.scenarios[key] = {
      label: scenario.label,
      prompt: scenario.prompt,
      base_llm: [],
      poppies: []
    };

    // Run Base LLM 3 times
    console.log("  Running Base LLM (3 iterations)...");
    for (let i = 0; i < 3; i++) {
      process.stdout.write(`    Base LLM run ${i + 1}/3... `);
      try {
        const start = Date.now();
        const output = await runBaseLLM(scenario.prompt);
        const duration = Date.now() - start;
        results.scenarios[key].base_llm.push({ iteration: i + 1, durationMs: duration, output });
        console.log(`done (${duration}ms).`);
      } catch (err) {
        console.log(`error: ${err.message}`);
        results.scenarios[key].base_llm.push({ iteration: i + 1, error: err.message });
      }
    }

    // Run Poppies 3 times
    console.log("  Running Poppies Engine (3 iterations)...");
    for (let j = 0; j < 3; j++) {
      process.stdout.write(`    Poppies run ${j + 1}/3... `);
      try {
        const start = Date.now();
        const output = await runPoppies(scenario.prompt);
        const duration = Date.now() - start;
        results.scenarios[key].poppies.push({ iteration: j + 1, durationMs: duration, output });
        console.log(`done (${duration}ms).`);
      } catch (err) {
        console.log(`error: ${err.message}`);
        results.scenarios[key].poppies.push({ iteration: j + 1, error: err.message });
      }
    }
  }

  // Save raw results to file
  fs.writeFileSync("scripts/benchmark_results.json", JSON.stringify(results, null, 2), "utf8");
  console.log("\n=======================================================");
  console.log("RAW RESULTS SAVED TO scripts/benchmark_results.json");
  console.log("=======================================================");
}

main().catch(console.error);
