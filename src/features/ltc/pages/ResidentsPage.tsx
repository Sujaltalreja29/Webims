import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { residentApi } from '../../../core/services/api';
import { Resident, ResidentStatus, CareLevel } from '../../../core/models';
import {
  Building2, Plus, Search, Users, Heart,
  AlertTriangle, ChevronRight, Activity,
  BedDouble, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ResidentStatus, string> = {
  'Active':            'bg-green-100 text-green-700 border-green-200',
  'Discharged':        'bg-gray-100 text-gray-600 border-gray-200',
  'Hospital Transfer': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

const CARE_LEVEL_STYLES: Record<CareLevel, string> = {
  'Independent':    'bg-blue-100 text-blue-700',
  'Assisted':       'bg-purple-100 text-purple-700',
  'Skilled Nursing':'bg-orange-100 text-orange-700',
  'Memory Care':    'bg-pink-100 text-pink-700'
};

const MOBILITY_ICONS: Record<string, string> = {
  'Independent': '🚶',
  'Walker':      '🦯',
  'Wheelchair':  '♿',
  'Bedridden':   '🛏️'
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ResidentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [residents, setResidents]     = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ResidentStatus | 'All'>('All');
  const [filterCareLevel, setFilterCareLevel] = useState<CareLevel | 'All'>('All');
  const [loading, setLoading]         = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await residentApi.getAll();
      data.sort((a, b) =>
        new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime()
      );
      setResidents(data);
    } catch {
      toast.error('Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = {
    total:     residents.length,
    active:    residents.filter(r => r.status === 'Active').length,
    discharged:residents.filter(r => r.status === 'Discharged').length,
    hospital:  residents.filter(r => r.status === 'Hospital Transfer').length,
    followUp:  residents.filter(r => r.dnrStatus).length
  };

  // ── Filters ───────────────────────────────────────────────────────────
  const filtered = residents.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.residentNumber.toLowerCase().includes(q) ||
      r.roomNumber.toLowerCase().includes(q);
    const matchStatus    = filterStatus === 'All' || r.status === filterStatus;
    const matchCareLevel = filterCareLevel === 'All' || r.careLevel === filterCareLevel;
    return matchSearch && matchStatus && matchCareLevel;
  });

  const getAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Residents</h1>
          <p className="text-slate-600 mt-1">Manage long-term care residents</p>
        </div>
        <button
          onClick={() => navigate('/ltc/residents/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium text-sm"
        >
          <Plus size={18} />
          <span>Admit Resident</span>
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Residents</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Heart size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Hospital Transfer</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.hospital}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Discharged</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{stats.discharged}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <BedDouble size={20} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, resident number, or room..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Status:</span>
            {(['All', 'Active', 'Discharged', 'Hospital Transfer'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Care level filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Care Level:</span>
            {(['All', 'Independent', 'Assisted', 'Skilled Nursing', 'Memory Care'] as const).map(cl => (
              <button
                key={cl}
                onClick={() => setFilterCareLevel(cl)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterCareLevel === cl
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Residents List ───────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No residents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Resident</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Room</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Care Level</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Mobility</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Admission</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(resident => (
                  <tr
                    key={resident.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/ltc/residents/${resident.id}`)}
                  >
                    {/* Resident */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {resident.firstName[0]}{resident.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {resident.firstName} {resident.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {resident.residentNumber} · Age {getAge(resident.dateOfBirth)}
                          </p>
                          {resident.dnrStatus && (
                            <span className="text-xs text-red-600 font-medium">DNR</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {resident.roomNumber}{resident.bedNumber}
                      </span>
                    </td>

                    {/* Care Level */}
                    <td className="px-5 py-4">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${CARE_LEVEL_STYLES[resident.careLevel]}`}>
                        {resident.careLevel}
                      </span>
                    </td>

                    {/* Mobility */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-700">
                        {MOBILITY_ICONS[resident.mobilityStatus]} {resident.mobilityStatus}
                      </span>
                    </td>

                    {/* Admission */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {format(new Date(resident.admissionDate), 'MMM dd, yyyy')}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[resident.status]}`}>
                        {resident.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/ltc/care-notes/new?residentId=${resident.id}`)}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                        >
                          + Care Note
                        </button>
                        <button
                          onClick={() => navigate(`/ltc/residents/${resident.id}`)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};