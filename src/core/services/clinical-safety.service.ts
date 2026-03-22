import type { Prescription } from '../models';
import { MEDICATION_ALLERGY_MAP } from '../constants/medication-allergy-map';
import { CRITICAL_DRUG_INTERACTIONS, type DrugInteraction } from '../constants/drug-interactions';

interface AllergyCheckResult {
  hasContraindication: boolean;
  matchedAllergens: string[];
}

interface InteractionCheckResult {
  severe: DrugInteraction[];
  moderate: DrugInteraction[];
}

interface RefillEligibilityResult {
  eligible: boolean;
  reason?: string;
  nextEligibleDate?: string;
}

class ClinicalSafetyService {
  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private tokenizeAllergies(allergyList?: string): string[] {
    if (!allergyList) return [];

    return allergyList
      .split(/,|;|\//)
      .map((item) => this.normalize(item))
      .filter(Boolean);
  }

  checkMedicationAllergy(medicationName: string, allergyList?: string): AllergyCheckResult {
    const normalizedMedication = this.normalize(medicationName);
    const medicationAllergens = MEDICATION_ALLERGY_MAP[normalizedMedication] || [normalizedMedication];
    const allergies = this.tokenizeAllergies(allergyList);

    const matchedAllergens = medicationAllergens.filter((medAllergen) =>
      allergies.some((allergy) => allergy.includes(medAllergen) || medAllergen.includes(allergy))
    );

    return {
      hasContraindication: matchedAllergens.length > 0,
      matchedAllergens
    };
  }

  checkDuplicateMedication(medicationName: string, existingPrescriptions: Array<Pick<Prescription, 'medicationName'>>): boolean {
    const normalizedMedication = this.normalize(medicationName);
    return existingPrescriptions.some(
      (prescription) => this.normalize(prescription.medicationName) === normalizedMedication
    );
  }

  checkDrugInteractions(
    medicationName: string,
    existingPrescriptions: Array<Pick<Prescription, 'medicationName'>>
  ): InteractionCheckResult {
    const normalizedMedication = this.normalize(medicationName);
    const existingMedicationNames = existingPrescriptions.map((prescription) => this.normalize(prescription.medicationName));

    const matched = CRITICAL_DRUG_INTERACTIONS.filter((interaction) => {
      const [medA, medB] = interaction.meds.map((med) => this.normalize(med));
      const includesMedication = normalizedMedication === medA || normalizedMedication === medB;
      if (!includesMedication) return false;

      const counterpart = normalizedMedication === medA ? medB : medA;
      return existingMedicationNames.some((existing) => existing.includes(counterpart) || counterpart.includes(existing));
    });

    return {
      severe: matched.filter((interaction) => interaction.severity === 'severe'),
      moderate: matched.filter((interaction) => interaction.severity === 'moderate')
    };
  }

  private estimateDailyDoses(frequency: string): number {
    const normalized = this.normalize(frequency);

    if (normalized.includes('four')) return 4;
    if (normalized.includes('three')) return 3;
    if (normalized.includes('twice')) return 2;
    if (normalized.includes('every 6')) return 4;
    if (normalized.includes('every 8')) return 3;
    if (normalized.includes('every 12')) return 2;
    if (normalized.includes('as needed')) return 1;
    return 1;
  }

  private calculateDaysSupply(quantity: number, frequency: string): number {
    const dailyDoses = this.estimateDailyDoses(frequency);
    if (quantity <= 0) return 0;
    return Math.max(1, Math.floor(quantity / dailyDoses));
  }

  validateRefillEligibility(prescription: Prescription): RefillEligibilityResult {
    if (prescription.status === 'Cancelled') {
      return { eligible: false, reason: 'Cancelled prescriptions cannot be refilled.' };
    }

    if (prescription.refills <= 0) {
      return { eligible: false, reason: 'No refills remaining on this prescription.' };
    }

    if (!prescription.dispensedAt) {
      return { eligible: true };
    }

    const daysSupply = this.calculateDaysSupply(prescription.quantity, prescription.frequency);
    const minimumDaysBeforeRefill = Math.max(1, Math.floor(daysSupply * 0.8));

    const dispensedDate = new Date(prescription.dispensedAt);
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceDispensed = Math.floor((now.getTime() - dispensedDate.getTime()) / msPerDay);

    if (daysSinceDispensed < minimumDaysBeforeRefill) {
      const nextEligibleDate = new Date(dispensedDate.getTime() + minimumDaysBeforeRefill * msPerDay).toISOString();
      return {
        eligible: false,
        reason: `Refill requested too early. Minimum wait is ${minimumDaysBeforeRefill} day(s).`,
        nextEligibleDate
      };
    }

    return { eligible: true };
  }
}

export const clinicalSafetyService = new ClinicalSafetyService();
