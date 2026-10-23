async function runTest(label, prompt) {
  console.log(`\n=======================================================`);
  console.log(`RUNNING VERIFICATION FOR: ${label}`);
  console.log(`=======================================================`);

  const startTime = Date.now();
  const res = await fetch("http://localhost:3000/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    console.error(`HTTP error: ${res.status}`);
    return;
  }

  const data = await res.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Completed in ${duration}s. Character: "${data.character.name}"`);
  console.log(`Summary: "${data.character.summary}"`);
  console.log(`Seeds: ${data.seeds?.map(s => s.name).join(", ")}`);
  console.log(`\n--- INQUIRIES & CURATED ENTITIES ---`);
  for (const inq of data.inquiries || []) {
    console.log(`\n[${inq.source.toUpperCase()}] "${inq.question}" (${inq.domain})`);
    console.log(`Vignette: "${inq.vignette}"`);
    console.log(`Curated Entities (${inq.entities?.length}):`);
    for (const e of inq.entities || []) {
      console.log(`  * ${e.name} (${e.affinityScore}%) -> ${e.description}`);
    }
  }

  console.log(`\n--- CULTURAL DOSSIER ---`);
  console.log(`Thesis: "${data.culturalDossier?.tasteThesis}"`);
  console.log(`Clusters: [${data.culturalDossier?.observedClusters?.join("; ")}]`);
  if (data.culturalDossier?.unconsideredAngles?.[0]) {
    const ua = data.culturalDossier.unconsideredAngles[0];
    console.log(`Angle: "${ua.title}" -> ${ua.description} (${ua.groundedEntity})`);
  }
}

async function main() {
  await runTest(
    "ELENA (Marseille Conservator)",
    "Elena, 34, an architectural conservator in Marseille restoring 18th-century stone facades and overlooked woodwork. She lives in a drafty apartment near the old port, drinks bitter chicory tea, and refuses to sell her battered 1988 Peugeot 205. I want to understand her worktable tools, her 2 AM solitary soundscape, and where she disappears on Sunday afternoons."
  );

  await runTest(
    "TSUKURU (Nagoya Train Station Architect)",
    "Tsukuru, 36, an architect in Nagoya who designs train stations. He lives alone in an uncluttered apartment, drinks black pour-over coffee from simple Hasami porcelain, and spends his Sunday afternoons sitting on station benches observing passenger flow. He is haunted by an abrupt estrangement from his four closest childhood friends. What are his quiet habits, his secret bookshelf, and where does he walk at night?"
  );
}

main();
