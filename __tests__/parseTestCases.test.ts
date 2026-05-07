import * as XLSX from "xlsx";
import { parseTextInput, parseExcelBuffer } from "@/lib/parseTestCases";

// ── parseTextInput ──────────────────────────────────────────────────────────

describe("parseTextInput", () => {
  it("splits blank-line-separated blocks into individual test cases", () => {
    const input = `User Login
Navigate to /login
Enter credentials
Expected: Dashboard loads

Search Products
Type "shoes" in search bar
Expected: Results appear`;

    const result = parseTextInput(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("User Login");
    expect(result[1].title).toBe("Search Products");
  });

  it("uses the first line as title and the rest as description", () => {
    const input = `Checkout Flow\nAdd item to cart\nProceed to checkout`;
    const result = parseTextInput(input);
    expect(result[0].title).toBe("Checkout Flow");
    expect(result[0].description).toContain("Add item to cart");
  });

  it("falls back to a numbered title when block is a single line", () => {
    const input = `Single line test case`;
    const result = parseTextInput(input);
    expect(result[0].title).toBe("Single line test case");
  });

  it("ignores empty or whitespace-only blocks", () => {
    const input = `\n\n  \n\nValid Test\nStep 1\n\n  \n\n`;
    const result = parseTextInput(input);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Valid Test");
  });

  it("handles a single test case with no blank lines", () => {
    const input = `API Response Time\nSend GET /api/users\nExpected: 200 in <200ms`;
    const result = parseTextInput(input);
    expect(result).toHaveLength(1);
  });

  it("preserves rawInput as the original block text", () => {
    const block = `Login Test\nGo to /login`;
    const result = parseTextInput(block);
    expect(result[0].rawInput).toBe(block);
  });
});

// ── parseExcelBuffer ────────────────────────────────────────────────────────

function makeExcelBuffer(rows: Record<string, string>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tests");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

describe("parseExcelBuffer", () => {
  it("parses standard column names", () => {
    const buf = makeExcelBuffer([
      {
        Title: "Login",
        Description: "User logs in",
        Steps: "Open /login",
        "Expected Result": "Dashboard shown",
      },
    ]);
    const result = parseExcelBuffer(buf);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Login");
    expect(result[0].description).toBe("User logs in");
    expect(result[0].steps).toBe("Open /login");
    expect(result[0].expectedResult).toBe("Dashboard shown");
  });

  it("accepts alternative column names (Test Case, Summary, Expected)", () => {
    const buf = makeExcelBuffer([
      {
        "Test Case": "Register User",
        Summary: "New user registration",
        Steps: "Fill form",
        Expected: "Account created",
      },
    ]);
    const result = parseExcelBuffer(buf);
    expect(result[0].title).toBe("Register User");
    expect(result[0].description).toBe("New user registration");
    expect(result[0].expectedResult).toBe("Account created");
  });

  it("falls back to numbered title when Title column is missing", () => {
    const buf = makeExcelBuffer([{ Description: "No title row" }]);
    const result = parseExcelBuffer(buf);
    expect(result[0].title).toBe("Test Case 1");
  });

  it("parses multiple rows", () => {
    const buf = makeExcelBuffer([
      { Title: "TC1", Description: "d1", Steps: "s1", "Expected Result": "e1" },
      { Title: "TC2", Description: "d2", Steps: "s2", "Expected Result": "e2" },
      { Title: "TC3", Description: "d3", Steps: "s3", "Expected Result": "e3" },
    ]);
    const result = parseExcelBuffer(buf);
    expect(result).toHaveLength(3);
    expect(result[2].title).toBe("TC3");
  });

  it("stores original row as JSON in rawInput", () => {
    const buf = makeExcelBuffer([{ Title: "T1", Description: "D1" }]);
    const result = parseExcelBuffer(buf);
    const raw = JSON.parse(result[0].rawInput);
    expect(raw.Title).toBe("T1");
  });
});
