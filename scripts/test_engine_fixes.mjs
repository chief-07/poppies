import fetch from "node-fetch";

async function testFixes() {
  console.log("Testing Base LLM Engine mode...");
  const baseRes = await fetch("http://localhost:3000/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Kenji, 35, Osaka underground skate architect who rides a rusted moped and has grease on his hands.",
      engine: "base_llm"
    })
  });

  const baseData = await baseRes.json();
  console.log("Base LLM Response status:", baseRes.status);
  console.log("Base LLM Engine:", baseData.engine);
  console.log("Base LLM Inquiries:", (baseData.inquiries || []).map(i => i.question));
  console.log("Base LLM Vignette sample:", baseData.inquiries?.[0]?.vignette);

  console.log("\nTesting Qloo Grounded Engine mode with Kenji (Gritty subculture & Osaka constraints)...");
  const qlooRes = await fetch("http://localhost:3000/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Kenji, 35, Osaka underground skate architect who rides a rusted moped and has grease on his hands. What are his worktable tools and where does he hang out?",
      engine: "qloo"
    })
  });

  const qlooData = await qlooRes.json();
  console.log("Qloo Response status:", qlooRes.status);
  console.log("Qloo Character constraints:", qlooData.character?.constraints);
  console.log("Qloo Seeds:", (qlooData.seeds || []).map(s => s.name));
  for (const inq of qlooData.inquiries || []) {
    console.log(`[${inq.domain}] "${inq.question}": ${(inq.entities || []).map(e => e.name).join(", ")}`);
    console.log(`  Vignette: "${inq.vignette}"`);
  }

  // Check that no "Elena" or "At the end of a long day" exists
  const allVignettes = (qlooData.inquiries || []).map(i => i.vignette).join(" ");
  if (allVignettes.includes("Elena")) {
    console.error("FAIL: Found hardcoded 'Elena' in vignettes!");
    process.exit(1);
  }
  if (allVignettes.includes("At the end of a long day")) {
    console.error("FAIL: Found canned fallback in vignettes!");
    process.exit(1);
  }

  console.log("\nALL VERIFICATIONS PASSED!");
}

testFixes().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
