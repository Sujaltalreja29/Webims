export type ShiftType = 'Day' | 'Evening' | 'Night';
export type NutritionIntake = 'Full' | 'Partial' | 'Minimal' | 'None';
export type HydrationIntake = 'Adequate' | 'Limited' | 'Poor';
export type MoodType = 'Happy' | 'Calm' | 'Anxious' | 'Agitated' | 'Sad' | 'Withdrawn';

export type ActivityType =
  | 'Meal'
  | 'Medication'
  | 'Bath/Hygiene'
  | 'Exercise'
  | 'Social Activity'
  | 'Vital Signs'
  | 'Wound Care'
  | 'Physical Therapy'
  | 'Other';

export interface CareActivity {
  type: ActivityType;
  description: string;
  time: string;
  completed: boolean;
}

export interface MedicationAdministration {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  administered: boolean;
  administeredTime?: string;
  refusedReason?: string;
  notes?: string;
}

export interface CareNoteVitals {
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  weight?: string;
  oxygenSaturation?: string;
  respiratoryRate?: string;
  bloodSugar?: string;
}

export interface CareNote {
  id: string;
  careNoteNumber: string;
  residentId: string;

  shift: ShiftType;
  date: string;
  startTime: string;
  endTime: string;

  caregiverId: string;
  caregiverName: string;

  activities: CareActivity[];

  vitals?: CareNoteVitals;

  medications: MedicationAdministration[];

  nutritionIntake: NutritionIntake;
  hydrationIntake: HydrationIntake;

  painLevel: number; // 0–10
  mood: MoodType;

  behavioralNotes?: string;
  skinCondition?: string;
  eliminationNotes?: string;

  alerts?: string;
  followUpNeeded: boolean;
  followUpReason?: string;

  signedBy: string;
  signedAt: string;

  createdAt: string;
  createdBy: string;
}