import * as XLSX from "xlsx";

export interface RawTestCase {
  title: string;
  description: string;
  steps: string;
  expectedResult: string;
  rawInput: string;
}

export function parseTextInput(text: string): RawTestCase[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, i) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const title = lines[0] ?? `Test Case ${i + 1}`;
    const rest = lines.slice(1).join(" ");
    return {
      title,
      description: rest,
      steps: rest,
      expectedResult: "",
      rawInput: block,
    };
  });
}

export function parseExcelBuffer(buffer: Buffer): RawTestCase[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  return rows.map((row, i) => {
    // Normalise common column name variations
    const title =
      row["Title"] ||
      row["Test Case"] ||
      row["Test Name"] ||
      row["Name"] ||
      `Test Case ${i + 1}`;
    const description =
      row["Description"] || row["Summary"] || row["Details"] || "";
    const steps =
      row["Steps"] || row["Test Steps"] || row["Steps to Reproduce"] || "";
    const expectedResult =
      row["Expected Result"] ||
      row["Expected"] ||
      row["Expected Outcome"] ||
      "";

    return {
      title,
      description,
      steps,
      expectedResult,
      rawInput: JSON.stringify(row),
    };
  });
}
