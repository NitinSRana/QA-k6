"use client";

import { useState, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import InputPanel from "@/components/InputPanel";
import ClassificationPanel from "@/components/ClassificationPanel";
import ExportPanel from "@/components/ExportPanel";
import { TestCase, TestCategory } from "@/types";
import { RawTestCase } from "@/lib/parseTestCases";

type Step = "input" | "classifying" | "review";

export default function Home() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [source, setSource] = useState<"upload" | "paste">("paste");
  const [classifyError, setClassifyError] = useState("");

  const handleParsed = useCallback(
    async (raw: RawTestCase[], src: "upload" | "paste") => {
      setSource(src);
      setClassifyError("");
      setStep("classifying");
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testCases: raw }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setTestCases(data.all);
        setStep("review");
      } catch (e: unknown) {
        setClassifyError(
          e instanceof Error ? e.message : "Classification failed"
        );
        setStep("input");
      }
    },
    []
  );

  const handleCategoryChange = useCallback(
    (id: string, category: TestCategory) => {
      setTestCases((prev) =>
        prev.map((tc) => (tc.id === id ? { ...tc, category } : tc))
      );
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">QA Test Case Hub</h1>
              <p className="text-xs text-gray-500">Classify &amp; export for k6</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <span className="text-xs text-gray-600 hidden sm:block">
                  {session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="text-xs text-indigo-600 font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {(["input", "review"] as const).map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300">›</span>}
              <span
                className={`px-2 py-0.5 rounded-full ${
                  step === s || (step === "classifying" && s === "input")
                    ? "bg-indigo-100 text-indigo-700 font-medium"
                    : testCases.length > 0 && s === "input"
                    ? "text-gray-400 line-through"
                    : "text-gray-400"
                }`}
              >
                {s === "input" ? "1. Add Test Cases" : "2. Review & Export"}
              </span>
            </span>
          ))}
        </div>

        {/* Classifying overlay card */}
        {step === "classifying" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="font-medium text-gray-800">Classifying with Claude…</p>
              <p className="text-sm text-gray-500 mt-1">
                Analysing and categorising your test cases
              </p>
            </div>
          </div>
        )}

        {/* Input step */}
        {step === "input" && (
          <>
            {classifyError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {classifyError}
              </div>
            )}
            <InputPanel
              onParsed={handleParsed}
              loading={loading}
              setLoading={setLoading}
            />
          </>
        )}

        {/* Review + export step */}
        {step === "review" && testCases.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep("input"); setTestCases([]); }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                ← Start over
              </button>
              <span className="text-xs text-gray-500">
                {testCases.length} test case{testCases.length !== 1 ? "s" : ""} classified
              </span>
            </div>

            <ClassificationPanel
              testCases={testCases}
              onCategoryChange={handleCategoryChange}
            />

            <ExportPanel
              testCases={testCases}
              source={source}
              isSignedIn={!!session}
              onSignIn={() => signIn("google")}
            />
          </>
        )}
      </main>
    </div>
  );
}
