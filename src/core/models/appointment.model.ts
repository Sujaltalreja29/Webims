export type AppointmentType = 'New Patient' | 'Follow-up' | 'Urgent' | 'Telehealth';
export type AppointmentStatus = 'Scheduled' | 'Checked-in' | 'In-Progress' | 'Completed' | 'Cancelled' | 'No-show';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  providerId: string;
  
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  duration: number; // minutes
  
  status: AppointmentStatus;
  
  reason?: string;
  notes?: string;
  
  createdAt: string;
  createdBy: string;
}