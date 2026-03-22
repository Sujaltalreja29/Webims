import { CareNote, ShiftType } from '../../models';
import { BaseApiService } from './base-api.service';

class CareNoteApiService extends BaseApiService<CareNote> {
  constructor() {
    super('care_notes');
  }

  // ─── Generators ────────────────────────────────────────────────────────
  generateCareNoteNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `CN${timestamp}`;
  }

  // ─── Queries ───────────────────────────────────────────────────────────
  getByResident(residentId: string): Promise<CareNote[]> {
    return this.getAll().then(all =>
      all
        .filter(n => n.residentId === residentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }

  getByDate(date: string): Promise<CareNote[]> {
    return this.getAll().then(all =>
      all.filter(n => n.date === date)
    );
  }

  getByShift(date: string, shift: ShiftType): Promise<CareNote[]> {
    return this.getAll().then(all =>
      all.filter(n => n.date === date && n.shift === shift)
    );
  }

  getByCaregiver(caregiverId: string): Promise<CareNote[]> {
    return this.getAll().then(all =>
      all.filter(n => n.caregiverId === caregiverId)
    );
  }

  getRecentByResident(residentId: string, limit = 5): Promise<CareNote[]> {
    return this.getByResident(residentId).then(notes =>
      notes.slice(0, limit)
    );
  }

  getWithFollowUp(): Promise<CareNote[]> {
    return this.getAll().then(all =>
      all.filter(n => n.followUpNeeded)
    );
  }

  getTodayNotes(): Promise<CareNote[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  }
}

export const careNoteApi = new CareNoteApiService();