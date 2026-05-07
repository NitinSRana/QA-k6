import { TestCase, CategorizedTestCases, ExportPayload, TestCategory } from "@/types";

// Helpers that mirror the logic in ExportPanel and the /api/drive route
function buildCategorized(testCases: TestCase[]): CategorizedTestCases {
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

function buildPayload(
  testCases: TestCase[],
  source: "upload" | "paste"
): ExportPayload {
  const categorized = buildCategorized(testCases);
  const categories: TestCategory[] = [
    "functional",
    "nonFunctional",
    "automation",
    "performance",
  ];
  const totalCount = categories.reduce(
    (sum, cat) => sum + categorized[cat].length,
    0
  );
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCount,
      source,
      categoryCounts: {
        functional: categorized.functional.length,
        nonFunctional: categorized.nonFunctional.length,
        automation: categorized.automation.length,
        performance: categorized.performance.length,
      },
    },
    testCases: categorized,
  };
}

const sampleCases: TestCase[] = [
  {
    id: "TC-001",
    title: "Login",
    description: "User login flow",
    steps: ["Open /login", "Submit"],
    expectedResult: "Dashboard",
    category: "functional",
    k6Ready: false,
    rawInput: "",
  },
  {
    id: "TC-002",
    title: "Load test",
    description: "100 VUs on /api",
    steps: ["Run k6 script"],
    expectedResult: "P95 < 300ms",
    category: "performance",
    k6Ready: true,
    rawInput: "",
  },
  {
    id: "TC-003",
    title: "SQL injection",
    description: "Input sanitisation",
    steps: ["Submit ' OR 1=1"],
    expectedResult: "Error / no data leak",
    category: "nonFunctional",
    k6Ready: false,
    rawInput: "",
  },
  {
    id: "TC-004",
    title: "Create user API",
    description: "POST /users",
    steps: ["POST /users payload"],
    expectedResult: "201 Created",
    category: "automation",
    k6Ready: false,
    rawInput: "",
  },
];

describe("buildCategorized", () => {
  it("groups test cases by category", () => {
    const result = buildCategorized(sampleCases);
    expect(result.functional).toHaveLength(1);
    expect(result.performance).toHaveLength(1);
    expect(result.nonFunctional).toHaveLength(1);
    expect(result.automation).toHaveLength(1);
  });

  it("places the correct test case in each bucket", () => {
    const result = buildCategorized(sampleCases);
    expect(result.functional[0].id).toBe("TC-001");
    expect(result.performance[0].id).toBe("TC-002");
  });

  it("returns empty arrays for categories with no cases", () => {
    const only: TestCase[] = [{ ...sampleCases[0] }];
    const result = buildCategorized(only);
    expect(result.nonFunctional).toHaveLength(0);
    expect(result.automation).toHaveLength(0);
    expect(result.performance).toHaveLength(0);
  });
});

describe("buildPayload", () => {
  it("metadata.totalCount equals number of test cases", () => {
    const payload = buildPayload(sampleCases, "upload");
    expect(payload.metadata.totalCount).toBe(4);
  });

  it("metadata.source reflects the input source", () => {
    expect(buildPayload(sampleCases, "paste").metadata.source).toBe("paste");
    expect(buildPayload(sampleCases, "upload").metadata.source).toBe("upload");
  });

  it("categoryCounts sums to totalCount", () => {
    const payload = buildPayload(sampleCases, "paste");
    const sum = Object.values(payload.metadata.categoryCounts).reduce(
      (a, b) => a + b,
      0
    );
    expect(sum).toBe(payload.metadata.totalCount);
  });

  it("generatedAt is a valid ISO timestamp", () => {
    const payload = buildPayload(sampleCases, "paste");
    expect(() => new Date(payload.metadata.generatedAt).toISOString()).not.toThrow();
  });

  it("testCases object contains categorised arrays", () => {
    const payload = buildPayload(sampleCases, "upload");
    expect(payload.testCases.functional[0].title).toBe("Login");
    expect(payload.testCases.performance[0].k6Ready).toBe(true);
  });

  it("k6Ready test cases appear in performance bucket", () => {
    const payload = buildPayload(sampleCases, "paste");
    const k6Cases = payload.testCases.performance.filter((tc) => tc.k6Ready);
    expect(k6Cases.length).toBeGreaterThan(0);
  });

  it("serialises to valid JSON without throwing", () => {
    const payload = buildPayload(sampleCases, "upload");
    expect(() => JSON.stringify(payload, null, 2)).not.toThrow();
  });

  it("handles empty test cases array", () => {
    const payload = buildPayload([], "paste");
    expect(payload.metadata.totalCount).toBe(0);
    expect(Object.values(payload.metadata.categoryCounts).every((v) => v === 0)).toBe(true);
  });
});

describe("manual category override", () => {
  it("re-categorising a test case moves it to the new bucket", () => {
    const cases = sampleCases.map((tc) =>
      tc.id === "TC-001" ? { ...tc, category: "automation" as TestCategory } : tc
    );
    const result = buildCategorized(cases);
    expect(result.functional).toHaveLength(0);
    expect(result.automation).toHaveLength(2);
  });
});
