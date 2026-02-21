export type UserRole = 
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'BILLING'
  | 'PHARMACIST';

export type Department = 'CLINIC' | 'PHARMACY' | 'BILLING' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string; // demo only
  role: UserRole;
  department: Department;
  phone?: string;
  createdAt: string;
  isActive: boolean;
}