import type { Claim } from '../models';

export type ClaimScrubberSeverity = 'error' | 'warning';

export interface ClaimScrubberIssue {
  code: string;
  message: string;
  severity: ClaimScrubberSeverity;
}

export interface ClaimScrubberResult {
  issues: ClaimScrubberIssue[];
  errors: ClaimScrubberIssue[];
  warnings: ClaimScrubberIssue[];
  qualityScore: number;
  isClean: boolean;
}

const daysBetween = (fromDate: string, toDate: Date = new Date()): number => {
  const from = new Date(fromDate);
  if (Number.isNaN(from.getTime())) return 0;
  const diff = toDate.getTime() - from.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const hasDuplicates = (values: string[]): boolean => {
  const normalized = values.map((value) => value.trim().toLowerCase());
  return new Set(normalized).size !== normalized.length;
};

export const billingScrubberService = {
  evaluateClaimDraft(claim: Partial<Claim>): ClaimScrubberResult {
    const issues: ClaimScrubberIssue[] = [];

    const diagnosisCodes = claim.diagnosisCodes || [];
    const procedureCodes = claim.procedureCodes || [];
    const amount = claim.totalAmount || 0;

    if (!claim.patientId) {
      issues.push({ code: 'PATIENT_MISSING', message: 'Patient is required before claim submission.', severity: 'error' });
    }

    if (!claim.visitDate) {
      issues.push({ code: 'VISIT_DATE_MISSING', message: 'Visit date is required.', severity: 'error' });
    } else {
      const visitDate = new Date(claim.visitDate);
      if (Number.isNaN(visitDate.getTime())) {
        issues.push({ code: 'VISIT_DATE_INVALID', message: 'Visit date is invalid.', severity: 'error' });
      } else if (visitDate.getTime() > Date.now()) {
        issues.push({ code: 'VISIT_DATE_FUTURE', message: 'Visit date cannot be in the future.', severity: 'error' });
      } else {
        const ageInDays = daysBetween(claim.visitDate);
        if (ageInDays > 90) {
          issues.push({
            code: 'VISIT_DATE_OLD',
            message: 'Claim is older than 90 days. Payer may require justification for timely filing.',
            severity: 'warning'
          });
        }
      }
    }

    if (!claim.insuranceType) {
      issues.push({ code: 'INSURANCE_MISSING', message: 'Insurance type is required.', severity: 'error' });
    } else if (claim.insuranceType === 'Self-Pay') {
      issues.push({
        code: 'SELF_PAY_NOTE',
        message: 'Self-pay selected. Verify patient payment plan and receipt workflow.',
        severity: 'warning'
      });
    }

    if (diagnosisCodes.length === 0) {
      issues.push({ code: 'DX_MISSING', message: 'At least one diagnosis code is required.', severity: 'error' });
    }

    if (procedureCodes.length === 0) {
      issues.push({ code: 'PROC_MISSING', message: 'At least one procedure code is required.', severity: 'error' });
    }

    if (amount <= 0) {
      issues.push({ code: 'AMOUNT_INVALID', message: 'Total amount must be greater than zero.', severity: 'error' });
    }

    if (diagnosisCodes.length > 8) {
      issues.push({ code: 'DX_HEAVY', message: 'High diagnosis count may trigger payer review.', severity: 'warning' });
    }

    if (procedureCodes.length > 6) {
      issues.push({ code: 'PROC_HEAVY', message: 'High procedure count may require additional documentation.', severity: 'warning' });
    }

    if (hasDuplicates(diagnosisCodes)) {
      issues.push({ code: 'DX_DUPLICATE', message: 'Duplicate diagnosis entries were detected.', severity: 'warning' });
    }

    if (hasDuplicates(procedureCodes)) {
      issues.push({ code: 'PROC_DUPLICATE', message: 'Duplicate procedure entries were detected.', severity: 'warning' });
    }

    if (!claim.encounterId) {
      issues.push({
        code: 'ENCOUNTER_LINK_MISSING',
        message: 'Claim is not linked to an encounter. Link one to improve traceability.',
        severity: 'warning'
      });
    }

    if (amount > 15000) {
      issues.push({
        code: 'AMOUNT_HIGH',
        message: 'High charge amount detected. Confirm coding and units before submission.',
        severity: 'warning'
      });
    }

    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');

    const qualityScore = Math.max(0, 100 - errors.length * 20 - warnings.length * 7);

    return {
      issues,
      errors,
      warnings,
      qualityScore,
      isClean: errors.length === 0
    };
  }
};