import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { labResultApi, patientApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { LabResult, Patient } from '../../../core/models';
import {
  ArrowLeft, FlaskConical, User, Calendar,
  AlertTriangle, CheckCircle, AlertCircle,
  Printer, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  result: z.string().min(1, 'Result value is required'),
  normalRange: z.string().optional(),
  isAbnormal: z.boolean(),
  notes: z.string().optional(),
  completedDate: z.string().min(1, 'Completed date is required')
});

type FormData = z.infer<typeof schema>;

// ─── Type color helper ────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  'Blood Test':  'bg-red-100 text-red-700',
  'Urinalysis':  'bg-yellow-100 text-yellow-700',
  'X-Ray':       'bg-purple-100 text-purple-700',
  'ECG':         'bg-pink-100 text-pink-700',
  'MRI':         'bg-indigo-100 text-indigo-700',
  'CT Scan':     'bg-cyan-100 text-cyan-700',
  'Ultrasound':  'bg-teal-100 text-teal-700',
  'Other':       'bg-slate-100 text-slate-700'
};

// ─── Component ────────────────────────────────────────────────────────────────
export const EnterResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [lab, setLab]         = useState<LabResult | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      result: '',
      normalRange: '',
      isAbnormal: false,
      notes: '',
      completedDate: new Date().toISOString().split('T')[0]
    }
  });

  const watchedIsAbnormal = watch('isAbnormal');

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (labId: string) => {
    setLoading(true);
    try {
      const labData = await labResultApi.getById(labId);
      if (!labData) {
        toast.error('Lab order not found');
        navigate('/lab');
        return;
      }

      // If already completed/cancelled, redirect to view
      if (labData.status === 'Completed' || labData.status === 'Cancelled') {
        navigate(`/lab/${labId}`);
        return;
      }

      setLab(labData);

      // Pre-fill if there's an existing result (In Progress)
      if (labData.result) setValue('result', labData.result);
      if (labData.normalRange) setValue('normalRange', labData.normalRange);
      if (labData.notes) setValue('notes', labData.notes);

      const p = await patientApi.getById(labData.patientId);
      setPatient(p);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load lab order');
    } finally {
      setLoading(false);
    }
  };

  // ── Mark In Progress ──────────────────────────────────────────────────
  const handleMarkInProgress = async () => {
    if (!lab) return;
    try {
      await labResultApi.markInProgress(lab.id);
      toast.success('Marked as In Progress');
      loadData(lab.id);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Submit Results ────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (!lab || !user) return;
    setSubmitting(true);
    try {
      await labResultApi.enterResults(lab.id, {
        result: data.result,
        normalRange: data.normalRange,
        isAbnormal: data.isAbnormal,
        notes: data.notes,
        completedDate: new Date(data.completedDate).toISOString(),
        enteredBy: user.id,
        enteredByName: user.fullName
      });

      toast.success('Lab results entered successfully');
      navigate(`/lab/${lab.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save results');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!lab) return null;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/lab')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enter Lab Results</h1>
          <p className="text-slate-500 text-sm mt-0.5">{lab.labOrderNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Form (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Status notice if Ordered */}
            {lab.status === 'Ordered' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    This order has not been started yet
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    You can mark it as In Progress before entering results.
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkInProgress}
                    className="mt-2 text-xs font-medium text-yellow-700 underline hover:no-underline"
                  >
                    Mark as In Progress →
                  </button>
                </div>
              </div>
            )}

            {/* Result Entry */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800 flex items-center">
                <ClipboardList size={18} className="mr-2 text-blue-600" />
                Test Results
              </h2>

              {/* Result Value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Result Value <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('result')}
                  rows={3}
                  placeholder="e.g. 6.8%, Within normal limits, 120/80 mmHg..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.result && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.result.message}
                  </p>
                )}
              </div>

              {/* Normal Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Normal Range{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('normalRange')}
                  placeholder="e.g. < 5.7%, 70–100 mg/dL, 0.4–4.0 mIU/L"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Abnormal Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Result Classification <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      value="false"
                      checked={!watchedIsAbnormal}
                      onChange={() => setValue('isAbnormal', false)}
                      className="peer sr-only"
                    />
                    <div className="border-2 rounded-lg p-3 text-center transition-all peer-checked:border-green-500 peer-checked:bg-green-50 border-slate-200 hover:border-slate-300">
                      <CheckCircle size={20} className={`mx-auto mb-1 ${!watchedIsAbnormal ? 'text-green-500' : 'text-slate-300'}`} />
                      <p className={`text-sm font-medium ${!watchedIsAbnormal ? 'text-green-700' : 'text-slate-500'}`}>
                        Normal
                      </p>
                    </div>
                  </label>
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      value="true"
                      checked={watchedIsAbnormal}
                      onChange={() => setValue('isAbnormal', true)}
                      className="peer sr-only"
                    />
                    <div className="border-2 rounded-lg p-3 text-center transition-all peer-checked:border-red-500 peer-checked:bg-red-50 border-slate-200 hover:border-slate-300">
                      <AlertTriangle size={20} className={`mx-auto mb-1 ${watchedIsAbnormal ? 'text-red-500' : 'text-slate-300'}`} />
                      <p className={`text-sm font-medium ${watchedIsAbnormal ? 'text-red-700' : 'text-slate-500'}`}>
                        Abnormal
                      </p>
                    </div>
                  </label>
                </div>
                {watchedIsAbnormal && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-medium">
                      This result will be flagged as abnormal and highlighted for the ordering physician.
                    </p>
                  </div>
                )}
              </div>

              {/* Completed Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Completed Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('completedDate')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.completedDate && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.completedDate.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clinical Notes{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Any additional observations, recommendations, or notes for the ordering physician..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/lab')}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Save Results</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Lab Order Summary (1/3) ──────────────────────────── */}
        <div className="space-y-4">

          {/* Order Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Lab Order Details
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Order Number</p>
                <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">
                  {lab.labOrderNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Test Name</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{lab.testName}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[lab.testType] || TYPE_COLORS['Other']}`}>
                  {lab.testType}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Ordered By</p>
                <p className="text-sm text-slate-800 mt-0.5">{lab.orderedByName || '—'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Ordered Date</p>
                <p className="text-sm text-slate-800 mt-0.5">
                  {format(new Date(lab.orderedDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              {lab.notes && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Order Notes</p>
                  <p className="text-sm text-slate-700 mt-0.5 bg-yellow-50 rounded p-2 border border-yellow-100">
                    {lab.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Current Status</p>
                <span className={`inline-flex items-center space-x-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  lab.status === 'Ordered' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  lab.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span>{lab.status}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          {patient && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center">
                <User size={14} className="mr-1.5" />
                Patient
              </h2>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-slate-500">MRN: {patient.mrn}</p>
                  <p className="text-xs text-slate-500">
                    DOB: {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              {patient.flags?.hasAllergies && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle size={12} className="text-red-500" />
                  <p className="text-xs text-red-700 font-medium">
                    Allergies: {patient.flags.allergyList}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Entered By (preview) */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
              Will be entered by
            </p>
            <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};