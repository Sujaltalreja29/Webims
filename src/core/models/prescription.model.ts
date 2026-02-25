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
  instructions?: string;
  
  status: PrescriptionStatus;
  
  dispensedAt?: string;
  dispensedBy?: string;
  
  // NEW: Cancellation tracking
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  
  // NEW: General tracking
  updatedAt?: string;
  updatedBy?: string;
  notes?: string; // Pharmacist notes
  
  createdAt: string;
  createdBy: string;
}