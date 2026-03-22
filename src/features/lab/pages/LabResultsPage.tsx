import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { labResultApi, patientApi } from '../../../core/services/api';
import { LabResult, Patient, LabStatus } from '../../../core/models';
import {
  FlaskConical, Search, AlertTriangle, Clock,
  CheckCircle, XCircle, Plus, ChevronRight,
  Activity, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterStatus = 'All' | LabStatus;

interface LabResultWithPatient extends LabResult {
  patient?: Patient | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Ordered:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  'In Progress':'bg-blue-100 text-blue-700 border-blue-200',
  Completed:    'bg-green-100 text-green-700 border-green-200',
  Cancelled:    'bg-gray-100 text-gray-600 border-gray-200'
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Ordered:      <Clock size={13} />,
  'In Progress':<Activity size={13} />,
  Completed:    <CheckCircle size={13} />,
  Cancelled:    <XCircle size={13} />
};

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
export const LabResultsPage: React.FC = () => {
  const navigate = useNavigate();

  const [labResults, setLabResults]   = useState<LabResultWithPatient[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading]         = useState(true);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [labs, patients] = await Promise.all([
        labResultApi.getAll(),
        patientApi.getAll()
      ]);

      const patientMap = new Map(patients.map(p => [p.id, p]));

      const enriched: LabResultWithPatient[] = labs
        .map(lab => ({ ...lab, patient: patientMap.get(lab.patientId) }))
        .sort((a, b) =>
          new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime()
        );

      setLabResults(enriched);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = {
    total:       labResults.length,
    pending:     labResults.filter(l => l.status === 'Ordered' || l.status === 'In Progress').length,
    completedToday: labResults.filter(l =>
      l.status === 'Completed' &&
      l.completedDate?.startsWith(new Date().toISOString().split('T')[0])
    ).length,
    abnormal:    labResults.filter(l => l.isAbnormal).length
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  const filtered = labResults.filter(lab => {
    const matchesStatus = filterStatus === 'All' || lab.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      lab.patient?.firstName.toLowerCase().includes(q) ||
      lab.patient?.lastName.toLowerCase().includes(q) ||
      lab.testName.toLowerCase().includes(q) ||
      lab.labOrderNumber.toLowerCase().includes(q) ||
      lab.orderedByName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const FILTER_TABS: FilterStatus[] = ['All', 'Ordered', 'In Progress', 'Completed', 'Cancelled'];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Results</h1>
          <p className="text-slate-600 mt-1">Manage lab orders and enter test results</p>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FlaskConical size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pending Results</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Completed Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.completedToday}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Abnormal Results</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.abnormal}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, test name, or order number..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status:</span>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab}
              {tab !== 'All' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filterStatus === tab ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {labResults.filter(l => l.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FlaskConical size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No lab orders found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Lab orders will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Order #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Test</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ordered By</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lab => (
                  <tr
                    key={lab.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/lab/${lab.id}`)}
                  >
                    {/* Order # */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-slate-700">
                        {lab.labOrderNumber}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-4">
                      {lab.patient ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {lab.patient.firstName[0]}{lab.patient.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {lab.patient.firstName} {lab.patient.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{lab.patient.mrn}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unknown</span>
                      )}
                    </td>

                    {/* Test */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">{lab.testName}</p>
                      <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[lab.testType] || TYPE_COLORS['Other']}`}>
                        {lab.testType}
                      </span>
                    </td>

                    {/* Ordered By */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">{lab.orderedByName || '—'}</p>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5 text-sm text-slate-600">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{format(new Date(lab.orderedDate), 'MMM dd, yyyy')}</span>
                      </div>
                      {lab.completedDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Completed: {format(new Date(lab.completedDate), 'MMM dd')}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-y-1 flex-col items-start">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[lab.status]}`}>
                          {STATUS_ICONS[lab.status]}
                          <span>{lab.status}</span>
                        </span>
                        {lab.isAbnormal && (
                          <span className="inline-flex items-center space-x-1 text-xs text-red-600 font-medium">
                            <AlertTriangle size={11} />
                            <span>Abnormal</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      {(lab.status === 'Ordered' || lab.status === 'In Progress') ? (
                        <button
                          onClick={() => navigate(`/lab/${lab.id}/enter-results`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Enter Results
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/lab/${lab.id}`)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View <ChevronRight size={14} />
                        </button>
                      )}
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