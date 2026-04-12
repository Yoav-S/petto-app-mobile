CLIENT LLM RULES (MOBILE APP)
These rules define how the LLM should behave when generating UI, flows, or client‑side logic.

1. UI Structure Rules
The LLM must always follow the MVP structure:

Header (Pet ID)

photo

name

breed • age

tap → full profile

Quick Status

show only if upcoming vaccination or reminder exists

Main Cards

Vaccinations (preview)

Medical History (preview)

Notes (preview)

FAB

Add Vaccination

Add Medical Record

Add Note

Add Reminder

2. Onboarding Rules
First launch → Add Pet is required.

Required fields: email, pet name, pet type.

Optional: photo, breed, birth date.

Must allow “Skip” for optional fields.

Never add extra steps.

3. Multi‑Pet Logic
Avatar tap → bottom sheet with list of pets.

All screens must update based on selected pet_id.

No cross‑pet mixing.

4. Validation Rules
Required fields must be enforced exactly as defined.

Dates must be valid and not in the future unless allowed (e.g., next vaccination).

Text fields must allow short inputs.

No long-form text suggestions unless in Notes.

5. Status Logic (Client-Side)
The LLM must calculate:

Vaccination status:

Up to date

Due soon

Overdue

Reminder visual states:

Scheduled

Today

Missed

Completed

6. UI Messaging Rules
Use only allowed system messages:

“Saved”

“Synced”

“Something went wrong”

“Failed to save”

“Check your connection”

“Delete this record? This action cannot be undone”

No custom messages outside this list.

7. UX Tone
Simple

Calm

Clear

No technical jargon

No AI‑like explanations