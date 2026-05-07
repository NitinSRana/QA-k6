import { classifyTestCases } from "@/lib/classifyWithClaude";
import { RawTestCase } from "@/lib/parseTestCases";

// Mock the Groq SDK so no real network calls are made
jest.mock("groq-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    id: "TC-001",
                    title: "User Login",
                    description: "Verify user can log in with valid credentials",
                    steps: ["Navigate to /login", "Enter credentials", "Click submit"],
                    expectedResult: "Dashboard is displayed",
                    category: "functional",
                    k6Ready: false,
                  },
                  {
                    id: "TC-002",
                    title: "Load Test Homepage",
                    description: "Measure homepage response time under load",
                    steps: ["Send 100 concurrent GET /"],
                    expectedResult: "P95 < 500ms",
                    category: "performance",
                    k6Ready: true,
                  },
                  {
                    id: "TC-003",
                    title: "XSS Prevention",
                    description: "Verify inputs are sanitised against XSS",
                    steps: ["Submit <script>alert(1)</script> in name field"],
                    expectedResult: "Script is not executed",
                    category: "nonFunctional",
                    k6Ready: false,
                  },
                  {
                    id: "TC-004",
                    title: "Create Order API",
                    description: "POST /api/orders returns 201",
                    steps: ["POST /api/orders with valid payload"],
                    expectedResult: "201 Created with order ID",
                    category: "automation",
                    k6Ready: false,
                  },
                ]),
              },
            },
          ],
        }),
      },
    },
  }));
});

const rawCases: RawTestCase[] = [
  {
    title: "User Login",
    description: "Verify user can log in",
    steps: "Navigate to /login, enter credentials",
    expectedResult: "Dashboard is displayed",
    rawInput: "User Login\nNavigate to /login",
  },
  {
    title: "Load Test Homepage",
    description: "Measure homepage response time under load",
    steps: "Send 100 concurrent GET /",
    expectedResult: "P95 < 500ms",
    rawInput: "Load Test Homepage\nSend 100 concurrent GET /",
  },
  {
    title: "XSS Prevention",
    description: "Verify inputs are sanitised",
    steps: "Submit script tag in name field",
    expectedResult: "Script is not executed",
    rawInput: "XSS Prevention",
  },
  {
    title: "Create Order API",
    description: "POST /api/orders returns 201",
    steps: "POST /api/orders with valid payload",
    expectedResult: "201 Created",
    rawInput: "Create Order API",
  },
];

describe("classifyTestCases", () => {
  it("returns one TestCase per raw input", async () => {
    const result = await classifyTestCases(rawCases);
    expect(result).toHaveLength(4);
  });

  it("assigns functional category to login test", async () => {
    const result = await classifyTestCases(rawCases);
    const login = result.find((tc) => tc.id === "TC-001");
    expect(login?.category).toBe("functional");
    expect(login?.k6Ready).toBe(false);
  });

  it("assigns performance category and k6Ready=true to load test", async () => {
    const result = await classifyTestCases(rawCases);
    const load = result.find((tc) => tc.id === "TC-002");
    expect(load?.category).toBe("performance");
    expect(load?.k6Ready).toBe(true);
  });

  it("assigns nonFunctional category to security test", async () => {
    const result = await classifyTestCases(rawCases);
    const xss = result.find((tc) => tc.id === "TC-003");
    expect(xss?.category).toBe("nonFunctional");
  });

  it("assigns automation category to API test", async () => {
    const result = await classifyTestCases(rawCases);
    const api = result.find((tc) => tc.id === "TC-004");
    expect(api?.category).toBe("automation");
  });

  it("populates title from rawCases (not overwritten by model)", async () => {
    const result = await classifyTestCases(rawCases);
    expect(result[0].title).toBe("User Login");
  });

  it("includes steps as an array", async () => {
    const result = await classifyTestCases(rawCases);
    expect(Array.isArray(result[0].steps)).toBe(true);
    expect(result[0].steps.length).toBeGreaterThan(0);
  });

  it("includes rawInput from original case", async () => {
    const result = await classifyTestCases(rawCases);
    expect(result[0].rawInput).toBe("User Login\nNavigate to /login");
  });

  it("handles model response with markdown fences gracefully", async () => {
    const Groq = require("groq-sdk");
    const instance = new Groq();
    instance.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              "```json\n" +
              JSON.stringify([
                {
                  id: "TC-001",
                  title: "Login",
                  description: "desc",
                  steps: ["step"],
                  expectedResult: "ok",
                  category: "functional",
                  k6Ready: false,
                },
              ]) +
              "\n```",
          },
        },
      ],
    });

    // Re-require to pick up new mock
    jest.resetModules();
    const { classifyTestCases: classify } = await import(
      "@/lib/classifyWithClaude"
    );
    const result = await classify([rawCases[0]]);
    expect(result[0].category).toBe("functional");
  });
});
