import { Patient } from '../../models';
import { BaseApiService } from './base-api.service';

class PatientApiService extends BaseApiService<Patient> {
  constructor() {
    super('patients');
  }

  generateMRN(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MRN${timestamp}${random}`;
  }

  searchByMRN(mrn: string): Promise<Patient | null> {
    return this.search(p => p.mrn === mrn).then(results => results[0] || null);
  }

  searchByName(name: string): Promise<Patient[]> {
    const searchTerm = name.toLowerCase();
    return this.search(p => 
      p.firstName.toLowerCase().includes(searchTerm) ||
      p.lastName.toLowerCase().includes(searchTerm)
    );
  }

  searchByPhone(phone: string): Promise<Patient[]> {
    return this.search(p => p.phone.includes(phone));
  }

    getActivePatients(): Promise<Patient[]> {
    return this.search(p => p.isActive);
  }
}

export const patientApi = new PatientApiService();