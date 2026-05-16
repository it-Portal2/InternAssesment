# InternAssesment

Single-page intern-application flow with AI resume analysis, generated interview questions, and live screen-recorded proctoring. **Vite 7 + React 19 + TypeScript 5.8 SPA**, with a single Vercel Node function for the Gemini-backed resume/question pipeline.

## Commands

- `npm run dev` — Vite dev server (port 5173). The `/api/analyzeResume` function does **not** run locally; use `vercel dev` if you need it.
- `npm run build` — `tsc -b && vite build` (typecheck is part of build; there is no separate `typecheck` script).
- `npm run lint` — ESLint over the repo.
- `npm run preview` — serve the built `dist/`.
- `vercel deploy` — preview deploy. Project is linked (`.vercel/` exists). Production goes through `vercel deploy --prod`.

## Project Structure

```
api/                    Vercel Node functions (plain .js, not TS). Only file: analyzeResume.js.
src/
  App.tsx               Providers (QueryClient → Recording → Proctoring → Router) + Lenis smooth scroll.
  Firebase.ts           Firebase init (Storage, Firestore, Auth). Config is hardcoded — see Gotchas.
  pages/                Route components. Only `/` (home) and `*` (not-found).
  components/
    landing/            Marketing page sections (Hero, FAQ, Footer, …).
    steps/              Multi-step application modal — one file per step.
    ui/                 shadcn/ui primitives (style: new-york, baseColor: neutral).
  context/              RecordingContext (MediaRecorder + Cloudinary upload + IndexedDB cache), ProctoringContext.
  hooks/                useProctoring, useScreenRecording.
  store/                Zustand store (`useApplicationStore`) with `persist` middleware — single source of truth for form, step, and proctoring state.
  lib/                  queryClient, validation (zod schemas), utils (cn helper).
  types/application.ts  All shared app types.
  utils/                Browser/screen detection, speech-to-text, formatting.
vercel.json             Deploy config. Sets memory/maxDuration for analyzeResume.
```

## Conventions

- **Imports use the `@/` alias** (maps to `src/`). Don't write relative imports across feature folders.
- **State lives in Zustand** (`useApplicationStore`), not component-local state, for anything spanning steps or surviving reload — the store is `persist`-wrapped.
- **Router import is `react-router`** (not `react-router-dom`), because react-router v7 unified the package. Keep this consistent with `App.tsx`.
- **Forms** use react-hook-form + zod via `@hookform/resolvers`. Validation schemas live in `src/lib/validation.ts`.
- **Toasts** use `sonner`. The `<Toaster>` in `App.tsx` already styles success/error/warning/info — just call `toast.success(...)` etc., don't pass custom styles.
- **Tailwind v4** via `@tailwindcss/vite` (no `tailwind.config.js`; tokens are CSS vars in `src/index.css`).
- **Icons** are `lucide-react`. Do not introduce another icon library.
- **The serverless function (`api/analyzeResume.js`) is plain JavaScript**, not TypeScript. Leave it that way — it's `@vercel/node` runtime and the rest of the build doesn't touch it.

## Gotchas

- **Deploy target is Vercel, not Firebase Hosting.** Firebase is used only as a client SDK (Storage/Firestore/Auth) — there is no Firebase Hosting config and re-introducing one would split the deploy surface. Ship via `vercel deploy`.
- **Firebase web config is hardcoded in `src/Firebase.ts`** (not env-driven). It's a public Firebase web key and is considered acceptable, but don't "fix" it by moving values to env vars without also adjusting deploy. Real secrets (`GEMINI_API_KEY_*`) live in `.env.local` / Vercel env.
- **Gemini API keys rotate on failure** in `api/analyzeResume.js` via `APIKeyManager`. When adding a new key, add it as `GEMINI_API_KEY_3` etc. and include it in the manager's input array — don't replace existing keys.
- **Recordings are written to IndexedDB first**, then uploaded to Cloudinary (cloud `duusiq4ws`, preset `InternAssesment`). If you change the upload flow, preserve the local-download fallback in `RecordingContext` — losing a candidate's recording mid-submit was the reason it exists.
- **Don't start recording from multiple places.** `RecordingContext.startRecording` is guarded against double-starts (see recent fix in `StepUploadAndAI`); keep that pattern.
- **Proctoring state is global**, not per-component. Read/write violations and termination through `useApplicationStore`, not local refs, or the persisted state will desync from UI.
- **`.env.local` is gitignored but currently contains a live `VERCEL_OIDC_TOKEN`** — never paste its contents into chat, issues, or commit messages.

## Verification

There is **no test suite** in this project and none is planned — do not add Jest/Vitest/Playwright scaffolding unless explicitly asked. After every change, run in order:
1. `npm run build` — runs `tsc -b` then the Vite build; fix type errors and build errors.
2. `npm run lint` — fix lint errors.
3. For UI changes: `npm run dev`, walk through the application modal (Permissions → Personal Info → Upload+AI → Predefined Questions → Comments → Success) and confirm no console errors.

When Claude is corrected on a project-specific convention, add the correction here.
