import { User, Patient, Appointment, Encounter, Prescription, Claim, LabResult,RefillRequest } from '../models';
import { storageService } from './storage.service';
import type { MedicationInventory, StockTransaction } from '../models';
import type { Resident, CareNote } from '../models';

const toDateOnly = (date: Date): string => date.toISOString().split('T')[0];

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildRollingVisitSeed = () => {
  const today = new Date();
  const twoDaysAgo = toDateOnly(addDays(today, -2));
  const yesterday = toDateOnly(addDays(today, -1));
  const todayStr = toDateOnly(today);
  const tomorrow = toDateOnly(addDays(today, 1));

  const appointments: Appointment[] = [
    {
      id: 'appt-1',
      appointmentNumber: 'APT12345001',
      patientId: 'patient-1',
      providerId: 'user-1',
      appointmentType: 'Follow-up',
      date: twoDaysAgo,
      startTime: '09:00',
      duration: 30,
      status: 'Completed',
      reason: 'Blood pressure follow-up',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-2',
      appointmentNumber: 'APT12345002',
      patientId: 'patient-2',
      providerId: 'user-1',
      appointmentType: 'Follow-up',
      date: yesterday,
      startTime: '10:00',
      duration: 30,
      status: 'Completed',
      reason: 'Diabetes medication check',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-3',
      appointmentNumber: 'APT12345003',
      patientId: 'patient-3',
      providerId: 'user-1',
      appointmentType: 'Urgent',
      date: todayStr,
      startTime: '14:00',
      duration: 30,
      status: 'Checked-in',
      reason: 'Fever and cough',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-4',
      appointmentNumber: 'APT12345004',
      patientId: 'patient-1',
      providerId: 'user-1',
      appointmentType: 'Follow-up',
      date: todayStr,
      startTime: '16:00',
      duration: 30,
      status: 'Scheduled',
      reason: 'Review blood pressure log',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-5',
      appointmentNumber: 'APT12345005',
      patientId: 'patient-2',
      providerId: 'user-1',
      appointmentType: 'Follow-up',
      date: tomorrow,
      startTime: '09:30',
      duration: 30,
      status: 'Scheduled',
      reason: 'Lab results review',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-6',
      appointmentNumber: 'APT12345006',
      patientId: 'patient-3',
      providerId: 'user-1',
      appointmentType: 'Telehealth',
      date: tomorrow,
      startTime: '11:30',
      duration: 20,
      status: 'Scheduled',
      reason: 'Symptom follow-up',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    }
  ];

  const encounters: Encounter[] = [
    {
      id: 'enc-1',
      encounterNumber: 'ENC12345001',
      patientId: 'patient-1',
      providerId: 'user-1',
      appointmentId: 'appt-1',
      visitDate: twoDaysAgo,
      chiefComplaint: 'Follow-up for hypertension',
      vitals: {
        bloodPressure: '136/86',
        pulse: 76,
        temperature: 98.4,
        weight: 184,
        height: 72
      },
      diagnoses: ['Hypertension (High Blood Pressure)'],
      assessment: 'Blood pressure improved compared with previous visit.',
      plan: 'Continue Lisinopril 20mg daily. Home BP checks and low-sodium diet.',
      status: 'Closed',
      followUpDate: tomorrow,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    },
    {
      id: 'enc-2',
      encounterNumber: 'ENC12345002',
      patientId: 'patient-2',
      providerId: 'user-1',
      appointmentId: 'appt-2',
      visitDate: yesterday,
      chiefComplaint: 'Diabetes management follow-up',
      vitals: {
        bloodPressure: '128/82',
        pulse: 74,
        temperature: 98.5,
        weight: 161,
        height: 66
      },
      diagnoses: ['Type 2 Diabetes Mellitus'],
      assessment: 'Glucose trend stable with current regimen.',
      plan: 'Maintain current medications. Repeat A1c in 3 months.',
      status: 'Closed',
      followUpDate: tomorrow,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
  ];

  const claims: Claim[] = [
    {
      id: 'claim-1',
      claimNumber: 'CLM12345001',
      patientId: 'patient-1',
      encounterId: 'enc-1',
      visitDate: twoDaysAgo,
      diagnosisCodes: ['Hypertension (High Blood Pressure)'],
      procedureCodes: ['Office Visit - Established Patient'],
      totalAmount: 150,
      insuranceType: 'Private',
      status: 'Paid',
      payment: {
        amountPaid: 150,
        paidDate: yesterday,
        method: 'Insurance',
        referenceNumber: 'EOB-15001'
      },
      createdAt: new Date().toISOString(),
      createdBy: 'user-4'
    },
    {
      id: 'claim-2',
      claimNumber: 'CLM12345002',
      patientId: 'patient-2',
      encounterId: 'enc-2',
      visitDate: yesterday,
      diagnosisCodes: ['Type 2 Diabetes Mellitus'],
      procedureCodes: ['Office Visit - Established Patient'],
      totalAmount: 145,
      insuranceType: 'Medicare',
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      createdBy: 'user-4'
    }
  ];

  return {
    appointments,
    encounters,
    claims
  };
};

const extraSeedUsers: User[] = [
  {
    id: 'user-7',
    fullName: 'Dr. Olivia Carter',
    email: 'doctor2@webims.com',
    password: 'password',
    role: 'DOCTOR',
    department: 'CLINIC',
    phone: '555-0107',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'user-8',
    fullName: 'Daniel Kim',
    email: 'nurse2@webims.com',
    password: 'password',
    role: 'NURSE',
    department: 'CLINIC',
    phone: '555-0108',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

const extraSeedPatients: Patient[] = [
  {
    id: 'patient-4',
    mrn: 'MRN001234570',
    firstName: 'Patricia',
    lastName: 'Lopez',
    dateOfBirth: '1968-05-04',
    gender: 'Female',
    phone: '555-4001',
    email: 'patricia.lopez@email.com',
    address: {
      street: '210 Willow St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704'
    },
    emergencyContact: {
      name: 'Miguel Lopez',
      relationship: 'Spouse',
      phone: '555-4002'
    },
    insurance: {
      type: 'Private',
      insuranceId: 'INS555901',
      payerName: 'Aetna'
    },
    flags: {
      hasAllergies: false,
      isHighRisk: false
    },
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    isActive: true
  },
  {
    id: 'patient-5',
    mrn: 'MRN001234571',
    firstName: 'Ronald',
    lastName: 'Baker',
    dateOfBirth: '1959-12-18',
    gender: 'Male',
    phone: '555-5001',
    email: 'ronald.baker@email.com',
    address: {
      street: '88 Riverbend Dr',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62705'
    },
    emergencyContact: {
      name: 'Sandra Baker',
      relationship: 'Wife',
      phone: '555-5002'
    },
    insurance: {
      type: 'Medicare',
      insuranceId: 'MED129991',
      payerName: 'Medicare'
    },
    flags: {
      hasAllergies: true,
      allergyList: 'Sulfa drugs',
      isHighRisk: true
    },
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    isActive: true
  },
  {
    id: 'patient-6',
    mrn: 'MRN001234572',
    firstName: 'Aisha',
    lastName: 'Patel',
    dateOfBirth: '1995-09-27',
    gender: 'Female',
    phone: '555-6001',
    email: 'aisha.patel@email.com',
    address: {
      street: '742 Cedar View',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62706'
    },
    emergencyContact: {
      name: 'Rahul Patel',
      relationship: 'Brother',
      phone: '555-6002'
    },
    insurance: {
      type: 'Medicaid',
      insuranceId: 'MCD778201',
      payerName: 'Illinois Medicaid'
    },
    flags: {
      hasAllergies: false,
      isHighRisk: false
    },
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    isActive: true
  }
];

const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
  const existingIds = new Set(existing.map((item) => item.id));
  const additions = incoming.filter((item) => !existingIds.has(item.id));
  return [...existing, ...additions];
};

let seedRefillRequests: RefillRequest[] = [];
let seedMedicationInventory: MedicationInventory[] = [];
let seedStockTransactions: StockTransaction[] = [];


export const seedData = () => {
  const rollingVisitSeed = buildRollingVisitSeed();

  // Check if data already exists
  if (storageService.get('users')) {
    const existingUsers = storageService.get<User[]>('users') || [];
    const existingPatients = storageService.get<Patient[]>('patients') || [];

    storageService.set('users', mergeById(existingUsers, extraSeedUsers));
    storageService.set('patients', mergeById(existingPatients, extraSeedPatients));

    // Refresh date-sensitive visit data to keep dashboards useful in demos.
    storageService.set('appointments', rollingVisitSeed.appointments);
    storageService.set('encounters', rollingVisitSeed.encounters);
    storageService.set('claims', rollingVisitSeed.claims);

    // Backfill newer datasets for existing localStorage installs.
    if (!storageService.get('refill_requests')) {
      storageService.set('refill_requests', seedRefillRequests);
    }

    if (!storageService.get('medication_inventory')) {
      storageService.set('medication_inventory', seedMedicationInventory);
    }

    if (!storageService.get('stock_transactions')) {
      storageService.set('stock_transactions', seedStockTransactions);
    }

    console.log('Data already seeded (rolling visits refreshed)');
    return;
  }

  // Seed Users
  const users: User[] = [
    {
      id: 'user-1',
      fullName: 'Dr. Sarah Johnson',
      email: 'doctor@webims.com',
      password: 'password',
      role: 'DOCTOR',
      department: 'CLINIC',
      phone: '555-0101',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-2',
      fullName: 'Emily Davis',
      email: 'nurse@webims.com',
      password: 'password',
      role: 'NURSE',
      department: 'CLINIC',
      phone: '555-0102',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-3',
      fullName: 'Michael Brown',
      email: 'reception@webims.com',
      password: 'password',
      role: 'RECEPTIONIST',
      department: 'CLINIC',
      phone: '555-0103',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-4',
      fullName: 'Jessica Lee',
      email: 'billing@webims.com',
      password: 'password',
      role: 'BILLING',
      department: 'BILLING',
      phone: '555-0104',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-5',
      fullName: 'Robert Wilson',
      email: 'pharmacist@webims.com',
      password: 'password',
      role: 'PHARMACIST',
      department: 'PHARMACY',
      phone: '555-0105',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-6',
      fullName: 'Admin User',
      email: 'admin@webims.com',
      password: 'password',
      role: 'ADMIN',
      department: 'ADMIN',
      phone: '555-0100',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    ...extraSeedUsers
  ];

  // Seed Patients
  const patients: Patient[] = [
    {
      id: 'patient-1',
      mrn: 'MRN001234567',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1985-06-15',
      gender: 'Male',
      phone: '555-1001',
      email: 'john.smith@email.com',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      emergencyContact: {
        name: 'Jane Smith',
        relationship: 'Spouse',
        phone: '555-1002'
      },
      insurance: {
        type: 'Private',
        insuranceId: 'INS123456',
        payerName: 'Blue Cross'
      },
      flags: {
        hasAllergies: true,
        allergyList: 'Penicillin',
        isHighRisk: false
      },
      createdAt: new Date().toISOString(),
      createdBy: 'user-3',
      isActive: true
    },
    {
      id: 'patient-2',
      mrn: 'MRN001234568',
      firstName: 'Mary',
      lastName: 'Johnson',
      dateOfBirth: '1972-03-22',
      gender: 'Female',
      phone: '555-2001',
      email: 'mary.j@email.com',
      address: {
        street: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702'
      },
      insurance: {
        type: 'Medicare',
        insuranceId: 'MED789012',
        payerName: 'Medicare'
      },
      flags: {
        hasAllergies: false,
        isHighRisk: true
      },
      createdAt: new Date().toISOString(),
      createdBy: 'user-3',
      isActive: true
    },
    {
      id: 'patient-3',
      mrn: 'MRN001234569',
      firstName: 'James',
      lastName: 'Williams',
      dateOfBirth: '1990-11-08',
      gender: 'Male',
      phone: '555-3001',
      address: {
        street: '789 Pine Rd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703'
      },
      insurance: {
        type: 'Self-Pay'
      },
      flags: {
        hasAllergies: false,
        isHighRisk: false
      },
      createdAt: new Date().toISOString(),
      createdBy: 'user-3',
      isActive: true
    },
    ...extraSeedPatients
  ];

  // Seed Appointments
  const appointments = rollingVisitSeed.appointments;

  // Seed Encounters
  const encounters = rollingVisitSeed.encounters;

  // Seed Prescriptions
 const prescriptions: Prescription[] = [
  {
    id: 'rx-001',
    rxNumber: 'RX20240115001',
    patientId: 'patient-1',  // ✅ Changed from 'pat-001' to 'patient-1'
    providerId: 'user-2',    // ✅ Changed from 'user-doctor' to 'user-2' (doctor user)
    medicationName: 'Aspirin 81mg',
    dosage: '81mg',
    frequency: 'Once daily',
    duration: '30 days',
    quantity: 30,
    refills: 2,
    instructions: 'Take with food',
    status: 'Dispensed',
    dispensedAt: '2024-01-20T14:00:00Z',
    dispensedBy: 'user-6',  // ✅ Pharmacist user ID
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'rx-002',
    rxNumber: 'RX20240116002',
    patientId: 'patient-2',  // ✅ Changed
    providerId: 'user-2',    // ✅ Changed
    medicationName: 'Lisinopril 10mg',
    dosage: '10mg',
    frequency: 'Once daily in the morning',
    duration: '90 days',
    quantity: 90,
    refills: 3,
    instructions: 'Take at the same time each day',
    status: 'Ready',
    createdAt: '2024-01-16T11:30:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'rx-003',
    rxNumber: 'RX20240118003',
    patientId: 'patient-3',  // ✅ Changed
    providerId: 'user-2',    // ✅ Changed
    medicationName: 'Metformin 500mg',
    dosage: '500mg',
    frequency: 'Twice daily with meals',
    duration: '90 days',
    quantity: 180,
    refills: 2,
    instructions: 'Take with breakfast and dinner',
    status: 'Sent to Pharmacy',
    createdAt: '2024-01-18T09:15:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'rx-004',
    rxNumber: 'RX20240119004',
    patientId: 'patient-4',  // ✅ Changed from 'pat-001'
    providerId: 'user-2',    // ✅ Changed from 'user-doctor'
    medicationName: 'Amoxicillin 500mg',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: '10 days',
    quantity: 30,
    refills: 0,
    instructions: 'Complete full course even if symptoms improve',
    status: 'Sent to Pharmacy',
    createdAt: '2024-01-19T14:45:00Z',
    createdBy: 'user-2'
  },
  {
    id: 'rx-005',
    rxNumber: 'RX20240120005',
    patientId: 'patient-1',  // ✅ Changed
    providerId: 'user-2',    // ✅ Changed
    medicationName: 'Omeprazole 20mg',
    dosage: '20mg',
    frequency: 'Once daily before breakfast',
    duration: '30 days',
    quantity: 30,
    refills: 5,
    instructions: 'Take 30 minutes before first meal',
    status: 'Dispensed',
    dispensedAt: '2024-01-21T10:30:00Z',
    dispensedBy: 'user-6',
    createdAt: '2024-01-20T08:00:00Z',
    createdBy: 'user-2'
  },
  {
  id: 'rx-6',
  rxNumber: 'RX20240121006',
  patientId: 'patient-2',
  providerId: 'user-2',
  medicationName: 'Lisinopril 10mg',
  dosage: '10mg',
  frequency: 'Once daily in the morning',
  duration: '90 days',
  quantity: 90,
  refills: 2, // One less than original
  instructions: 'Take at the same time each day',
  status: 'Sent to Pharmacy',
  createdAt: '2024-01-21T15:00:00Z',
  createdBy: 'user-2'
}
];

// Seed lab results
const labResults: LabResult[] = [
  {
    id: 'lab-1',
    labOrderNumber: 'LAB20240101001',
    patientId: 'patient-1',
    encounterId: 'enc-1',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Hemoglobin A1C',
    testType: 'Blood Test',
    status: 'Completed',
    result: '6.8%',
    normalRange: '< 5.7%',
    isAbnormal: true,
    notes: 'Elevated — monitor diabetes management',
    orderedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    enteredBy: 'user-2',
    enteredByName: 'Emily Davis',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1'
  },
  {
    id: 'lab-2',
    labOrderNumber: 'LAB20240101002',
    patientId: 'patient-1',
    encounterId: 'enc-1',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Complete Blood Count (CBC)',
    testType: 'Blood Test',
    status: 'Completed',
    result: 'Within normal limits',
    normalRange: 'WBC: 4.5–11, RBC: 4.5–5.5',
    isAbnormal: false,
    orderedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    enteredBy: 'user-2',
    enteredByName: 'Emily Davis',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1'
  },
  {
    id: 'lab-3',
    labOrderNumber: 'LAB20240105001',
    patientId: 'patient-1',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Lipid Panel',
    testType: 'Blood Test',
    status: 'In Progress',
    notes: 'Fasting required',
    orderedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1'
  },
  {
    id: 'lab-4',
    labOrderNumber: 'LAB20240102001',
    patientId: 'patient-2',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Thyroid Function Test (TSH)',
    testType: 'Blood Test',
    status: 'Completed',
    result: 'TSH: 2.5 mIU/L',
    normalRange: 'TSH: 0.4–4.0 mIU/L',
    isAbnormal: false,
    orderedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    enteredBy: 'user-2',
    enteredByName: 'Emily Davis',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1'
  },
  {
    id: 'lab-5',
    labOrderNumber: 'LAB20240106001',
    patientId: 'patient-2',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Urinalysis',
    testType: 'Urinalysis',
    status: 'Ordered',
    orderedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1'
  },
  {
    id: 'lab-6',
    labOrderNumber: 'LAB20240107001',
    patientId: 'patient-3',
    orderedBy: 'user-1',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Chest X-Ray',
    testType: 'X-Ray',
    status: 'Ordered',
    notes: 'Rule out pneumonia',
    orderedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'user-1'
  }
];

// Add this after your other seed data
 seedRefillRequests = [
  {
    id: 'refill-req-1',
    refillRequestNumber: 'RFR1705920000001',
    originalPrescriptionId: 'rx-001',
    patientId: 'patient-1',
    medicationName: 'Aspirin 81mg',
    requestedDate: '2024-01-22T09:00:00Z',
    status: 'Pending',
    createdAt: '2024-01-22T09:00:00Z'
  },
  {
    id: 'refill-req-2',
    refillRequestNumber: 'RFR1705920000002',
    originalPrescriptionId: 'rx-002',
    patientId: 'patient-2',
    medicationName: 'Lisinopril 10mg',
    requestedDate: '2024-01-21T14:30:00Z',
    status: 'Approved',
    reviewedBy: 'user-2',
    reviewedByName: 'Dr. John Smith',
    reviewedDate: '2024-01-21T15:00:00Z',
    newPrescriptionId: 'rx-6',
    createdAt: '2024-01-21T14:30:00Z'
  },
  {
    id: 'refill-req-3',
    refillRequestNumber: 'RFR1705920000003',
    originalPrescriptionId: 'rx-005',
    patientId: 'patient-1',
    medicationName: 'Omeprazole 20mg',
    requestedDate: '2024-01-20T10:00:00Z',
    status: 'Denied',
    reviewedBy: 'user-2',
    reviewedByName: 'Dr. John Smith',
    reviewedDate: '2024-01-20T11:00:00Z',
    denialReason: 'Patient needs follow-up appointment to evaluate continued need for medication',
    createdAt: '2024-01-20T10:00:00Z'
  }
];

  // Seed Claims
  const claims = rollingVisitSeed.claims;

 seedMedicationInventory = [
  {
    id: 'med-1',
    medicationName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosageForm: 'Capsule',
    strength: '500mg',
    manufacturer: 'Pfizer',
    ndc: '00093-4150-73',
    stockQuantity: 450,
    reorderLevel: 100,
    reorderQuantity: 500,
    unitPrice: 0.25,
    expiryDate: '2025-12-31',
    lotNumber: 'LOT2024-A1',
    location: 'Shelf A-3',
    isControlled: false,
    lastRestocked: '2024-01-15',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'med-2',
    medicationName: 'Lisinopril',
    genericName: 'Lisinopril',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Sandoz',
    ndc: '00093-1530-01',
    stockQuantity: 35,
    reorderLevel: 50,
    reorderQuantity: 300,
    unitPrice: 0.15,
    expiryDate: '2025-06-30',
    lotNumber: 'LOT2024-B2',
    location: 'Shelf B-1',
    isControlled: false,
    lastRestocked: '2024-01-20',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'med-3',
    medicationName: 'Hydrocodone-Acetaminophen',
    genericName: 'Hydrocodone-Acetaminophen',
    dosageForm: 'Tablet',
    strength: '5-325mg',
    manufacturer: 'Actavis',
    ndc: '00406-0512-01',
    stockQuantity: 85,
    reorderLevel: 50,
    reorderQuantity: 200,
    unitPrice: 1.50,
    expiryDate: '2025-09-30',
    lotNumber: 'LOT2024-C3',
    location: 'Locked Cabinet 1',
    isControlled: true,
    lastRestocked: '2024-01-18',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z'
  },
  {
    id: 'med-4',
    medicationName: 'Metformin',
    genericName: 'Metformin HCL',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Teva',
    ndc: '00093-7214-01',
    stockQuantity: 0,
    reorderLevel: 100,
    reorderQuantity: 500,
    unitPrice: 0.10,
    expiryDate: '2025-11-30',
    lotNumber: 'LOT2024-D4',
    location: 'Shelf C-2',
    isControlled: false,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-25T11:00:00Z'
  },
  {
    id: 'med-5',
    medicationName: 'Albuterol',
    genericName: 'Albuterol Sulfate',
    dosageForm: 'Inhaler',
    strength: '90mcg',
    manufacturer: 'GSK',
    ndc: '00173-0682-20',
    stockQuantity: 25,
    reorderLevel: 20,
    reorderQuantity: 100,
    unitPrice: 15.00,
    expiryDate: '2024-03-31',
    lotNumber: 'LOT2023-E5',
    location: 'Refrigerator 1',
    isControlled: false,
    lastRestocked: '2023-12-10',
    createdAt: '2023-12-01T08:00:00Z',
    updatedAt: '2023-12-10T16:00:00Z'
  },
  {
    id: 'med-6',
    medicationName: 'Omeprazole',
    genericName: 'Omeprazole',
    dosageForm: 'Capsule',
    strength: '20mg',
    manufacturer: 'Dr. Reddy',
    ndc: '55111-0393-30',
    stockQuantity: 180,
    reorderLevel: 75,
    reorderQuantity: 300,
    unitPrice: 0.20,
    expiryDate: '2026-01-31',
    lotNumber: 'LOT2024-F6',
    location: 'Shelf A-5',
    isControlled: false,
    lastRestocked: '2024-01-22',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-22T13:45:00Z'
  }
];

seedStockTransactions = [
  {
    id: 'stock-tx-1',
    medicationId: 'med-1',
    transactionType: 'Received',
    quantityChange: 500,
    quantityBefore: 0,
    quantityAfter: 500,
    reason: 'Initial stock',
    performedBy: 'user-6',
    performedByName: 'Sarah Wilson',
    notes: 'First shipment received',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'stock-tx-2',
    medicationId: 'med-1',
    transactionType: 'Dispensed',
    quantityChange: -50,
    quantityBefore: 500,
    quantityAfter: 450,
    prescriptionId: 'rx-1',
    performedBy: 'user-6',
    performedByName: 'Sarah Wilson',
    notes: 'Dispensed for prescription rx-1',
    createdAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'stock-tx-3',
    medicationId: 'med-2',
    transactionType: 'Received',
    quantityChange: 300,
    quantityBefore: 0,
    quantityAfter: 300,
    reason: 'Initial stock',
    performedBy: 'user-6',
    performedByName: 'Sarah Wilson',
    createdAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'stock-tx-4',
    medicationId: 'med-2',
    transactionType: 'Dispensed',
    quantityChange: -265,
    quantityBefore: 300,
    quantityAfter: 35,
    performedBy: 'user-6',
    performedByName: 'Sarah Wilson',
    notes: 'Multiple prescriptions dispensed',
    createdAt: '2024-01-25T11:00:00Z'
  }
];

// Only seed if not already present
if (!storageService.get('residents')) {

  const seedResidents: Resident[] = [
    {
      id: 'resident-1',
      residentNumber: 'RES00000001',
      firstName: 'Dorothy',
      lastName: 'Henderson',
      dateOfBirth: '1938-04-12',
      gender: 'Female',
      phone: '555-4001',
      emergencyContact: {
        name: 'Robert Henderson',
        relationship: 'Son',
        phone: '555-4002'
      },
      admissionDate: '2023-03-15',
      roomNumber: '101',
      bedNumber: 'A',
      careLevel: 'Assisted',
      status: 'Active',
      medicalConditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
      allergies: 'Penicillin',
      primaryPhysician: 'Dr. Sarah Johnson',
      mobilityStatus: 'Walker',
      cognitiveStatus: 'Alert',
      dietaryRestrictions: 'Low sodium, diabetic diet',
      dnrStatus: true,
      insuranceType: 'Medicare',
      insuranceId: 'MED-001-HENDERSON',
      notes: 'Prefers morning showers. Enjoys bingo on Tuesdays.',
      createdAt: '2023-03-15T09:00:00Z',
      createdBy: 'user-2'
    },
    {
      id: 'resident-2',
      residentNumber: 'RES00000002',
      firstName: 'Harold',
      lastName: 'Mitchell',
      dateOfBirth: '1932-11-28',
      gender: 'Male',
      phone: '555-4003',
      emergencyContact: {
        name: 'Susan Mitchell',
        relationship: 'Daughter',
        phone: '555-4004'
      },
      admissionDate: '2022-08-20',
      roomNumber: '102',
      bedNumber: 'A',
      careLevel: 'Skilled Nursing',
      status: 'Active',
      medicalConditions: ['COPD', 'Heart Failure', 'Depression'],
      allergies: 'Sulfa drugs',
      primaryPhysician: 'Dr. Sarah Johnson',
      mobilityStatus: 'Wheelchair',
      cognitiveStatus: 'Mild Impairment',
      dietaryRestrictions: 'Soft foods, fluid restriction 1.5L/day',
      dnrStatus: true,
      insuranceType: 'Medicare',
      insuranceId: 'MED-002-MITCHELL',
      createdAt: '2022-08-20T10:00:00Z',
      createdBy: 'user-2'
    },
    {
      id: 'resident-3',
      residentNumber: 'RES00000003',
      firstName: 'Eleanor',
      lastName: 'Vance',
      dateOfBirth: '1940-07-03',
      gender: 'Female',
      emergencyContact: {
        name: 'Thomas Vance',
        relationship: 'Husband',
        phone: '555-4006'
      },
      admissionDate: '2023-09-01',
      roomNumber: '103',
      bedNumber: 'A',
      careLevel: 'Memory Care',
      status: 'Active',
      medicalConditions: ["Alzheimer's Disease", 'Hypertension'],
      primaryPhysician: 'Dr. Sarah Johnson',
      mobilityStatus: 'Walker',
      cognitiveStatus: 'Moderate Impairment',
      dietaryRestrictions: 'Finger foods preferred',
      dnrStatus: false,
      insuranceType: 'Private',
      insuranceId: 'PVT-003-VANCE',
      notes: 'Responds well to music therapy. May become confused in evenings (sundowning).',
      createdAt: '2023-09-01T08:00:00Z',
      createdBy: 'user-2'
    },
    {
      id: 'resident-4',
      residentNumber: 'RES00000004',
      firstName: 'George',
      lastName: 'Paulson',
      dateOfBirth: '1945-02-18',
      gender: 'Male',
      phone: '555-4007',
      emergencyContact: {
        name: 'Linda Paulson',
        relationship: 'Wife',
        phone: '555-4008'
      },
      admissionDate: '2024-01-10',
      roomNumber: '104',
      bedNumber: 'A',
      careLevel: 'Independent',
      status: 'Active',
      medicalConditions: ['Mild Hypertension'],
      primaryPhysician: 'Dr. Sarah Johnson',
      mobilityStatus: 'Independent',
      cognitiveStatus: 'Alert',
      dnrStatus: false,
      insuranceType: 'Private',
      insuranceId: 'PVT-004-PAULSON',
      notes: 'Very independent. Participates in all activities.',
      createdAt: '2024-01-10T09:00:00Z',
      createdBy: 'user-2'
    },
    {
      id: 'resident-5',
      residentNumber: 'RES00000005',
      firstName: 'Margaret',
      lastName: 'Chen',
      dateOfBirth: '1936-09-14',
      gender: 'Female',
      emergencyContact: {
        name: 'Kevin Chen',
        relationship: 'Son',
        phone: '555-4010'
      },
      admissionDate: '2022-05-12',
      roomNumber: '201',
      bedNumber: 'A',
      careLevel: 'Skilled Nursing',
      status: 'Hospital Transfer',
      medicalConditions: ['Stroke', 'Dysphagia', 'Hypertension'],
      allergies: 'Latex',
      primaryPhysician: 'Dr. Sarah Johnson',
      mobilityStatus: 'Bedridden',
      cognitiveStatus: 'Moderate Impairment',
      dietaryRestrictions: 'Pureed foods, thickened liquids',
      dnrStatus: true,
      insuranceType: 'Medicare',
      insuranceId: 'MED-005-CHEN',
      createdAt: '2022-05-12T07:00:00Z',
      createdBy: 'user-2'
    }
  ];

  const today = new Date().toISOString().split('T')[0];

  const seedCareNotes: CareNote[] = [
    {
      id: 'cn-1',
      careNoteNumber: 'CN00000001',
      residentId: 'resident-1',
      shift: 'Day',
      date: today,
      startTime: '07:00',
      endTime: '15:00',
      caregiverId: 'user-2',
      caregiverName: 'Emily Davis',
      activities: [
        { type: 'Bath/Hygiene', description: 'Assisted with morning shower', time: '07:30', completed: true },
        { type: 'Meal', description: 'Breakfast — full meal consumed', time: '08:00', completed: true },
        { type: 'Medication', description: 'Morning medications administered', time: '08:30', completed: true },
        { type: 'Exercise', description: '15-min walk in hallway with walker', time: '10:00', completed: true },
        { type: 'Meal', description: 'Lunch — partial meal consumed', time: '12:00', completed: true }
      ],
      vitals: {
        bloodPressure: '138/86',
        pulse: '74',
        temperature: '98.4',
        weight: '142',
        oxygenSaturation: '97%'
      },
      medications: [
        {
          medicationName: 'Lisinopril 10mg',
          dosage: '10mg',
          scheduledTime: '08:00',
          administered: true,
          administeredTime: '08:15'
        },
        {
          medicationName: 'Metformin 500mg',
          dosage: '500mg',
          scheduledTime: '08:00',
          administered: true,
          administeredTime: '08:15'
        }
      ],
      nutritionIntake: 'Partial',
      hydrationIntake: 'Adequate',
      painLevel: 2,
      mood: 'Happy',
      behavioralNotes: 'Resident was cheerful and engaged. Expressed excitement about upcoming family visit.',
      skinCondition: 'Intact, no breakdown noted.',
      followUpNeeded: false,
      signedBy: 'Emily Davis',
      signedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'user-2'
    },
    {
      id: 'cn-2',
      careNoteNumber: 'CN00000002',
      residentId: 'resident-2',
      shift: 'Day',
      date: today,
      startTime: '07:00',
      endTime: '15:00',
      caregiverId: 'user-2',
      caregiverName: 'Emily Davis',
      activities: [
        { type: 'Meal', description: 'Breakfast — soft diet, 75% consumed', time: '08:00', completed: true },
        { type: 'Medication', description: 'Morning medications administered', time: '08:30', completed: true },
        { type: 'Vital Signs', description: 'Routine vitals taken', time: '09:00', completed: true },
        { type: 'Physical Therapy', description: 'PT session — range of motion exercises', time: '10:30', completed: true }
      ],
      vitals: {
        bloodPressure: '152/94',
        pulse: '82',
        temperature: '98.8',
        oxygenSaturation: '92%',
        respiratoryRate: '18'
      },
      medications: [
        {
          medicationName: 'Furosemide 40mg',
          dosage: '40mg',
          scheduledTime: '08:00',
          administered: true,
          administeredTime: '08:20'
        },
        {
          medicationName: 'Carvedilol 6.25mg',
          dosage: '6.25mg',
          scheduledTime: '08:00',
          administered: true,
          administeredTime: '08:20'
        }
      ],
      nutritionIntake: 'Partial',
      hydrationIntake: 'Limited',
      painLevel: 4,
      mood: 'Calm',
      behavioralNotes: 'Resident seemed fatigued. Mild shortness of breath noted at rest.',
      skinCondition: 'Mild edema bilateral lower extremities.',
      alerts: 'O2 sat 92% — monitor closely. Notified charge nurse.',
      followUpNeeded: true,
      followUpReason: 'O2 saturation below baseline. Consider physician notification if no improvement.',
      signedBy: 'Emily Davis',
      signedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'user-2'
    }
  ];

  storageService.set('residents', seedResidents);
  storageService.set('care_notes', seedCareNotes);
}

  // Save to localStorage
  storageService.set('users', users);
  storageService.set('patients', patients);
  storageService.set('appointments', appointments);
  storageService.set('encounters', encounters);
  storageService.set('prescriptions', prescriptions);
  storageService.set('claims', claims);
    storageService.set('lab_results', labResults);
    // ✅ ADD THESE NEW LINES:
storageService.set('medication_inventory', seedMedicationInventory);
storageService.set('stock_transactions', seedStockTransactions);

// Then in the initializeData function, add:
storageService.set('refill_requests', seedRefillRequests);



  console.log('✅ Seed data loaded successfully');
};