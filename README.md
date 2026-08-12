# Jewel Studio

AI model shots for jewelry: sign up with **email + password**, get **5 free generations**, then buy credits in **INR** via Razorpay.

## Prerequisites

- Node.js 20+
- PostgreSQL — local, [Supabase](https://supabase.com), or [Neon](https://neon.tech)
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Razorpay](https://dashboard.razorpay.com) test keys for payments — see [RAZORPAY.md](RAZORPAY.md)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL, OPENAI_API_KEY, AUTH_SECRET
npm run db:push
npm run dev
```

## Database

**Local:** `DATABASE_URL` pointing at Postgres on your machine (see `.env.example`).

**Supabase (recommended for production):**

1. Create a project at [supabase.com](https://supabase.com)
2. **Settings → Database** → copy the Postgres **URI** into `DATABASE_URL`
3. Run `npm run db:push` so Prisma creates tables on Supabase
4. (Optional for Vercel) use the **pooler** URI (port `6543`) with `?pgbouncer=true` in production

Auth stays in this app (email + password). You do **not** need Supabase Auth.

## Image storage

**Default (local):** files under `data/uploads/`, served at `/api/uploads/...`.

**Supabase Storage (for production / cloud):**

1. In Supabase → **Storage** → create a public bucket named `generations` (or your choice)
2. **Settings → API** → copy Project URL and **service_role** key
3. Add to `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=generations
```

4. Restart `npm run dev`. New generations upload to Supabase and `resultUrl` is a public Supabase URL.

If those env vars are missing, the app keeps using local disk (nothing breaks).

## Auth & credits

- Sign up: **email OTP** (proves the inbox is real) then set a password
- Log in: **email + password** (no OTP)
- Forgot password: email OTP, then set a new password
- **5 credits** on first account (1 credit = 1 generation)
- Same email (or phone, if provided) cannot register twice

## Payments (Razorpay)

Full setup: **[RAZORPAY.md](RAZORPAY.md)**

1. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys) to `.env`
2. Log in → visit `/pricing` → **Buy with Razorpay**
3. For production: add webhook `https://your-domain.com/api/razorpay/webhook` + `RAZORPAY_WEBHOOK_SECRET`

## Gallery

Metadata is in PostgreSQL (`Generation` table). Images are local files or Supabase Storage URLs. View at `/gallery`.

## Mobile

See [MOBILE.md](MOBILE.md) for PWA + Capacitor App Store path.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + production build |
| `npm run db:push` | Apply schema to Postgres |
| `npm run db:studio` | Prisma Studio |

## API

| Route | Purpose |
|-------|---------|
| `GET /api/session` | Auth state + credits |
| `POST /api/auth/signup` | Create account (email OTP + password) |
| `POST /api/auth/login` | Log in (email + password) |
| `POST /api/auth/send-otp` | Send signup or password-reset code |
| `POST /api/auth/reset-password` | Set a new password with email OTP |
| `POST /api/auth/logout` | Log out |
| `POST /api/generate` | Generate model shot (auth required) |
| `GET /api/generations` | User gallery |
| `POST /api/razorpay/create-order` | Start INR checkout |
| `POST /api/razorpay/verify` | Confirm payment |
