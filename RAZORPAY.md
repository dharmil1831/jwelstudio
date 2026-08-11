# Razorpay setup — Jewel Studio

Credits are sold in **INR** on `/pricing`. Flow: create order → Razorpay Checkout → verify signature → add credits.

## 1. Razorpay account (Test mode)

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Stay in **Test mode** (toggle top-left) while developing
3. Go to **Account & Settings → API Keys → Generate Key**
4. Copy **Key ID** (`rzp_test_...`) and **Key Secret**

## 2. Environment variables

Add to `.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
# Optional until deploy — webhook is a backup if the browser closes after pay
# RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Restart `npm run dev` after saving.

Optional custom packs (JSON array):

```env
RAZORPAY_CREDIT_PACKS=[{"id":"starter","label":"Starter","amountPaise":9900,"credits":20}]
```

Default packs if unset: Starter ₹99 (20 credits), Pro ₹199 (50), Studio ₹499 (150).

## 3. Local test

1. Log in at `/login`
2. Open `/pricing`
3. Click **Buy with Razorpay** on a pack
4. Use Razorpay **test** payment methods (UPI/card test details in Razorpay docs)
5. After success you should see the green banner and credits increase in the header

Verify route (`POST /api/razorpay/verify`) adds credits immediately. Webhook is optional on localhost.

## 4. Webhook (production)

When deployed with HTTPS:

1. Razorpay Dashboard → **Webhooks → Add New Webhook**
2. URL: `https://your-domain.com/api/razorpay/webhook`
3. Events: **payment.captured**
4. Copy **Webhook Secret** → `RAZORPAY_WEBHOOK_SECRET` in Vercel env

## 5. Go live

1. Complete Razorpay **KYC** and switch to **Live mode**
2. Replace test keys with `rzp_live_...` keys in production env
3. Update webhook URL to production domain

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/razorpay/create-order` | Auth required; creates order + `Payment` row |
| `POST /api/razorpay/verify` | Client callback after Checkout success |
| `POST /api/razorpay/webhook` | Server backup for `payment.captured` |
