export type CareLevel = 'Independent' | 'Assisted' | 'Skilled Nursing' | 'Memory Care';
export type ResidentStatus = 'Active' | 'Discharged' | 'Hospital Transfer';
export type MobilityStatus = 'Independent' | 'Walker' | 'Wheelchair' | 'Bedridden';
export type CognitiveStatus = 'Alert' | 'Mild Impairment' | 'Moderate Impairment' | 'Severe Impairment';

export interface Resident {
  id: string;
  residentNumber: string;

  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  email?: string;

  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  admissionDate: string;
  roomNumber: string;
  bedNumber: string;

  careLevel: CareLevel;
  status: ResidentStatus;

  medicalConditions: string[];
  allergies?: string;
  primaryPhysician?: string;

  mobilityStatus: MobilityStatus;
  cognitiveStatus: CognitiveStatus;

  dietaryRestrictions?: string;
  dnrStatus: boolean;

  insuranceType?: string;
  insuranceId?: string;

  dischargeDate?: string;
  dischargeReason?: string;

  notes?: string;

  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}