import { NextRequest, NextResponse } from "next/server";
import { runAgenticResearchCycle, runBaseLLMResearchCycle } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { prompt, engine = "qloo" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A character prompt is required." }, { status: 400 });
    }

    // Run either the grounded Qloo agentic research cycle or the ungrounded Vanilla Base LLM cycle
    const dossier =
      engine === "base_llm"
        ? await runBaseLLMResearchCycle(prompt)
        : await runAgenticResearchCycle(prompt);

    return NextResponse.json({
      success: true,
      engine,
      userPrompt: prompt,
      character: {
        name: dossier.characterName,
        summary: dossier.summary,
        anchors: dossier.explicitAnchors,
        constraints: dossier.constraints,
      },
      seeds: dossier.resolvedSeeds,
      culturalDossier: dossier.culturalDossier,
      inquiries: dossier.inquiries,
      agentDecisions: dossier.agentDecisions,
    });
  } catch (error: any) {
    console.error("API /api/resolve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute character resolution" },
      { status: 500 }
    );
  }
}
