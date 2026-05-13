# Phase 01 — Home Screen

## Screens Covered
1. Home (default state)
2. Home + FAB expanded state

---

## Visual Breakdown

### Layout Structure
```
SafeAreaView (bg: #F7F5F0)
  ScrollView
    ── TopBar (Switch | Settings)
    ── PetHeader (white bg, rounded bottom)
         ── avatar (rounded square ~100px, radius 20)
         ── pet name (H1, Rubik Regular 28)
         ── breed • age (Body2, Secondary text #6B7280)
    ── CardsGrid (bg: #F7F5F0, padding 16)
         ── Row: [VaccinesCard] [RemindersCard]
         ── HealthCard (full width)
  FAB (absolute, bottom-right)
  FABMenu (overlay, appears when FAB open)
```

---

## Files to Create / Modify

### 1. `constants/theme.ts` — REPLACE ENTIRE FILE
Replace the default Expo placeholder with the Petto design system:

```ts
export const Colors = {
  background: '#F7F5F0',
  surface: '#FFFFFF',
  primaryText: '#1F2937',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  error: '#C96A6A',
  button: {
    primaryBg: '#1F2937',
    primaryText: '#FFFFFF',
    disabledBg: '#C7C9CC',
    disabledText: '#FFFFFF',
  },
  category: {
    vaccines: '#4A6FA5',
    vaccinesBg: '#EBF0F8',
    medical: '#8499B1',
    medicalBg: '#F0F3F7',
    notes: '#E9A16D',
    notesBg: '#FDF3EA',
    reminders: '#426A5A',
    remindersBg: '#EAF2EE',
  },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const FontSize = {
  h1: 36,
  h2: 24,
  h3: 20,
  h4: 16,
  h5: 14,
  body: 16,
  body2: 14,
  caption: 12,
};

export const LineHeight = {
  h1: 44,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 20,
  body: 24,
  body2: 20,
  caption: 16,
};
```

---

### 2. `i18n/index.ts` — NEW

```ts
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { getLocales } from 'expo-localization';

type Translations = typeof import('../locales/en.json');

const locales: Record<string, Translations> = {
  en: require('../locales/en.json'),
  he: require('../locales/he.json'),
};

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
export const currentLocale = locales[deviceLocale] ? deviceLocale : 'en';

// Enable RTL for Hebrew/Arabic
const isRTL = ['he', 'ar'].includes(currentLocale);
I18nManager.forceRTL(isRTL);

export function t(key: string): string {
  const keys = key.split('.');
  let result: any = locales[currentLocale];
  for (const k of keys) {
    result = result?.[k];
  }
  return result ?? key;
}

export { isRTL };
```

---

### 3. `locales/en.json` — NEW

```json
{
  "home": {
    "switch": "Switch",
    "vaccinesCard": {
      "title": "Vaccines",
      "last": "Last:",
      "next": "Next:",
      "empty": "No vaccinations yet"
    },
    "remindersCard": {
      "title": "Reminders",
      "upcoming": "upcoming",
      "empty": "No reminders yet"
    },
    "healthCard": {
      "title": "Health",
      "empty": "No records yet"
    }
  },
  "fab": {
    "vaccines": "Vaccines",
    "health": "Health",
    "reminders": "Reminders"
  },
  "status": {
    "due_soon": "Due Soon",
    "overdue": "Overdue",
    "up_to_date": "Up to date",
    "scheduled": "Scheduled",
    "today": "Today",
    "missed": "Missed",
    "completed": "Completed"
  },
  "common": {
    "today": "Today",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry"
  }
}
```

---

### 4. `locales/he.json` — NEW

```json
{
  "home": {
    "switch": "החלף",
    "vaccinesCard": {
      "title": "חיסונים",
      "last": "אחרון:",
      "next": "הבא:",
      "empty": "אין חיסונים עדיין"
    },
    "remindersCard": {
      "title": "תזכורות",
      "upcoming": "קרובות",
      "empty": "אין תזכורות עדיין"
    },
    "healthCard": {
      "title": "בריאות",
      "empty": "אין רשומות עדיין"
    }
  },
  "fab": {
    "vaccines": "חיסון",
    "health": "בריאות",
    "reminders": "תזכורת"
  },
  "status": {
    "due_soon": "בקרוב",
    "overdue": "באיחור",
    "up_to_date": "מעודכן",
    "scheduled": "מתוכנן",
    "today": "היום",
    "missed": "הוחמץ",
    "completed": "הושלם"
  },
  "common": {
    "today": "היום",
    "loading": "טוען...",
    "error": "משהו השתבש",
    "retry": "נסה שוב"
  }
}
```

---

### 5. `services/api.ts` — NEW

```ts
import auth from './firebaseAuth';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}
```

---

### 6. `services/firebaseAuth.ts` — NEW

```ts
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getApps().length === 1
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export default auth;
```

---

### 7. `store/petStore.ts` — NEW

Lightweight context-based store. No Redux needed.

```ts
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_PET_KEY = '@petto_active_pet_id';

interface PetStoreContextType {
  activePetId: string | null;
  setActivePetId: (id: string) => Promise<void>;
}

const PetStoreContext = createContext<PetStoreContextType | null>(null);

export function PetStoreProvider({ children }: { children: React.ReactNode }) {
  const [activePetId, setActivePetIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_PET_KEY).then((id) => {
      if (id) setActivePetIdState(id);
    });
  }, []);

  async function setActivePetId(id: string) {
    setActivePetIdState(id);
    await AsyncStorage.setItem(ACTIVE_PET_KEY, id);
  }

  return (
    <PetStoreContext.Provider value={{ activePetId, setActivePetId }}>
      {children}
    </PetStoreContext.Provider>
  );
}

export function useActivePet() {
  const ctx = useContext(PetStoreContext);
  if (!ctx) throw new Error('useActivePet must be inside PetStoreProvider');
  return ctx;
}
```

---

### 8. `components/home/PetHeader.tsx` — NEW

Visual spec:
- White background, borderBottomLeftRadius: 24, borderBottomRightRadius: 24
- Avatar: 100×100, borderRadius: 20, object-fit cover
- Name: Rubik Regular, fontSize 28, color #1F2937
- Subtitle: "Breed • X years", Rubik Regular 14, color #6B7280
- Tap anywhere on header or avatar → navigate to `/pet-profile`
- TopBar lives INSIDE this component (Switch button + gear icon)

```tsx
// TopBar row:
// [Switch pill button]          [⚙ gear icon]

// Switch button:
// - border: 1px #E5E7EB
// - borderRadius: 20 (pill)
// - padding: 8 16
// - icon: refresh/switch arrows (outline, 16px, #1F2937)
// - text: t('home.switch'), Rubik Medium 14, #1F2937
// - onPress → open pet switcher bottom sheet (Phase 2)
// - HIDE if only 1 pet

// Gear icon:
// - outline gear icon 24px, #1F2937
// - onPress → navigate to /settings (future phase)

// Skeleton state: show 100px rounded square + 2 text placeholder bars
```

Props:
```ts
interface PetHeaderProps {
  pet: {
    id: string;
    name: string;
    breed?: string;
    birth_date?: string;
    photo_url?: string;
  } | null;
  petCount: number;
  loading: boolean;
  onSwitchPress: () => void;
}
```

Age calculation: derive from `birth_date` on client. Display as "X years" or "X months" if under 1 year.

---

### 9. `components/home/VaccinesCard.tsx` — NEW

Visual spec:
- White surface, borderRadius: 16, padding: 16
- Half width of screen minus spacing
- Top: syringe icon in light blue circle bg (#EBF0F8), icon color #4A6FA5, size 20px, circle ~36px
- Title: "Vaccines" — Rubik Medium 16, #1F2937
- Latest vaccine name: Rubik Regular 16, #1F2937
- "Last: DD.MM.YY" — Rubik Regular 14, #6B7280
- "Next: DD.MM.YY" — Rubik Regular 14, #6B7280
- Empty state: show t('home.vaccinesCard.empty'), no icon row
- Tap → navigate to `/vaccines`
- Skeleton: 3 placeholder bars

Date format rule: display as `DD.MM.YY` (e.g. `10.04.26`). Use `toLocaleDateString` with format options.

Props:
```ts
interface VaccinesCardProps {
  latestVaccine: {
    name: string;
    date: string;       // ISO string from server
    next_date?: string;
  } | null;
  loading: boolean;
  onPress: () => void;
}
```

---

### 10. `components/home/RemindersCard.tsx` — NEW

Visual spec:
- White surface, borderRadius: 16, padding: 16
- Half width of screen minus spacing
- Top: bell icon in light green bg (#EAF2EE), icon color #426A5A, size 20px, circle ~36px
- Title: "Reminders" — Rubik Medium 16, #1F2937
- Next reminder title (e.g. "Vet visit today"): Rubik Regular 16, #1F2937
- Reminder time (e.g. "10:00 AM"): Rubik Regular 14, #6B7280
- Bottom row: "N upcoming ›" — Rubik Regular 14, #6B7280 + chevron-right 16px
- Empty state: show t('home.remindersCard.empty')
- Tap → navigate to `/reminders`

"Today" logic: if reminder date is today → show title as-is. Time format: 10:00 AM (locale-aware).

"N upcoming" = count of reminders with status `scheduled` or `today`.

Props:
```ts
interface RemindersCardProps {
  nextReminder: {
    title: string;
    scheduled_at: string; // ISO
    status: 'today' | 'scheduled' | 'missed' | 'completed';
  } | null;
  upcomingCount: number;
  loading: boolean;
  onPress: () => void;
}
```

---

### 11. `components/home/HealthCard.tsx` — NEW

Visual spec:
- White surface, borderRadius: 16, padding: 16
- Full width
- Left side: heart/health icon in light orange bg (#FDF3EA), icon color #E9A16D, circle ~36px
- Title: "Health" — Rubik Medium 16, #1F2937 (inline with icon)
- Right side: bell icon (#6B7280, 16px) + "Today, HH:MM" — Rubik Regular 14, #6B7280
  - Only show right side if there is a reminder associated with this record
- Below: record type/name — Rubik Regular 16, #1F2937
- Below: short description — Rubik Regular 14, #6B7280 (max 1 line, ellipsis)
- Empty state: t('home.healthCard.empty'), no reminder badge
- Tap → navigate to `/medical`

Props:
```ts
interface HealthCardProps {
  latestRecord: {
    type: string;
    description?: string;
    date: string;
    reminder_time?: string; // e.g. "20:00"
  } | null;
  loading: boolean;
  onPress: () => void;
}
```

---

### 12. `components/home/FABMenu.tsx` — NEW

Visual spec (from screen 2):
- FAB button: 56×56, borderRadius: 28, bg #1F2937, position absolute bottom 32 right 16
- When CLOSED: shows "+" icon (white, 28px)
- When OPEN:
  - FAB changes to "×" icon
  - Overlay: semi-transparent dark background (rgba 0,0,0,0.4)
  - 3 action rows float ABOVE FAB, stacked vertically, right-aligned:
    - Each row: white pill (surface), shadow, padding 12 20, borderRadius 28
    - Row layout: [icon in colored bg circle] [label text]
    - Vaccines: syringe icon (#4A6FA5), label t('fab.vaccines')
    - Health: heart icon (#E9A16D), label t('fab.health')
    - Reminders: bell icon (#426A5A), label t('fab.reminders')
  - Animate in: slide up + fade in (use Animated or Reanimated)
  - Tap outside overlay → close

Navigation on FAB item press:
- Vaccines → `/add-vaccine`
- Health → `/add-medical`
- Reminders → `/add-reminder`

```ts
interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}
```

Animation:
- Use `react-native-reanimated` (already in package.json)
- `withTiming` for opacity, `withSpring` for translateY
- Each menu item staggers: 0ms, 60ms, 120ms delay

---

### 13. `app/(tabs)/index.tsx` — REWRITE

This is the Home screen. It:
1. Reads `activePetId` from `PetStoreContext`
2. On mount, fetches:
   - `GET /pets` → to get pet list and hydrate active pet
   - `GET /pets/{activePetId}/vaccinations?limit=1&sort=desc`
   - `GET /pets/{activePetId}/reminders?status=scheduled,today&limit=1`
   - `GET /pets/{activePetId}/medical-records?limit=1&sort=desc`
3. Passes data to each card component
4. No tab bar — remove the Tabs navigation (see below)

```tsx
// Full screen layout (NO TABS):
<SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
  <ScrollView showsVerticalScrollIndicator={false}>
    <PetHeader pet={pet} petCount={pets.length} loading={loading} onSwitchPress={...} />
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <VaccinesCard ... style={{ flex: 1 }} />
        <RemindersCard ... style={{ flex: 1 }} />
      </View>
      <HealthCard ... />
    </View>
  </ScrollView>
  <FABMenu ... />
</SafeAreaView>
```

---

### 14. `app/(tabs)/_layout.tsx` — REPLACE

Remove the tab bar entirely. Home is a standalone screen.

```tsx
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

---

### 15. `app/_layout.tsx` — MODIFY

Wrap the app with `PetStoreProvider`:

```tsx
import { PetStoreProvider } from '@/store/petStore';

// Inside RootLayout return:
<PetStoreProvider>
  <ThemeProvider ...>
    <Stack>...</Stack>
    <StatusBar style="auto" />
  </ThemeProvider>
</PetStoreProvider>
```

---

## i18n Notes

- ALL text in every component must use `t('key')` — zero hardcoded strings
- Date display: `DD.MM.YY` format is locale-neutral visually, but use `toLocaleDateString` with the device locale for accessibility
- RTL: all row layouts (icon + text) must use `flexDirection: 'row'` which auto-flips in RTL. Do NOT use `marginLeft` — use `marginStart` or `gap`
- "Breed • age" separator dot: use `' \u2022 '` (unicode bullet) — renders in all locales

---

## API Endpoints Used in This Phase

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/pets` | List all user's pets |
| GET | `/pets/{id}/vaccinations?limit=1&sort=desc` | Latest vaccination for card |
| GET | `/pets/{id}/reminders?status=scheduled,today&limit=5` | Next reminder + count |
| GET | `/pets/{id}/medical-records?limit=1&sort=desc` | Latest medical record for card |

---

## Dependencies to Install

```bash
npx expo install @react-native-async-storage/async-storage expo-localization firebase
```

- `@react-native-async-storage/async-storage` — pet store + Firebase auth persistence
- `expo-localization` — detect device locale for i18n
- `firebase` — Firebase Web SDK (auth + storage)

---

## Skeleton Loading Spec

Each card must show a skeleton when `loading === true`:

- Use `Animated` looping opacity (0.4 → 1 → 0.4) on gray placeholder bars
- Placeholder bar color: `#E5E7EB`
- Avatar skeleton: 100×100 rounded square
- Text skeletons: width 60–80%, height 12–16px, borderRadius 6

---

## Empty State Rules

- Show empty state text per card (no data yet)
- Do NOT hide the card — always show it
- Empty state: centered text in Rubik Regular 14, #6B7280
- Cards with empty state still navigate to full section on tap

---

## Error Handling

- On fetch failure: show a subtle inline retry link inside each card
- Text: t('common.error') + t('common.retry')
- No blocking modals, no full-screen error screens
