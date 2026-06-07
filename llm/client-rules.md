# PETTO — CLIENT LLM RULES (MOBILE APP)

## 0. Core Principle

This app is NOT a feature-rich system.

This is a **simple, fast, calm digital pet passport**.

The user must feel:
- “I have everything in one place”
- “I don’t need to remember everything”
- “I can show the vet quickly”
- “I feel in control”

Priorities:
1. Speed
2. Simplicity
3. Clarity
4. Low friction
5. Trust

DO NOT:
- Add unnecessary features
- Add complex navigation
- Add search or filters
- Add dashboards, charts, or analytics UI
- Add AI-like UI explanations
- Over-design the interface

---

## 1. Platform and App Structure

The client app must follow this setup:

- Expo React Native
- TypeScript
- Expo Router is allowed if kept simple
- Mobile-first UI
- Single-screen-centered flow
- Main app entry is Home

The LLM must respect these app identifiers:

- App name: Petto
- Slug: petto
- Android package: com.yoavshamir.petto
- iOS bundleIdentifier: com.yoavshamir.petto

### Windows / Expo Development Constraints (STRICT)

- The developer is using Windows. This is an Expo (React Native) project, NOT a native iOS project.
- Do NOT give instructions that require Xcode or a Mac.
- Do NOT suggest Swift Package Manager, CocoaPods, or native iOS setup.
- Firebase is configured using the JS/Web SDK only (`firebase` npm package).
- For iOS builds, we use Expo EAS Build (cloud build, no Mac needed).
- All Firebase setup is done through the `firebaseConfig` object in code, not native config files.

---

## 2. App Structure (STRICT)

The LLM MUST follow this MVP structure:

### Header (Pet ID)
Always visible on Home:
- photo
- name
- breed • age

Tap behavior:
- tap header or avatar → open Full Profile

---

### Quick Status
Show ONLY if relevant data exists.

Show ONLY one item.

Priority order:
1. Today reminder
2. Upcoming reminder
3. Due vaccination
4. Overdue vaccination

Examples:
- “Reminder tomorrow”
- “Next vaccine in 2 weeks”

---

### Main Cards
Cards shown on Home:
- Vaccinations
- Medical History
- Notes

Each preview shows ONLY the latest relevant item.

Tap → open full section

---

### FAB (GLOBAL ADD)
The FAB must open:
- Add Vaccination
- Add Medical Record
- Add Note
- Add Reminder

Access points for Add:
- FAB
- inside relevant sections

---

## 3. Navigation Rules

Navigation must remain simple.

Structure:
- Home = main screen
- Navigation via:
  - cards
  - profile
  - FAB

Rules:
- No deep complex stacks
- No tab overload
- No multi-layered navigation patterns
- Keep screen transitions predictable

---

## 4. Onboarding Rules

First launch must require Add Pet.

Required fields:
- email
- pet name
- pet type

Optional fields:
- photo
- breed
- birth date

Rules:
- Must allow Skip for optional fields
- No extra onboarding steps
- No tutorials
- No walkthroughs
- No additional forms before pet creation

Auth flow:
- email is required
- account is created during onboarding
- **passwordless** email auth via server **6-digit OTP** (NOT Firebase email links, NOT passwords)
- signup and login use the **same** OTP flow
- session persists via Firebase + AsyncStorage until user taps **Sign out**
- after sign-out, user must complete OTP again to log in
- Google Sign-In optional (separate flow, test on dev build / deployment)
- logout does NOT delete saved data
- incomplete onboarding must return user to Add Pet

---

## 4.1 Passwordless Email OTP and Backend Sync (STRICT)

The client owns UI and Firebase session. The server owns OTP, user storage, and MongoDB.

### API base

- All backend calls use `EXPO_PUBLIC_API_BASE_URL` + prefix `/api/v1`.
- Protected routes require `Authorization: Bearer <Firebase ID token>`.
- OTP routes are **public** (no Bearer token).

### Email signup AND login (same flow)

| Step | Client action | Endpoint | Request body | Response |
|------|---------------|----------|--------------|----------|
| 1 | User enters email, taps Continue | `POST /auth/send-otp` | `{ "email": "user@example.com" }` | `{ "message": "..." }` |
| 2 | Navigate to OTP screen | — | Keep email in **memory only** (`setPendingEmail`) | — |
| 3 | User enters 6-digit OTP | `POST /auth/verify-otp` | `{ "email": "...", "otp": "123456" }` | `{ "custom_token": "..." }` |
| 4 | Firebase sign-in | `signInWithCustomToken(auth, custom_token)` | Client only | Firebase session |
| 5 | Backend handshake | `POST /users/me` `{}` | Bearer token | User profile + `last_login_at` |

Optional: `POST /auth/resend-otp` `{ "email" }` — **20s cooldown** (show timer in UI).

### Session rules

- **Do NOT** sign out on app close — Firebase AsyncStorage keeps the session.
- **Only** call `signOut()` when user taps Sign out — next login requires new OTP.
- On app launch, `onAuthStateChanged` restores session → auto `POST /users/me`.

### Google Sign-In (sign up + log in)

Google uses one flow for both new and returning users:

1. Google OAuth → Firebase (`signInWithCredential` with ID token)
2. `AuthContext` auto-calls `POST /users/me`
3. Server sets `auth_provider: "google"`, no password hash, updates `last_login_at`

**Client config (`AuthContext`):**

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Firebase Web client ID (required)
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — iOS OAuth client (native builds)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Android OAuth client (native builds)
- Redirect scheme: `petto` (matches `app.json` → `expo.scheme`)
- Use `webClientId` (not `clientId`) in `Google.useIdTokenAuthRequest`

**UI:** `GoogleSignInButton` on login and signup screens.

**Expo Go vs development build:**

- **Web:** Google Sign-In works in the browser with the web client ID.
- **Phone (Expo Go):** Google OAuth is unreliable — Expo Go cannot use custom redirect schemes properly.
- **Phone (recommended):** Run an EAS **development build** (`eas build --profile development`). Register Android SHA-1 and iOS bundle ID in Firebase / Google Cloud.

**Google Cloud (if blocked):** Auth platform → Audience → Test users (while app is in Testing); enable Google in Firebase Authentication.

### Client files (auth)

- `services/firebaseAuth.ts` — Firebase Web SDK init + AsyncStorage persistence
- `services/api.ts` — `apiGet`, `apiPost` (Bearer), `apiPostPublic` (register/OTP)
- `services/auth.ts` — `sendOtp`, `verifyOtpAndSignIn`, `resendOtp`, `syncUserWithBackend`, `setPendingEmail`
- `context/AuthContext.tsx` — session restore + auto `POST /users/me` after Firebase login
- `app/(auth)/signup.tsx`, `verify-email.tsx`, `login.tsx`

### Rules

- Do NOT use passwords or `signInWithEmailAndPassword` for email auth.
- Do NOT use Firebase `sendEmailVerification` — OTP is server-side only.
- Do NOT store email in URL/route params or AsyncStorage between OTP steps — use in-memory `pendingEmail` only.
- Do NOT skip `POST /users/me` after login — MongoDB user + `last_login_at` depend on it.
- OTP is **6 digits** (match UI boxes).
- On physical device dev, `localhost` in `EXPO_PUBLIC_API_BASE_URL` must resolve to the dev machine (LAN IP or Expo host swap in `api.ts`).

### Dev OTP

When server SMTP is not configured, OTP appears in the **server terminal**:

```
[DEV OTP] user@example.com -> 123456
```

---

## 5. Multi-Pet Logic

Avatar tap → bottom sheet with pets list.

Rules:
- Switch pet instantly
- All screens must update based on selected pet_id
- Never mix pet data
- Last selected pet must be saved
- On return, app opens the same pet
- Hide pet switcher when only one pet exists

---

## 6. Full Profile Rules

Full Profile acts as extended passport.

Show:
- photo
- name
- breed
- gender
- weight
- birth date
- age (calculated automatically)
- chip ID
- passport number
- color
- neutered / not
- notes

Rules:
- Keep layout clean and readable
- Do not overload with advanced fields
- Display only available values when possible

---

## 7. Section Rules

### Vaccinations
List items:
- vaccine name
- date
- next date

Inside record:
- name
- date
- next date
- note

Sorting:
- newest first

Empty state:
- “No vaccinations yet”
- CTA: Add vaccination

---

### Medical History
List items:
- type
- date
- short description

Inside record:
- date
- type
- description
- notes

Sorting:
- newest first

Empty state:
- “No records yet”
- CTA: Add record

---

### Notes
List items:
- text
- date

Inside record:
- full text
- date

Sorting:
- newest first

Empty state:
- “No notes yet”
- CTA: Add note

---

### Reminders
List items:
- title
- date
- status

Types:
- Vaccination
- Medication
- Treatment
- Vet Visit

Sorting order:
1. Today
2. Scheduled
3. Missed
4. Completed

Empty state:
- “No reminders yet”
- CTA: Add reminder

---

## 8. Input UX Rules

Input must feel:
- fast
- clear
- light
- non-threatening

Field types allowed:
- text input
- date picker
- select / dropdown
- multiline input

Rules:
- Minimize typing
- Use short forms
- Keep most inputs optional where possible
- Use local validation
- No long-form suggestions except Notes
- Avoid complex multi-step input flows

---

## 9. Input Field Design Rules

Field structure:
- Label
- Input
- Helper or Error text

Dimensions:
- Height: 48 px
- Radius: 12 px
- Horizontal padding: 16 px
- Vertical padding: 12 px

States:
- Default
- Focus
- Filled
- Error
- Disabled

Styles:
- Default background: #FFFFFF
- Default border: #E5E7EB
- Text: #1F2937
- Focus border: #1F2937
- Disabled background: #F3F4F6
- Disabled text: #9CA3AF
- Error border: #C96A6A
- Error text: #C96A6A

Typography:
- Label: Rubik Medium 14/20
- Input: Rubik Regular 16/24
- Placeholder: Rubik Regular 16/24
- Error: Rubik Regular 12/16

UX principles:
- prevent errors where possible
- reduce effort
- show clear inline errors

---

## 10. Validation Rules

Required fields must be enforced exactly as defined.

Validation rules:
- required fields must exist
- dates must follow product logic
- max text length: 300
- inline errors only

Date rules:
- records use past dates
- reminders use future dates
- reminder default time: 09:00
- timezone is local
- display format: `10 Apr 2026`

Rules:
- no blocking popups for simple validation
- validation must feel calm and lightweight

---

## 11. Status Logic (Client Display Only)

Client must reflect server truth.

Vaccination statuses:
- Up to date
- Due soon
- Overdue

Reminder statuses:
- Scheduled
- Today
- Missed
- Completed

Rules:
- Use simple indicators
- Do not invent custom status logic
- Client display must not override backend logic

---

## 12. Edit / Delete Flow

Edit flow:
- open
- edit
- save

Success message:
- “Changes saved”

Delete flow:
- confirmation modal
- “Delete this record?”
- “This action cannot be undone”
- “Deleted”

Rules:
- destructive actions must be clearly separated
- never silently delete

---

## 13. Messaging Rules (STRICT)

Allowed short system messages:
- “Saved”
- “Synced”
- “Something went wrong”
- “Failed to save”
- “Check your connection”
- “Delete this record? This action cannot be undone”
- “Changes saved”
- “Deleted”
- “Reminder completed”

Rules:
- Keep messages short
- No technical language
- No verbose explanations
- No invented system copy outside product tone

---

## 14. Error States

The UI must support:
- network error
- save error
- general error

Rules:
- keep error copy short
- always remain calm and readable
- never expose technical stack details

---

## 15. Offline Behavior

Rules:
- user can view data offline
- user can add locally
- sync when online
- show “Check your connection” when relevant

The app must assume offline use is normal.

Do NOT:
- block viewing existing data
- lose locally added content silently

---

## 16. Loading States

Use:
- skeleton loading
- button loading

Rules:
- avoid blank screens
- loading should feel light and predictable
- no excessive spinners everywhere

---

## 17. Search / Filter

Not included in MVP.

DO NOT build:
- search
- filters
- advanced sorting controls
- query UI
- global search bar

---

## 18. Copy / Tone

Tone must be:
- warm
- simple
- friendly
- calm
- non-technical

Avoid:
- robotic language
- medical jargon overload
- “AI assistant” style explanations
- over-instruction

---

## 19. Success Path and Core Loop

Success path:
- onboarding
- first record
- value moment

Core loop:
- add
- reminder
- notification
- return
- complete
- record

The UI must support this loop clearly and simply.

---

## 20. Accessibility

Must support:
- readable text
- good contrast
- clean spacing
- understandable hierarchy

Rules:
- prioritize readability over decoration
- do not use color as the only signal
- text must remain understandable without icons

---

## 21. Design System — Typography

Primary font:
- Rubik

Reasons:
- multilingual support
- readable on mobile
- soft and friendly tone
- aligns with calm-care product feel

Rules:
- one font across the product
- hierarchy via size and weight
- minimal style variation
- consistency across all screens

Type scale:
- H1: Rubik Regular 36/44
- H2: Rubik Regular 24/28
- H3: Rubik Medium 20/24
- H4: Rubik Medium 16/20
- Body: Rubik Regular 16/24
- Body 2: Rubik Regular 14/20
- H5: Rubik Medium 14/20
- Caption: Rubik Regular 12/16

UI text:
- Button Text: Rubik Medium 16/20
- Tab Text: Rubik Medium 14/20
- Tag/Label: Rubik Medium 12/16
- Card Secondary Text: Rubik Regular 14/20
- Input Text: Rubik Regular 16/24
- Input Placeholder: Rubik Regular 16/24

Principle:
- readability over decoration

---

## 22. Design System — Colors

Base colors:
- Background: #F7F5F0
- Surface: #FFFFFF
- Primary Text: #1F2937
- Secondary Text: #6B7280
- Divider / Border: #E5E7EB

Category accents:
- Vaccinations: #4A6FA5
- Medical History: #8499B1
- Notes: #E9A16D
- Reminders: #426A5A

Error:
- #C96A6A

Buttons:
- Primary/FAB background: #1F2937
- Primary/FAB text/icon: #FFFFFF
- Disabled background: #C7C9CC
- Disabled text/icon: #FFFFFF

Rules:
- category colors are accents only
- do not use category colors for buttons
- do not use category colors as big backgrounds
- keep interface neutral
- no bright, saturated color-heavy screens
- no more than 1–2 accent colors per screen

---

## 23. Design System — Icons

Icon rules:
- outline / linear style
- no fill
- consistent stroke width
- primary size: 24 px
- allowed small size: 16 px

Default colors:
- #1F2937
- #FFFFFF where needed

Category icons may use category accent color.

Allowed:
- inside cards
- next to text
- in buttons
- FAB

Not allowed:
- decorative-only icon clutter
- oversized icons
- mixed icon styles

Suggested mapping:
- Vaccination → syringe
- Medical → cross
- Notes → note
- Reminder → bell

---

## 24. Design System — Buttons

Buttons are action tools, not visual accents.

Button types:
- Primary
- Secondary
- Destructive
- FAB

Primary:
- background: #1F2937
- text: #FFFFFF

Secondary:
- background: transparent
- border: #E5E7EB
- text: #1F2937

Destructive:
- text: #C96A6A
- background: transparent

FAB:
- background: #1F2937
- icon: #FFFFFF

Sizes:
- Large: 48 px height, radius 12
- Medium: 40 px height, radius 10
- Small: 32 px height, radius 8

Rules:
- no category-colored buttons
- buttons must stay neutral
- content holds the meaning, not the buttons

---

## 25. What NOT to Build

DO NOT add:
- search
- filters
- dashboards
- analytics screens
- charts
- AI suggestions
- smart diagnostics
- gamification
- unnecessary onboarding
- visual clutter

---

## 26. Success Condition

The client is correct if:
- user understands the app instantly
- user can add data in seconds
- user can switch pets without confusion
- user can return and see the same pet
- user can show information to a vet without stress
- UI feels calm, clear, and reliable


## Firebase Configuration (STRICT)

The app uses Firebase via the Web SDK.

The LLM MUST:

- Create a dedicated config file:
  `services/firebaseAuth.ts`

- Initialize Firebase using environment variables only
- NEVER hardcode credentials
- NEVER use values directly from Firebase snippet

---

### Required environment variables

- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- EXPO_PUBLIC_FIREBASE_APP_ID
- EXPO_PUBLIC_API_BASE_URL

---

### Optional environment variables (for Google Sign-In)

- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

---

### Rules

- Use initializeApp from firebase/app
- Implement React Native Persistence: When initializing Auth on mobile via the Web SDK, you MUST wrap it with AsyncStorage (e.g., `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`) to prevent users from being logged out on app restart.
- Export initialized app instance
- Do NOT initialize Firebase multiple times
- Do NOT include analytics in MVP
- Do NOT use Firestore (MongoDB is backend)

---

### Backend Auth Handshake

- When calling the custom server backend (via `EXPO_PUBLIC_API_BASE_URL`), the client MUST retrieve the Firebase ID Token upon login or session restore.
- Attach the ID Token as a `Bearer` token in the `Authorization` headers for all **protected** HTTP requests to the backend.
- Call `POST /api/v1/users/me` after every successful Firebase login and on session restore (`onAuthStateChanged`). This upserts the user in MongoDB and updates `last_login_at`.
- Public auth endpoints (`/auth/send-otp`, `/auth/verify-otp`, `/auth/resend-otp`) do NOT use Bearer tokens.

---

### Goal

Firebase is used ONLY for:
- Authentication
- Cloud Storage (for images)
- (optional later) push notifications

It is NOT used for:
- database
- business logic

---

### Android Firebase configuration

To make the `google-services.json` config values accessible to Firebase SDKs, you need the Google services Gradle plugin.

**Kotlin DSL (`build.gradle.kts`)**
**Groovy (`build.gradle`)**

Add the plugin as a dependency to your project-level `build.gradle.kts` file:

**Root-level (project-level) Gradle file (`<project>/build.gradle.kts`):**
```kotlin
plugins {
  // ...

  // Add the dependency for the Google services Gradle plugin
  id("com.google.gms.google-services") version "4.4.4" apply false

}
```

Then, in your module (app-level) `build.gradle.kts` file, add both the google-services plugin and any Firebase SDKs that you want to use in your app:

**Module (app-level) Gradle file (`<project>/<app-module>/build.gradle.kts`):**
```kotlin
plugins {
  id("com.android.application")

  // Add the Google services Gradle plugin
  id("com.google.gms.google-services")

  // ...
}

dependencies {
  // Import the Firebase BoM
  implementation(platform("com.google.firebase:firebase-bom:34.12.0"))


  // TODO: Add the dependencies for Firebase products you want to use
  // When using the BoM, don't specify versions in Firebase dependencies
  implementation("com.google.firebase:firebase-analytics")


  // Add the dependencies for any other desired Firebase products
  // https://firebase.google.com/docs/android/setup#available-libraries
}
```

By using the Firebase Android BoM, your app will always use compatible Firebase library versions. Learn more
After adding the plugin and the desired SDKs, sync your Android project with Gradle files.

---

## Payment Rules (STRICT)

We are building for iOS and Android only. 
The mobile app acts as the client for logging in and using features.

### Client-Side Payments
- **iOS** → Apple In-App Purchases (IAP)
- **Android** → Google Play Billing

### Backend Normalization
- **Backend responsibility**: Normalize all payments into the system.
- Handle tokens and subscriptions centrally on the backend.
- Track payment source centrally as: `ios` | `android`
