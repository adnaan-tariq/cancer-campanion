# Cancer Companion

Cancer Companion is a Vite + React + TypeScript application that uses medical AI and Supabase Edge Functions to help translate reports, find matching trials, and guide patients through treatment in plain language.

This project is built as part of the **[Med-Gemma Impact Challenge](https://www.kaggle.com/competitions/med-gemma-impact-challenge)** and lives in this GitHub repository: **[adnaan-tariq/cancer-campanion](https://github.com/adnaan-tariq/cancer-campanion)**.

## Features

- **Patient-friendly explanations** of medical reports using AI.
- **Treatment navigation** to help patients understand options and next steps.
- **Clinical trial discovery** powered by external AI APIs and Supabase Edge Functions.
- **Modern UI** built with shadcn-ui and Tailwind CSS.

## Tech stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Edge Functions + Database)

## Getting started

You’ll need Node.js and npm installed (for example via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Clone the repository
git clone https://github.com/adnaan-tariq/cancer-campanion.git
cd cancer-campanion

# Install dependencies
npm install

# Start the development server
npm run dev
```

The development server URL (e.g. `http://localhost:5173`) will be printed in your terminal.

## Environment variables

Create a `.env` file in the project root (or `.env.local`) with your Supabase configuration:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

**Do not commit real keys** – `.env` is already ignored via `.gitignore`.

## Hosting with your own Supabase

You can run the backend (Edge Functions) and point the app to **your own** Supabase project.

### 1. Create or use your Supabase project

- Go to [supabase.com](https://supabase.com) and create a project (or use an existing one).
- In **Project Settings → API**, copy:
  - **Project URL** → use as `VITE_SUPABASE_URL`
  - **anon public** key → use as `VITE_SUPABASE_PUBLISHABLE_KEY`
  - **Project ID** (in the URL or settings) → use as `VITE_SUPABASE_PROJECT_ID`

### 2. Point the app to your project

In the project root, create or update `.env`:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

Do **not** commit real keys; use `.env.local` or keep `.env` in `.gitignore` if it isn’t already.

### 3. Link and deploy Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if needed, then:

```sh
# Log in and link this repo to your project
npx supabase login
npx supabase link --project-ref your-project-id

# Deploy all Edge Functions
npx supabase functions deploy treatment-navigator
npx supabase functions deploy trial-finder
npx supabase functions deploy tts-generate
```

If your `supabase/config.toml` has a different `project_id`, linking overrides it for CLI commands.

### 4. Set Edge Function secrets

Your functions need these env vars (set as Supabase “secrets”):

| Secret | Used by |
|--------|--------|
| `AIMLAPI_API_KEY` | treatment-navigator, trial-finder |
| `FIRECRAWL_API_KEY` | treatment-navigator, trial-finder |
| `PERPLEXITY_API_KEY` | treatment-navigator, trial-finder |
| `ELEVENLABS_API_KEY` | tts-generate |

Example (replace with your real values):

```sh
npx supabase secrets set AIMLAPI_API_KEY=your-aiml-key
npx supabase secrets set FIRECRAWL_API_KEY=your-firecrawl-key
npx supabase secrets set PERPLEXITY_API_KEY=your-perplexity-key
npx supabase secrets set ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 5. Run the app

```sh
npm install
npm run dev
```

The app uses only `VITE_SUPABASE_*` to talk to Supabase. Once the env points to your project and the functions are deployed and secrets are set, everything runs on your Supabase project. 
