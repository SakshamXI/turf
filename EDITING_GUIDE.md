# Where to edit things

A quick reference for common changes — no need to search through the whole
codebase. All paths are from your project's root folder.

## Text & branding

| What you want to change | File to open |
|---|---|
| Turf name (header, footer, browser tab, payment checkout) | `components/Header.tsx`, `components/Footer.tsx`, `app/layout.tsx`, `components/PaymentButton.tsx` |
| Homepage headline, hero text | `app/page.tsx` (top of the file) |
| Owner bio / photo | `app/page.tsx` — search for "Who runs this place" |
| Address / contact phone / email | `app/page.tsx` — search for "Contact us" |
| Map location | `app/page.tsx` — search for `Jammu, Jammu and Kashmir` (appears twice: map embed + directions link) |
| Code of conduct / rules list | `app/page.tsx` — the `rules` array near the top |
| Gallery photo captions | `app/page.tsx` — the `gallery` array near the top |
| Grievance email address | `components/GrievanceContact.tsx` |
| Scrolling announcement bar messages | `components/AnnouncementBar.tsx` — the `messages` array |
| Scroll speed of the announcement bar | `components/AnnouncementBar.tsx` — the `DURATION_MS` constant |
| Pre-payment terms (non-refundable, conduct warning) | `components/PolicyModal.tsx` |
| Pricing page FAQ text | `app/pricing/page.tsx` — the `faqs` array |

## Photos

| What | Where |
|---|---|
| Gallery photos | Add files to `public/images/` named `turf-1.jpg` through `turf-6.jpg` |
| Owner photo | Add `public/images/owner.jpg` |

## Prices & slots (no code editing needed — use the admin panel)

Go to `/admin` → **"Time slots & pricing"** to add new bookable times,
change a slot's price, or disable/delete one. Nothing in the code needs
touching for this.

## Numbers & settings that live in `.env.local`

| Setting | Variable |
|---|---|
| Admin panel password | `ADMIN_PASSWORD` |
| Razorpay keys | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET` |
| Resend (email OTP + tickets) keys | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Database connection | `DATABASE_URL` |
| Turf name/address used in ticket SMS text | `TURF_NAME`, `TURF_ADDRESS` |

Note: `SLOT_PRICE_PAISE` in `.env.local` is legacy — it only seeds the
very first database migration. Actual prices are managed in the admin
panel now, not this file.

## Things managed entirely from `/admin` (no file editing at all)

- Time slots & their prices
- Holidays (dates the turf is closed)
- Discount/promo codes
- Manually adding or cancelling a booking
- Viewing booking history and revenue
- Scanning/verifying tickets

## After editing any file

Restart your dev server for changes to take effect:
```
Ctrl+C
npm run dev
```
