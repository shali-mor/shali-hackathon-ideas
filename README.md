# Forcepoint Hackathon — submit your idea

A small Next.js site for collecting and reviewing ideas for the Forcepoint hackathon on **2026-06-09**.

🚀 Live: **https://shali-hackathon-ideas.vercel.app**

| | |
|---|---|
| Submit deadline | **2026-06-04 23:59 Asia/Jerusalem** |
| Hack day | **2026-06-09** |
| Judging | **2026-06-10** (external judges) |

## How it works

1. Sign in with your `@forcepoint.com` email (name + email, no password — there's no verification email, just trust).
2. Submit an idea through a six-step wizard: title → idea → motivation → team → contact → review.
3. Edit freely until the submission deadline (any edit resets the status to `pending`).
4. Admin reviews and accepts or rejects each idea. Status appears next to your submission in the dashboard.
5. Build it on hack day. The next day, external judges open their private review board.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind 4** with a custom indigo / violet palette
- **Drizzle ORM** + **Neon Postgres** (provisioned through the Vercel Marketplace)
- Session: HMAC-signed JWT cookie via `jose` (no external auth provider)
- 3D hero: **React Three Fiber** + **drei**
- Animations: **Framer Motion**
- Confetti: `canvas-confetti`

## Routes

| Route | Who can see it |
|---|---|
| `/` | Anyone |
| `/ideas` | Anyone — accepted ideas only (admin sees all) |
| `/ideas/[id]` | Anyone if accepted, plus the submitter and admin for any status |
| `/submit` | Signed-in `@forcepoint.com` users |
| `/my-submissions` | Submitter's own ideas with status |
| `/my-submissions/[id]/edit` | Submitter, until deadline |
| `/admin` | Admin only (allowlist via `ADMIN_EMAILS`) |
| `/judges?token=…` | Anyone with a signed JWT link |

## Local development

### Prerequisites
- Node 20+
- Access to a Postgres database (Neon recommended — free tier is fine)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/shali-mor/shali-hackathon-ideas
cd shali-hackathon-ideas
npm install

# 2. Environment
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, JUDGE_TOKEN_SECRET, ADMIN_EMAILS, APP_URL

# Generate secrets (or use any high-entropy strings):
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"  # → AUTH_SECRET
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"  # → JUDGE_TOKEN_SECRET

# 3. Push schema to your Postgres
npm run db:push           # quick / dev
# or with explicit migrations:
npm run db:generate
npm run db:migrate

# 4. Run
npm run dev
```

Sign in at http://localhost:3000/auth/signin with your `@forcepoint.com` email.

### Useful scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run db:studio  # Drizzle Studio
```

## Deployment (Vercel + GitHub auto-deploy)

This repo is connected to Vercel. Pushes to `main` trigger production deploys at https://shali-hackathon-ideas.vercel.app; other branches and PRs produce preview deploys.

If you're forking and deploying your own copy:

```bash
vercel link                          # link a Vercel project
vercel integration add neon          # provision Neon Postgres
vercel env pull .env.local           # pull Neon's DATABASE_URL
# Set the remaining env vars (see Environment below)
vercel deploy --prod
```

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (auto-set by the Vercel/Neon integration) |
| `AUTH_SECRET` | HMAC key for session JWTs. 32+ bytes base64url |
| `JUDGE_TOKEN_SECRET` | HMAC key for judge JWTs. 48+ bytes base64url |
| `ADMIN_EMAILS` | Comma-separated admin email allowlist. Defaults to `shali.mor@forcepoint.com` |
| `APP_URL` | Public URL (used for judge invite links) |

(Remnants of an earlier magic-link auth are still present in `.env.example` — `RESEND_API_KEY`, `AUTH_RESEND_KEY`, `EMAIL_FROM`. They're unused by the current cookie-session auth and can be left blank.)

## Inviting external judges

Judges don't sign in. You email them a signed URL.

```bash
npm run mint-judge -- "Jane Doe" jane@external.com
```

This prints a URL like `https://shali-hackathon-ideas.vercel.app/judges?token=…`. The token is HS256-signed and valid through 2026-06-18. Anyone with the URL can read accepted ideas on the read-only judge board, so keep it private.

## Admin

The default admin is `shali.mor@forcepoint.com` (override with `ADMIN_EMAILS=a@x,b@y`). On `/admin`:

- Filter by status (pending / accepted / rejected / all)
- Accept or reject a submission, optionally with a note to the submitter
- Reopen a previously reviewed submission (back to `pending`)
- Delete a submission permanently (two-step confirm)

## Submission lifecycle

| Event | Status | What the submitter sees |
|---|---|---|
| Submit | `pending` | Status badge on `/my-submissions` |
| Edit before deadline | resets to `pending` | Status badge flips back |
| Admin accepts | `accepted` | Visible on `/ideas` and to judges |
| Admin rejects | `rejected` | Status badge with reviewer note |
| Admin reopens | `pending` | Status badge changes |
| Deadline passes | locked | Edits disabled |

## File map

```
src/
├── app/
│   ├── page.tsx                 — landing (3D hero + countdown)
│   ├── layout.tsx               — site shell, nav, session
│   ├── globals.css              — theme tokens + utilities
│   ├── auth/
│   │   ├── signin/              — name + email + signed cookie
│   │   └── error/
│   ├── submit/                  — wizard form + server action
│   ├── ideas/                   — list + detail
│   ├── my-submissions/          — own ideas + edit
│   ├── admin/                   — review queue + accept/reject/reopen/delete
│   └── judges/                  — tokenized read-only board
├── components/                  — Hero3D, HeroClient, Brand, Countdown, StatusBadge, TiltCard
└── lib/
    ├── session.ts               — JWT cookie helpers
    ├── admin.ts                 — admin allowlist + email-domain guard
    ├── dates.ts                 — deadline / hackathon / judging dates
    ├── submissions.ts           — Zod validation + form parsing
    ├── judge-tokens.ts          — JWT mint/verify
    └── db/                      — Drizzle schema + client
scripts/
├── mint-judge-token.ts          — print a signed judge URL
└── send-judge-invite.ts         — (legacy) email a judge via Resend
drizzle/0000_late_ikaris.sql     — initial schema
```

## License

Internal Forcepoint project — not open for external contributions.
