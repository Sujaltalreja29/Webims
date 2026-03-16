import { BaseApiService } from './base-api.service';
import type { RefillRequest } from '../../models';

class RefillRequestApiService extends BaseApiService<RefillRequest> {
  constructor() {
    super('refill_requests');
  }

  // Generate refill request number
  generateRefillRequestNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RFR${timestamp}${random}`;
  }

  // Get by status
  async getByStatus(status: RefillRequest['status']): Promise<RefillRequest[]> {
    const all = await this.getAll();
    return all.filter(req => req.status === status);
  }

  // Get pending requests
  async getPending(): Promise<RefillRequest[]> {
    return this.getByStatus('Pending');
  }

  // Get by patient
  async getByPatient(patientId: string): Promise<RefillRequest[]> {
    const all = await this.getAll();
    return all
      .filter(req => req.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get by original prescription
  async getByPrescription(prescriptionId: string): Promise<RefillRequest[]> {
    const all = await this.getAll();
    return all.filter(req => req.originalPrescriptionId === prescriptionId);
  }

  // Approve refill request
  async approve(
    id: string,
    reviewedBy: string,
    reviewedByName: string,
    newPrescriptionId: string
  ): Promise<RefillRequest> {
    const request = await this.getById(id);
    if (!request) {
      throw new Error('Refill request not found');
    }

    const updated: RefillRequest = {
      ...request,
      status: 'Approved',
      reviewedBy,
      reviewedByName,
      reviewedDate: new Date().toISOString(),
      newPrescriptionId
    };

        const result = await this.update(id, updated);
    if (!result) {
      throw new Error('Failed to update refill request');
    }

    return result;
  }

  // Deny refill request
  async deny(
    id: string,
    reviewedBy: string,
    reviewedByName: string,
    denialReason: string
  ): Promise<RefillRequest> {
    const request = await this.getById(id);
    if (!request) {
      throw new Error('Refill request not found');
    }

    const updated: RefillRequest = {
      ...request,
      status: 'Denied',
      reviewedBy,
      reviewedByName,
      reviewedDate: new Date().toISOString(),
      denialReason
    };

        const result = await this.update(id, updated);
    if (!result) {
      throw new Error('Failed to update refill request');
    }

    return result;
  }
}

export const refillRequestApi = new RefillRequestApiService();