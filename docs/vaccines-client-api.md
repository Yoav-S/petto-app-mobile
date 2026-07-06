# Vaccines flow — client → server contract

This documents exactly what the **client** now calls for the vaccines feature, so the
server side can implement/confirm the matching endpoints. Scope here is **list, details,
inline edit, delete** (the "add" screen is next and will be documented separately, but its
endpoint is already listed below).

## Conventions

- **Base URL:** `EXPO_PUBLIC_API_BASE_URL` + prefix `/api/v1`.
- **Auth:** every request sends `Authorization: Bearer <Firebase ID token>`.
- **Content type:** `application/json` for bodies.
- **Dates:** `date` / `next_date` are calendar dates in **`YYYY-MM-DD`** format.
- **Timestamps:** `created_at` is an ISO 8601 datetime string.
- **Deletes:** server should respond **`204 No Content`**.
- **Errors:** client expects the existing error-code envelope (mapped via `errorCodes`), e.g. `{ "code": "not_found" }` with the proper HTTP status.
- **Active pet:** `{petId}` is the currently selected pet (`useActivePet()`), never hardcoded.

## Vaccination model (server response shape)

```jsonc
{
  "id": "string",
  "pet_id": "string",
  "name": "string",              // e.g. "Rabies"
  "date": "YYYY-MM-DD",          // "Vaccinated on"
  "next_date": "YYYY-MM-DD|null",// "Valid until" (optional)
  "status": "up_to_date|due_soon|overdue", // server-computed (not shown in list UI now, safe to keep)
  "photo_url": "https://...|null",   // proof photo (see Photo handling)
  "vet_clinic": "string|null",       // "Veterinarian / Clinic"
  "note": "string|null",             // optional; used by the add screen
  "created_at": "ISO-8601"
}
```

### New fields to add server-side
The client now reads/writes two fields that may not exist yet:
- **`photo_url`** — URL string of the proof photo.
- **`vet_clinic`** — free-text veterinarian / clinic name.

## Endpoints used by the client

### 1. List vaccinations
```
GET /api/v1/pets/{petId}/vaccinations
→ 200 OK: Vaccination[]
```
- Rendered as a list (thumbnail = `photo_url`, name, "Vaccinated on" `date`, "Valid until" `next_date`).
- Supports pull-to-refresh and re-fetches on screen focus.
- Order: client renders as-is; recommend newest `date` first (or `created_at` desc).

### 2. Get one vaccination
```
GET /api/v1/pets/{petId}/vaccinations/{id}
→ 200 OK: Vaccination
→ 404 (code "not_found") if missing/deleted
```
- Powers the details screen.

### 3. Update (inline edit) — partial PATCH
```
PATCH /api/v1/pets/{petId}/vaccinations/{id}
body: { any subset of the editable fields }
→ 200 OK: Vaccination (full, updated)
```
Editable fields the client sends (each independently, on commit):
- `name` (on name blur, non-empty)
- `date` (after date picker confirm)
- `next_date` (after date picker confirm)
- `vet_clinic` (on blur; may be `null` to clear)
- `photo_url` (after a new photo is uploaded)

Notes for server:
- Treat body as a **partial** update; only mutate provided keys.
- `null` is a valid value to **clear** `vet_clinic` / `next_date` / `photo_url`.
- Return the full updated object (client replaces local state with the response).

### 4. Delete
```
DELETE /api/v1/pets/{petId}/vaccinations/{id}
→ 204 No Content
```

### 5. Create (add screen)
```
POST /api/v1/pets/{petId}/vaccinations
body: {
  "name": "string",              // required
  "date": "YYYY-MM-DD",          // required — defaults to today on client
  "next_date": "YYYY-MM-DD",     // optional but client always sends today + 1 year by default
  "photo_url": "https://...|null", // optional proof photo URL (Firebase Storage)
  "vet_clinic": "string|null",   // optional
  "note": "string|null"          // optional (not on add UI yet)
}
→ 201/200: Vaccination
```
When `next_date` is set the server auto-creates a linked reminder — no extra client work.

**Client add-screen defaults:**
- `date` = today (local calendar date)
- `next_date` = exactly one calendar year after `date`
- Changing "Vaccinated on" recalculates `next_date` to +1 year from the new date
- User may override "Valid until" independently via inline calendar

## Photo handling (important)

The client does **not** upload image binaries to your API. It uploads the picked image to
**Firebase Storage** under `users/{uid}/vaccines/<timestamp>.jpg`, gets back the public
download URL, and then sends that URL as the `photo_url` string in the PATCH/POST body.

So the server only needs to **store and return the `photo_url` string** — no multipart
handling required. The proof photo is shown inline on the details screen with a fullscreen
viewer (expand icon) and can be replaced by tapping it (re-upload → new URL → PATCH).

## Client behavior summary (per screen)

- **List (`app/vaccines.tsx`)** — `GET list`; thumbnail + name + Vaccinated on / Valid until; tap → details; `+` FAB → add; loading / empty / error + retry; pull-to-refresh.
- **Details (`app/vaccines/[id].tsx`)** — `GET one`; inline editing with **auto-save on commit** (no explicit save button, matching the design): name (blur), dates (picker confirm), clinic (blur), photo (upload→PATCH). Delete uses a confirm dialog → `DELETE` → back. Fullscreen photo viewer.
- **Delete dialog** — "Delete vaccine? / This action cannot be undone." → `DELETE`.

## Status field
The list UI no longer renders the status badge, but `status` is still part of the model and
used elsewhere (home card). Keep computing it (`up_to_date` / `due_soon` / `overdue`) from
`next_date` relative to today.
