import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Clock, CheckCircle, XCircle, User, Pill, Calendar } from 'lucide-react';
import { refillRequestApi, prescriptionApi, patientApi } from '../../../core/services/api';
import type { RefillRequest, Prescription, Patient } from '../../../core/models';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ApproveRefillModal } from '../components/ApproveRefillModal';
import { DenyRefillModal } from '../components/DenyRefillModal';

export const RefillRequestsPage = () => {
  const [requests, setRequests] = useState<RefillRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RefillRequest[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RefillRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRequests, allPrescriptions, allPatients] = await Promise.all([
        refillRequestApi.getAll(),
        prescriptionApi.getAll(),
        patientApi.getAll()
      ]);

      setRequests(allRequests);

      // Create lookup maps
      const prescriptionsMap: Record<string, Prescription> = {};
      allPrescriptions.forEach(rx => {
        prescriptionsMap[rx.id] = rx;
      });
      setPrescriptions(prescriptionsMap);

      const patientsMap: Record<string, Patient> = {};
      allPatients.forEach(p => {
        patientsMap[p.id] = p;
      });
      setPatients(patientsMap);

      // Calculate stats
      setStats({
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'Pending').length,
        approved: allRequests.filter(r => r.status === 'Approved').length,
        denied: allRequests.filter(r => r.status === 'Denied').length
      });
    } catch (error) {
      console.error('Failed to load refill requests:', error);
      toast.error('Failed to load refill requests');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filterStatus !== 'all') {
      const statusMap = {
        pending: 'Pending',
        approved: 'Approved',
        denied: 'Denied'
      };
      filtered = filtered.filter(r => r.status === statusMap[filterStatus]);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());

    setFilteredRequests(filtered);
  };

  const handleApprove = (request: RefillRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleDeny = (request: RefillRequest) => {
    setSelectedRequest(request);
    setShowDenyModal(true);
  };

  const handleModalSuccess = () => {
    setShowApproveModal(false);
    setShowDenyModal(false);
    setSelectedRequest(null);
    loadData(); // Reload data
  };

  const getStatusColor = (status: RefillRequest['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Denied':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Dispensed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: RefillRequest['status']) => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />;
      case 'Approved':
        return <CheckCircle size={16} />;
      case 'Denied':
        return <XCircle size={16} />;
      case 'Dispensed':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading refill requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refill Requests</h1>
        <p className="text-slate-600 mt-1">Review and approve prescription refill requests from patients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total Requests</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <RefreshCcw size={24} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100">Pending Review</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock size={24} className="text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Approved</p>
              <p className="text-3xl font-bold mt-1">{stats.approved}</p>
            </div>
            <CheckCircle size={24} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Denied</p>
              <p className="text-3xl font-bold mt-1">{stats.denied}</p>
            </div>
            <XCircle size={24} className="text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('denied')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filterStatus === 'denied'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Denied
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <RefreshCcw size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No refill requests found</p>
            <p className="text-sm text-slate-400 mt-2">
              {filterStatus === 'pending' 
                ? 'All refill requests have been reviewed'
                : 'No requests match the selected filter'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const prescription = prescriptions[request.originalPrescriptionId];
            const patient = patients[request.patientId];

            if (!prescription || !patient) return null;

            return (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Left Section - Request Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                      <span className="text-sm text-slate-500">
                        Request #{request.refillRequestNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Patient Info */}
                      <div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <User size={14} />
                          <span>Patient</span>
                        </div>
                        <Link
                          to={`/patients/${patient.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {patient.firstName} {patient.lastName}
                        </Link>
                        <p className="text-sm text-slate-500">{patient.phone}</p>
                      </div>

                      {/* Medication Info */}
                      <div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Pill size={14} />
                          <span>Medication</span>
                        </div>
                        <p className="font-semibold text-slate-900">{request.medicationName}</p>
                        <p className="text-sm text-slate-500">
                          {prescription.dosage} • {prescription.frequency}
                        </p>
                      </div>

                      {/* Date Info */}
                      <div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Calendar size={14} />
                          <span>Requested</span>
                        </div>
                        <p className="text-sm text-slate-900">
                          {format(new Date(request.requestedDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(request.requestedDate), 'h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Original Prescription Details */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">Original Prescription</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          Rx# <span className="font-mono">{prescription.rxNumber}</span>
                        </span>
                        <span className="text-slate-600">
                          Qty: {prescription.quantity}
                        </span>
                        <span className="text-slate-600">
                          Refills: {prescription.refills} remaining
                        </span>
                        <Link
                          to={`/pharmacy/prescriptions/${prescription.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Prescription →
                        </Link>
                      </div>
                    </div>

                    {/* Notes from request */}
                    {request.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Patient Notes:</p>
                        <p className="text-sm text-slate-700">{request.notes}</p>
                      </div>
                    )}

                    {/* Reviewed Info */}
                    {request.reviewedBy && (
                      <div className="mt-3 text-sm text-slate-600">
                        Reviewed by {request.reviewedByName} on{' '}
                        {format(new Date(request.reviewedDate!), 'MMM dd, yyyy h:mm a')}
                        {request.denialReason && (
                          <p className="text-red-600 mt-1">Reason: {request.denialReason}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  {request.status === 'Pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(request)}
                        className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                      >
                        <XCircle size={16} className="mr-2" />
                        Deny
                      </button>
                    </div>
                  )}

                  {request.status === 'Approved' && request.newPrescriptionId && (
                    <div className="ml-4">
                      <Link
                        to={`/pharmacy/prescriptions/${request.newPrescriptionId}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View New Rx
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showApproveModal && selectedRequest && (
        <ApproveRefillModal
          request={selectedRequest}
          prescription={prescriptions[selectedRequest.originalPrescriptionId]}
          onClose={() => setShowApproveModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showDenyModal && selectedRequest && (
        <DenyRefillModal
          request={selectedRequest}
          onClose={() => setShowDenyModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};