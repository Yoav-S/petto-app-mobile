import type { ImageSourcePropType } from 'react-native';
import en from '../locales/en.json';
import he from '../locales/he.json';
import ro from '../locales/ro.json';
import ru from '../locales/ru.json';

export type ReminderCategory =
  | 'general'
  | 'medication'
  | 'vaccination'
  | 'appointment'
  | 'observation';

export const REMINDER_CATEGORIES: ReminderCategory[] = [
  'general',
  'medication',
  'vaccination',
  'appointment',
  'observation',
];

export const CATEGORY_ICONS: Record<ReminderCategory, ImageSourcePropType> = {
  general: require('@/assets/images/reminders/general.png'),
  medication: require('@/assets/images/reminders/medication.png'),
  vaccination: require('@/assets/images/reminders/vaccination.png'),
  appointment: require('@/assets/images/reminders/appointment.png'),
  observation: require('@/assets/images/reminders/observation.png'),
};

const CATALOGS = [en, ro, ru, he] as const;

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
    'vax',
    // RU
    'ежегодная прививка',
    'ревакцинация',
    'вакцинация',
    'вакцинации',
    'прививки',
    'прививка',
    'прививок',
    'вакцина',
    'вакцин',
    'привив',
    'иммунизация',
    'иммуниз',
    'бустер',
    'бешенство',
    'бешенств',
    'лептоспироз',
    'бордетелла',
    'парвовирус',
    'чумка',
    'парво',
    // RO
    'revaccinare',
    'vaccinare',
    'vaccinari',
    'vaccinuri',
    'vaccin',
    'imunizare',
    'rapel',
    'antirabic',
    'rabie',
    // HE
    'חיסון',
    'חיסונים',
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
    'meds',
    'gel',
    // RU
    'глазные капли',
    'ушные капли',
    'дать лекарство',
    'лекарства',
    'лекарство',
    'лекарств',
    'препарат',
    'таблетки',
    'таблетка',
    'таблет',
    'капсулы',
    'капсула',
    'капсул',
    'капли',
    'капл',
    'мазь',
    'маз',
    'крем',
    'спрей',
    'сироп',
    'инсулин',
    'антибиотик',
    'пробиотик',
    'витамины',
    'витамин',
    'дозировка',
    'лечение',
    'лечен',
    'пилюли',
    'пилюля',
    'укол',
    'инъекция',
    'инъекц',
    'суспензия',
    'порошок',
    'противовоспалительн',
    'обезболива',
    // RO
    'picaturi de ochi',
    'picaturi de urechi',
    'picături de ochi',
    'picături de urechi',
    'medicamente',
    'medicament',
    'medicație',
    'medicatie',
    'pastile',
    'pastila',
    'pastilă',
    'pastil',
    'comprimate',
    'comprimat',
    'capsule',
    'capsula',
    'picaturi',
    'picături',
    'picatura',
    'unguent',
    'pomada',
    'crema',
    'sirop',
    'insulina',
    'insulină',
    'antibiotic',
    'probiotic',
    'vitamine',
    'vitamina',
    'tratament',
    'administrare',
    'doza',
    'doze',
    'pilula',
    'pilulă',
    // HE
    'תרופה',
    'תרופות',
    'כדור',
    'כדורים',
    'טיפות',
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
    // RU
    'запись к врачу',
    'ветклиника',
    'ветклиник',
    'ветеринару',
    'ветеринар',
    'повторный приём',
    'повторный прием',
    'консультация',
    'консультац',
    'дрессировка',
    'дрессиров',
    'приёмы',
    'приём',
    'приемы',
    'прием',
    'запись',
    'запис',
    'клиника',
    'клиник',
    'осмотр',
    'груминг',
    'грумер',
    'стрижка',
    'стрижк',
    'визит',
    'больница',
    'больниц',
    'доктор',
    'хирург',
    // RO
    'programari',
    'programări',
    'programare',
    'veterinar',
    'consultatie',
    'consultație',
    'consultatii',
    'clinica',
    'clinică',
    'examinare',
    'toaletaj',
    'grooming',
    'vizita',
    'vizită',
    'spital',
    'doctor',
    'control',
    'rezervare',
    'intalnire',
    'întâlnire',
    'consult',
    // HE
    'תור',
    'וטרינר',
    'מרפאה',
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
    // RU
    'наблюдение',
    'наблюден',
    'мониторинг',
    'монитор',
    'симптомы',
    'симптом',
    'рвота',
    'рвот',
    'понос',
    'диарея',
    'зуд',
    'чешется',
    'аллергия',
    'аллерги',
    'температура',
    'температ',
    'лихорадка',
    'лихорадк',
    'аппетит',
    'хромота',
    'хромает',
    'кашель',
    'кашл',
    'рана',
    'взвешивание',
    'взвесить',
    'вес',
    'моча',
    'моч',
    'стул',
    'поведение',
    'поведен',
    'царапина',
    'царапин',
    'отёк',
    'отек',
    'опухоль',
    'опух',
    'краснота',
    'краснот',
    'дыхание',
    'дыхан',
    'заживление',
    // RO
    'monitorizare',
    'monitoriz',
    'observatie',
    'observație',
    'observare',
    'simptome',
    'simptom',
    'varsaturi',
    'vărsături',
    'diaree',
    'mancarime',
    'mâncărime',
    'alergie',
    'temperatura',
    'temperatură',
    'apetit',
    'schiopatare',
    'șchiopătare',
    'tuse',
    'rana',
    'rană',
    'greutate',
    'urina',
    'urină',
    'scaun',
    'comportament',
    'febra',
    'febră',
    'umflatura',
    'umflătură',
    'zgarietura',
    'zgârietură',
    // HE
    'מעקב',
    'תצפית',
  ],
};

const MATCH_ORDER: Exclude<ReminderCategory, 'general'>[] = [
  'vaccination',
  'medication',
  'appointment',
  'observation',
];

const SHORT_EXACT = 3;

function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a')
    .replace(/î/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(foldedTitle: string): string[] {
  return foldedTitle.split(/[^a-z0-9\u0400-\u04ff\u0590-\u05ff]+/).filter(Boolean);
}

function titleHasKeyword(foldedTitle: string, keyword: string): boolean {
  const foldedKeyword = fold(keyword);
  if (!foldedKeyword) return false;

  if (foldedKeyword.includes(' ')) {
    const escaped = foldedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9\\u0400-\\u04ff\\u0590-\\u05ff])${escaped}(?:[^a-z0-9\\u0400-\\u04ff\\u0590-\\u05ff]|$)`).test(
      foldedTitle,
    );
  }

  const words = titleTokens(foldedTitle);
  if (foldedKeyword.length <= SHORT_EXACT) {
    return words.includes(foldedKeyword);
  }
  return words.some((word) => {
    if (word === foldedKeyword) return true;
    if (word.startsWith(foldedKeyword)) return true;
    return foldedKeyword.startsWith(word) && word.length >= 4;
  });
}

function categoryLabels(category: ReminderCategory): string[] {
  const key = `category_${category}` as const;
  return CATALOGS.map((catalog) => catalog.reminders[key]).filter(Boolean);
}

export function resolveReminderCategory(title: string | null | undefined): ReminderCategory {
  const folded = fold(title ?? '');
  if (!folded) return 'general';

  for (const category of MATCH_ORDER) {
    for (const label of categoryLabels(category)) {
      if (titleHasKeyword(folded, label)) return category;
    }
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (titleHasKeyword(folded, keyword)) return category;
    }
  }
  return 'general';
}

export function reminderCategoryIcon(title: string | null | undefined): ImageSourcePropType {
  return CATEGORY_ICONS[resolveReminderCategory(title)];
}

export function reminderCategoryIconFor(category: ReminderCategory): ImageSourcePropType {
  return CATEGORY_ICONS[category];
}
