import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { careNoteApi, residentApi } from '../../../core/services/api';
import { CareNote, Resident } from '../../../core/models';
import {
  ArrowLeft, Printer, Calendar, Clock,
  User, Heart, Pill, Activity, AlertTriangle,
  CheckCircle, XCircle, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SHIFT_STYLES: Record<string, string> = {
  'Day':     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Evening': 'bg-orange-100 text-orange-700 border-orange-200',
  'Night':   'bg-indigo-100 text-indigo-700 border-indigo-200'
};

const PAIN_COLOR = (level: number) =>
  level === 0 ? 'text-green-600' :
  level <= 3  ? 'text-yellow-600' :
  level <= 6  ? 'text-orange-600' :
  'text-red-600';

// ─── Component ────────────────────────────────────────────────────────────────
export const CareNoteDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote]         = useState<CareNote | null>(null);
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (noteId: string) => {
    setLoading(true);
    try {
      const n = await careNoteApi.getById(noteId);
      if (!n) { toast.error('Care note not found'); navigate('/ltc/care-notes'); return; }
      setNote(n);
      const r = await residentApi.getById(n.residentId);
      setResident(r);
    } catch {
      toast.error('Failed to load care note');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!note) return null;

  const medsAdministered = note.medications.filter(m => m.administered).length;
  const activitiesCompleted = note.activities.filter(a => a.completed).length;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          @page { margin: 0.75in; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/ltc/care-notes')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-800">{note.careNoteNumber}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${SHIFT_STYLES[note.shift]}`}>
                  {note.shift} Shift
                </span>
                {note.followUpNeeded && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex items-center space-x-1">
                    <AlertTriangle size={11} />
                    <span>Follow-Up</span>
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                {format(new Date(note.date), 'MMMM dd, yyyy')} · {note.startTime}–{note.endTime}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-sm font-medium"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>

        {/* ── 2-Col Layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Activities */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <Activity size={18} className="mr-2 text-green-600" />
                  Activities
                </span>
                <span className="text-sm font-normal text-slate-500">
                  {activitiesCompleted}/{note.activities.length} completed
                </span>
              </h2>
              {note.activities.length === 0 ? (
                <p className="text-sm text-slate-400">No activities recorded</p>
              ) : (
                <div className="space-y-2">
                  {note.activities.map((act, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                        act.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {act.completed
                          ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          : <XCircle size={16} className="text-slate-400 flex-shrink-0" />
                        }
                        <div>
                          <span className="font-medium text-slate-800">{act.type}</span>
                          <span className="text-slate-500 mx-2">—</span>
                          <span className="text-slate-700">{act.description}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-3">{act.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vitals */}
            {note.vitals && Object.values(note.vitals).some(v => v) && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                  <Activity size={18} className="mr-2 text-red-500" />
                  Vital Signs
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Blood Pressure', value: note.vitals.bloodPressure,    unit: 'mmHg' },
                    { label: 'Pulse',           value: note.vitals.pulse,            unit: 'bpm' },
                    { label: 'Temperature',     value: note.vitals.temperature,      unit: '°F' },
                    { label: 'O2 Saturation',   value: note.vitals.oxygenSaturation, unit: '' },
                    { label: 'Weight',          value: note.vitals.weight,           unit: 'lbs' },
                    { label: 'Resp. Rate',      value: note.vitals.respiratoryRate,  unit: '/min' },
                    { label: 'Blood Sugar',     value: note.vitals.bloodSugar,       unit: '' }
                  ].filter(v => v.value).map(v => (
                    <div key={v.label} className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{v.label}</p>
                      <p className="text-lg font-bold text-slate-800 mt-1">{v.value}</p>
                      {v.unit && <p className="text-xs text-slate-400">{v.unit}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <Pill size={18} className="mr-2 text-purple-600" />
                  Medication Administration
                </span>
                <span className="text-sm font-normal text-slate-500">
                  {medsAdministered}/{note.medications.length} administered
                </span>
              </h2>
              {note.medications.length === 0 ? (
                <p className="text-sm text-slate-400">No medications recorded</p>
              ) : (
                <div className="space-y-2">
                  {note.medications.map((med, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-sm ${
                        med.administered
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {med.administered
                            ? <CheckCircle size={16} className="text-green-500" />
                            : <XCircle size={16} className="text-red-500" />
                          }
                          <div>
                            <p className="font-semibold text-slate-800">
                              {med.medicationName} — {med.dosage}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Scheduled: {med.scheduledTime}
                              {med.administeredTime && ` · Given: ${med.administeredTime}`}
                            </p>
                            {med.refusedReason && (
                              <p className="text-xs text-red-600 mt-0.5">
                                Reason not given: {med.refusedReason}
                              </p>
                            )}
                            {med.notes && (
                              <p className="text-xs text-slate-500 mt-0.5">{med.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${
                          med.administered ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {med.administered ? 'GIVEN' : 'NOT GIVEN'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Observations */}
            {(note.behavioralNotes || note.skinCondition || note.eliminationNotes || note.alerts) && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                  <ClipboardList size={18} className="mr-2 text-slate-600" />
                  Clinical Observations
                </h2>
                <div className="space-y-4">
                  {note.alerts && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                        ⚠ Alert
                      </p>
                      <p className="text-sm text-red-800">{note.alerts}</p>
                    </div>
                  )}
                  {note.behavioralNotes && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                        Behavioral Notes
                      </p>
                      <p className="text-sm text-slate-700">{note.behavioralNotes}</p>
                    </div>
                  )}
                  {note.skinCondition && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                        Skin Condition
                      </p>
                      <p className="text-sm text-slate-700">{note.skinCondition}</p>
                    </div>
                  )}
                  {note.eliminationNotes && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
                        Elimination Notes
                      </p>
                      <p className="text-sm text-slate-700">{note.eliminationNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follow-Up */}
            {note.followUpNeeded && (
              <div className="bg-amber-50 rounded-lg border-2 border-amber-300 p-5">
                <h2 className="text-base font-semibold text-amber-800 mb-2 flex items-center">
                  <AlertTriangle size={18} className="mr-2" />
                  Follow-Up Required
                </h2>
                <p className="text-sm text-amber-800">
                  {note.followUpReason || 'Follow-up action needed — see attending nurse.'}
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Summary Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                Shift Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Nutrition</span>
                  <span className={`text-sm font-semibold ${
                    note.nutritionIntake === 'Full'    ? 'text-green-600' :
                    note.nutritionIntake === 'Partial' ? 'text-yellow-600' :
                    note.nutritionIntake === 'Minimal' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>{note.nutritionIntake}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Hydration</span>
                  <span className={`text-sm font-semibold ${
                    note.hydrationIntake === 'Adequate' ? 'text-blue-600' :
                    note.hydrationIntake === 'Limited'  ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{note.hydrationIntake}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Pain Level</span>
                  <span className={`text-sm font-bold ${PAIN_COLOR(note.painLevel)}`}>
                    {note.painLevel}/10
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Mood</span>
                  <span className="text-sm font-semibold text-slate-800">{note.mood}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Activities</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {activitiesCompleted}/{note.activities.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Medications</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {medsAdministered}/{note.medications.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Resident */}
            {resident && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center">
                  <User size={13} className="mr-1.5" />
                  Resident
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {resident.firstName[0]}{resident.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {resident.firstName} {resident.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Room {resident.roomNumber}{resident.bedNumber}
                    </p>
                    <p className="text-xs text-slate-500">{resident.careLevel}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/ltc/residents/${resident.id}`)}
                  className="no-print mt-3 w-full text-xs text-center text-blue-600 hover:underline"
                >
                  View Resident Profile →
                </button>
              </div>
            )}

            {/* Sign-off */}
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Signed By</p>
              <p className="text-white font-semibold text-sm">{note.signedBy}</p>
              <p className="text-slate-400 text-xs mt-1">
                {format(new Date(note.signedAt), 'MMM dd, yyyy · h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};