"use client";

import { useRef, useState } from "react";
import { RawTestCase } from "@/lib/parseTestCases";

interface Props {
  onParsed: (testCases: RawTestCase[], source: "upload" | "paste") => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export default function InputPanel({ onParsed, loading, setLoading }: Props) {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePaste() {
    if (!text.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onParsed(data.testCases, "paste");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to parse input");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onParsed(data.testCases, "upload");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        1. Add Test Cases
      </h2>

      <div className="flex gap-2 mb-4">
        {(["paste", "upload"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "paste" ? "Paste Text" : "Upload Excel / CSV"}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={`Separate test cases with a blank line, e.g.\n\nUser Login\nNavigate to /login\nEnter credentials\nExpected: Dashboard loads\n\nSearch Products\nType "shoes" in search bar\nExpected: Results appear`}
            className="w-full rounded-xl border border-gray-300 p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handlePaste}
            disabled={loading || !text.trim()}
            className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Parse Test Cases
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <svg
            className="w-10 h-10 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            Click to upload <span className="font-medium text-gray-700">.xlsx, .xls, or .csv</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Columns: Title, Description, Steps, Expected Result
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
