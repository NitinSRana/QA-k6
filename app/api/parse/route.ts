import { NextRequest, NextResponse } from "next/server";
import { parseTextInput, parseExcelBuffer } from "@/lib/parseTestCases";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = parseExcelBuffer(buffer);

      return NextResponse.json({ testCases: parsed, source: "upload" });
    }

    // Plain text / JSON body
    const body = await req.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const parsed = parseTextInput(body.text);
    return NextResponse.json({ testCases: parsed, source: "paste" });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json({ error: "Failed to parse input" }, { status: 500 });
  }
}
