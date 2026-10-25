import fs from "fs";

function analyze() {
  if (!fs.existsSync("scripts/benchmark_results.json")) {
    console.log("No benchmark_results.json found yet.");
    return;
  }

  const data = JSON.parse(fs.readFileSync("scripts/benchmark_results.json", "utf8"));
  console.log("\n=======================================================");
  console.log("BENCHMARK ANALYSIS REPORT (ZERO-BIAS FACTUAL TRACE)");
  console.log("=======================================================\n");

  for (const [key, scenario] of Object.entries(data.scenarios)) {
    console.log(`-------------------------------------------------------`);
    console.log(`SCENARIO: ${scenario.label}`);
    console.log(`-------------------------------------------------------`);

    // Analyze Base LLM
    console.log(`\n[BASE LLM (VANILLA GEMINI FLASH LITE - 3 RUNS)]`);
    const baseTools = new Set();
    const baseMusic = new Set();
    const baseBooks = new Set();
    const basePlaces = new Set();

    scenario.base_llm.forEach((r, idx) => {
      const out = r.output || {};
      const t = (out.tools || []).map(x => x.name).join(", ");
      const m = (out.music || []).map(x => x.name).join(", ");
      const b = (out.books || []).map(x => x.name).join(", ");
      const p = (out.places || []).map(x => x.name).join(", ");
      (out.tools || []).forEach(x => baseTools.add(x.name));
      (out.music || []).forEach(x => baseMusic.add(x.name));
      (out.books || []).forEach(x => baseBooks.add(x.name));
      (out.places || []).forEach(x => basePlaces.add(x.name));

      console.log(`  Run ${idx + 1}:`);
      console.log(`    Tools:  ${t}`);
      console.log(`    Music:  ${m}`);
      console.log(`    Books:  ${b}`);
      console.log(`    Places: ${p}`);
      console.log(`    Scene:  "${out.vignette?.slice(0, 100)}..."`);
    });

    // Analyze Poppies
    console.log(`\n[POPPIES (QLOO TASTE GRAPH + CURATOR - 3 RUNS)]`);
    const poppiesTools = new Set();
    const poppiesMusic = new Set();
    const poppiesBooks = new Set();
    const poppiesPlaces = new Set();

    scenario.poppies.forEach((r, idx) => {
      const out = r.output || {};
      const seeds = (out.seeds || []).map(s => s.name).join(", ");
      console.log(`  Run ${idx + 1} (Seeds: ${seeds}):`);
      for (const inq of out.inquiries || []) {
        const entList = (inq.entities || []).map(e => `${e.name} (${e.affinityScore}%)`).join(", ");
        console.log(`    [${inq.domain}] "${inq.question}": ${entList}`);
        if (inq.domain === "OBJECTS") (inq.entities || []).forEach(e => poppiesTools.add(e.name));
        if (inq.domain === "MUSIC") (inq.entities || []).forEach(e => poppiesMusic.add(e.name));
        if (inq.domain === "BOOKS") (inq.entities || []).forEach(e => poppiesBooks.add(e.name));
        if (inq.domain === "PLACES") (inq.entities || []).forEach(e => poppiesPlaces.add(e.name));
      }
      const thesis = out.culturalDossier?.tasteThesis || "";
      console.log(`    Dossier Thesis: "${thesis.slice(0, 110)}..."`);
      if (out.inquiries?.[0]?.vignette) {
        console.log(`    Scene Vignette: "${out.inquiries[0].vignette.slice(0, 100)}..."`);
      }
    });

    console.log("\n");
  }

  // Cross-scenario divergence test between Tsukuru and Kenji
  console.log(`=======================================================`);
  console.log(`CHARACTER DIVERGENCE TEST: TSUKURU vs KENJI`);
  console.log(`(Do two Japanese architects get the same or distinct culture?)`);
  console.log(`=======================================================`);

  const tsukuruBase = new Set();
  const kenjiBase = new Set();
  const tsukuruPoppies = new Set();
  const kenjiPoppies = new Set();

  data.scenarios.tsukuru_standard?.base_llm.forEach(r => {
    const o = r.output || {};
    [...(o.tools||[]), ...(o.music||[]), ...(o.books||[]), ...(o.places||[])].forEach(x => tsukuruBase.add(x.name?.toLowerCase()));
  });
  data.scenarios.kenji_osaka?.base_llm.forEach(r => {
    const o = r.output || {};
    [...(o.tools||[]), ...(o.music||[]), ...(o.books||[]), ...(o.places||[])].forEach(x => kenjiBase.add(x.name?.toLowerCase()));
  });

  data.scenarios.tsukuru_standard?.poppies.forEach(r => {
    const o = r.output || {};
    (o.inquiries||[]).forEach(inq => {
      (inq.entities||[]).forEach(e => tsukuruPoppies.add(e.name?.toLowerCase()));
    });
  });
  data.scenarios.kenji_osaka?.poppies.forEach(r => {
    const o = r.output || {};
    (o.inquiries||[]).forEach(inq => {
      (inq.entities||[]).forEach(e => kenjiPoppies.add(e.name?.toLowerCase()));
    });
  });

  const baseOverlap = [...tsukuruBase].filter(x => kenjiBase.has(x));
  const poppiesOverlap = [...tsukuruPoppies].filter(x => kenjiPoppies.has(x));

  console.log(`\nBase LLM Tsukuru unique entities count: ${tsukuruBase.size}`);
  console.log(`Base LLM Kenji unique entities count: ${kenjiBase.size}`);
  console.log(`Base LLM Overlapping entities: [${baseOverlap.join(", ") || "None"}]`);

  console.log(`\nPoppies Tsukuru unique entities count: ${tsukuruPoppies.size}`);
  console.log(`Poppies Kenji unique entities count: ${kenjiPoppies.size}`);
  console.log(`Poppies Overlapping entities: [${poppiesOverlap.join(", ") || "None"}]`);
}

analyze();
