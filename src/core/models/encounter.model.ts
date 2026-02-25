export interface Vitals {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export type EncounterStatus = 'Open' | 'Closed';

export interface Encounter {
  id: string;
  encounterNumber: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  
  visitDate: string;
  
  chiefComplaint: string;
  vitals?: Vitals;
  
  // Physical Examination
  physicalExam?: string;
  
  diagnoses: string[];
  assessment: string;
  plan: string;
  
  followUpDate?: string;
  
  // Related records
  prescriptionIds?: string[];
  labOrderIds?: string[];
  claimId?: string;
  
  // Status
  status: EncounterStatus;
  closedAt?: string;
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}