import { Encounter } from '../../models';
import { BaseApiService } from './base-api.service';

class EncounterApiService extends BaseApiService<Encounter> {
  constructor() {
    super('encounters');
  }

  generateEncounterNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `ENC${timestamp}`;
  }

  getByPatient(patientId: string): Promise<Encounter[]> {
    return this.search(e => e.patientId === patientId);
  }

  getByProvider(providerId: string): Promise<Encounter[]> {
    return this.search(e => e.providerId === providerId);
  }

  getByAppointment(appointmentId: string): Promise<Encounter | null> {
    return this.search(e => e.appointmentId === appointmentId)
      .then(results => results[0] || null);
  }

  getRecentByPatient(patientId: string, limit: number = 5): Promise<Encounter[]> {
    return this.getByPatient(patientId).then(encounters => 
      encounters
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        .slice(0, limit)
    );
  }
}

export const encounterApi = new EncounterApiService();