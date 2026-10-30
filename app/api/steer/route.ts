import { NextRequest, NextResponse } from "next/server";
import { steerAgenticResearch } from "@/lib/agent";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const {
      characterName,
      instruction,
      livingSeeds,
      existingSeeds,
      characterSummary,
      constraints,
      mode,
      inquiryId,
      currentQuestion,
      currentVignette,
      domain,
      tasteThesis,
      engine,
    } = await req.json();

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "Steering instruction is required." }, { status: 400 });
    }

    const seedsToUse = livingSeeds && livingSeeds.length > 0 ? livingSeeds : existingSeeds || [];

    const result = await steerAgenticResearch(
      characterName || "Character",
      instruction,
      seedsToUse,
      {
        locality: constraints?.locality,
        era: constraints?.era,
        occupation: constraints?.occupation,
        summary: characterSummary,
      },
      {
        mode: mode || "new_inquiry",
        inquiryId,
        currentQuestion,
        currentVignette,
        domain,
        tasteThesis,
        engine,
      }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("API /api/steer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to steer agentic research" },
      { status: 500 }
    );
  }
}
