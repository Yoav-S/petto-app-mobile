# PETTO — CLIENT LLM RULES (MOBILE APP)

## 0. Core Principle

This app is NOT a feature-rich system.

This is a **simple, fast, stress-free pet passport**.

The user must feel:
“I don’t need to remember anything anymore.”

Priorities:
1. Speed
2. Simplicity
3. Clarity
4. Low friction

DO NOT:
- Add extra screens
- Add unnecessary features
- Add complex UI patterns

---

## 1. App Structure (STRICT)

The LLM MUST follow this structure:

### Header (Pet ID)
- photo
- name
- breed • age
Tap → Full Profile

---

### Quick Status
Show ONLY if exists:
- nearest reminder
- OR vaccination

Show ONE item only (priority):
1. Today reminder
2. Upcoming reminder
3. Due vaccination
4. Overdue vaccination

---

### Main Cards

Vaccinations (preview)
Medical History (preview)
Notes (preview)

Each shows ONLY latest item.

---

### FAB (GLOBAL ADD)

Must open:

- Add Vaccination
- Add Medical Record
- Add Note
- Add Reminder

---

## 2. Onboarding (STRICT)

- First launch → Add Pet required
- Required:
  email, pet name, pet type
- Optional:
  photo, breed, birth date

Rules:
- Must allow Skip
- No extra steps
- No tutorials
- No onboarding flow expansion

---

## 3. Multi-Pet Logic

- Avatar tap → bottom sheet
- Switch pet instantly
- All data depends on pet_id

Rules:
- NEVER mix pet data
- ALWAYS refresh UI on switch

---

## 4. Input UX Rules

- Minimal typing
- Short inputs only
- No long forms

Forms must be:
- fast
- clear
- optional where possible

---

## 5. Validation Rules

- Required fields enforced strictly
- Dates:
  - past → records
  - future → reminders only

- Inline validation only
- No blocking popups

---

## 6. Status Display Rules

Client reflects server status.

Vaccination:
- Up to date
- Due soon
- Overdue

Reminder:
- Scheduled
- Today
- Missed
- Completed

Use simple visual indicators only.

---

## 7. Messaging Rules (STRICT)

ONLY allowed messages:

- “Saved”
- “Synced”
- “Something went wrong”
- “Failed to save”
- “Check your connection”
- “Delete this record? This action cannot be undone”

No extra text.
No explanations.
No system verbosity.

---

## 8. UX Tone

Must be:

- Calm
- Friendly
- Minimal
- Non-technical

Avoid:
- medical jargon
- complex language
- instructions overload

---

## 9. Navigation Rules

- Single main screen (Home)
- Navigation via:
  - cards
  - profile
  - FAB

DO NOT:
- introduce tabs
- introduce deep navigation stacks

---

## 10. Empty States

Must be present:

Vaccinations:
→ “No vaccinations yet”

Medical:
→ “No records yet”

Notes:
→ “No notes yet”

Reminders:
→ “No reminders yet”

Each must include CTA:
→ Add

---

## 11. Offline Behavior

- Show data offline
- Allow adding records
- Sync silently later

If offline:
→ “Check your connection”

---

## 12. Performance Rules

- Avoid heavy animations
- Use skeleton loading
- Fast screen transitions

---

## 13. What NOT to Build

DO NOT add:

- search
- filters
- dashboards
- analytics
- charts
- AI suggestions

---

## 14. Success Condition

The UI is correct if:

- User can open app and understand instantly
- User can add data in seconds
- User can show vet data without thinking
