export interface Vitals {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

export interface Encounter {
  id: string;
  encounterNumber: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  
  visitDate: string;
  
  chiefComplaint: string;
  vitals?: Vitals;
  
  diagnoses: string[];
  assessment: string;
  plan: string;
  
  followUpDate?: string;
  
  createdAt: string;
  createdBy: string;
}