import { UserRole } from '../models';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  BILLING: 'Billing Staff',
  PHARMACIST: 'Pharmacist'
};

export const ROLE_PERMISSIONS = {
  ADMIN: ['all'],
  DOCTOR: ['patients.view', 'patients.edit', 'encounters.create', 'encounters.view', 'prescriptions.create'],
  NURSE: ['patients.view', 'encounters.view', 'vitals.record'],
  RECEPTIONIST: ['patients.create', 'patients.view', 'patients.edit', 'appointments.create', 'appointments.view'],
  BILLING: ['patients.view', 'claims.create', 'claims.view', 'payments.record'],
  PHARMACIST: ['prescriptions.view', 'prescriptions.dispense']
};