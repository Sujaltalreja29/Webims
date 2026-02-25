import { LabResult } from '../../models';
import { BaseApiService } from './base-api.service';

class LabResultApiService extends BaseApiService<LabResult> {
  constructor() {
    super('labResults');
  }

  generateLabOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `LAB${timestamp}`;
  }

  // Get lab results by patient
  getByPatient(patientId: string): Promise<LabResult[]> {
    return this.search(lab => lab.patientId === patientId);
  }

  // Get lab results by encounter
  getByEncounter(encounterId: string): Promise<LabResult[]> {
    return this.search(lab => lab.encounterId === encounterId);
  }

  // Get lab results by status
  getByStatus(status: LabResult['status']): Promise<LabResult[]> {
    return this.search(lab => lab.status === status);
  }

  // Get pending lab orders
  async getPendingOrders(): Promise<LabResult[]> {
    return this.search(lab => 
      lab.status === 'Ordered' || lab.status === 'In Progress'
    );
  }

  // Get completed lab results
  async getCompletedResults(): Promise<LabResult[]> {
    return this.getByStatus('Completed');
  }

  // Get recent lab results for a patient (last 10)
  async getRecentByPatient(patientId: string, limit: number = 10): Promise<LabResult[]> {
    const all = await this.getByPatient(patientId);
    return all
      .sort((a, b) => new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime())
      .slice(0, limit);
  }

  // Update lab result status
  async updateStatus(
    id: string,
    status: LabResult['status'],
    result?: string,
    isAbnormal?: boolean
  ): Promise<LabResult | null> {
    const updates: Partial<LabResult> = {
      status,
      result,
      isAbnormal
    };

    if (status === 'Completed') {
      updates.completedDate = new Date().toISOString();
    }

    return this.update(id, updates);
  }

  // Cancel lab order
  async cancel(id: string, reason: string): Promise<LabResult | null> {
    return this.update(id, {
      status: 'Cancelled',
      notes: reason
    });
  }
}

export const labResultApi = new LabResultApiService();