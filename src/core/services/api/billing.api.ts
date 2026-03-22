import { Claim, ClaimStatus, ClaimStatusChange, PaymentInfo } from '../../models';
import { BaseApiService } from './base-api.service';

class BillingApiService extends BaseApiService<Claim> {
  constructor() {
    super('claims');
  }

  private async updateOrThrow(id: string, updates: Partial<Claim>): Promise<Claim> {
    const updatedClaim = await this.update(id, updates);
    if (!updatedClaim) {
      throw new Error('Claim not found');
    }
    return updatedClaim;
  }

  // ─── Generators ───────────────────────────────────────────────
  generateClaimNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `CLM${timestamp}`;
  }

  // ─── Queries ──────────────────────────────────────────────────
  getByPatient(patientId: string): Promise<Claim[]> {
    return this.search(c => c.patientId === patientId);
  }

  getByEncounter(encounterId: string): Promise<Claim | null> {
    return this.search(c => c.encounterId === encounterId)
      .then(results => results[0] || null);
  }

  getByStatus(status: ClaimStatus): Promise<Claim[]> {
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

  // ─── Status Transitions ───────────────────────────────────────
  async submitClaim(id: string, changedBy: string): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');

    const historyEntry: ClaimStatusChange = {
      status: 'Submitted',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: 'Claim submitted for processing'
    };

    return this.updateOrThrow(id, {
      status: 'Submitted',
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }

  async approveClaim(id: string, changedBy: string): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');

    const historyEntry: ClaimStatusChange = {
      status: 'Approved',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: 'Claim approved by insurance'
    };

    return this.updateOrThrow(id, {
      status: 'Approved',
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }

  async rejectClaim(
    id: string,
    changedBy: string,
    rejectionReason: string
  ): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');

    const historyEntry: ClaimStatusChange = {
      status: 'Rejected',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: rejectionReason
    };

    return this.updateOrThrow(id, {
      status: 'Rejected',
      rejectionReason,
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }

  async recordPayment(
    id: string,
    payment: PaymentInfo,
    changedBy: string
  ): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');

    const historyEntry: ClaimStatusChange = {
      status: 'Paid',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: `Payment of $${payment.amountPaid.toFixed(2)} recorded via ${payment.method}`
    };

    return this.updateOrThrow(id, {
      status: 'Paid',
      payment,
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }
}

export const billingApi = new BillingApiService();