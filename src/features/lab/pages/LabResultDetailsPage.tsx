import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labResultApi, patientApi, encounterApi } from '../../../core/services/api';
import { LabResult, Patient, Encounter } from '../../../core/models';
import {
  ArrowLeft, Printer, FlaskConical, User,
  CheckCircle, AlertTriangle, Clock, Activity,
  XCircle, Calendar, ChevronRight, Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
export const LabResultDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lab, setLab]           = useState<LabResult | null>(null);
  const [patient, setPatient]   = useState<Patient | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (labId: string) => {
    setLoading(true);
    try {
      const labData = await labResultApi.getById(labId);
      if (!labData) {
        toast.error('Lab result not found');
        navigate('/lab');
        return;
      }
      setLab(labData);

      const [p, enc] = await Promise.all([
        patientApi.getById(labData.patientId),
        labData.encounterId ? encounterApi.getById(labData.encounterId) : Promise.resolve(null)
      ]);
      setPatient(p);
      setEncounter(enc);
    } catch {
      toast.error('Failed to load lab result');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!lab) return;
    const reason = window.prompt('Enter cancellation reason:');
    if (!reason?.trim()) return;
    try {
      await labResultApi.cancel(lab.id, reason);
      toast.success('Lab order cancelled');
      loadData(lab.id);
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!lab) return null;

  const canEnterResults = lab.status === 'Ordered' || lab.status === 'In Progress';
  const canCancel = lab.status === 'Ordered' || lab.status === 'In Progress';

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          @page { margin: 1in; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/lab')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-800">{lab.labOrderNumber}</h1>
                {lab.isAbnormal && (
                  <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <AlertTriangle size={12} />
                    <span>Abnormal</span>
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                {lab.testName} · {lab.testType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-sm font-medium"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
            {canEnterResults && (
              <button
                onClick={() => navigate(`/lab/${lab.id}/enter-results`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
              >
                <Edit2 size={15} />
                <span>Enter Results</span>
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm font-medium"
              >
                <XCircle size={15} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 2-Col Layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Test Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <FlaskConical size={18} className="mr-2 text-blue-600" />
                Test Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Test Name</p>
                  <p className="text-slate-800 font-semibold mt-1">{lab.testName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Test Type</p>
                  <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[lab.testType] || TYPE_COLORS['Other']}`}>
                    {lab.testType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Ordered By</p>
                  <p className="text-slate-800 mt-1">{lab.orderedByName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Ordered Date</p>
                  <p className="text-slate-800 mt-1">
                    {format(new Date(lab.orderedDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                {lab.completedDate && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Completed Date</p>
                    <p className="text-slate-800 mt-1">
                      {format(new Date(lab.completedDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {lab.enteredByName && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Results Entered By</p>
                    <p className="text-slate-800 mt-1">{lab.enteredByName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results (if completed) */}
            {lab.status === 'Completed' && (
              <div className={`bg-white rounded-lg border-2 p-6 ${lab.isAbnormal ? 'border-red-200' : 'border-green-200'}`}>
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                  {lab.isAbnormal ? (
                    <AlertTriangle size={18} className="mr-2 text-red-500" />
                  ) : (
                    <CheckCircle size={18} className="mr-2 text-green-500" />
                  )}
                  Test Results
                  {lab.isAbnormal && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      ABNORMAL
                    </span>
                  )}
                </h2>

                <div className="space-y-4">
                  {/* Result Value */}
                  <div className={`p-4 rounded-lg border ${lab.isAbnormal ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Result</p>
                    <p className={`text-xl font-bold ${lab.isAbnormal ? 'text-red-800' : 'text-green-800'}`}>
                      {lab.result}
                    </p>
                  </div>

                  {/* Normal Range */}
                  {lab.normalRange && (
                    <div>
                                            <p className="text-slate-700 mt-1 font-medium">{lab.normalRange}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {lab.notes && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Clinical Notes</p>
                      <p className="text-slate-700 mt-1 bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm">
                        {lab.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending / In Progress state */}
            {(lab.status === 'Ordered' || lab.status === 'In Progress') && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                  <Clock size={18} className="mr-2 text-yellow-500" />
                  Results Pending
                </h2>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {lab.status === 'Ordered'
                      ? <Clock size={32} className="text-yellow-500" />
                      : <Activity size={32} className="text-blue-500" />
                    }
                  </div>
                  <p className="text-slate-600 font-medium">
                    {lab.status === 'Ordered'
                      ? 'This lab order has not been started yet'
                      : 'This test is currently in progress'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Results will appear here once entered by lab staff
                  </p>
                  <button
                    onClick={() => navigate(`/lab/${lab.id}/enter-results`)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Enter Results Now
                  </button>
                </div>
              </div>
            )}

            {/* Cancelled state */}
            {lab.status === 'Cancelled' && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h2 className="text-base font-semibold text-red-800 mb-2 flex items-center">
                  <XCircle size={18} className="mr-2" />
                  Order Cancelled
                </h2>
                {lab.notes && (
                  <p className="text-red-700 text-sm">Reason: {lab.notes}</p>
                )}
              </div>
            )}

            {/* Linked Encounter */}
            {encounter && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center">
                  <Calendar size={18} className="mr-2 text-slate-500" />
                  Linked Encounter
                </h2>
                <button
                  onClick={() => navigate(`/clinical/${encounter.id}`)}
                  className="no-print w-full text-left bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg p-3 border border-slate-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {encounter.encounterNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(encounter.visitDate), 'MMM dd, yyyy')} — {encounter.chiefComplaint}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Status Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Order Status
              </h2>
              <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 font-semibold text-sm ${
                lab.status === 'Ordered'      ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                lab.status === 'In Progress'  ? 'bg-blue-50 border-blue-300 text-blue-700' :
                lab.status === 'Completed'    ? 'bg-green-50 border-green-300 text-green-700' :
                'bg-gray-50 border-gray-300 text-gray-600'
              }`}>
                {lab.status === 'Ordered'     && <Clock size={16} />}
                {lab.status === 'In Progress' && <Activity size={16} />}
                {lab.status === 'Completed'   && <CheckCircle size={16} />}
                {lab.status === 'Cancelled'   && <XCircle size={16} />}
                <span>{lab.status}</span>
              </div>

              {/* Status timeline */}
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Ordered',     done: true },
                  { label: 'In Progress', done: lab.status === 'In Progress' || lab.status === 'Completed' },
                  { label: 'Completed',   done: lab.status === 'Completed' }
                ].map((step, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? 'bg-blue-500' : 'bg-slate-200'
                    }`}>
                      {step.done && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm ${step.done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Info */}
            {patient && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center">
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
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center space-x-2">
                    <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                      Allergies: {patient.flags.allergyList}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="no-print mt-3 w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Patient Profile →
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="no-print bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Quick Actions
              </h2>
              <div className="space-y-2">
                {canEnterResults && (
                  <button
                    onClick={() => navigate(`/lab/${lab.id}/enter-results`)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                  >
                    <Edit2 size={14} className="text-blue-500" />
                    <span>Enter Results</span>
                  </button>
                )}
                {patient && (
                  <button
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                  >
                    <User size={14} className="text-blue-500" />
                    <span>View Patient</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>Print Report</span>
                </button>
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-100 flex items-center space-x-2 transition-colors"
                  >
                    <XCircle size={14} className="text-red-500" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
             PRINT-ONLY LAB REPORT
        ══════════════════════════════════════════════════════════════ */}
        <div className="print-only fixed inset-0 bg-white p-12">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-800">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">WebIMS Medical Center</h1>
              <p className="text-slate-600 mt-1">Clinical Laboratory Services</p>
              <p className="text-slate-600">123 Healthcare Blvd, Springfield, IL 62701</p>
              <p className="text-slate-600">Lab Director: Dr. Sarah Johnson · CLIA: 14D0000001</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">LAB REPORT</p>
              <p className="text-slate-600 font-mono mt-1">{lab.labOrderNumber}</p>
              <p className="text-slate-600 mt-1">
                Ordered: {format(new Date(lab.orderedDate), 'MMMM dd, yyyy')}
              </p>
              {lab.completedDate && (
                <p className="text-slate-600">
                  Resulted: {format(new Date(lab.completedDate), 'MMMM dd, yyyy')}
                </p>
              )}
              {lab.isAbnormal && (
                <p className="mt-2 text-red-700 font-bold text-lg">⚠ ABNORMAL RESULT</p>
              )}
            </div>
          </div>

          {/* Patient + Ordering Info */}
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Patient</p>
              {patient && (
                <>
                  <p className="font-bold text-slate-900 text-lg">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-slate-600">MRN: {patient.mrn}</p>
                  <p className="text-slate-600">
                    DOB: {format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-slate-600">Gender: {patient.gender}</p>
                </>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Ordering Provider</p>
              <p className="font-bold text-slate-900">{lab.orderedByName}</p>
              <p className="text-slate-600 mt-2">
                Resulted by: {lab.enteredByName || 'Lab Staff'}
              </p>
            </div>
          </div>

          {/* Test Details */}
          <div className="mt-6 border border-slate-300 rounded">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
              <p className="font-semibold text-slate-800">{lab.testName}</p>
              <p className="text-sm text-slate-600">{lab.testType}</p>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-semibold text-slate-600">Result</th>
                    <th className="text-left py-2 font-semibold text-slate-600">Normal Range</th>
                    <th className="text-left py-2 font-semibold text-slate-600">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`py-3 font-bold text-lg ${lab.isAbnormal ? 'text-red-700' : 'text-green-700'}`}>
                      {lab.result || 'Pending'}
                    </td>
                    <td className="py-3 text-slate-600">
                      {lab.normalRange || '—'}
                    </td>
                    <td className="py-3">
                      {lab.isAbnormal
                        ? <span className="text-red-700 font-bold">ABNORMAL ⚠</span>
                        : <span className="text-green-700 font-medium">NORMAL ✓</span>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>

              {lab.notes && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-1">
                    Clinical Notes / Interpretation
                  </p>
                  <p className="text-slate-700">{lab.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Abnormal notice */}
          {lab.isAbnormal && (
            <div className="mt-4 p-4 border-2 border-red-400 rounded bg-red-50">
              <p className="text-red-800 font-bold">⚠ ABNORMAL RESULT — PHYSICIAN REVIEW REQUIRED</p>
              <p className="text-red-700 text-sm mt-1">
                This result is outside the normal reference range. Please review and take appropriate clinical action.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 text-center">
            <p>This report was generated by WebIMS Medical Center Laboratory Information System.</p>
            <p className="mt-1">
              Questions? Contact the lab at lab@webims.com or (555) 000-0002.
            </p>
            <p className="mt-1 font-medium text-slate-600">
              Electronically verified — No signature required
            </p>
          </div>
        </div>

      </div>
    </>
  );
};