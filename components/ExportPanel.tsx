"use client";

import { useState } from "react";
import { CategorizedTestCases, TestCase, TestCategory } from "@/types";

interface Props {
  testCases: TestCase[];
  source: "upload" | "paste";
  isSignedIn: boolean;
  onSignIn: () => void;
}

export default function ExportPanel({
  testCases,
  source,
  isSignedIn,
  onSignIn,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [driveLink, setDriveLink] = useState("");
  const [error, setError] = useState("");

  function buildCategorized(): CategorizedTestCases {
    const categories: TestCategory[] = [
      "functional",
      "nonFunctional",
      "automation",
      "performance",
    ];
    const out = { functional: [], nonFunctional: [], automation: [], performance: [] } as CategorizedTestCases;
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
        categoryCounts: Object.fromEntries(
          (Object.keys(categorized) as TestCategory[]).map((k) => [
            k,
            categorized[k].length,
          ])
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Export</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={downloadJson}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download JSON
        </button>

        {isSignedIn ? (
          <button
            onClick={saveToDrive}
            disabled={status === "saving"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.28 3L1 12.25 6.72 22h10.56L23 12.25 17.72 3zm5.22 15.5L7 10.5h10l-4.5 8zM7.75 9l2.5-4.5h3.5L16.25 9z" />
            </svg>
            {status === "saving" ? "Saving…" : "Save to Google Drive"}
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google to save to Drive
          </button>
        )}
      </div>

      {status === "success" && (
        <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-700">
          Saved to Drive!{" "}
          {driveLink && (
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Open file
            </a>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
