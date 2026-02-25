import { Appointment, AppointmentStatusChange } from '../../models';
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
      (a.status !== 'Cancelled' && a.status !== 'No-show')
    ).then(appointments => {
      return appointments.some(a => a.startTime === startTime);
    });
  }

  async cancelAppointment(
    id: string, 
    reason: string, 
    cancelledBy: string, 
    cancelledByName: string
  ): Promise<Appointment | null> {
    const appointment = await this.getById(id);
    if (!appointment) return null;

    const statusChange: AppointmentStatusChange = {
      status: 'Cancelled',
      changedBy: cancelledBy,
      changedByName: cancelledByName,
      changedAt: new Date().toISOString(),
      reason
    };

    return this.update(id, {
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledBy,
      cancelledByName,
      cancelledAt: new Date().toISOString(),
      statusHistory: [...(appointment.statusHistory || []), statusChange]
    } as Partial<Appointment>);
  }

  async markAsNoShow(id: string, userId: string, userName: string): Promise<Appointment | null> {
    const appointment = await this.getById(id);
    if (!appointment) return null;

    const statusChange: AppointmentStatusChange = {
      status: 'No-show',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date().toISOString(),
      reason: 'Patient did not arrive'
    };

    return this.update(id, {
      status: 'No-show',
      statusHistory: [...(appointment.statusHistory || []), statusChange]
    } as Partial<Appointment>);
  }

  async updateStatusWithHistory(
    id: string,
    newStatus: Appointment['status'],
    userId: string,
    userName: string,
    reason?: string
  ): Promise<Appointment | null> {
    const appointment = await this.getById(id);
    if (!appointment) return null;

    const statusChange: AppointmentStatusChange = {
      status: newStatus,
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date().toISOString(),
      reason
    };

    return this.update(id, {
      status: newStatus,
      statusHistory: [...(appointment.statusHistory || []), statusChange]
    } as Partial<Appointment>);
  }

  async rescheduleAppointment(
    originalId: string,
    newDate: string,
    newTime: string,
    userId: string
  ): Promise<{ original: Appointment | null; new: Appointment | null }> {
    const original = await this.getById(originalId);
    if (!original) return { original: null, new: null };

    // Create new appointment with same details
    const newAppointment: Appointment = {
      ...original,
      id: `appt-${Date.now()}`,
      appointmentNumber: this.generateAppointmentNumber(),
      date: newDate,
      startTime: newTime,
      status: 'Scheduled',
      rescheduledFrom: originalId,
      statusHistory: [{
        status: 'Scheduled',
        changedBy: userId,
        changedAt: new Date().toISOString(),
        reason: 'Rescheduled from previous appointment'
      }],
      createdAt: new Date().toISOString()
    };

    // Cancel original appointment
    await this.cancelAppointment(
      originalId,
      'Rescheduled to new date/time',
      userId,
      'System'
    );

    // Update original to link to new
    await this.update(originalId, {
      rescheduledTo: newAppointment.id
    } as Partial<Appointment>);

    // Create new appointment
    const created = await this.create(newAppointment);

    return { original, new: created };
  }
}

export const appointmentApi = new AppointmentApiService();