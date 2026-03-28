import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { residentApi, careNoteApi } from '../../../core/services/api';
import { Resident, CareNote } from '../../../core/models';
import {
  ArrowLeft, Edit2, Plus, Heart, User,
  Phone, Building2, Activity, AlertTriangle,
  Calendar, FileText, ChevronRight, Clock,
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CARE_LEVEL_STYLES: Record<string, string> = {
  'Independent':    'bg-blue-100 text-blue-700',
  'Assisted':       'bg-purple-100 text-purple-700',
  'Skilled Nursing':'bg-orange-100 text-orange-700',
  'Memory Care':    'bg-pink-100 text-pink-700'
};

const STATUS_STYLES: Record<string, string> = {
  'Active':            'bg-green-100 text-green-700 border-green-200',
  'Discharged':        'bg-gray-100 text-gray-600 border-gray-200',
  'Hospital Transfer': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

const MOOD_COLORS: Record<string, string> = {
  'Happy':    'text-green-600',
  'Calm':     'text-blue-600',
  'Anxious':  'text-yellow-600',
  'Agitated': 'text-orange-600',
  'Sad':      'text-purple-600',
  'Withdrawn':'text-slate-500'
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ResidentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resident, setResident]   = useState<Resident | null>(null);
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'care-notes'>('overview');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
        if (id) loadData(id);
  }, [id]);

  const loadData = async (residentId: string) => {
    setLoading(true);
    try {
      const [res, notes] = await Promise.all([
        residentApi.getById(residentId),
        careNoteApi.getByResident(residentId)
      ]);
      if (!res) { toast.error('Resident not found'); navigate('/ltc/residents'); return; }
      setResident(res);
      setCareNotes(notes);
    } catch {
      toast.error('Failed to load resident');
    } finally {
      setLoading(false);
    }
  };

  // ── Status Actions ───────────────────────────────────────────────────
  const handleDischarge = async () => {
    if (!resident) return;
    const reason = window.prompt('Enter discharge reason:');
    if (!reason?.trim()) return;
    try {
      await residentApi.discharge(
        resident.id,
        new Date().toISOString().split('T')[0],
        reason
      );
      toast.success('Resident discharged');
      loadData(resident.id);
    } catch { toast.error('Failed to discharge resident'); }
  };

  const handleHospitalTransfer = async () => {
    if (!resident) return;
    if (!window.confirm('Mark this resident as transferred to hospital?')) return;
    try {
      await residentApi.markHospitalTransfer(resident.id);
      toast.success('Marked as hospital transfer');
      loadData(resident.id);
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!resident) return null;

  const age = differenceInYears(new Date(), new Date(resident.dateOfBirth));
  const latestNote = careNotes[0] || null;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/ltc/residents')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {resident.firstName[0]}{resident.lastName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-800">
                  {resident.firstName} {resident.lastName}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[resident.status]}`}>
                  {resident.status}
                </span>
                {resident.dnrStatus && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                    DNR
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                {resident.residentNumber} · Age {age} · Room {resident.roomNumber}{resident.bedNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => navigate(`/ltc/care-notes/new?residentId=${resident.id}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm font-medium"
          >
            <Plus size={16} />
            <span>New Care Note</span>
          </button>
          <button
            onClick={() => navigate(`/ltc/residents/${resident.id}/edit`)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center space-x-2 text-sm font-medium"
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
          {resident.status === 'Active' && (
            <>
              <button
                onClick={handleHospitalTransfer}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2 text-sm font-medium"
              >
                <Activity size={16} />
                <span>Hospital Transfer</span>
              </button>
              <button
                onClick={handleDischarge}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center space-x-2 text-sm font-medium"
              >
                <span>Discharge</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${CARE_LEVEL_STYLES[resident.careLevel]}`}>
            {resident.careLevel}
          </span>
          <p className="text-xs text-slate-500 mt-1">Care Level</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-sm font-semibold text-slate-800">{resident.mobilityStatus}</p>
          <p className="text-xs text-slate-500 mt-1">Mobility</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-sm font-semibold text-slate-800">{resident.cognitiveStatus}</p>
          <p className="text-xs text-slate-500 mt-1">Cognitive</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-sm font-semibold text-slate-800">{careNotes.length}</p>
          <p className="text-xs text-slate-500 mt-1">Care Notes</p>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-1">
          {([
            { key: 'overview',    label: 'Overview',    icon: User },
            { key: 'care-notes',  label: 'Care Notes',  icon: FileText }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              {tab.key === 'care-notes' && careNotes.length > 0 && (
                <span className="ml-1 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {careNotes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Main Info ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Demographics */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <User size={18} className="mr-2 text-blue-600" />
                Demographics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name',    value: `${resident.firstName} ${resident.lastName}` },
                  { label: 'Date of Birth',value: `${format(new Date(resident.dateOfBirth), 'MMMM dd, yyyy')} (Age ${age})` },
                  { label: 'Gender',       value: resident.gender },
                  { label: 'Phone',        value: resident.phone || '—' },
                  { label: 'Email',        value: resident.email || '—' },
                  { label: 'Res. Number',  value: resident.residentNumber }
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
                    <p className="text-sm text-slate-800 mt-0.5 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <Heart size={18} className="mr-2 text-red-500" />
                Medical Information
              </h2>

              {/* Conditions */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Medical Conditions</p>
                {resident.medicalConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resident.medicalConditions.map((cond, i) => (
                      <span key={i} className="bg-orange-50 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-full font-medium">
                        {cond}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No conditions recorded</p>
                )}
              </div>

              {/* Allergies */}
              {resident.allergies && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Allergies</p>
                    <p className="text-sm text-red-800 mt-0.5">{resident.allergies}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Primary Physician',    value: resident.primaryPhysician || '—' },
                  { label: 'Dietary Restrictions', value: resident.dietaryRestrictions || 'None' },
                  { label: 'Mobility Status',      value: resident.mobilityStatus },
                  { label: 'Cognitive Status',     value: resident.cognitiveStatus }
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{item.label}</p>
                    <p className="text-sm text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {resident.notes && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Staff Notes
                </p>
                <p className="text-sm text-amber-800">{resident.notes}</p>
              </div>
            )}

            {/* Discharge info (if applicable) */}
            {resident.status !== 'Active' && resident.dischargeDate && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {resident.status === 'Discharged' ? 'Discharge Information' : 'Transfer Information'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm font-medium text-slate-700">
                      {format(new Date(resident.dischargeDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  {resident.dischargeReason && (
                    <div>
                      <p className="text-xs text-slate-400">Reason</p>
                      <p className="text-sm text-slate-700">{resident.dischargeReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ──────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Admission */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center">
                <Building2 size={14} className="mr-1.5" />
                Admission Details
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Admission Date', value: format(new Date(resident.admissionDate), 'MMM dd, yyyy') },
                  { label: 'Room / Bed',     value: `Room ${resident.roomNumber}, Bed ${resident.bedNumber}` },
                  { label: 'Insurance',      value: resident.insuranceType || '—' },
                  { label: 'Insurance ID',   value: resident.insuranceId || '—' }
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center">
                <Phone size={14} className="mr-1.5 text-red-500" />
                Emergency Contact
              </h2>
              <p className="text-sm font-semibold text-slate-800">{resident.emergencyContact.name}</p>
              <p className="text-xs text-slate-500">{resident.emergencyContact.relationship}</p>
              <p className="text-sm text-blue-600 mt-1">{resident.emergencyContact.phone}</p>
            </div>

            {/* Latest vitals from most recent note */}
            {latestNote?.vitals && (
              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center">
                  <Activity size={14} className="mr-1.5 text-green-500" />
                  Latest Vitals
                </h2>
                <p className="text-xs text-slate-400 mb-2">
                  From: {format(new Date(latestNote.date), 'MMM dd, yyyy')}
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: 'BP',     value: latestNote.vitals.bloodPressure,    unit: 'mmHg' },
                    { label: 'Pulse',  value: latestNote.vitals.pulse,            unit: 'bpm' },
                    { label: 'Temp',   value: latestNote.vitals.temperature,      unit: '°F' },
                    { label: 'O2 Sat', value: latestNote.vitals.oxygenSaturation, unit: '' },
                    { label: 'Weight', value: latestNote.vitals.weight,           unit: 'lbs' }
                  ].filter(v => v.value).map(v => (
                    <div key={v.label} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{v.label}</span>
                      <span className="font-medium text-slate-800">{v.value} {v.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/ltc/care-notes/new?residentId=${resident.id}`)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2"
                >
                  <Plus size={14} className="text-purple-500" />
                  <span>Add Care Note</span>
                </button>
                <button
                  onClick={() => { setActiveTab('care-notes'); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2"
                >
                  <FileText size={14} className="text-blue-500" />
                  <span>View All Care Notes</span>
                </button>
                <button
                  onClick={() => navigate(`/ltc/residents/${resident.id}/edit`)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-2"
                >
                  <Edit2 size={14} className="text-slate-500" />
                  <span>Edit Resident</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           TAB: CARE NOTES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'care-notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{careNotes.length} care notes on record</p>
            <button
              onClick={() => navigate(`/ltc/care-notes/new?residentId=${resident.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm font-medium"
            >
              <Plus size={16} />
              <span>New Care Note</span>
            </button>
          </div>

          {careNotes.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 py-16 text-center">
              <FileText size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No care notes yet</p>
              <p className="text-slate-400 text-sm mt-1">Care notes will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {careNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/ltc/care-notes/${note.id}`)}
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-sm transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 flex-wrap gap-2">
                        <span className="font-mono text-xs text-slate-500">{note.careNoteNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          note.shift === 'Day'     ? 'bg-yellow-100 text-yellow-700' :
                          note.shift === 'Evening' ? 'bg-orange-100 text-orange-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {note.shift} Shift
                        </span>
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Calendar size={11} />
                          <span>{format(new Date(note.date), 'MMM dd, yyyy')}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          {note.startTime} – {note.endTime}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3">
                        <span className="text-xs text-slate-600">
                          <strong>Caregiver:</strong> {note.caregiverName}
                        </span>
                        <span className="text-xs text-slate-600">
                          <strong>Nutrition:</strong> {note.nutritionIntake}
                        </span>
                        <span className="text-xs text-slate-600">
                          <strong>Pain:</strong> {note.painLevel}/10
                        </span>
                        <span className={`text-xs font-medium ${MOOD_COLORS[note.mood] || 'text-slate-600'}`}>
                          <strong>Mood:</strong> {note.mood}
                        </span>
                      </div>

                      {note.behavioralNotes && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {note.behavioralNotes}
                        </p>
                      )}

                      {note.followUpNeeded && (
                        <div className="mt-2 inline-flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          <AlertTriangle size={11} />
                          <span>Follow-up needed</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};