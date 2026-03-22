export type ClaimStatus = 'Draft' | 'Submitted' | 'Resubmitted' | 'Approved' | 'Rejected' | 'Paid';

export interface ClaimDenialInfo {
  category: string;
  reasonCode: string;
  details?: string;
  deniedAt: string;
  deniedBy: string;
}

export interface ClaimResubmissionInfo {
  count: number;
  lastResubmittedAt?: string;
  lastResubmittedBy?: string;
  appealNote?: string;
}

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
  denial?: ClaimDenialInfo;
  resubmission?: ClaimResubmissionInfo;

  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}