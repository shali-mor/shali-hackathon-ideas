# shali-hackathon-ideas

Internal site to submit and review ideas for the Forcepoint hackathon on **2026-06-01**.

- Submit deadline: **2026-05-27 23:59 Asia/Jerusalem**
- Hackathon: **2026-06-01**
- External judges review: **2026-06-02** (read-only)

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4
- Auth.js v5 with Resend magic-link, restricted to `@forcepoint.com` emails
- Drizzle ORM + Neon Postgres
- Server Actions for all mutations
- Judge access via signed JWT in `/judges?token=…`

## Pages

- `/` — landing
- `/submit` — auth-gated submission form
- `/ideas` — public list (accepted only); admin sees all
- `/ideas/[id]` — detail (owner / admin / public-if-accepted)
- `/my-submissions` — submitter's own ideas with status
- `/my-submissions/[id]/edit` — edit until deadline; resets status to pending
- `/admin` — accept / reject / re-open (admin-only)
- `/judges?token=…` — read-only review board for external judges

## Local development

### 1. Provision Neon Postgres
Vercel dashboard → project → Storage → Create Database → Neon. Copy the `DATABASE_URL` into `.env`.

### 2. Provision Resend
[resend.com](https://resend.com) → API Keys → create. Verify your sending domain (or use Resend's test domain for dev). Set `RESEND_API_KEY`, `AUTH_RESEND_KEY` (same value), and `EMAIL_FROM`.

### 3. Set env
```bash
cp .env.example .env
npx auth secret              # for AUTH_SECRET
openssl rand -base64 48      # for JUDGE_TOKEN_SECRET
```

### 4. Push schema
```bash
npm run db:push          # quick first-time / dev
# or, with migrations:
npm run db:generate
npm run db:migrate
```

### 5. Run
```bash
npm run dev
```

Sign in at `/auth/signin` with your `@forcepoint.com` email.

## Deploy to Vercel

```bash
npx vercel link
npx vercel env pull .env.local
npx vercel deploy --prod
```

Set in Vercel project Settings → Environment Variables (production + preview):
`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `AUTH_RESEND_KEY`, `EMAIL_FROM`, `APP_URL`, `ADMIN_EMAILS`, `JUDGE_TOKEN_SECRET`.

## Inviting judges

Mint a private link (no email sent):
```bash
npm run mint-judge -- "Jane Doe" jane@example.com
```

Mint AND email the judge their link via Resend:
```bash
npm run invite-judge -- "Jane Doe" jane@example.com
```

The link is signed (HS256, valid through 2026-06-10).

## Admin

Default admin is `shali.mor@forcepoint.com`. Override with `ADMIN_EMAILS=a@x,b@y`.

## Submission lifecycle

| Event | Status | Notification |
|---|---|---|
| Submitter creates idea | `pending` | none |
| Submitter edits (before deadline) | reset to `pending` | none |
| Admin accepts | `accepted` | email + in-app badge |
| Admin rejects | `rejected` | email + in-app badge |
| Admin re-opens | `pending` | none |
| Deadline passes | locked | edits disabled |
