import { Prescription } from '../../models';
import { BaseApiService } from './base-api.service';

class PrescriptionApiService extends BaseApiService<Prescription> {
  constructor() {
    super('prescriptions');
  }

  generateRxNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `RX${timestamp}`;
  }

  getByPatient(patientId: string): Promise<Prescription[]> {
    return this.search(p => p.patientId === patientId);
  }

  getByProvider(providerId: string): Promise<Prescription[]> {
    return this.search(p => p.providerId === providerId);
  }

  getByStatus(status: Prescription['status']): Promise<Prescription[]> {
    return this.search(p => p.status === status);
  }

  getPharmacyQueue(): Promise<Prescription[]> {
    return this.search(p => 
      p.status === 'Sent to Pharmacy' || p.status === 'Ready'
    );
  }

  getActiveByPatient(patientId: string): Promise<Prescription[]> {
    return this.search(p => 
      p.patientId === patientId &&
      p.status !== 'Cancelled' &&
      p.status !== 'Dispensed'
    );
  }

  dispense(id: string, dispensedBy: string): Promise<Prescription | null> {
    return this.update(id, {
      status: 'Dispensed',
      dispensedAt: new Date().toISOString(),
      dispensedBy
    } as Partial<Prescription>);
  }
}

export const prescriptionApi = new PrescriptionApiService();