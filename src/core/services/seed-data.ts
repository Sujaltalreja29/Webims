import { User, Patient, Appointment, Encounter, Prescription, Claim } from '../models';
import { storageService } from './storage.service';

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
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
  ];

  // Seed Prescriptions
  const prescriptions: Prescription[] = [
    {
      id: 'rx-1',
      rxNumber: 'RX12345001',
      patientId: 'patient-1',
      providerId: 'user-1',
      encounterId: 'enc-1',
      medicationName: 'Lisinopril (Blood Pressure)',
      dosage: '20mg',
      frequency: 'Once daily',
      duration: '30 days',
      quantity: 30,
      refills: 3,
      status: 'Sent to Pharmacy',
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    },
    {
      id: 'rx-2',
      rxNumber: 'RX12345002',
      patientId: 'patient-2',
      providerId: 'user-1',
      medicationName: 'Metformin (Diabetes)',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      duration: '90 days',
      quantity: 180,
      refills: 2,
      status: 'Ready',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'user-1'
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

  // Save to localStorage
  storageService.set('users', users);
  storageService.set('patients', patients);
  storageService.set('appointments', appointments);
  storageService.set('encounters', encounters);
  storageService.set('prescriptions', prescriptions);
  storageService.set('claims', claims);

  console.log('✅ Seed data loaded successfully');
};