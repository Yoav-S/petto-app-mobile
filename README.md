# Ragly (client)

Mobile app for **Ragly** — a simple digital pet passport: pets, vaccinations, medical topics/notes, and reminders in one place.

> Display name: **Ragly** · Expo slug / native IDs still use **petto** (`com.yoav.petto`).

Sibling backend: `../server` (FastAPI → MongoDB, Cloud Run).

---

## Stack

| Layer | Choice |
|--------|--------|
| Runtime | Expo SDK ~54, React Native 0.81, React 19 |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| Auth | Firebase Auth (email OTP via server + Google Sign-In) |
| API | REST → `EXPO_PUBLIC_API_BASE_URL` + Firebase ID token |
| Push | `expo-notifications` → Expo Push → server dispatcher |
| IAP | RevenueCat (`react-native-purchases`) — entitlement `petto_premium`, product `sub_premium` |
| i18n | Custom `i18n/` + `locales/` (`en`, `ro`, `ru`, `he`) |
| Theme | Light/dark via `ThemeContext` |
| Builds | EAS Build (`development` / `preview` / `production`) |
| Updates | `expo-updates` (runtime by `appVersion`) |

**Not supported in Expo Go** for full flows: Google Sign-In (native), RevenueCat IAP, reliable remote push. Use a **development** or **preview** build.

---

## App structure

```
app/
  (auth)/          Welcome, email OTP, terms
  (onboarding)/    First pet: name → type → photo → birth
  (tabs)/          Home
  pets/            Pet list / add
  profile/         Edit pet profile
  vaccines/        Vaccinations
  topics/          Medical topics + notes (server: medical-records)
  reminders/       Reminders (today / upcoming / recent)
  settings/        Account, language, theme, notifications, subscription, legal
assets/            Icons, splash, onboarding art, wordmark
components/        UI by feature (home, health, reminders, …)
services/          API + Firebase + RevenueCat + push helpers
store/             Pet store, onboarding draft
context/           Auth, theme, locale, toast
types/api.ts       Shared response shapes
locales/           Translation JSON
```

Home is the main hub: active pet header, quick status, cards (vaccines / medical / notes), FAB to add.

---

## Data the client cares about

All durable data lives on the **server/DB**. The client holds session + UI state only.

| Domain | Client types (`types/api.ts`) | Main endpoints |
|--------|-------------------------------|----------------|
| User | `UserProfile`, `UserSubscription` | `/users/me`, auth OTP routes |
| Pets | `Pet` | `/pets`, `/pets/:id` |
| Vaccinations | `Vaccination` | `/pets/:id/vaccinations` |
| Medical topics | `MedicalRecord`, `HealthNote` | `/pets/:id/medical-records` (+ notes) |
| Reminders | `Reminder` | `/pets/:id/reminders?tab=…` |
| Push prefs / token | — | `/notifications/register`, `/notifications/preferences` |

**Reminder status (API display):** `today` | `scheduled` | `missed` | `completed`.  
Tabs: `today` / `upcoming` / `recent` (date-based; past **time** same day still stays on Today until the calendar day rolls or the user taps Done/Missed).

**Push:** device registers an Expo push token after login. Fires are sent by the **server** Cloud Scheduler → `POST /api/v1/internal/dispatch-reminders` (production DB). Editing Mongo alone does not send a push.

**Subscription:** RevenueCat on device; server webhook keeps `subscription` on the user profile for gating.

Photos: picked on device, uploaded via client storage helpers, URLs stored on pet / vaccine / note records.

---

## Setup

### 1. Install

```bash
cd client
npm install
```

### 2. Environment

Copy `.env.example` → `.env` and fill:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web config |
| `EXPO_PUBLIC_API_BASE_URL` | Backend base (no trailing slash), e.g. Cloud Run URL or `http://LAN_IP:8080` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In (web client) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `ANDROID` | Native Google clients |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `ANDROID_KEY` | RC public SDK keys (`test_…` in development) |

Native Firebase files (committed for this project):

- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

See also `FIREBASE_NATIVE_SETUP.md`.

### 3. Run Metro

```bash
npx expo start
# or: npx expo start --lan
```

Open in an installed **dev client** (not Expo Go for auth/IAP/push).

Physical phone on locked Wi‑Fi: use USB + `adb reverse tcp:8081 tcp:8081`, phone hotspot, or `npx expo start --tunnel`.

### 4. Native builds (EAS)

```bash
# Dev client + Metro
eas build --platform android --profile development

# Standalone APK (internal), no Metro
eas build --platform android --profile preview

# Store / production
eas build --platform android --profile production
eas build --platform ios --profile production
```

Profiles live in `eas.json`. Env for EAS can be synced with `scripts/sync-eas-env.ps1` when present.

**Icons / splash / notification icon** change only after a **new native build**.

---

## Identifiers

| Key | Value |
|-----|--------|
| App name | Ragly |
| Expo slug | `petto` |
| Android package | `com.yoav.petto` |
| iOS bundle ID | `com.yoav.petto` |
| Deep link scheme | `petto` |
| Support | `support@ragly.cloud` |
| RC entitlement | `petto_premium` |
| RC product | `sub_premium` |

---

## Scripts

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run lint       # eslint
```

---

## Related docs

- `llm/client-rules.md` — product/UI constraints for agents
- `docs/vaccines-client-api.md` — vaccines API notes
- `FIREBASE_NATIVE_SETUP.md` — Firebase native wiring
- `../server` — API, Mongo, dispatch, webhooks

---

## Product principles (short)

Simple, fast, calm. Home-first. No dashboards, search, or heavy navigation. Prefer clarity over features — see `llm/client-rules.md`.
