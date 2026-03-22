import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi, patientApi, encounterApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Claim, Patient, Encounter } from '../../../core/models';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import {
  ArrowLeft, Printer, Send, CheckCircle, XCircle,
  DollarSign, Clock, FileText, User, Calendar,
  Edit2, AlertCircle, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { billingScrubberService } from '../../../core/services/billing-scrubber.service';
import { DENIAL_CATEGORIES } from '../../../core/constants/denial-reasons';
import { getDenialPlaybook } from '../../../core/constants/payer-denial-playbooks';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Draft:     'bg-gray-100 text-gray-700 border-gray-300',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-300',
  Resubmitted: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  Approved:  'bg-green-100 text-green-700 border-green-300',
  Rejected:  'bg-red-100 text-red-700 border-red-300',
  Paid:      'bg-purple-100 text-purple-700 border-purple-300'
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Draft:     <FileText size={16} />,
  Submitted: <Clock size={16} />,
  Resubmitted: <Clock size={16} />,
  Approved:  <CheckCircle size={16} />,
  Rejected:  <XCircle size={16} />,
  Paid:      <DollarSign size={16} />
};

const TIMELINE_COLORS: Record<string, string> = {
  Draft:     'bg-gray-400',
  Submitted: 'bg-blue-500',
  Resubmitted: 'bg-indigo-500',
  Approved:  'bg-green-500',
  Rejected:  'bg-red-500',
  Paid:      'bg-purple-500'
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ClaimDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const printRef = useRef<HTMLDivElement>(null);

  const [claim, setClaim] = useState<Claim | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [denialCategory, setDenialCategory] = useState(DENIAL_CATEGORIES[0].id);
  const [denialReasonCode, setDenialReasonCode] = useState(DENIAL_CATEGORIES[0].reasons[0].code);
  const [denialDetails, setDenialDetails] = useState('');
  const [showResubmitPrompt, setShowResubmitPrompt] = useState(false);
  const [appealNote, setAppealNote] = useState('Corrected coding and attached supporting documentation.');

  const scrubberResult = useMemo(() => {
    if (!claim) return null;
    return billingScrubberService.evaluateClaimDraft(claim);
  }, [claim]);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (claimId: string) => {
    setLoading(true);
    try {
      const c = await billingApi.getById(claimId);
      if (!c) { toast.error('Claim not found'); navigate('/billing'); return; }
      setClaim(c);

      const [p, enc] = await Promise.all([
        patientApi.getById(c.patientId),
        c.encounterId ? encounterApi.getById(c.encounterId) : Promise.resolve(null)
      ]);

      setPatient(p);
      setEncounter(enc);
    } catch {
      toast.error('Failed to load claim details');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSubmitClaim = async () => {
    if (!claim || !user) return;
    setActionLoading(true);
    try {
      await billingApi.submitClaim(claim.id, user.id);
      toast.success('Claim submitted successfully');
      loadData(claim.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit claim';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClaim = async () => {
    if (!claim || !user) return;
    setActionLoading(true);
    try {
      await billingApi.approveClaim(claim.id, user.id);
      toast.success('Claim approved');
      loadData(claim.id);
    } catch {
      toast.error('Failed to approve claim');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!claim || !user) return;
    if (!denialReasonCode.trim()) {
      toast.error('Select a denial reason before rejecting the claim.');
      return;
    }

    setActionLoading(true);
    try {
      await billingApi.rejectClaimStructured(claim.id, user.id, {
        category: denialCategory,
        reasonCode: denialReasonCode,
        details: denialDetails.trim() || undefined
      });
      toast.success('Claim marked as rejected');
      setShowRejectForm(false);
      setDenialDetails('');
      loadData(claim.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject claim';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleReopenClaim = async () => {
    if (!claim || !user) return;
    const note = window.prompt('Optional note for rework queue:', 'Reopened for coding correction');
    setActionLoading(true);
    try {
      await billingApi.reopenRejectedClaim(claim.id, user.id, note || undefined);
      toast.success('Claim reopened as Draft');
      loadData(claim.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reopen claim';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmitClaim = async () => {
    if (!claim || !user) return;

    setActionLoading(true);
    try {
      await billingApi.resubmitClaim(claim.id, user.id, appealNote.trim() || undefined);
      toast.success('Claim resubmitted to payer');
      setShowResubmitPrompt(false);
      loadData(claim.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resubmit claim';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!claim || !patient) {
    return (
      <div className="text-center py-20 text-slate-500">
        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <p>Claim not found</p>
      </div>
    );
  }

  const canSubmit  = claim.status === 'Draft';
  const canApprove = (claim.status === 'Submitted' || claim.status === 'Resubmitted') && (user?.role === 'ADMIN' || user?.role === 'BILLING');
  const canReject  = (claim.status === 'Submitted' || claim.status === 'Resubmitted') && (user?.role === 'ADMIN' || user?.role === 'BILLING');
  const canPay     = claim.status === 'Approved';
  const canEdit    = claim.status === 'Draft';
  const canReopen  = claim.status === 'Rejected' && (user?.role === 'ADMIN' || user?.role === 'BILLING');
  const canResubmit = claim.status === 'Draft' && !!claim.denial && (user?.role === 'ADMIN' || user?.role === 'BILLING');
  const currentCategory = DENIAL_CATEGORIES.find((category) => category.id === denialCategory) || DENIAL_CATEGORIES[0];
  const activePlaybook = getDenialPlaybook(claim.insuranceType);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Print Stylesheet ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          @page { margin: 1in; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="space-y-6">

        {/* ── Page Header (no-print) ── */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/billing')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {claim.claimNumber}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Created {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-sm font-medium"
            >
              <Printer size={16} />
              <span>Print Invoice</span>
            </button>

            {canEdit && (
              <button
                onClick={() => navigate(`/billing/${claim.id}/edit`)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-sm font-medium"
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            )}

            {canSubmit && (
              <button
                onClick={handleSubmitClaim}
                disabled={actionLoading || (scrubberResult ? scrubberResult.errors.length > 0 : false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                title={
                  scrubberResult && scrubberResult.errors.length > 0
                    ? 'Resolve scrubber blocking errors before submitting.'
                    : 'Submit claim'
                }
              >
                <Send size={16} />
                <span>Submit Claim</span>
              </button>
            )}

            {canApprove && (
              <button
                onClick={handleApproveClaim}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm font-medium disabled:opacity-60"
              >
                <CheckCircle size={16} />
                <span>Approve</span>
              </button>
            )}

            {canReject && (
              <button
                onClick={() => setShowRejectForm((prev) => !prev)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm font-medium disabled:opacity-60"
              >
                <XCircle size={16} />
                <span>{showRejectForm ? 'Cancel Reject' : 'Reject'}</span>
              </button>
            )}

            {canPay && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm font-medium"
              >
                <DollarSign size={16} />
                <span>Record Payment</span>
              </button>
            )}

            {canReopen && (
              <button
                onClick={handleReopenClaim}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center space-x-2 text-sm font-medium disabled:opacity-60"
              >
                <Edit2 size={16} />
                <span>Reopen for Correction</span>
              </button>
            )}

            {canResubmit && (
              <button
                onClick={() => setShowResubmitPrompt((prev) => !prev)}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 text-sm font-medium disabled:opacity-60"
              >
                <Send size={16} />
                <span>{showResubmitPrompt ? 'Cancel Resubmit' : 'Resubmit Claim'}</span>
              </button>
            )}
          </div>
        </div>

        {showRejectForm && canReject && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-800">Structured Denial</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-red-700">Category</label>
                <select
                  value={denialCategory}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    setDenialCategory(nextCategory);
                    const nextReason = DENIAL_CATEGORIES.find((category) => category.id === nextCategory)?.reasons[0]?.code;
                    if (nextReason) setDenialReasonCode(nextReason);
                  }}
                  className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                >
                  {DENIAL_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-red-700">Reason</label>
                <select
                  value={denialReasonCode}
                  onChange={(event) => setDenialReasonCode(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                >
                  {currentCategory.reasons.map((reason) => (
                    <option key={reason.code} value={reason.code}>{reason.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-red-700">Details</label>
                <input
                  value={denialDetails}
                  onChange={(event) => setDenialDetails(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                  placeholder="Optional denial notes"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleRejectClaim}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Submit Denial
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Payer Playbook</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{activePlaybook.title}</p>
              <p className="text-xs text-slate-500">Target turnaround: {activePlaybook.targetTurnaroundDays} days</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {activePlaybook.actions.map((action) => (
                  <li key={action}>• {action}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {showResubmitPrompt && canResubmit && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h3 className="text-sm font-semibold text-indigo-800">Appeal and Resubmission Note</h3>
            <textarea
              value={appealNote}
              onChange={(event) => setAppealNote(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleResubmitClaim}
                disabled={actionLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Confirm Resubmission
              </button>
            </div>
          </div>
        )}

        {/* ── Main Content: 2-column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Main details (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Patient Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <User size={18} className="mr-2 text-blue-600" />
                Patient Information
              </h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-lg">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                    <span className="text-sm text-slate-500">MRN: <strong className="text-slate-700">{patient.mrn}</strong></span>
                    <span className="text-sm text-slate-500">DOB: <strong className="text-slate-700">{format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}</strong></span>
                    {patient.phone && (
                      <span className="text-sm text-slate-500">Phone: <strong className="text-slate-700">{patient.phone}</strong></span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                      {patient.insurance?.type || 'No Insurance'}
                      {patient.insurance?.payerName ? ` — ${patient.insurance.payerName}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Encounter */}
              {encounter && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <FileText size={14} className="mr-1.5 text-slate-500" />
                    Linked Encounter
                  </p>
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

            {/* Visit & Insurance */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <Calendar size={18} className="mr-2 text-green-600" />
                Visit Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Visit Date</p>
                  <p className="text-slate-800 font-medium mt-1">
                    {format(new Date(claim.visitDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Insurance Type</p>
                  <p className="text-slate-800 font-medium mt-1">{claim.insuranceType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Claim Number</p>
                  <p className="text-slate-800 font-mono font-medium mt-1">{claim.claimNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Current Status</p>
                  <span className={`inline-flex items-center space-x-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[claim.status]}`}>
                    {STATUS_ICONS[claim.status]}
                    <span>{claim.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnosis Codes */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <FileText size={18} className="mr-2 text-purple-600" />
                Diagnosis Codes
              </h2>
              {claim.diagnosisCodes.length === 0 ? (
                <p className="text-sm text-slate-500">No diagnosis codes</p>
              ) : (
                <div className="space-y-2">
                  {claim.diagnosisCodes.map((code, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-800">{code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Procedure Codes */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <CheckCircle size={18} className="mr-2 text-green-600" />
                Procedure Codes
              </h2>
              {claim.procedureCodes.length === 0 ? (
                <p className="text-sm text-slate-500">No procedure codes</p>
              ) : (
                <div className="space-y-2">
                  {claim.procedureCodes.map((code, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-800">{code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total Amount</span>
                <span className="text-2xl font-bold text-slate-800">
                  ${claim.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Info (if paid) */}
            {claim.status === 'Paid' && claim.payment && (
              <div className="bg-white rounded-lg border border-green-200 p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                  <DollarSign size={18} className="mr-2 text-green-600" />
                  Payment Information
                </h2>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        ${claim.payment.amountPaid.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Payment Date</p>
                      <p className="text-slate-800 font-medium mt-1">
                        {format(new Date(claim.payment.paidDate), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Payment Method</p>
                      <p className="text-slate-800 font-medium mt-1">{claim.payment.method}</p>
                    </div>
                    {claim.payment.referenceNumber && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Reference #</p>
                        <p className="text-slate-800 font-mono font-medium mt-1">
                          {claim.payment.referenceNumber}
                        </p>
                      </div>
                    )}
                    {claim.payment.notes && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Notes</p>
                        <p className="text-slate-800 mt-1">{claim.payment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {claim.status === 'Rejected' && claim.rejectionReason && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h2 className="text-base font-semibold text-red-800 mb-2 flex items-center">
                  <XCircle size={18} className="mr-2" />
                  Rejection Reason
                </h2>
                <p className="text-red-700">{claim.rejectionReason}</p>
                {claim.denial && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-xs text-slate-700">
                    <p><span className="font-semibold">Category:</span> {claim.denial.category}</p>
                    <p><span className="font-semibold">Reason Code:</span> {claim.denial.reasonCode}</p>
                    {claim.denial.details ? <p><span className="font-semibold">Details:</span> {claim.denial.details}</p> : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar (1/3) ── */}
          <div className="space-y-6">

            {/* Status Badge */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Claim Status</h2>
              <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 font-semibold ${STATUS_COLORS[claim.status]}`}>
                {STATUS_ICONS[claim.status]}
                <span className="text-lg">{claim.status}</span>
              </div>

              {/* Amount summary */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Billed Amount</span>
                  <span className="font-semibold text-slate-800">${claim.totalAmount.toFixed(2)}</span>
                </div>
                {claim.payment && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Amount Paid</span>
                      <span className="font-semibold text-green-600">${claim.payment.amountPaid.toFixed(2)}</span>
                    </div>
                    {claim.payment.amountPaid < claim.totalAmount && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Balance Due</span>
                        <span className="font-semibold text-amber-600">
                          ${(claim.totalAmount - claim.payment.amountPaid).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <Clock size={18} className="mr-2 text-slate-500" />
                Status History
              </h2>
              {!claim.statusHistory || claim.statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No history available</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />

                  <div className="space-y-4">
                    {[...claim.statusHistory].reverse().map((entry, i) => (
                      <div key={i} className="flex items-start space-x-3 relative pl-1">
                        {/* Dot */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${TIMELINE_COLORS[entry.status]}`}>
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <p className="text-sm font-semibold text-slate-800">{entry.status}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {format(new Date(entry.changedAt), 'MMM dd, yyyy · h:mm a')}
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {scrubberResult && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <h2 className="text-base font-semibold text-slate-800 mb-3">Claim Scrubber</h2>
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm text-slate-600">Quality Score</p>
                        <p
                          className={`text-lg font-bold ${
                            scrubberResult.qualityScore >= 85
                              ? 'text-emerald-700'
                              : scrubberResult.qualityScore >= 60
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {scrubberResult.qualityScore}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-center">
                          <p className="text-xs uppercase tracking-wide text-red-700">Errors</p>
                          <p className="text-lg font-semibold text-red-800">{scrubberResult.errors.length}</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-center">
                          <p className="text-xs uppercase tracking-wide text-amber-700">Warnings</p>
                          <p className="text-lg font-semibold text-amber-800">{scrubberResult.warnings.length}</p>
                        </div>
                      </div>

                      {scrubberResult.issues.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {scrubberResult.issues.slice(0, 4).map((issue) => (
                            <div
                              key={issue.code}
                              className={`rounded-lg border px-2.5 py-2 text-xs ${
                                issue.severity === 'error'
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {issue.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions (no-print) */}
            <div className="no-print bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                >
                  <User size={15} className="text-blue-500" />
                  <span>View Patient Profile</span>
                </button>

                {encounter && (
                  <button
                    onClick={() => navigate(`/clinical/${encounter.id}`)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                  >
                    <FileText size={15} className="text-purple-500" />
                    <span>View Encounter</span>
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2 transition-colors"
                >
                  <Printer size={15} className="text-slate-500" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
             PRINT-ONLY INVOICE VIEW
        ══════════════════════════════════════════════════════════════ */}
        <div className="print-only fixed inset-0 bg-white p-12">
          {/* Clinic Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-800">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">WebIMS Medical Center</h1>
              <p className="text-slate-600 mt-1">123 Healthcare Blvd, Springfield, IL 62701</p>
              <p className="text-slate-600">Phone: (555) 000-0000 · Fax: (555) 000-0001</p>
              <p className="text-slate-600">NPI: 1234567890</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">INVOICE</p>
              <p className="text-slate-600 font-mono mt-1">{claim.claimNumber}</p>
              <p className="text-slate-600 mt-1">
                Date: {format(new Date(claim.createdAt), 'MMMM dd, yyyy')}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-semibold border ${STATUS_COLORS[claim.status]}`}>
                {claim.status}
              </span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Bill To</p>
              <p className="font-bold text-slate-900 text-lg">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-slate-600">MRN: {patient.mrn}</p>
              <p className="text-slate-600">DOB: {format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')}</p>
              {patient.address && (
                <>
                  <p className="text-slate-600 mt-1">{patient.address.street}</p>
                  <p className="text-slate-600">
                    {patient.address.city}, {patient.address.state} {patient.address.zipCode}
                  </p>
                </>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Insurance</p>
              <p className="text-slate-800 font-medium">{claim.insuranceType}</p>
              {patient.insurance?.payerName && (
                <p className="text-slate-600">{patient.insurance.payerName}</p>
              )}
              {patient.insurance?.insuranceId && (
                <p className="text-slate-600">ID: {patient.insurance.insuranceId}</p>
              )}
              <p className="text-slate-600 mt-2">
                Visit Date: {format(new Date(claim.visitDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Diagnoses */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Diagnoses</p>
            <div className="border border-slate-200 rounded">
              {claim.diagnosisCodes.map((code, i) => (
                <div key={i} className={`px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  {i + 1}. {code}
                </div>
              ))}
            </div>
          </div>

          {/* Procedures / Itemized */}
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Services Rendered</p>
            <table className="w-full border border-slate-200 rounded">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">#</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">Description</th>
                </tr>
              </thead>
              <tbody>
                {claim.procedureCodes.map((code, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-2 text-sm text-slate-600">{i + 1}</td>
                    <td className="px-4 py-2 text-sm text-slate-800">{code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 border border-slate-200 rounded">
              <div className="flex justify-between px-4 py-2 border-b border-slate-200">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-sm font-medium">${claim.totalAmount.toFixed(2)}</span>
              </div>
              {claim.payment && (
                <div className="flex justify-between px-4 py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Amount Paid</span>
                  <span className="text-sm font-medium text-green-700">
                    -${claim.payment.amountPaid.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 bg-slate-800 rounded-b">
                <span className="text-sm font-bold text-white">
                  {claim.status === 'Paid' ? 'PAID IN FULL' : 'BALANCE DUE'}
                </span>
                <span className="text-sm font-bold text-white">
                  ${claim.status === 'Paid'
                    ? '0.00'
                    : claim.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment info if paid */}
          {claim.payment && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-semibold text-green-800">Payment Received</p>
              <p className="text-sm text-green-700 mt-1">
                ${claim.payment.amountPaid.toFixed(2)} via {claim.payment.method}
                {' · '}{format(new Date(claim.payment.paidDate), 'MMMM dd, yyyy')}
                {claim.payment.referenceNumber && ` · Ref: ${claim.payment.referenceNumber}`}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <p>Thank you for choosing WebIMS Medical Center.</p>
            <p className="mt-1">
              Questions about this invoice? Call (555) 000-0000 or email billing@webims.com
            </p>
            <p className="mt-1">Payment due within 30 days of service date.</p>
          </div>
        </div>

      </div>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <RecordPaymentModal
          claim={claim}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadData(claim.id);
          }}
        />
      )}
    </>
  );
};