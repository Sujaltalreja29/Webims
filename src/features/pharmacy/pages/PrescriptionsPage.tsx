import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prescriptionApi, patientApi } from '../../../core/services/api';
import { Prescription, Patient } from '../../../core/models';
import { useAuthStore } from '../../../store/authStore';
import { 
  Pill, Search, Filter, Clock, CheckCircle, 
  XCircle, Package, DollarSign, Eye, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type PrescriptionWithPatient = Prescription & {
  patient?: Patient;
};

type FilterStatus = 'all' | Prescription['status'];

export const PrescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ready: 0,
    dispensedToday: 0,
    revenue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, prescriptions]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load prescriptions and stats
      const [queue, rxStats, revenue] = await Promise.all([
        prescriptionApi.getPharmacyQueue(),
        prescriptionApi.getStats(),
        prescriptionApi.getTotalRevenue()
      ]);

      // Load patient data for each prescription
      const withPatients = await Promise.all(
        queue.map(async (rx) => {
          const patient = await patientApi.getById(rx.patientId);
          return { ...rx, patient: patient || undefined };
        })
      );

      setPrescriptions(withPatients);
      setStats({ ...rxStats, revenue });
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...prescriptions];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.rxNumber.toLowerCase().includes(term) ||
        p.medicationName.toLowerCase().includes(term) ||
        p.patient?.firstName.toLowerCase().includes(term) ||
        p.patient?.lastName.toLowerCase().includes(term) ||
        p.patient?.mrn.toLowerCase().includes(term)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const handleMarkReady = async (id: string) => {
    if (!user) return;

    try {
      await prescriptionApi.markAsReady(id, user.id, user.fullName);
      toast.success('Prescription marked as ready for pickup');
      loadData();
    } catch (error) {
      toast.error('Failed to update prescription status');
    }
  };

  const handleDispense = async (id: string) => {
    if (!user) return;

    try {
      await prescriptionApi.dispense(id, user.id, user.fullName);
      toast.success('Prescription dispensed successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to dispense prescription');
    }
  };

  const getStatusColor = (status: Prescription['status']) => {
    const colors: Record<Prescription['status'], string> = {
      'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
      'Sent to Pharmacy': 'bg-amber-100 text-amber-700 border-amber-200',
      'Ready': 'bg-green-100 text-green-700 border-green-200',
      'Dispensed': 'bg-purple-100 text-purple-700 border-purple-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: Prescription['status']) => {
    switch (status) {
      case 'Pending':
      case 'Sent to Pharmacy':
        return <Clock size={16} />;
      case 'Ready':
        return <Package size={16} />;
      case 'Dispensed':
        return <CheckCircle size={16} />;
      case 'Cancelled':
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const filterButtons: { label: string; value: FilterStatus; count?: number }[] = [
    { label: 'All', value: 'all', count: stats.total },
    { label: 'Pending', value: 'Sent to Pharmacy', count: stats.pending },
    { label: 'Ready', value: 'Ready', count: stats.ready },
    { label: 'Dispensed', value: 'Dispensed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pharmacy - Prescriptions</h1>
          <p className="text-slate-600 mt-1">Manage and dispense patient prescriptions</p>
        </div>
        <button
          onClick={() => navigate('/pharmacy/inventory')}
          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2"
        >
          <Package size={18} />
          <span>Inventory</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              <p className="text-amber-100 text-xs mt-1">Need attention</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* Ready for Pickup */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ready for Pickup</p>
              <p className="text-3xl font-bold mt-1">{stats.ready}</p>
              <p className="text-green-100 text-xs mt-1">Prepared</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Dispensed Today */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Dispensed Today</p>
              <p className="text-3xl font-bold mt-1">{stats.dispensedToday}</p>
              <p className="text-purple-100 text-xs mt-1">Completed</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">${stats.revenue.toFixed(0)}</p>
              <p className="text-blue-100 text-xs mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, medication, or Rx number..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <Filter size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Status:</span>
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === btn.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {btn.label}
              {btn.count !== undefined && ` (${btn.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions Queue */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Pill className="mr-2 text-purple-600" size={20} />
            Prescription Queue
            <span className="ml-2 text-sm text-slate-500">
              ({filteredPrescriptions.length} {filteredPrescriptions.length === 1 ? 'prescription' : 'prescriptions'})
            </span>
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No prescriptions match your filters' 
                  : 'No prescriptions in queue'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white rounded-lg border-2 border-slate-200 p-4 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(rx.status)}`}>
                        {getStatusIcon(rx.status)}
                        <span className="ml-1">{rx.status}</span>
                      </span>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{rx.rxNumber}</p>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {rx.patient?.firstName[0]}{rx.patient?.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {rx.patient?.firstName} {rx.patient?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{rx.patient?.mrn}</p>
                    </div>
                  </div>

                  {/* Medication Details */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Pill className="text-purple-600" size={18} />
                      <p className="font-semibold text-slate-800">{rx.medicationName}</p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Dosage: {rx.dosage} • {rx.frequency}
                    </p>
                    <p className="text-sm text-slate-600">
                      Qty: {rx.quantity} • Refills: {rx.refills}
                    </p>
                    {rx.instructions && (
                      <p className="text-xs text-slate-500 mt-1 italic">{rx.instructions}</p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-slate-500 mb-3">
                    {rx.status === 'Ready' && rx.updatedAt ? (
                      <p>Ready Since: {format(new Date(rx.updatedAt), 'MMM dd, yyyy h:mm a')}</p>
                    ) : rx.status === 'Dispensed' && rx.dispensedAt ? (
                      <p>Dispensed: {format(new Date(rx.dispensedAt), 'MMM dd, yyyy h:mm a')} by {rx.dispensedBy}</p>
                    ) : (
                      <p>Prescribed: {format(new Date(rx.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/pharmacy/prescriptions/${rx.id}`)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    
                    {(rx.status === 'Pending' || rx.status === 'Sent to Pharmacy') && (
                      <button
                        onClick={() => handleMarkReady(rx.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                      >
                        <Package size={16} />
                        <span>Mark Ready</span>
                      </button>
                    )}
                    
                    {rx.status === 'Ready' && (
                      <button
                        onClick={() => handleDispense(rx.id)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        <span>Dispense</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};