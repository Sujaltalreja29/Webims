import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { billingApi, patientApi, encounterApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient, Encounter } from '../../../core/models';
import { DIAGNOSIS_CODES, PROCEDURE_CODES, INSURANCE_TYPES } from '../../../core/constants/medical-codes';
import {
  ArrowLeft, FileText, User, Calendar,
  DollarSign, AlertCircle, Search, X, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Validation Schema ──────────────────────────────────────────────────────
const schema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  encounterId: z.string().optional(),
  visitDate: z.string().min(1, 'Visit date is required'),
  insuranceType: z.string().min(1, 'Insurance type is required'),
  diagnosisCodes: z.array(z.string()).min(1, 'At least one diagnosis is required'),
  procedureCodes: z.array(z.string()).min(1, 'At least one procedure is required'),
  totalAmount: z.number({ message: 'Amount must be a number' }).positive('Amount must be greater than 0')
});

type FormData = z.infer<typeof schema>;

// ─── Component ──────────────────────────────────────────────────────────────
export const NewClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  // Pre-fill from URL params (e.g., from encounter flow)
  const prefilledEncounterId = searchParams.get('encounterId');
  const prefilledPatientId = searchParams.get('patientId');

  // ── State ────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loadingEncounters, setLoadingEncounters] = useState(false);

  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  // ── React Hook Form ──────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: prefilledPatientId || '',
      encounterId: prefilledEncounterId || '',
      visitDate: new Date().toISOString().split('T')[0],
      insuranceType: '',
      diagnosisCodes: [],
      procedureCodes: [],
      totalAmount: 0
    }
  });

  const watchedPatientId = watch('patientId');
  const watchedEncounterId = watch('encounterId');

  // ── Load patients on mount ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const data = await patientApi.getAll();
      setPatients(data.filter(p => p.isActive));

      // If pre-filled patient, load them immediately
      if (prefilledPatientId) {
        const p = data.find(x => x.id === prefilledPatientId);
        if (p) {
          setSelectedPatient(p);
          setPatientSearch(`${p.firstName} ${p.lastName}`);
          loadEncountersForPatient(prefilledPatientId);
          setValue('insuranceType', p.insurance?.type || '');
        }
      }
    };
    load();
  }, []);

  // ── Pre-fill from encounter if provided ─────────────────────────────────
  useEffect(() => {
    if (prefilledEncounterId) {
      encounterApi.getById(prefilledEncounterId).then(enc => {
        if (!enc) return;
        setValue('visitDate', enc.visitDate);
        // Pre-fill diagnoses from encounter
        if (enc.diagnoses?.length) {
          setSelectedDiagnoses(enc.diagnoses);
          setValue('diagnosisCodes', enc.diagnoses);
        }
      });
    }
  }, [prefilledEncounterId]);

  // ── Load encounters when patient changes ────────────────────────────────
  const loadEncountersForPatient = async (patientId: string) => {
    setLoadingEncounters(true);
    try {
      const all = await encounterApi.getAll();
      const patientEncounters = all
        .filter(e => e.patientId === patientId)
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      setEncounters(patientEncounters);
    } finally {
      setLoadingEncounters(false);
    }
  };

  // ── When encounter is selected, auto-fill fields ─────────────────────────
  useEffect(() => {
    if (!watchedEncounterId) return;
    const enc = encounters.find(e => e.id === watchedEncounterId);
    if (!enc) return;

    setValue('visitDate', enc.visitDate);
    if (enc.diagnoses?.length) {
      setSelectedDiagnoses(enc.diagnoses);
      setValue('diagnosisCodes', enc.diagnoses);
    }
  }, [watchedEncounterId]);

  // ── Patient search / select ──────────────────────────────────────────────
  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q)
    );
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
    setValue('patientId', patient.id);
    setValue('insuranceType', patient.insurance?.type || '');
    loadEncountersForPatient(patient.id);
    // reset encounter when patient changes
    setValue('encounterId', '');
    setEncounters([]);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setValue('patientId', '');
    setValue('encounterId', '');
    setValue('insuranceType', '');
    setEncounters([]);
  };

  // ── Diagnosis toggles ────────────────────────────────────────────────────
  const toggleDiagnosis = (code: string) => {
    const updated = selectedDiagnoses.includes(code)
      ? selectedDiagnoses.filter(c => c !== code)
      : [...selectedDiagnoses, code];
    setSelectedDiagnoses(updated);
    setValue('diagnosisCodes', updated);
  };

  // ── Procedure toggles ────────────────────────────────────────────────────
  const toggleProcedure = (description: string) => {
    const updated = selectedProcedures.includes(description)
      ? selectedProcedures.filter(c => c !== description)
      : [...selectedProcedures, description];
    setSelectedProcedures(updated);
    setValue('procedureCodes', updated);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const allClaims = await billingApi.getAll();
      const nextId = allClaims.length + 1;

      const newClaim = await billingApi.create({
        id: `claim-${nextId}`,
        claimNumber: billingApi.generateClaimNumber(),
        patientId: data.patientId,
        encounterId: data.encounterId || undefined,
        visitDate: data.visitDate,
        diagnosisCodes: data.diagnosisCodes,
        procedureCodes: data.procedureCodes,
        totalAmount: data.totalAmount,
        insuranceType: data.insuranceType,
        status: 'Draft',
        statusHistory: [
          {
            status: 'Draft',
            changedBy: user.id,
            changedAt: new Date().toISOString(),
            notes: 'Claim created'
          }
        ],
        createdAt: new Date().toISOString(),
        createdBy: user.id
      });

      toast.success('Claim created successfully!');
      navigate(`/billing/${newClaim.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create claim');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/billing')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">New Claim</h1>
            <p className="text-slate-600 mt-0.5">Create a new billing claim</p>
          </div>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ─ Patient & Visit Info ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <User size={20} className="mr-2 text-blue-600" />
            Patient & Visit Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Patient Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient <span className="text-red-500">*</span>
              </label>

              {selectedPatient ? (
                /* Selected state */
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        MRN: {selectedPatient.mrn} · {selectedPatient.insurance?.type || 'No Insurance'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>
              ) : (
                /* Search state */
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search by name or MRN..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showPatientDropdown && patientSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <p className="p-3 text-sm text-slate-500">No patients found</p>
                      ) : (
                        filteredPatients.slice(0, 8).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => handleSelectPatient(p)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <p className="font-medium text-slate-800 text-sm">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              MRN: {p.mrn} · {p.insurance?.type || 'No Insurance'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.patientId && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.patientId.message}
                </p>
              )}
            </div>

            {/* Encounter (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Linked Encounter <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                {...register('encounterId')}
                disabled={!watchedPatientId || loadingEncounters}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {!watchedPatientId
                    ? 'Select a patient first'
                    : loadingEncounters
                    ? 'Loading...'
                    : encounters.length === 0
                    ? 'No encounters found'
                    : '-- No linked encounter --'}
                </option>
                {encounters.map(enc => (
                  <option key={enc.id} value={enc.id}>
                    {format(new Date(enc.visitDate), 'MMM dd, yyyy')} — {enc.chiefComplaint}
                  </option>
                ))}
              </select>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Visit Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('visitDate')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.visitDate && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.visitDate.message}
                </p>
              )}
            </div>

            {/* Insurance Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Insurance Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('insuranceType')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select insurance type...</option>
                {INSURANCE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.insuranceType && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.insuranceType.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─ Diagnoses ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <FileText size={20} className="mr-2 text-purple-600" />
              Diagnosis Codes
              <span className="ml-2 text-sm font-normal text-slate-500">
                (select all that apply)
              </span>
            </h2>
            {selectedDiagnoses.length > 0 && (
              <span className="text-sm bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                {selectedDiagnoses.length} selected
              </span>
            )}
          </div>

          {errors.diagnosisCodes && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-sm">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              {errors.diagnosisCodes.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {DIAGNOSIS_CODES.map(code => {
              const selected = selectedDiagnoses.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleDiagnosis(code)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selected
                      ? 'bg-purple-50 border-purple-400 text-purple-800 font-medium'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                      selected ? 'bg-purple-500 border-purple-500' : 'border-slate-300'
                    }`}>
                      {selected && <CheckSquare size={12} className="text-white" />}
                    </div>
                    <span>{code}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─ Procedures ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Calendar size={20} className="mr-2 text-green-600" />
              Procedure Codes
              <span className="ml-2 text-sm font-normal text-slate-500">
                (select all that apply)
              </span>
            </h2>
            {selectedProcedures.length > 0 && (
              <span className="text-sm bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                {selectedProcedures.length} selected
              </span>
            )}
          </div>

          {errors.procedureCodes && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-sm">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              {errors.procedureCodes.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PROCEDURE_CODES.map(proc => {
              const selected = selectedProcedures.includes(proc.description);
              return (
                <button
                  key={proc.code}
                  type="button"
                  onClick={() => toggleProcedure(proc.description)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selected
                      ? 'bg-green-50 border-green-400 text-green-800 font-medium'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 mt-0.5 ${
                      selected ? 'bg-green-500 border-green-500' : 'border-slate-300'
                    }`}>
                      {selected && <CheckSquare size={12} className="text-white" />}
                    </div>
                    <div>
                      <span className="font-mono text-xs text-slate-500 block">{proc.code}</span>
                      <span>{proc.description}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─ Amount ─ */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <DollarSign size={20} className="mr-2 text-green-600" />
            Billing Amount
          </h2>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('totalAmount', { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.totalAmount && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.totalAmount.message}
              </p>
            )}
          </div>
        </div>

        {/* ─ Form Actions ─ */}
        <div className="flex justify-end space-x-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Create Claim</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};