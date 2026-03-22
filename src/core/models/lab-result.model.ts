export type LabTestType = 'Blood Test' | 'Urinalysis' | 'X-Ray' | 'ECG' | 'MRI' | 'CT Scan' | 'Ultrasound' | 'Other';
export type LabStatus = 'Ordered' | 'In Progress' | 'Completed' | 'Cancelled';

export interface LabResult {
  id: string;
  labOrderNumber: string;
  patientId: string;
  encounterId?: string;
  orderedBy: string;
  orderedByName?: string;

  testName: string;
  testType: LabTestType;
  status: LabStatus;

  result?: string;
  normalRange?: string;
  isAbnormal?: boolean;
  notes?: string;

  orderedDate: string;
  completedDate?: string;

  // Added for result entry workflow
  enteredBy?: string;
  enteredByName?: string;

  createdAt: string;
  createdBy: string;
}