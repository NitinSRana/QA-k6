export type TestCategory =
  | "functional"
  | "nonFunctional"
  | "automation"
  | "performance";

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  category: TestCategory;
  k6Ready: boolean;
  rawInput: string;
}

export interface CategorizedTestCases {
  functional: TestCase[];
  nonFunctional: TestCase[];
  automation: TestCase[];
  performance: TestCase[];
}

export interface ExportPayload {
  metadata: {
    generatedAt: string;
    totalCount: number;
    source: "upload" | "paste";
    categoryCounts: Record<TestCategory, number>;
  };
  testCases: CategorizedTestCases;
}
