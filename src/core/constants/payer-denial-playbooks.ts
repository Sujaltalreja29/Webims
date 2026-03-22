export interface DenialPlaybook {
  payer: string;
  title: string;
  actions: string[];
  targetTurnaroundDays: number;
}

const DEFAULT_PLAYBOOK: DenialPlaybook = {
  payer: 'Default',
  title: 'General Denial Rework Guidance',
  actions: [
    'Validate diagnosis-procedure linkage and modifier use.',
    'Attach missing chart notes or authorization evidence.',
    'Document correction details in appeal notes before resubmission.'
  ],
  targetTurnaroundDays: 5
};

const PLAYBOOKS: Record<string, DenialPlaybook> = {
  Medicare: {
    payer: 'Medicare',
    title: 'Medicare Denial Playbook',
    actions: [
      'Confirm LCD/NCD support for billed service.',
      'Add ABN or medical necessity documentation where applicable.',
      'Use corrected claim frequency code and include appeal narrative.'
    ],
    targetTurnaroundDays: 7
  },
  Medicaid: {
    payer: 'Medicaid',
    title: 'Medicaid Denial Playbook',
    actions: [
      'Verify member eligibility on date of service.',
      'Confirm state-specific prior authorization requirements.',
      'Refile with corrected rendering/billing provider taxonomy.'
    ],
    targetTurnaroundDays: 5
  },
  Private: {
    payer: 'Private',
    title: 'Commercial Payer Denial Playbook',
    actions: [
      'Check plan-specific policy and authorization requirements.',
      'Attach operative/progress notes supporting billed complexity.',
      'Submit corrected claim and follow up within 72 hours.'
    ],
    targetTurnaroundDays: 4
  },
  'Self-Pay': {
    payer: 'Self-Pay',
    title: 'Self-Pay Resolution Playbook',
    actions: [
      'Validate charge capture and patient balance calculation.',
      'Share itemized statement with patient guarantor.',
      'Offer payment plan and document acceptance or refusal.'
    ],
    targetTurnaroundDays: 3
  }
};

export const getDenialPlaybook = (insuranceType: string): DenialPlaybook => {
  return PLAYBOOKS[insuranceType] || DEFAULT_PLAYBOOK;
};