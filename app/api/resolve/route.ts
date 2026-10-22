import { NextRequest, NextResponse } from "next/server";
import { runAgenticResearchCycle } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A character prompt is required." }, { status: 400 });
    }

    // Run the full agentic research cycle:
    // Plan -> Resolve Seeds -> First-Order Insights -> Adaptive Autonomous Branching -> Narrative Synthesis
    const dossier = await runAgenticResearchCycle(prompt);

    return NextResponse.json({
      success: true,
      character: {
        name: dossier.characterName,
        summary: dossier.summary,
        anchors: dossier.explicitAnchors,
      },
      inquiries: dossier.inquiries,
      agentDecisions: dossier.agentDecisions,
    });
  } catch (error: any) {
    console.error("API /api/resolve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute agentic research cycle" },
      { status: 500 }
    );
  }
}
