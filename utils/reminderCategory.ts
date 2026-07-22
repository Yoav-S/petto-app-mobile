import type { ImageSourcePropType } from 'react-native';

export type ReminderCategory =
  | 'general'
  | 'medication'
  | 'vaccination'
  | 'appointment'
  | 'observation';

const CATEGORY_ICONS: Record<ReminderCategory, ImageSourcePropType> = {
  general: require('@/assets/images/reminders/general.png'),
  medication: require('@/assets/images/reminders/medication.png'),
  vaccination: require('@/assets/images/reminders/vaccination.png'),
  appointment: require('@/assets/images/reminders/appointment.png'),
  observation: require('@/assets/images/reminders/observation.png'),
};

/** Longer / more specific phrases first so "eye drops" beats bare "eye". */
const CATEGORY_KEYWORDS: Record<Exclude<ReminderCategory, 'general'>, string[]> = {
  vaccination: [
    'annual vaccine',
    'next vaccine',
    'vaccine due',
    'booster shot',
    'canine influenza',
    'feline leukemia',
    'revaccination',
    'immunization',
    'immunisation',
    'vaccinations',
    'vaccination',
    'vaccinated',
    'vaccinate',
    'vaccines',
    'vaccine',
    'distemper',
    'parvovirus',
    'bordetella',
    'leptospirosis',
    'booster',
    'rabies',
    'parvo',
    'dhppi',
    'dhpp',
    'fvrcp',
    'lyme',
    'shots',
    'shot',
  ],
  medication: [
    'give medication',
    'take medicine',
    'give medicine',
    'liquid medicine',
    'oral medicine',
    'apply ointment',
    'anti-inflammatory',
    'take pill',
    'apply cream',
    'ear drops',
    'eye drops',
    'nasal spray',
    'medications',
    'medication',
    'prescription',
    'prescribed',
    'painkiller',
    'antibiotic',
    'probiotic',
    'supplements',
    'supplement',
    'treatment',
    'medicate',
    'medicine',
    'capsules',
    'capsule',
    'ointment',
    'vitamins',
    'vitamin',
    'tablets',
    'tablet',
    'insulin',
    'therapy',
    'dosage',
    'syrup',
    'pills',
    'cream',
    'spray',
    'drops',
    'dose',
    'pill',
    'gel',
  ],
  appointment: [
    'scheduled visit',
    'obedience class',
    'animal clinic',
    'nail trimming',
    'consultation',
    'appointments',
    'appointment',
    'veterinarian',
    'veterinary',
    'examination',
    'reservation',
    'follow-up',
    'follow up',
    'check-up',
    'grooming',
    'training',
    'hospital',
    'groomer',
    'trainer',
    'checkup',
    'meeting',
    'session',
    'booking',
    'drop off',
    'pickup',
    'clinic',
    'doctor',
    'haircut',
    'visit',
    'exam',
    'bath',
    'vet',
  ],
  observation: [
    'water intake',
    'monitoring',
    'observation',
    'observing',
    'scratching',
    'breathing',
    'temperature',
    'behaviour',
    'behavior',
    'urination',
    'vomiting',
    'diarrhoea',
    'diarrhea',
    'appetite',
    'recovery',
    'symptoms',
    'allergic',
    'monitor',
    'observe',
    'healing',
    'symptom',
    'scratch',
    'redness',
    'swelling',
    'allergy',
    'itching',
    'drinking',
    'sleeping',
    'limping',
    'progress',
    'inspect',
    'condition',
    'injury',
    'health',
    'wound',
    'rash',
    'itch',
    'skin',
    'ears',
    'eyes',
    'paws',
    'nose',
    'mouth',
    'teeth',
    'tooth',
    'vomit',
    'cough',
    'sneeze',
    'fever',
    'weight',
    'weigh',
    'urine',
    'stool',
    'energy',
    'tired',
    'sleep',
    'photo',
    'check',
    'pain',
    'ear',
    'eye',
    'paw',
    'cut',
  ],
};

const MATCH_ORDER: Exclude<ReminderCategory, 'general'>[] = [
  'vaccination',
  'medication',
  'appointment',
  'observation',
];

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Word-boundary-ish match so "ear" does not hit "hear" / "year". */
function titleHasKeyword(normalizedTitle: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
  return pattern.test(normalizedTitle);
}

export function resolveReminderCategory(title: string | null | undefined): ReminderCategory {
  const normalized = normalizeTitle(title ?? '');
  if (!normalized) return 'general';

  for (const category of MATCH_ORDER) {
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (titleHasKeyword(normalized, keyword)) return category;
    }
  }
  return 'general';
}

export function reminderCategoryIcon(title: string | null | undefined): ImageSourcePropType {
  return CATEGORY_ICONS[resolveReminderCategory(title)];
}
