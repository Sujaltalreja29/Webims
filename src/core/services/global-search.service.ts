import type { UserRole } from '../models';
import type { Patient, Appointment, Encounter, Prescription, Claim, LabResult } from '../models';
import { ACCESS_CONTROL } from '../constants/access-control';
import {
  patientApi,
  appointmentApi,
  encounterApi,
  prescriptionApi,
  billingApi,
  labResultApi
} from './api';

export type GlobalSearchKind =
  | 'action'
  | 'patient'
  | 'appointment'
  | 'encounter'
  | 'prescription'
  | 'claim'
  | 'lab';

export interface GlobalSearchResult {
  id: string;
  kind: GlobalSearchKind;
  title: string;
  subtitle: string;
  path: string;
  score: number;
}

const normalize = (value: string): string => value.toLowerCase().trim();

const humanDate = (dateLike?: string): string => {
  if (!dateLike) return '-';
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};

const canAccess = (role: UserRole, roles: readonly UserRole[]): boolean => roles.includes(role);

const scoreMatch = (query: string, primary: string, extra: string[]): number => {
  const term = normalize(query);
  if (!term) return 0;

  const primaryValue = normalize(primary);
  const extraValue = normalize(extra.join(' '));
  const combined = `${primaryValue} ${extraValue}`;
  const tokens = term.split(/\s+/).filter(Boolean);

  let score = 0;

  if (primaryValue === term) score += 220;
  if (primaryValue.startsWith(term)) score += 140;
  if (primaryValue.includes(term)) score += 100;
  if (combined.includes(term)) score += 70;

  for (const token of tokens) {
    if (primaryValue.includes(token)) score += 30;
    else if (combined.includes(token)) score += 18;
    else score -= 8;
  }

  return score;
};

const labelPatient = (patient: Patient): string => `${patient.firstName} ${patient.lastName}`;

export const globalSearchService = {
  async search(query: string, role: UserRole, limit = 25): Promise<GlobalSearchResult[]> {
    const term = query.trim();

    const actionResults = ACCESS_CONTROL.quickActions
      .filter((action) => canAccess(role, action.roles))
      .map<GlobalSearchResult>((action) => ({
        id: `action-${action.path}`,
        kind: 'action',
        title: action.label,
        subtitle: 'Quick action',
        path: action.path,
        score: term ? scoreMatch(term, action.label, [action.path]) : 65
      }))
      .filter((item) => (term ? item.score > 0 : true));

    if (!term) {
      return actionResults.sort((a, b) => b.score - a.score).slice(0, Math.min(limit, 10));
    }

    const [patients, appointments, encounters, prescriptions, claims, labs] = await Promise.all([
      canAccess(role, ACCESS_CONTROL.routes.patients) ? patientApi.getAll() : Promise.resolve([]),
      canAccess(role, ACCESS_CONTROL.routes.appointments) ? appointmentApi.getAll() : Promise.resolve([]),
      canAccess(role, ACCESS_CONTROL.routes.clinical) ? encounterApi.getAll() : Promise.resolve([]),
      canAccess(role, ACCESS_CONTROL.routes.pharmacyQueue) ? prescriptionApi.getAll() : Promise.resolve([]),
      canAccess(role, ACCESS_CONTROL.routes.billing) ? billingApi.getAll() : Promise.resolve([]),
      canAccess(role, ACCESS_CONTROL.routes.lab) ? labResultApi.getAll() : Promise.resolve([])
    ]);

    const patientById = new Map<string, Patient>(patients.map((patient) => [patient.id, patient]));

    const patientResults = patients
      .map<GlobalSearchResult | null>((patient) => {
        const fullName = labelPatient(patient);
        const score = scoreMatch(term, fullName, [patient.mrn, patient.phone, patient.email || '']);
        if (score <= 0) return null;
        return {
          id: `patient-${patient.id}`,
          kind: 'patient',
          title: `${fullName} (${patient.mrn})`,
          subtitle: `${patient.gender} • ${patient.isActive ? 'Active' : 'Inactive'}`,
          path: `/patients/${patient.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    const appointmentResults = appointments
      .map<GlobalSearchResult | null>((appointment: Appointment) => {
        const patient = patientById.get(appointment.patientId);
        const patientName = patient ? labelPatient(patient) : 'Unknown patient';
        const score = scoreMatch(term, appointment.appointmentNumber, [
          patientName,
          patient?.mrn || '',
          appointment.status,
          appointment.reason || '',
          appointment.date,
          appointment.startTime
        ]);
        if (score <= 0) return null;
        return {
          id: `appointment-${appointment.id}`,
          kind: 'appointment',
          title: `${appointment.appointmentNumber} • ${patientName}`,
          subtitle: `${appointment.status} • ${humanDate(appointment.date)} ${appointment.startTime}`,
          path: `/appointments/${appointment.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    const encounterResults = encounters
      .map<GlobalSearchResult | null>((encounter: Encounter) => {
        const patient = patientById.get(encounter.patientId);
        const patientName = patient ? labelPatient(patient) : 'Unknown patient';
        const score = scoreMatch(term, encounter.encounterNumber, [
          patientName,
          patient?.mrn || '',
          encounter.chiefComplaint,
          encounter.assessment,
          encounter.status,
          encounter.visitDate
        ]);
        if (score <= 0) return null;
        return {
          id: `encounter-${encounter.id}`,
          kind: 'encounter',
          title: `${encounter.encounterNumber} • ${patientName}`,
          subtitle: `${encounter.status} • ${humanDate(encounter.visitDate)} • ${encounter.chiefComplaint}`,
          path: `/clinical/${encounter.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    const prescriptionResults = prescriptions
      .map<GlobalSearchResult | null>((prescription: Prescription) => {
        const patient = patientById.get(prescription.patientId);
        const patientName = patient ? labelPatient(patient) : 'Unknown patient';
        const score = scoreMatch(term, prescription.rxNumber, [
          prescription.medicationName,
          patientName,
          patient?.mrn || '',
          prescription.status,
          prescription.dosage,
          prescription.frequency
        ]);
        if (score <= 0) return null;
        return {
          id: `prescription-${prescription.id}`,
          kind: 'prescription',
          title: `${prescription.rxNumber} • ${prescription.medicationName}`,
          subtitle: `${patientName} • ${prescription.status}`,
          path: `/pharmacy/prescriptions/${prescription.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    const claimResults = claims
      .map<GlobalSearchResult | null>((claim: Claim) => {
        const patient = patientById.get(claim.patientId);
        const patientName = patient ? labelPatient(patient) : 'Unknown patient';
        const score = scoreMatch(term, claim.claimNumber, [
          patientName,
          patient?.mrn || '',
          claim.status,
          claim.insuranceType,
          ...claim.diagnosisCodes,
          ...claim.procedureCodes
        ]);
        if (score <= 0) return null;
        return {
          id: `claim-${claim.id}`,
          kind: 'claim',
          title: `${claim.claimNumber} • ${patientName}`,
          subtitle: `${claim.status} • $${claim.totalAmount.toFixed(2)} • ${humanDate(claim.visitDate)}`,
          path: `/billing/${claim.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    const labResults = labs
      .map<GlobalSearchResult | null>((lab: LabResult) => {
        const patient = patientById.get(lab.patientId);
        const patientName = patient ? labelPatient(patient) : 'Unknown patient';
        const score = scoreMatch(term, lab.labOrderNumber, [
          patientName,
          patient?.mrn || '',
          lab.testName,
          lab.testType,
          lab.status,
          lab.result || ''
        ]);
        if (score <= 0) return null;
        return {
          id: `lab-${lab.id}`,
          kind: 'lab',
          title: `${lab.labOrderNumber} • ${lab.testName}`,
          subtitle: `${patientName} • ${lab.status} • ${humanDate(lab.orderedDate)}`,
          path: `/lab/${lab.id}`,
          score
        };
      })
      .filter((item): item is GlobalSearchResult => item !== null);

    return [...actionResults, ...patientResults, ...appointmentResults, ...encounterResults, ...prescriptionResults, ...claimResults, ...labResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
};