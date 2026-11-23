# Jwelpixel — End-to-end QA checklist

Manual QA for production launch. Mark each case **Pass** / **Fail** / **N/A**.  
Primary environment: **https://jwel-pixel.vercel.app**

| Field | Value |
|-------|--------|
| Date | |
| Tester | |
| Commit / deploy | (Vercel deployment or Git SHA) |
| Device | Phone / Chrome device mode / Desktop |
| Browser | |
| Account email | |
| Starting plan | free / silver / gold / platinum / diamond |
| Starting credits | |

## Credit & feature rules (reference)

| Action | Cost | Code |
|--------|------|------|
| Model / background / batch image | **1** credit each | `CREDIT_COST_PER_GENERATION` in [`lib/users.ts`](../lib/users.ts) |
| Video | **5** credits | `CREDIT_COST_PER_VIDEO` in [`lib/video-presets.ts`](../lib/video-presets.ts) |
| New account | **5** free generations (copy on studio/login) | Studio + login UX |

| Feature | Min plan | Enforced in |
|---------|----------|-------------|
| Model / background | free | [`lib/entitlements.ts`](../lib/entitlements.ts) |
| Custom prompt | gold | entitlements + studio UI |
| Brand / festival / share card | gold | entitlements + [`BrandMarketingPanel`](../components/brand-marketing-panel.tsx) |
| Themes / selfie try-on | platinum | entitlements + studio |
| Video | diamond | entitlements + [`/api/generate-video`](../app/api/generate-video/route.ts) |
| Share / WhatsApp buttons | **hidden for launch** | `SOCIAL_SHARE_UI_ENABLED = false` in [`share-image-button.tsx`](../components/share-image-button.tsx) |

**Viewports**

- **Desktop:** width ≥ `lg` → desktop studio ([`studio-app.tsx`](../components/studio-app.tsx))
- **Mobile:** width &lt; `lg` → mobile shell ([`studio-mobile-home.tsx`](../components/studio-mobile-home.tsx))

---

## Master scorecard

| Section | Result (Pass / Fail / N/A) | Notes |
|---------|----------------------------|-------|
| P0 Smoke | | |
| Auth & identity | | |
| Studio — Model | | |
| Studio — Background | | |
| Studio — Batch | | |
| Studio — Video | | |
| Brand / festivals / share cards | | |
| Themes | | |
| Gallery / profile / pricing | | |
| Payments (Paddle) | | |
| Admin | | |
| Mobile vs desktop parity | | |
| P2 Edge / security | | |
| **Launch decision** | Go / No-go | |

---

## P0 — Launch smoke (all must Pass)

Hard refresh before starting. Use a clear jewelry photo (full piece visible).

### P0.1 Auth — `/login`

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-A1 | Log out if needed → open `/login` → log in with valid credentials | Lands in studio; credits/plan visible | | |
| P0-A2 | Hard refresh studio | Still logged in | | |
| P0-A3 | Log out → open studio | Prompted to log in (no generate) | | |

### P0.2 Model shot — studio (1 credit)

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-M1 | Upload jewelry → Model → pick look/format → Generate | Purple JP **generating** loader while running | | |
| P0-M2 | Wait for result | Full jewelry visible (not cropped); credit **−1** | | |
| P0-M3 | Open `/gallery` or Library and refresh | Same result still listed | | |

### P0.3 Background — studio (1 credit)

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-B1 | Backdrop / Background → solid color → Generate | Clean product on backdrop; credit **−1** | | |

### P0.4 Brand share card — Gold+ only

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-C1 | Fill brand name (+ phone/grams/logo optional) → generate image → **Preview share card** → download | Card readable; jewelry not cut; file downloads | | |
| P0-C2 | On result row, look for **Share** / **WhatsApp** buttons | **Absent** (UI parked) | | |

### P0.5 Video — Diamond only (5 credits)

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-V1 | Video tab **without** jewelry upload | Generate **locked**; calm idle (not infinite sparkle “generating”) | | |
| P0-V2 | Upload → Generate video | Loader only while API runs; credit **−5** on success | | |
| P0-V3 | When finished | Video **autoplays immediately** — no JP cover, no jewelry still as poster | | |

### P0.6 Mobile shell (&lt; `lg`)

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P0-U1 | Home feed chips | Icons on All / Listing / Editing / Marketing | | |
| P0-U2 | Tools cards | Jewelry-style placeholders for Video/Prompt/Brand/Theme | | |
| P0-U3 | Bottom nav | Home / Tools / Edit / Profile | | |
| P0-U4 | Edit → Model options | Broad option set (subjects, looks, placements, scenes, moods) present | | |

**P0 gate:** all applicable rows Pass → OK to invite users. Skip P0-C* if no Gold account; skip P0-V* if no Diamond (mark N/A and note).

---

## P1 — Full product matrix

### P1.1 Auth & identity

Routes: [`/login`](../app/login/page.tsx), `POST /api/auth/login`, `signup`, `send-otp`, `phone-login`, `logout`, `reset-password`.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-A1 | Sign up new email (if open) | Account created; ~5 free gens messaging | | |
| P1-A2 | Login wrong password | Clear error; no session | | |
| P1-A3 | Login correct password | Studio access | | |
| P1-A4 | Phone OTP login (if MSG91 enabled) | OTP sent + login works | | |
| P1-A5 | Phone OTP with SMS disabled (admin) | Friendly disabled/error state | | |
| P1-A6 | Reset password flow | Completes or clear error | | |
| P1-A7 | Logout | Session cleared; APIs return 401 | | |
| P1-A8 | Reuse email/phone that already used free gens (if policy applies) | Clear identity message | | |

### P1.2 Studio — Model

UI: desktop aside + mobile Edit → Model. API: `POST /api/generate`.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-M1 | Generate with default options | Success; −1 credit | | |
| P1-M2 | Change placement (neck / ears / hands / …) | Result matches placement intent | | |
| P1-M3 | Change subject (incl. regional casts) | Casting reflected; jewelry preserved | | |
| P1-M4 | Campaign looks (bridal, glamour, tuxedo, …) | Look changes wardrobe/set; jewelry from upload | | |
| P1-M5 | Shot types (editorial, close_up, catalog, …) | Framing changes appropriately | | |
| P1-M6 | Scene + mood combinations | Background mood changes | | |
| P1-M7 | Output formats (WhatsApp / IG post / story) | Aspect matches; download exact pixels when applicable | | |
| P1-M8 | Custom prompt (Gold+) filled | Prompt drives look; chips ignored as copy says | | |
| P1-M9 | Custom prompt below Gold | Locked / upgrade copy | | |
| P1-M10 | Selfie try-on (Platinum+) | Selfie used as model; placement still applies | | |
| P1-M11 | Selfie below Platinum | Locked copy | | |
| P1-M12 | Regenerate same upload | New result; another −1 credit | | |
| P1-M13 | Jewelry visibility | Piece never cropped off edges | | |

### P1.3 Studio — Background

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-BG1 | Preset colors (white, black, navy, gold, …) | Backdrop matches | | |
| P1-BG2 | Custom hex apply | Valid hex applied; invalid shows error | | |
| P1-BG3 | Framing options | Catalog/hero/macro/lifestyle respected | | |
| P1-BG4 | Jewelry shadow (off/soft/hard/floating) | Shadow style changes | | |
| P1-BG5 | Festival selected + background | Festive scene behavior (not washed out by solid white) | | |

### P1.4 Studio — Batch

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-BT1 | Add 2–4 jewelry photos → Generate all | Each tile progresses; credits = N × 1 | | |
| P1-BT2 | One failure in batch | Failed tile shows Failed + Retry | | |
| P1-BT3 | Retry failed | Retries only failed; credits for retries | | |
| P1-BT4 | Brand kit ready → batch | Share/brand cards appear on done tiles when applicable | | |
| P1-BT5 | Stop after current (if shown) | Stops queue; no further deductions | | |
| P1-BT6 | Insufficient credits for full batch | Generate disabled or clear error | | |

### P1.5 Studio — Video

API: `POST /api/generate-video`. Cost: **5** credits. Plan: **diamond**.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-V1 | Non-Diamond account | Upgrade / Diamond messaging; no charge | | |
| P1-V2 | Diamond, no upload | Generate locked; idle preview (not fake generating loop) | | |
| P1-V3 | Ratio vertical 9:16 vs horizontal 16:9 | Output aspect matches | | |
| P1-V4 | Cast jewelry-only vs on-model | Cast respected | | |
| P1-V5 | Cast = model → subject + look options | Options visible and applied | | |
| P1-V6 | Purpose + motion presets | Different motion character | | |
| P1-V7 | Success path | −5 credits; video plays directly (no JP overlay, no upload poster) | | |
| P1-V8 | Download video | File saves / plays locally | | |
| P1-V9 | Insufficient credits (&lt; 5) | Clear error; no charge | | |

### P1.6 Brand / festivals / share cards

UI: [`brand-marketing-panel.tsx`](../components/brand-marketing-panel.tsx), [`marketing-poster-button.tsx`](../components/marketing-poster-button.tsx). Festivals: `GET /api/festivals`.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-BR1 | Below Gold: brand panel | Locked / upgrade | | |
| P1-BR2 | Brand name, phone, WhatsApp field, grams, marketing line | Fields save in session and appear on card | | |
| P1-BR3 | Logo upload + placements | Logo position on card matches selection | | |
| P1-BR4 | Poster / share card templates | Template switch changes layout | | |
| P1-BR5 | Festival pick from calendar | Festival label/scene applied | | |
| P1-BR6 | Preview share card → download | Opens preview; download works | | |
| P1-BR7 | Share + WhatsApp buttons on result/gallery | **Hidden** | | |
| P1-BR8 | `POST /api/share` while public share disabled | 503 / disabled (admin flag) | | |

### P1.7 Themes (Platinum+)

API: `/api/themes`, `/api/themes/[id]`.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-T1 | Below Platinum | Themes locked | | |
| P1-T2 | Save current result as theme | Theme appears in list | | |
| P1-T3 | Apply theme → new jewelry → Generate | Style reused; new piece | | |
| P1-T4 | Clear theme | Options editable again | | |
| P1-T5 | Delete theme | Removed from list | | |

### P1.8 Gallery / profile / pricing

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-G1 | `/gallery` logged out | Login prompt | | |
| P1-G2 | `/gallery` logged in | Lists image + video gens | | |
| P1-G3 | Download / save from gallery | Works for image (and video if offered) | | |
| P1-G4 | `/profile` | Email, credits, plan accurate | | |
| P1-G5 | `/pricing` | Packs/plans match entitlements (video = Diamond, etc.) | | |
| P1-G6 | Pricing copy does not promise live Share-to-WhatsApp | Matches parked social share | | |

### P1.9 Payments (Paddle)

Routes: `/api/paddle/checkout`, `confirm`, `webhook`. UI: Buy once on pricing.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-P1 | Start checkout for a pack | Paddle checkout opens | | |
| P1-P2 | Complete test/live payment | Credits increase; plan upgrades if pack includes plan | | |
| P1-P3 | Cancel payment | No credit change | | |
| P1-P4 | Refresh after success | Credits/plan persist | | |
| P1-P5 | Webhook / verify idempotency (if re-fired) | Credits not double-added | | |

### P1.10 Admin

Routes: `/admin/login`, `/admin` panel (users, payments, settings, generations).

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-AD1 | Admin login / logout | Access control works | | |
| P1-AD2 | Non-admin cannot open panel | Rejected | | |
| P1-AD3 | Users list + search | Loads | | |
| P1-AD4 | Set user plan | Plan updates; features unlock | | |
| P1-AD5 | Set user credits | Credits update immediately | | |
| P1-AD6 | Settings flags (brand, prompt, themes, selfie, video, public share, SMS) | Toggles affect product | | |
| P1-AD7 | Generations / payments admin views | Data loads without error | | |

### P1.11 Mobile vs desktop parity

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P1-MP1 | Subjects list mobile vs desktop | Same set (full SUBJECTS) | | |
| P1-MP2 | Campaign looks | Full LOOK_PRESET_IDS | | |
| P1-MP3 | Placements / shots / scenes / vibes | Full enums | | |
| P1-MP4 | Backdrop framing + shadow + hex | Present on mobile Backdrop | | |
| P1-MP5 | Video cast=model → subject + look | Present on mobile | | |
| P1-MP6 | Brand / Theme / Prompt / Selfie tools | Reachable on mobile Edit tools row | | |

---

## P2 — Edge / negative / security

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| P2-E1 | 0 credits → Generate image | Clear error; no result charged | | |
| P2-E2 | &lt; 5 credits → Generate video | Clear error; no charge | | |
| P2-E3 | Gold feature on Free/Silver (prompt/brand) | UI lock + server reject if forced | | |
| P2-E4 | Video on non-Diamond | UI lock + server reject | | |
| P2-E5 | Generate with no file (API or UI) | Blocked | | |
| P2-E6 | Invalid file type (e.g. PDF) | Rejected gracefully | | |
| P2-E7 | Very large image | Compress/upload path works or clear error | | |
| P2-E8 | Abort / kill network mid-generate | Friendly error; refund if designed | | |
| P2-E9 | Session expired mid-generate | Login/error; no silent success | | |
| P2-E10 | `POST /api/generate` without cookie | **401** | | |
| P2-E11 | `POST /api/generate-video` without cookie | **401** | | |
| P2-E12 | `GET /api/generations` without cookie | **401** | | |
| P2-E13 | `GET /api/health` | **200** healthy | | |
| P2-E14 | Public share disabled → `/s/[id]` or share POST | Not publicly usable / disabled | | |
| P2-E15 | Admin disables `featureVideoEnabled` | Video unavailable even on Diamond | | |
| P2-E16 | Admin disables `featureBrandEnabled` | Brand panel locked | | |

---

## Plan × feature gate matrix (explicit checks)

For each row: test **below** min plan (locked) and **at/above** min plan (works).

| Feature | Min plan | Below-plan case ID | At-plan case ID | Pass? |
|---------|----------|--------------------|-----------------|-------|
| Model / background | free | — | P0-M1 / P0-B1 | |
| Custom prompt | gold | P1-M9 | P1-M8 | |
| Brand / share card | gold | P1-BR1 | P0-C1 | |
| Themes | platinum | P1-T1 | P1-T2 | |
| Selfie try-on | platinum | P1-M11 | P1-M10 | |
| Video | diamond | P1-V1 | P0-V2 | |
| Share link UI | parked off | P0-C2 / P1-BR7 | N/A until re-enabled | |

---

## Known parked / N/A for this launch

Do **not** fail launch for these; mark **N/A**:

| Item | Status | Notes |
|------|--------|-------|
| Share + WhatsApp buttons (public link / wa.me) | Parked | `SOCIAL_SHARE_UI_ENABLED = false` — use Download + Preview share card |
| Account-connected Meta / WhatsApp Business posting | Not built | Future |
| Designer blank luxury poster templates | Not shipped | Option A share cards only |
| Capacitor / Play Store / App Store native builds | Out of scope here | See `MOBILE.md` separately |
| Automated Playwright / CI E2E | Out of scope this checklist | Manual only |
| Load / soak / performance benchmarking | Out of scope | |

---

## Severity guide (for Failures)

| Severity | Meaning | Launch impact |
|----------|---------|---------------|
| **Blocker** | Cannot generate, pay, login, or credits wrong | No-go |
| **Major** | Core path broken (video flash, share card unreadable, mobile missing critical options) | Fix before invite |
| **Minor** | Cosmetic / rare edge | Can ship with note |

Log failures as:

```text
[ID] Severity — short title
Steps: …
Expected: …
Actual: …
Screenshot/URL: …
```

---

## Sign-off

| Gate | Decision |
|------|----------|
| P0 all applicable Pass? | Yes / No |
| Blockers open? | Yes / No |
| OK to invite users to jwel-pixel? | **Go** / **No-go** |

| Role | Name | Signature / date |
|------|------|------------------|
| Tester | | |
| Product owner | | |

---

## Quick run order (recommended)

1. Prep accounts (free + Gold + Diamond or admin plan bumps)  
2. Run **P0** on mobile width, then desktop  
3. Run **P1** areas that match the launch offer (skip payments if packs not live)  
4. Spot-check **P2** security rows (E10–E14)  
5. Fill scorecard + sign-off  

---

## Client review retest (30 Oct 2026 feedback)

Fixes shipped for the editor screenshot review: India-first festival calendar, failure reason + credit-returned copy, Retry credit note, generation elapsed time, credit rules under Generate.

| ID | Steps | Expected | Pass? | Notes |
|----|-------|----------|-------|-------|
| CR-01 | Open Brand & festival → Region = India → Nov 2026 | Diwali / Bhai Duj / Chhat / Guru Nanak days highlighted | | |
| CR-02 | Tap a highlighted day | Festival name list appears; selecting sets “Using …” | | |
| CR-03 | Tap a blank day | “No India festival on this date” | | |
| CR-04 | Force or wait for a failed output card | Shows reason text + “Credit returned” + Retry | | |
| CR-05 | Click Retry on failed item | New attempt runs; credit only stays if success | | |
| CR-06 | Watch Generate placeholder | Elapsed seconds tick while generating | | |
| CR-07 | Check Credits line + Generate helper | “1 photo = 1 credit”; failed returns credit | | |
| CR-08 | Pricing / Studio header links | Pricing 200; Studio (`/gallery`) opens or login redirect when logged out | Pass (logged out → `/login`) | Header label is Studio; route remains `/gallery` |
| CR-09 | Enable watermark, upload logo, pick placement, generate Gold+ | Logo preview in panel; marketing poster options apply | | |
| CR-10 | Mobile width &lt; lg | Credits line shows “1 photo = 1 credit”; generate still works | | |
| CR-11 | Output preview size + Expand / click-to-expand (desktop + mobile) | Preview matches format aspect; Expand / tap opens lightbox; Download works | | Desktop: “Click to expand” + Expand button; mobile: “Tap photo to zoom”; Studio grid: Tap to zoom |
| CR-12 | Notification module (push / email / in-app) | User-facing alerts if built | N/A | **Not built.** Only Paddle webhook “notification” payloads exist — not a user notification product. |

**Out of scope this pass:** push/email/in-app notification module (**not built**; tracked separately if product wants it).
