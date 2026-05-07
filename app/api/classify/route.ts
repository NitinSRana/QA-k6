import { NextRequest, NextResponse } from "next/server";
import { classifyTestCases } from "@/lib/classifyWithClaude";
import { CategorizedTestCases, TestCase } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testCases } = body;

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: "No test cases provided" },
        { status: 400 }
      );
    }

    const classified = await classifyTestCases(testCases);

    const categorized: CategorizedTestCases = {
      functional: [],
      nonFunctional: [],
      automation: [],
      performance: [],
    };

    for (const tc of classified) {
      (categorized[tc.category] as TestCase[]).push(tc);
    }

    return NextResponse.json({ categorized, all: classified });
  } catch (err) {
    console.error("Classify error:", err);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
