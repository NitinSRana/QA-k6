import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveJsonToDrive } from "@/lib/googleDrive";
import { CategorizedTestCases, ExportPayload, TestCategory } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated — please sign in with Google" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { categorized, source } = body as {
      categorized: CategorizedTestCases;
      source: "upload" | "paste";
    };

    if (!categorized) {
      return NextResponse.json(
        { error: "No categorized test cases provided" },
        { status: 400 }
      );
    }

    const categories: TestCategory[] = [
      "functional",
      "nonFunctional",
      "automation",
      "performance",
    ];

    const totalCount = categories.reduce(
      (sum, cat) => sum + (categorized[cat]?.length ?? 0),
      0
    );

    const payload: ExportPayload = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalCount,
        source: source ?? "paste",
        categoryCounts: {
          functional: categorized.functional?.length ?? 0,
          nonFunctional: categorized.nonFunctional?.length ?? 0,
          automation: categorized.automation?.length ?? 0,
          performance: categorized.performance?.length ?? 0,
        },
      },
      testCases: categorized,
    };

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `test-cases-${timestamp}.json`;

    const result = await saveJsonToDrive(session.accessToken, payload, fileName);

    return NextResponse.json({
      success: true,
      fileName,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });
  } catch (err) {
    console.error("Drive export error:", err);
    return NextResponse.json(
      { error: "Failed to save to Google Drive" },
      { status: 500 }
    );
  }
}
