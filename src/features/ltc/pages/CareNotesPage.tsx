import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { careNoteApi, residentApi } from '../../../core/services/api';
import { CareNote, Resident, ShiftType } from '../../../core/models';
import {
  FileText, Plus, Search, Calendar, Clock,
  AlertTriangle, ChevronRight, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CareNoteWithResident extends CareNote {
  resident?: Resident | null;
}

const SHIFT_STYLES: Record<ShiftType, string> = {
  'Day':     'bg-yellow-100 text-yellow-700',
  'Evening': 'bg-orange-100 text-orange-700',
  'Night':   'bg-indigo-100 text-indigo-700'
};

const MOOD_COLORS: Record<string, string> = {
  'Happy':    'text-green-600',
  'Calm':     'text-blue-600',
  'Anxious':  'text-yellow-600',
  'Agitated': 'text-orange-600',
  'Sad':      'text-purple-600',
  'Withdrawn':'text-slate-500'
};

export const CareNotesPage: React.FC = () => {
  const navigate = useNavigate();

  const [notes, setNotes]           = useState<CareNoteWithResident[]>([]);
  const [residents, setResidents]   = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<ShiftType | 'All'>('All');
  const [filterResident, setFilterResident] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allNotes, allResidents] = await Promise.all([
        careNoteApi.getAll(),
        residentApi.getAll()
      ]);

      const residentMap = new Map(allResidents.map(r => [r.id, r]));

      const enriched: CareNoteWithResident[] = allNotes
        .map(n => ({ ...n, resident: residentMap.get(n.residentId) }))
        .sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.startTime.localeCompare(a.startTime);
        });

      setNotes(enriched);
      setResidents(allResidents);
    } catch {
      toast.error('Failed to load care notes');
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total:      notes.length,
    today:      notes.filter(n => n.date === today).length,
    followUp:   notes.filter(n => n.followUpNeeded).length,
    highPain:   notes.filter(n => n.painLevel >= 7).length
  };

  // ── Filters ──────────────────────────────────────────────────────────
  const filtered = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      n.resident?.firstName.toLowerCase().includes(q) ||
      n.resident?.lastName.toLowerCase().includes(q) ||
      n.careNoteNumber.toLowerCase().includes(q) ||
      n.caregiverName.toLowerCase().includes(q);
    const matchShift    = filterShift === 'All' || n.shift === filterShift;
    const matchResident = filterResident === 'All' || n.residentId === filterResident;
    const matchDate     = !filterDate || n.date === filterDate;
    return matchSearch && matchShift && matchResident && matchDate;
  });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Care Notes</h1>
          <p className="text-slate-600 mt-1">Daily care documentation for all residents</p>
        </div>
        <button
          onClick={() => navigate('/ltc/care-notes/new')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 font-medium text-sm"
        >
          <Plus size={18} />
          <span>New Care Note</span>
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Notes',   value: stats.total,    color: 'blue',   icon: FileText },
          { label: "Today's Notes", value: stats.today,    color: 'green',  icon: Calendar },
          { label: 'Follow-Up',     value: stats.followUp, color: 'yellow', icon: AlertTriangle },
          { label: 'High Pain (7+)',value: stats.highPain, color: 'red',    icon: Clock }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 text-${stat.color}-600`}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon size={20} className={`text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by resident name, note number, or caregiver..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Shift */}
          <div className="flex items-center space-x-2">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Shift:</span>
            {(['All', 'Day', 'Evening', 'Night'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterShift(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterShift === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Resident */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Resident:</span>
            <select
              value={filterResident}
              onChange={e => setFilterResident(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Residents</option>
              {residents.map(r => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Notes List ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No care notes found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(note => (
              <div
                key={note.id}
                onClick={() => navigate(`/ltc/care-notes/${note.id}`)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {note.resident?.firstName[0]}{note.resident?.lastName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {note.resident?.firstName} {note.resident?.lastName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="font-mono text-xs text-slate-500">{note.careNoteNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SHIFT_STYLES[note.shift]}`}>
                          {note.shift} Shift
                        </span>
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Calendar size={11} />
                          <span>{format(new Date(note.date), 'MMM dd, yyyy')}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          {note.startTime}–{note.endTime}
                        </span>
                      </div>

                      {/* Middle row */}
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span><strong>By:</strong> {note.caregiverName}</span>
                        <span><strong>Nutrition:</strong> {note.nutritionIntake}</span>
                        <span><strong>Hydration:</strong> {note.hydrationIntake}</span>
                        <span><strong>Pain:</strong> {note.painLevel}/10</span>
                        <span className={`font-medium ${MOOD_COLORS[note.mood] || ''}`}>
                          <strong className="text-slate-600">Mood:</strong> {note.mood}
                        </span>
                        <span>
                          <strong>Meds:</strong>{' '}
                          {note.medications.filter(m => m.administered).length}/{note.medications.length} given
                        </span>
                      </div>

                      {/* Alerts */}
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {note.followUpNeeded && (
                          <span className="inline-flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle size={10} />
                            <span>Follow-up needed</span>
                          </span>
                        )}
                        {note.painLevel >= 7 && (
                          <span className="inline-flex items-center space-x-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <AlertTriangle size={10} />
                            <span>High pain: {note.painLevel}/10</span>
                          </span>
                        )}
                        {note.alerts && (
                          <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            ⚠ {note.alerts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};