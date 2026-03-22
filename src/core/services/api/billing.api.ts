import { Claim, ClaimStatus, ClaimStatusChange, PaymentInfo } from '../../models';
import { BaseApiService } from './base-api.service';
import { billingScrubberService } from '../billing-scrubber.service';

interface RejectClaimStructuredInput {
  category: string;
  reasonCode: string;
  details?: string;
}

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
    return this.search(c => c.status === 'Draft' || c.status === 'Submitted' || c.status === 'Resubmitted');
  }

  getDenied(): Promise<Claim[]> {
    return this.search(c => c.status === 'Rejected');
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

    const scrubber = billingScrubberService.evaluateClaimDraft(claim);
    if (!scrubber.isClean) {
      throw new Error(scrubber.errors[0]?.message || 'Claim failed validation checks');
    }

    const historyEntry: ClaimStatusChange = {
      status: 'Submitted',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: `Claim submitted for processing (scrubber score ${scrubber.qualityScore})`
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
    return this.rejectClaimStructured(id, changedBy, {
      category: 'administrative',
      reasonCode: 'MISSING_DOCUMENTATION',
      details: rejectionReason
    });
  }

  async rejectClaimStructured(
    id: string,
    changedBy: string,
    input: RejectClaimStructuredInput
  ): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');

    const rejectionReason = [input.category, input.reasonCode, input.details].filter(Boolean).join(' | ');

    const historyEntry: ClaimStatusChange = {
      status: 'Rejected',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: rejectionReason
    };

    return this.updateOrThrow(id, {
      status: 'Rejected',
      rejectionReason,
      denial: {
        category: input.category,
        reasonCode: input.reasonCode,
        details: input.details,
        deniedAt: new Date().toISOString(),
        deniedBy: changedBy
      },
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }

  async reopenRejectedClaim(
    id: string,
    changedBy: string,
    notes?: string
  ): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== 'Rejected') {
      throw new Error('Only rejected claims can be reopened');
    }

    const historyEntry: ClaimStatusChange = {
      status: 'Draft',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: notes?.trim() || 'Reopened for coding corrections'
    };

    return this.updateOrThrow(id, {
      status: 'Draft',
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      updatedAt: new Date().toISOString()
    });
  }

  async resubmitClaim(
    id: string,
    changedBy: string,
    appealNote?: string
  ): Promise<Claim> {
    const claim = await this.getById(id);
    if (!claim) throw new Error('Claim not found');
    if (claim.status !== 'Draft' && claim.status !== 'Rejected') {
      throw new Error('Only draft or rejected claims can be resubmitted');
    }

    const scrubber = billingScrubberService.evaluateClaimDraft(claim);
    if (!scrubber.isClean) {
      throw new Error(scrubber.errors[0]?.message || 'Claim failed validation checks');
    }

    const historyEntry: ClaimStatusChange = {
      status: 'Resubmitted',
      changedBy,
      changedAt: new Date().toISOString(),
      notes: appealNote?.trim() || 'Corrected claim resubmitted to payer'
    };

    const currentCount = claim.resubmission?.count || 0;

    return this.updateOrThrow(id, {
      status: 'Resubmitted',
      rejectionReason: undefined,
      statusHistory: [...(claim.statusHistory || []), historyEntry],
      resubmission: {
        count: currentCount + 1,
        lastResubmittedAt: new Date().toISOString(),
        lastResubmittedBy: changedBy,
        appealNote
      },
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