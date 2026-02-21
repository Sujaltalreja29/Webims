import { Appointment } from '../../models';
import { BaseApiService } from './base-api.service';

class AppointmentApiService extends BaseApiService<Appointment> {
  constructor() {
    super('appointments');
  }

  generateAppointmentNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `APT${timestamp}`;
  }

  getByPatient(patientId: string): Promise<Appointment[]> {
    return this.search(a => a.patientId === patientId);
  }

  getByProvider(providerId: string): Promise<Appointment[]> {
    return this.search(a => a.providerId === providerId);
  }

  getByDate(date: string): Promise<Appointment[]> {
    return this.search(a => a.date === date);
  }

  getByStatus(status: Appointment['status']): Promise<Appointment[]> {
    return this.search(a => a.status === status);
  }

  getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  }

  getUpcoming(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.search(a => 
      a.date >= today && 
      (a.status === 'Scheduled' || a.status === 'Checked-in')
    );
  }

  checkTimeConflict(providerId: string, date: string, startTime: string, duration: number, excludeId?: string): Promise<boolean> {
    return this.search(a => 
      a.providerId === providerId &&
      a.date === date &&
      a.id !== excludeId &&
      a.status !== 'Cancelled'
    ).then(appointments => {
      // Simple conflict check (can be enhanced)
      return appointments.some(a => a.startTime === startTime);
    });
  }
}

export const appointmentApi = new AppointmentApiService();