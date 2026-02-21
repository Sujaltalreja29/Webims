export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  insurance: {
    type: 'Medicare' | 'Medicaid' | 'Private' | 'Self-Pay';
    insuranceId?: string;
    payerName?: string;
  };
  
  flags: {
    hasAllergies: boolean;
    allergyList?: string;
    isHighRisk: boolean;
  };
  
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  isActive: boolean;
}