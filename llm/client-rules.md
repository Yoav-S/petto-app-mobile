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
- login via email
- logout does NOT delete saved data
- incomplete onboarding must return user to Add Pet

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