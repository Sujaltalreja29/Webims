export const COMMON_DIAGNOSES = [
  'Hypertension (High Blood Pressure)',
  'Type 2 Diabetes',
  'Upper Respiratory Infection',
  'Acute Bronchitis',
  'Urinary Tract Infection',
  'Anxiety Disorder',
  'Depression',
  'Osteoarthritis',
  'Migraine',
  'Asthma',
  'Hyperlipidemia (High Cholesterol)',
  'Back Pain',
  'Allergic Rhinitis',
  'GERD (Acid Reflux)',
  'Hypothyroidism'
];

export const COMMON_PROCEDURES = [
  'Office Visit - New Patient',
  'Office Visit - Established Patient',
  'Annual Physical Exam',
  'Blood Pressure Check',
  'Blood Test - Basic Panel',
  'Urinalysis',
  'X-Ray',
  'ECG (Electrocardiogram)',
  'Immunization - Flu Vaccine',
  'Wound Care'
];

export const COMMON_MEDICATIONS = [
  'Lisinopril (Blood Pressure)',
  'Metformin (Diabetes)',
  'Atorvastatin (Cholesterol)',
  'Amlodipine (Blood Pressure)',
  'Omeprazole (Acid Reflux)',
  'Levothyroxine (Thyroid)',
  'Albuterol Inhaler (Asthma)',
  'Amoxicillin (Antibiotic)',
  'Ibuprofen (Pain)',
  'Acetaminophen (Pain)'
];

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// src/core/constants/medical-codes.ts

export const DIAGNOSIS_CODES = [
  'Hypertension (High Blood Pressure)',
  'Type 2 Diabetes Mellitus',
  'Hyperlipidemia (High Cholesterol)',
  'Asthma',
  'GERD (Acid Reflux)',
  'Hypothyroidism',
  'Anxiety Disorder',
  'Depression',
  'Osteoarthritis',
  'Urinary Tract Infection',
  'Upper Respiratory Infection',
  'Acute Bronchitis',
  'Migraine',
  'Back Pain (Lower)',
  'Obesity',
  'Atrial Fibrillation',
  'Heart Failure',
  'Chronic Kidney Disease',
  'Anemia',
  'Vitamin D Deficiency'
] as const;

export const PROCEDURE_CODES = [
  { code: '99201', description: 'Office Visit - New Patient (Level 1)' },
  { code: '99202', description: 'Office Visit - New Patient (Level 2)' },
  { code: '99203', description: 'Office Visit - New Patient (Level 3)' },
  { code: '99211', description: 'Office Visit - Established Patient (Level 1)' },
  { code: '99212', description: 'Office Visit - Established Patient (Level 2)' },
  { code: '99213', description: 'Office Visit - Established Patient (Level 3)' },
  { code: '99214', description: 'Office Visit - Established Patient (Level 4)' },
  { code: '99215', description: 'Office Visit - Established Patient (Level 5)' },
  { code: '99283', description: 'Emergency Department Visit (Level 3)' },
  { code: '99284', description: 'Emergency Department Visit (Level 4)' },
  { code: '80050', description: 'General Health Panel (Lab)' },
  { code: '80053', description: 'Comprehensive Metabolic Panel (Lab)' },
  { code: '85025', description: 'Complete Blood Count (CBC)' },
  { code: '93000', description: 'Electrocardiogram (ECG)' },
  { code: '71046', description: 'Chest X-Ray (2 views)' },
  { code: '96372', description: 'Therapeutic Injection' },
  { code: '36415', description: 'Blood Draw / Venipuncture' },
  { code: '94640', description: 'Nebulizer Treatment' },
  { code: '99213-25', description: 'Office Visit with Preventive Care' },
  { code: 'G0439', description: 'Annual Wellness Visit (Medicare)' }
] as const;

export const INSURANCE_TYPES = [
  'Private',
  'Medicare',
  'Medicaid',
  'Self-Pay',
  'Workers Comp',
  'Tricare',
  'Other'
] as const;