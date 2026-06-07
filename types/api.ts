export interface UserProfile {
  id: string;
  email: string;
  auth_provider: 'email' | 'google';
  email_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
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
}

export interface Reminder {
  id: string;
  pet_id: string;
  title: string;
  date: string;
  time: string;
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
