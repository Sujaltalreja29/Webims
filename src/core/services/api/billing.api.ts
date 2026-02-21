import { Claim } from '../../models';
import { BaseApiService } from './base-api.service';

class BillingApiService extends BaseApiService<Claim> {
  constructor() {
    super('claims');
  }

  generateClaimNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `CLM${timestamp}`;
  }

  getByPatient(patientId: string): Promise<Claim[]> {
    return this.search(c => c.patientId === patientId);
  }

  getByEncounter(encounterId: string): Promise<Claim | null> {
    return this.search(c => c.encounterId === encounterId)
      .then(results => results[0] || null);
  }

  getByStatus(status: Claim['status']): Promise<Claim[]> {
    return this.search(c => c.status === status);
  }

  getPending(): Promise<Claim[]> {
    return this.search(c => c.status === 'Draft' || c.status === 'Submitted');
  }

  getTotalRevenue(): Promise<number> {
    return this.getAll().then(claims => 
      claims
        .filter(c => c.status === 'Paid')
        .reduce((sum, c) => sum + (c.payment?.amountPaid || 0), 0)
    );
  }

  recordPayment(id: string, amountPaid: number, method: 'Cash' | 'Card' | 'Insurance'): Promise<Claim | null> {
    return this.update(id, {
      status: 'Paid',
      payment: {
        amountPaid,
        paidDate: new Date().toISOString(),
        method
      }
    } as Partial<Claim>);
  }
}

export const billingApi = new BillingApiService();