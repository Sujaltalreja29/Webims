export interface DenialReasonOption {
  code: string;
  label: string;
}

export interface DenialCategory {
  id: string;
  label: string;
  reasons: DenialReasonOption[];
}

export const DENIAL_CATEGORIES: DenialCategory[] = [
  {
    id: 'coding',
    label: 'Coding Error',
    reasons: [
      { code: 'DX_MISMATCH', label: 'Diagnosis does not support procedure' },
      { code: 'MISSING_MODIFIER', label: 'Missing or invalid modifier' },
      { code: 'INVALID_CODE_SET', label: 'Invalid/expired code set' }
    ]
  },
  {
    id: 'eligibility',
    label: 'Eligibility / Coverage',
    reasons: [
      { code: 'COVERAGE_INACTIVE', label: 'Coverage inactive on date of service' },
      { code: 'NON_COVERED_SERVICE', label: 'Service is not covered by plan' },
      { code: 'AUTH_REQUIRED', label: 'Prior authorization required' }
    ]
  },
  {
    id: 'timely-filing',
    label: 'Timely Filing',
    reasons: [
      { code: 'FILED_LATE', label: 'Claim filed after payer deadline' },
      { code: 'INCORRECT_RECEIPT_DATE', label: 'Date of receipt discrepancy' }
    ]
  },
  {
    id: 'administrative',
    label: 'Administrative',
    reasons: [
      { code: 'MISSING_DOCUMENTATION', label: 'Missing required documentation' },
      { code: 'DUPLICATE_CLAIM', label: 'Claim appears to be duplicate' },
      { code: 'PATIENT_DEMOGRAPHICS', label: 'Patient demographics mismatch' }
    ]
  }
];