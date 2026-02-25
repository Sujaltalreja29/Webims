export type AppointmentType = 'New Patient' | 'Follow-up' | 'Urgent' | 'Telehealth';
export type AppointmentStatus = 'Scheduled' | 'Checked-in' | 'In-Progress' | 'Completed' | 'Cancelled' | 'No-show';

export interface AppointmentStatusChange {
  status: AppointmentStatus;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  reason?: string;
}

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
  
  // Cancellation info
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  
  // Reschedule info
  rescheduledFrom?: string; // original appointment ID
  rescheduledTo?: string; // new appointment ID
  
  // Status history
  statusHistory?: AppointmentStatusChange[];
  
  createdAt: string;
  createdBy: string;
}