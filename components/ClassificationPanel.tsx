"use client";

import { TestCase, TestCategory } from "@/types";

const CATEGORY_META: Record<
  TestCategory,
  { label: string; color: string; badge: string }
> = {
  functional: {
    label: "Functional",
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  nonFunctional: {
    label: "Non-Functional",
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
  },
  automation: {
    label: "Automation",
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
  },
  performance: {
    label: "Performance",
    color: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
};

interface Props {
  testCases: TestCase[];
  onCategoryChange: (id: string, category: TestCategory) => void;
}

export default function ClassificationPanel({
  testCases,
  onCategoryChange,
}: Props) {
  const categories = Object.keys(CATEGORY_META) as TestCategory[];
  const grouped = categories.reduce<Record<TestCategory, TestCase[]>>(
    (acc, cat) => {
      acc[cat] = testCases.filter((tc) => tc.category === cat);
      return acc;
    },
    { functional: [], nonFunctional: [], automation: [], performance: [] }
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        2. Review &amp; Adjust Classification
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Claude has classified your test cases below. You can change any
        category before exporting.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {categories.map((cat) => {
          const m = CATEGORY_META[cat];
          return (
            <div
              key={cat}
              className={`rounded-xl border p-3 flex items-center gap-3 ${m.color}`}
            >
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.badge}`}
              >
                {m.label}
              </span>
              <span className="text-2xl font-bold text-gray-800">
                {grouped[cat].length}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {testCases.map((tc) => {
          const m = CATEGORY_META[tc.category];
          return (
            <div
              key={tc.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-400">
                      {tc.id}
                    </span>
                    {tc.k6Ready && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        k6 ready
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {tc.title}
                  </p>
                  {tc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {tc.description}
                    </p>
                  )}
                </div>
                <select
                  value={tc.category}
                  onChange={(e) =>
                    onCategoryChange(tc.id, e.target.value as TestCategory)
                  }
                  className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${m.badge}`}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
