import { Resident, ResidentStatus, CareLevel } from '../../models';
import { BaseApiService } from './base-api.service';

class ResidentApiService extends BaseApiService<Resident> {
  constructor() {
    super('residents');
  }

  private async updateOrThrow(id: string, updates: Partial<Resident>): Promise<Resident> {
    const updatedResident = await this.update(id, updates);
    if (!updatedResident) {
      throw new Error('Resident not found');
    }
    return updatedResident;
  }

  // ─── Generators ────────────────────────────────────────────────────────
  generateResidentNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `RES${timestamp}`;
  }

  // ─── Queries ───────────────────────────────────────────────────────────
  getActive(): Promise<Resident[]> {
    return this.getAll().then(all =>
      all.filter(r => r.status === 'Active')
    );
  }

  getByStatus(status: ResidentStatus): Promise<Resident[]> {
    return this.getAll().then(all =>
      all.filter(r => r.status === status)
    );
  }

  getByCareLevel(careLevel: CareLevel): Promise<Resident[]> {
    return this.getAll().then(all =>
      all.filter(r => r.careLevel === careLevel)
    );
  }

  getByRoom(roomNumber: string): Promise<Resident[]> {
    return this.getAll().then(all =>
      all.filter(r => r.roomNumber === roomNumber && r.status === 'Active')
    );
  }

  searchResidents(query: string): Promise<Resident[]> {
    return this.getAll().then(all => {
      const q = query.toLowerCase();
      return all.filter(r =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.residentNumber.toLowerCase().includes(q) ||
        r.roomNumber.toLowerCase().includes(q)
      );
    });
  }

  // ─── Status Transitions ────────────────────────────────────────────────
  async discharge(
    id: string,
    dischargeDate: string,
    dischargeReason: string
  ): Promise<Resident> {
    return this.updateOrThrow(id, {
      status: 'Discharged',
      dischargeDate,
      dischargeReason,
      updatedAt: new Date().toISOString()
    });
  }

  async markHospitalTransfer(id: string): Promise<Resident> {
    return this.updateOrThrow(id, {
      status: 'Hospital Transfer',
      updatedAt: new Date().toISOString()
    });
  }

  async readmit(id: string, roomNumber: string, bedNumber: string): Promise<Resident> {
    return this.updateOrThrow(id, {
      status: 'Active',
      roomNumber,
      bedNumber,
      dischargeDate: undefined,
      dischargeReason: undefined,
      updatedAt: new Date().toISOString()
    });
  }
}

export const residentApi = new ResidentApiService();