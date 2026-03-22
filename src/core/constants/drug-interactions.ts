export type InteractionSeverity = 'moderate' | 'severe';

export interface DrugInteraction {
  meds: [string, string];
  severity: InteractionSeverity;
  description: string;
}

export const CRITICAL_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    meds: ['warfarin', 'ibuprofen'],
    severity: 'severe',
    description: 'Increased bleeding risk'
  },
  {
    meds: ['warfarin', 'aspirin'],
    severity: 'severe',
    description: 'Major bleeding risk when combined'
  },
  {
    meds: ['lisinopril', 'ibuprofen'],
    severity: 'moderate',
    description: 'Reduced antihypertensive effect and potential renal stress'
  },
  {
    meds: ['metformin', 'contrast dye'],
    severity: 'moderate',
    description: 'Potential lactic acidosis risk around contrast studies'
  }
];
