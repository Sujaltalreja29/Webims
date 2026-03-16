import { User, Patient, Appointment, Encounter, Prescription, Claim, LabResult,RefillRequest } from '../models';
import { storageService } from './storage.service';
import type { MedicationInventory, StockTransaction } from '../models';

export const seedData = () => {
  // Check if data already exists
  if (storageService.get('users')) {
    console.log('Data already seeded');
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
    }
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
    }
  ];

  // Seed Appointments
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const appointments: Appointment[] = [
    {
      id: 'appt-1',
      appointmentNumber: 'APT12345001',
      patientId: 'patient-1',
      providerId: 'user-1',
      appointmentType: 'Follow-up',
      date: todayStr,
      startTime: '09:00',
      duration: 30,
      status: 'Scheduled',
      reason: 'Blood pressure check',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    },
    {
      id: 'appt-2',
      appointmentNumber: 'APT12345002',
      patientId: 'patient-2',
      providerId: 'user-1',
      appointmentType: 'New Patient',
      date: todayStr,
      startTime: '10:00',
      duration: 60,
      status: 'Checked-in',
      reason: 'Annual physical',
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
      status: 'Scheduled',
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
      date: tomorrowStr,
      startTime: '11:00',
      duration: 30,
      status: 'Scheduled',
      reason: 'Lab results review',
      createdAt: new Date().toISOString(),
      createdBy: 'user-3'
    }
  ];

  // Seed Encounters
  const encounters: Encounter[] = [
    {
      id: 'enc-1',
      encounterNumber: 'ENC12345001',
      patientId: 'patient-1',
      providerId: 'user-1',
      appointmentId: 'appt-1',
      visitDate: todayStr,
      chiefComplaint: 'Follow-up for hypertension',
      vitals: {
        bloodPressure: '138/88',
        pulse: 78,
        temperature: 98.6,
        weight: 185,
        height: 72
      },
      diagnoses: ['Hypertension (High Blood Pressure)'],
      assessment: 'Blood pressure still elevated. Medication adjustment needed.',
      plan: 'Increase Lisinopril to 20mg daily. Follow-up in 2 weeks.',
      status: 'Closed',
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
  ];

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
    id: 'lab-001',
    labOrderNumber: 'LAB20240101001',
    patientId: 'pat-001', // John Smith
    encounterId: 'enc-001',
    orderedBy: 'user-doctor',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Hemoglobin A1C',
    testType: 'Blood Test',
    status: 'Completed',
    result: '6.8%',
    normalRange: '< 5.7%',
    isAbnormal: true,
    notes: 'Elevated - monitor diabetes management',
    orderedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-doctor'
  },
  {
    id: 'lab-002',
    labOrderNumber: 'LAB20240101002',
    patientId: 'pat-001', // John Smith
    encounterId: 'enc-001',
    orderedBy: 'user-doctor',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Complete Blood Count (CBC)',
    testType: 'Blood Test',
    status: 'Completed',
    result: 'Within normal limits',
    normalRange: 'WBC: 4.5-11, RBC: 4.5-5.5',
    isAbnormal: false,
    orderedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-doctor'
  },
  {
    id: 'lab-003',
    labOrderNumber: 'LAB20240105001',
    patientId: 'pat-001', // John Smith
    orderedBy: 'user-doctor',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Lipid Panel',
    testType: 'Blood Test',
    status: 'In Progress',
    notes: 'Fasting required',
    orderedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-doctor'
  },
  {
    id: 'lab-004',
    labOrderNumber: 'LAB20240102001',
    patientId: 'pat-002', // Jane Doe
    encounterId: 'enc-002',
    orderedBy: 'user-doctor',
    orderedByName: 'Dr. Sarah Johnson',
    testName: 'Thyroid Function Test (TSH, T3, T4)',
    testType: 'Blood Test',
    status: 'Completed',
    result: 'TSH: 2.5 mIU/L (Normal)',
    normalRange: 'TSH: 0.4-4.0 mIU/L',
    isAbnormal: false,
    orderedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-doctor'
  }
];

// Add this after your other seed data
 const seedRefillRequests: RefillRequest[] = [
  {
    id: 'refill-req-1',
    refillRequestNumber: 'RFR1705920000001',
    originalPrescriptionId: 'rx-1',
    patientId: 'patient-1',
    medicationName: 'Aspirin 81mg',
    requestedDate: '2024-01-22T09:00:00Z',
    status: 'Pending',
    createdAt: '2024-01-22T09:00:00Z'
  },
  {
    id: 'refill-req-2',
    refillRequestNumber: 'RFR1705920000002',
    originalPrescriptionId: 'rx-2',
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
    originalPrescriptionId: 'rx-5',
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
  const claims: Claim[] = [
    {
      id: 'claim-1',
      claimNumber: 'CLM12345001',
      patientId: 'patient-1',
      encounterId: 'enc-1',
      visitDate: todayStr,
      diagnosisCodes: ['Hypertension (High Blood Pressure)'],
      procedureCodes: ['Office Visit - Established Patient'],
      totalAmount: 150,
      insuranceType: 'Private',
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      createdBy: 'user-4'
    }
  ];

 const seedMedicationInventory: MedicationInventory[] = [
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

const seedStockTransactions: StockTransaction[] = [
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