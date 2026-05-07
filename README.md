# QA Test Case Hub

A Next.js platform that lets your team import test cases, auto-classify them with Claude AI, and export structured JSON to Google Drive — ready to feed into a local k6 + Copilot automation workflow.

## How it works

1. **Input** — paste raw test cases or upload an Excel / CSV file
2. **Classify** — Claude reads every test case and categorises it as:
   - `functional` — feature / user-behaviour tests
   - `nonFunctional` — security, usability, accessibility, compatibility
   - `automation` — deterministic flows good for UI/API automation
   - `performance` — load / throughput tests; flagged `k6Ready: true` when directly scriptable in k6
3. **Review** — inspect the results in a table; override any category with a dropdown
4. **Export** — download a local JSON file, or save directly to Google Drive (OAuth sign-in required)

## JSON output format

```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "totalCount": 12,
    "source": "upload",
    "categoryCounts": {
      "functional": 5,
      "nonFunctional": 2,
      "automation": 3,
      "performance": 2
    }
  },
  "testCases": {
    "functional": [...],
    "nonFunctional": [...],
    "automation": [...],
    "performance": [...]
  }
}
```

Each test case object:
```json
{
  "id": "TC-001",
  "title": "User Login",
  "description": "...",
  "steps": ["Navigate to /login", "Enter credentials", "Click submit"],
  "expectedResult": "Dashboard loads",
  "category": "functional",
  "k6Ready": false
}
```

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd QA-k6
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_DRIVE_FOLDER_ID` | Optional — folder ID from Drive URL |

### 3. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Enable **Google Drive API** in your project

### 4. Excel / CSV column names

The parser recognises these column headers (case-sensitive):

| Field | Accepted column names |
|---|---|
| Title | `Title`, `Test Case`, `Test Name`, `Name` |
| Description | `Description`, `Summary`, `Details` |
| Steps | `Steps`, `Test Steps`, `Steps to Reproduce` |
| Expected Result | `Expected Result`, `Expected`, `Expected Outcome` |

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  api/
    auth/[...nextauth]/   NextAuth Google OAuth handler
    parse/               Parses Excel/CSV/text → raw test cases
    classify/            Sends raw cases to Claude → categorised
    drive/               Saves JSON payload to Google Drive
  page.tsx               Main UI (orchestrates steps)
components/
  InputPanel.tsx         Paste / file upload UI
  ClassificationPanel.tsx Review table with category overrides
  ExportPanel.tsx        Download JSON + Save to Drive
lib/
  auth.ts                NextAuth config
  parseTestCases.ts      Excel/CSV/text parsing logic
  classifyWithClaude.ts  Claude API classification prompt
  googleDrive.ts         Google Drive file creation
types/
  index.ts               Shared TypeScript types
```
