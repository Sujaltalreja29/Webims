import type { UserRole } from '../models';

export const ACCESS_CONTROL = {
  routes: {
    dashboard: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING', 'PHARMACIST'] as UserRole[],
    patients: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] as UserRole[],
    appointments: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] as UserRole[],
    clinical: ['DOCTOR', 'NURSE', 'ADMIN'] as UserRole[],
    refillRequests: ['DOCTOR', 'ADMIN'] as UserRole[],
    billing: ['BILLING', 'ADMIN'] as UserRole[],
    lab: ['DOCTOR', 'NURSE', 'ADMIN'] as UserRole[],
    pharmacyQueue: ['PHARMACIST', 'DOCTOR', 'ADMIN'] as UserRole[],
    pharmacyInventory: ['PHARMACIST', 'ADMIN'] as UserRole[],
    ltc: ['NURSE', 'DOCTOR', 'ADMIN'] as UserRole[]
  },
  quickActions: [
    { label: 'Open Dashboard', path: '/dashboard', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING', 'PHARMACIST'] as UserRole[] },
    { label: 'Register New Patient', path: '/patients/new', roles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] as UserRole[] },
    { label: 'Schedule Appointment', path: '/appointments/new', roles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] as UserRole[] },
    { label: 'Create Encounter', path: '/clinical/new', roles: ['DOCTOR', 'NURSE', 'ADMIN'] as UserRole[] },
    { label: 'Review Refill Requests', path: '/clinical/refill-requests', roles: ['DOCTOR', 'ADMIN'] as UserRole[] },
    { label: 'Create Claim', path: '/billing/new', roles: ['BILLING', 'ADMIN'] as UserRole[] },
    { label: 'Open Prescription Queue', path: '/pharmacy/prescriptions', roles: ['PHARMACIST', 'DOCTOR', 'ADMIN'] as UserRole[] },
    { label: 'Open Inventory', path: '/pharmacy/inventory', roles: ['PHARMACIST', 'ADMIN'] as UserRole[] },
    { label: 'Open LTC Residents', path: '/ltc/residents', roles: ['NURSE', 'DOCTOR', 'ADMIN'] as UserRole[] }
  ]
} as const;
