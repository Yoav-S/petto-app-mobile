# Onboarding & passwordless auth — server contract

**No `login.tsx`, `signup.tsx`, or separate email/login screen.**

## Client flow

```
Step 1 — Welcome (cover + petto + title + Continue)     app/(auth)/index.tsx
Step 2 — Same screen: email field + Google (after Continue)
Step 3 — OTP                                           verify-email.tsx
Step 4 — Home                                          (tabs)/index.tsx
```

| Step | API |
|------|-----|
| Welcome Continue | None (sets `petto_onboarding_complete` in AsyncStorage) |
| Email Continue | `POST /auth/send-otp` |
| Google | Firebase OAuth → `POST /users/me` |
| OTP verify | `POST /auth/verify-otp` → `signInWithCustomToken` → `POST /users/me` |
| Resend OTP | `POST /auth/resend-otp` (20s cooldown) |

Server does **not** receive signup vs login — same endpoints for new and returning users.

## Onboarding UI (375×812)

- Cover ~60% height (`486px` panel start), image `assets/images/onboarding-cover.png`
- Logo **petto**: Rubik Regular 68.73px / 84px line-height, white, top 60px, centered
- White panel: height 326, top radius 38px, `#FFFFFF`
- Title: "Your Pet's Digital Passport" — 24/28 centered
- Subtitle: "Keep vaccinations, reminders, and health records in one place." — 12/16
- Button: 335×48, radius 12, `#1F2937`, "Continue"
- Legal: 12px `#6B7280`, Terms + Privacy Policy bold (Rubik Medium)

## Routing (`app/_layout.tsx`)

- Not logged in → always `/(auth)/` (onboarding index)
- Logged in → `(tabs)`
- OTP in progress → `verify-email`

## Logout

- Home → **Log out** (top-right) or settings gear
- To re-test welcome screen: reinstall app or clear AsyncStorage key `petto_onboarding_complete`

## Removed

- `login.tsx`, `signup.tsx`, `email.tsx` (old "What's your email?" login card)

## QA

1. Fresh install → cover welcome with dog/cat photo + "petto"
2. Continue → same layout, email field appears (no separate login page)
3. Email → OTP → home
4. Logout → onboarding auth step (or welcome if storage cleared)
