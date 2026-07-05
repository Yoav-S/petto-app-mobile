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
  date: string;
  next_date?: string | null;
  status: string;
  note?: string | null;
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
}

export interface MedicalRecord {
  id: string;
  pet_id: string;
  title: string;
  status: string;
  created_at: string;
  latest_note_preview?: string | null;
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
