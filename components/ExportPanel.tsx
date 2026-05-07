"use client";

import { useState } from "react";
import { CategorizedTestCases, TestCase, TestCategory } from "@/types";

interface Props {
  testCases: TestCase[];
  source: "upload" | "paste";
  isConnected: boolean;
}

export default function ExportPanel({ testCases, source, isConnected }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [driveLink, setDriveLink] = useState("");
  const [error, setError] = useState("");

  function buildCategorized(): CategorizedTestCases {
    const out: CategorizedTestCases = {
      functional: [],
      nonFunctional: [],
      automation: [],
      performance: [],
    };
    for (const tc of testCases) {
      (out[tc.category] as TestCase[]).push(tc);
    }
    return out;
  }

  function downloadJson() {
    const categorized = buildCategorized();
    const payload = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalCount: testCases.length,
        source,
        categoryCounts: (Object.keys(categorized) as TestCategory[]).reduce(
          (acc, k) => ({ ...acc, [k]: categorized[k].length }),
          {} as Record<TestCategory, number>
        ),
      },
      testCases: categorized,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-cases-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveToDrive() {
    setStatus("saving");
    setError("");
    try {
      const categorized = buildCategorized();
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorized, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDriveLink(data.webViewLink);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save to Drive");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">3. Export</h2>
      <p className="text-sm text-gray-500 mb-5">
        Download the classified JSON or save it directly to your connected Drive.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Always available: local download */}
        <button
          onClick={downloadJson}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download JSON
        </button>

        {/* Drive save — enabled only when connected */}
        <div className="flex-1 relative">
          <button
            onClick={saveToDrive}
            disabled={!isConnected || status === "saving"}
            title={!isConnected ? "Connect Google Drive above to enable this" : undefined}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.28 3L1 12.25 6.72 22h10.56L23 12.25 17.72 3zm5.22 15.5L7 10.5h10l-4.5 8zM7.75 9l2.5-4.5h3.5L16.25 9z" />
            </svg>
            {status === "saving" ? "Saving to Drive…" : "Save to Google Drive"}
          </button>

          {/* Hint below button when not connected */}
          {!isConnected && (
            <p className="text-center text-xs text-gray-400 mt-1.5">
              Connect Drive above to enable
            </p>
          )}
        </div>
      </div>

      {status === "success" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            Saved to Drive!{" "}
            {driveLink && (
              <a
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Open file →
              </a>
            )}
          </span>
        </div>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
