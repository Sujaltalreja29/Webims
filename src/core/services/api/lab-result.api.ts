import { LabResult } from '../../models';
import { BaseApiService } from './base-api.service';

class LabResultApiService extends BaseApiService<LabResult> {
  constructor() {
    super('lab_results'); // ✅ matches seed-data.ts key
  }

  private async updateOrThrow(id: string, updates: Partial<LabResult>): Promise<LabResult> {
    const updatedLab = await this.update(id, updates);
    if (!updatedLab) {
      throw new Error('Lab result not found');
    }
    return updatedLab;
  }

  // ─── Generators ───────────────────────────────────────────────────────────
  generateLabOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `LAB${timestamp}`;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────
  getByPatient(patientId: string): Promise<LabResult[]> {
    return this.getAll().then(all =>
      all.filter(lab => lab.patientId === patientId)
    );
  }

  getByEncounter(encounterId: string): Promise<LabResult[]> {
    return this.getAll().then(all =>
      all.filter(lab => lab.encounterId === encounterId)
    );
  }

  getByStatus(status: LabResult['status']): Promise<LabResult[]> {
    return this.getAll().then(all =>
      all.filter(lab => lab.status === status)
    );
  }

  getPendingOrders(): Promise<LabResult[]> {
    return this.getAll().then(all =>
      all.filter(lab => lab.status === 'Ordered' || lab.status === 'In Progress')
    );
  }

  getCompletedResults(): Promise<LabResult[]> {
    return this.getByStatus('Completed');
  }

  getAbnormalResults(): Promise<LabResult[]> {
    return this.getAll().then(all =>
      all.filter(lab => lab.isAbnormal === true)
    );
  }

  async getRecentByPatient(patientId: string, limit = 10): Promise<LabResult[]> {
    const all = await this.getByPatient(patientId);
    return all
      .sort((a, b) =>
        new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime()
      )
      .slice(0, limit);
  }

  // ─── Get today's completed count ─────────────────────────────────────────
  async getCompletedToday(): Promise<LabResult[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.getAll().then(all =>
      all.filter(lab =>
        lab.status === 'Completed' &&
        lab.completedDate?.startsWith(todayStr)
      )
    );
  }

  // ─── Status Transitions ───────────────────────────────────────────────────
  async markInProgress(id: string): Promise<LabResult> {
    return this.updateOrThrow(id, { status: 'In Progress' });
  }

  async enterResults(
    id: string,
    data: {
      result: string;
      normalRange?: string;
      isAbnormal: boolean;
      notes?: string;
      completedDate: string;
      enteredBy: string;
      enteredByName: string;
    }
  ): Promise<LabResult> {
    return this.updateOrThrow(id, {
      status: 'Completed',
      result: data.result,
      normalRange: data.normalRange,
      isAbnormal: data.isAbnormal,
      notes: data.notes,
      completedDate: data.completedDate,
      enteredBy: data.enteredBy,
      enteredByName: data.enteredByName
    });
  }

  async cancel(id: string, reason: string): Promise<LabResult> {
    return this.updateOrThrow(id, {
      status: 'Cancelled',
      notes: reason
    });
  }

  // Legacy — keep for backward compat
  async updateStatus(
    id: string,
    status: LabResult['status'],
    result?: string,
    isAbnormal?: boolean
  ): Promise<LabResult> {
    const updates: Partial<LabResult> = { status, result, isAbnormal };
    if (status === 'Completed') {
      updates.completedDate = new Date().toISOString();
    }
    return this.updateOrThrow(id, updates);
  }
}

export const labResultApi = new LabResultApiService();