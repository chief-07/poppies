import { NextRequest, NextResponse } from "next/server";
import { steerAgenticResearch } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { characterName, instruction, existingSeeds } = await req.json();

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "Steering instruction is required." }, { status: 400 });
    }

    const updatedInquiry = await steerAgenticResearch(
      characterName || "Shoujo A",
      instruction,
      existingSeeds || []
    );

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
    });
  } catch (error: any) {
    console.error("API /api/steer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to steer agentic research" },
      { status: 500 }
    );
  }
}
