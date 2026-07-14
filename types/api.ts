export interface UserProfile {
  id: string;
  email: string;
  auth_provider: 'email' | 'google';
  email_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
  // Server-driven post-login routing: true → go to app, false → onboarding.
  has_pets: boolean;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  photo_url?: string | null;
  breed?: string | null;
  birth_date?: string | null;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  name: string;
  /** Date the vaccine was administered ("Vaccinated on"). */
  date: string;
  /** Date the vaccine is valid until ("Valid until"). */
  next_date?: string | null;
  status: string;
  note?: string | null;
  /** URL of the uploaded proof photo (vaccine card / certificate). */
  photo_url?: string | null;
  /** Veterinarian or clinic name. */
  vet_clinic?: string | null;
  created_at?: string;
}

export interface Reminder {
  id: string;
  pet_id: string;
  title: string;
  date: string;
  time: string;
  repeat: string;
  status: string;
  note?: string | null;
  notified_at?: string | null;
}

export interface MedicalRecord {
  id: string;
  pet_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  latest_note_preview?: string | null;
  latest_note_id?: string | null;
  latest_note_photo_url?: string | null;
  linked_reminder_date?: string | null;
  linked_reminder_time?: string | null;
}

export interface HealthNote {
  id: string;
  medical_record_id: string;
  text: string;
  photo_url?: string | null;
  linked_reminder_id?: string | null;
  linked_reminder_date?: string | null;
  linked_reminder_time?: string | null;
  created_at: string;
}

export interface MedicalRecordDetail extends MedicalRecord {
  notes: HealthNote[];
}
