import Anthropic from "@anthropic-ai/sdk";
import { TestCase, TestCategory } from "@/types";
import { RawTestCase } from "./parseTestCases";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ClaudeClassification {
  id: string;
  category: TestCategory;
  k6Ready: boolean;
  steps: string[];
  expectedResult: string;
  description: string;
}

export async function classifyTestCases(
  rawCases: RawTestCase[]
): Promise<TestCase[]> {
  const prompt = `You are a QA engineer assistant. Classify each test case below into exactly one of these categories:
- "functional": tests that verify a specific feature or user behaviour (login, CRUD, UI interactions)
- "nonFunctional": tests for quality attributes like security, usability, accessibility, compatibility
- "automation": tests that are good candidates for UI/API automation (repeatable, deterministic flows)
- "performance": tests that measure speed, load, throughput, or scalability — these are ideal for k6

Also determine:
- k6Ready (boolean): true if the test can be directly scripted in k6 (HTTP-level performance/load test)
- Restructure each test case into: title, description, steps (array of strings), expectedResult

Return a JSON array ONLY — no markdown, no explanation:
[
  {
    "id": "TC-001",
    "title": "...",
    "description": "...",
    "steps": ["step 1", "step 2"],
    "expectedResult": "...",
    "category": "functional|nonFunctional|automation|performance",
    "k6Ready": true|false
  }
]

Test cases to classify:
${rawCases
  .map(
    (tc, i) => `[TC-${String(i + 1).padStart(3, "0")}]
Title: ${tc.title}
Description: ${tc.description}
Steps: ${tc.steps}
Expected Result: ${tc.expectedResult}`
  )
  .join("\n\n")}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip any accidental markdown fences
  const jsonText = text.replace(/```(?:json)?/g, "").trim();
  const classifications: ClaudeClassification[] = JSON.parse(jsonText);

  return classifications.map((c, i) => ({
    id: c.id ?? `TC-${String(i + 1).padStart(3, "0")}`,
    title: rawCases[i]?.title ?? c.id,
    description: c.description,
    steps: c.steps,
    expectedResult: c.expectedResult,
    category: c.category,
    k6Ready: c.k6Ready,
    rawInput: rawCases[i]?.rawInput ?? "",
  }));
}
