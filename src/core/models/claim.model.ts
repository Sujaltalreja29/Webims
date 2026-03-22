export type ClaimStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid';

export interface ClaimStatusChange {
  status: ClaimStatus;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export interface PaymentInfo {
  amountPaid: number;
  paidDate: string;
  method: 'Cash' | 'Check' | 'Credit Card' | 'Insurance' | 'Other';
  referenceNumber?: string;
  notes?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  encounterId?: string;          // optional — manual claims may not have one

  visitDate: string;

  diagnosisCodes: string[];
  procedureCodes: string[];

  totalAmount: number;
  insuranceType: string;

  status: ClaimStatus;

  payment?: PaymentInfo;         // expanded from old model

  statusHistory?: ClaimStatusChange[];
  paymentReference?: string;
  rejectionReason?: string;

  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}