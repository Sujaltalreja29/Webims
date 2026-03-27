import { Appointment, AppointmentStatusChange } from '../../models';
import { BaseApiService } from './base-api.service';

class AppointmentApiService extends BaseApiService<Appointment> {
  constructor() {
    super('appointments');
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private rangesOverlap(startA: number, durationA: number, startB: number, durationB: number): boolean {
    const endA = startA + durationA;
    const endB = startB + durationB;
    return startA < endB && startB < endA;
  }

  private isPastDateTime(date: string, startTime: string): boolean {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);

    if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
      return false;
    }

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return appointmentDateTime.getTime() <= Date.now();
  }

  async validateAppointmentSlot(
    providerId: string,
    date: string,
    startTime: string,
    duration: number,
    excludeId?: string
  ): Promise<void> {
    if (this.isPastDateTime(date, startTime)) {
      throw new Error('Cannot book appointments in the past.');
    }

    const hasConflict = await this.checkTimeConflict(providerId, date, startTime, duration, excludeId);
    if (hasConflict) {
      throw new Error('This time slot overlaps with another appointment for the provider.');
    }
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
    return this.search(a => a.date === date).then((appointments) =>
      [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime))
    );
  }

  getProviderSchedule(providerId: string, date: string, excludeId?: string): Promise<Appointment[]> {
    return this.search((appointment) =>
      appointment.providerId === providerId &&
      appointment.date === date &&
      appointment.id !== excludeId &&
      appointment.status !== 'Cancelled' &&
      appointment.status !== 'No-show'
    ).then((appointments) => [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime)));
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
      const requestedStart = this.toMinutes(startTime);
      return appointments.some((appointment) => {
        const existingStart = this.toMinutes(appointment.startTime);
        const existingDuration = appointment.duration || 30;
        return this.rangesOverlap(requestedStart, duration, existingStart, existingDuration);
      });
    });
  }

  async create(item: Appointment): Promise<Appointment> {
    await this.validateAppointmentSlot(item.providerId, item.date, item.startTime, item.duration);
    return super.create(item);
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

    await this.validateAppointmentSlot(
      original.providerId,
      newDate,
      newTime,
      original.duration,
      originalId
    );

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

    // Persist the replacement appointment first, then cancel original.
    const created = await super.create(newAppointment);

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

    return { original, new: created };
  }
}

export const appointmentApi = new AppointmentApiService();