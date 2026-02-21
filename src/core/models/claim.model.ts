export type ClaimStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid';

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  encounterId: string;
  
  visitDate: string;
  
  diagnosisCodes: string[];
  procedureCodes: string[];
  
  totalAmount: number;
  insuranceType: string;
  
  status: ClaimStatus;
  
  payment?: {
    amountPaid: number;
    paidDate: string;
    method: 'Cash' | 'Card' | 'Insurance';
  };
  
  createdAt: string;
  createdBy: string;
}