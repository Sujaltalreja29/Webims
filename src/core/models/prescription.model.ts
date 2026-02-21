export type PrescriptionStatus = 'Pending' | 'Sent to Pharmacy' | 'Ready' | 'Dispensed' | 'Cancelled';

export interface Prescription {
  id: string;
  rxNumber: string;
  patientId: string;
  providerId: string;
  encounterId?: string;
  
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  
  status: PrescriptionStatus;
  
  dispensedAt?: string;
  dispensedBy?: string;
  
  createdAt: string;
  createdBy: string;
}