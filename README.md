# social-media-frontend

Next.js 14 (App Router, TypeScript) frontend for the Social Media Demo. **One codebase, two running
instances** — each wired to a different backend (FastAPI or Django REST Framework) via env vars. The
same code works against either backend because both honor the shared
[API contract](../social-media-deploy/API_CONTRACT.md).

> For the full-stack local setup (nginx + both backends + Postgres), see the
> **[deploy repo README](../social-media-deploy/README.md)**. This file covers the frontend alone.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + **shadcn/ui** (Radix primitives, components owned in `src/components/ui/`)
- TanStack Query (data) · React Hook Form + Zod (forms) · next-themes (dark mode) · sonner (toasts)

## Component architecture (build once, reuse everywhere)
```
src/components/
├── ui/         shadcn primitives (button, input, dialog, sheet, input-otp, form, …)
├── common/     standard kit built FROM ui/: AppShell, fields, states, confirm-dialog, container
└── features/   composites: PostCard, PostComposer, CommentList, CodeEntry, FollowButton, AuthCard, …
```
Pages compose only from `features/` + `common/` — no inline one-off styling. Colors are semantic
CSS-variable tokens defined once in `src/app/globals.css` (royal blue / light blue + status + slate),
mapped in `tailwind.config.ts`.

## Run standalone (outside Docker)
```bash
cp .env.local.example .env.local     # point NEXT_PUBLIC_API_BASE_URL at a running backend
npm install
npm run dev                          # http://localhost:3000
```
Note: when running standalone you must point `NEXT_PUBLIC_API_BASE_URL` at a reachable backend (e.g.
`http://localhost:8002/api`). In Docker the browser uses the same-origin `/api` proxied by nginx.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |

## Key files
- `src/lib/api.ts` — typed fetch client; attaches the JWT and retries once on 401 via `/auth/refresh`
- `src/lib/auth.tsx` — auth context (`useAuth`, `useRequireAuth`)
- `src/lib/schemas.ts` — Zod schemas shared by all forms
- `src/components/features/code-entry.tsx` — 6-digit OTP with resend, 10-min countdown, dev auto-fill

## Auth flows (all converge on `<CodeEntry>`)
- **Register** → verify *every* contact (email and/or phone) → account activates
- **Login** → password → mandatory 2FA code to a chosen verified channel
- **Passwordless** → code to a verified email/phone

Demo login: **ada / hunter2x!** (after seeding). Codes appear in the backend logs / dev auto-fill.
