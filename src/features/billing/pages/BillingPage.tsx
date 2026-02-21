import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi, patientApi, encounterApi } from '../../../core/services/api';
import { Claim } from '../../../core/models';
import { 
  DollarSign, Plus, TrendingUp, Clock, 
  CheckCircle, XCircle, FileText, Download 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | Claim['status']>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const data = await billingApi.getAll();
      
      const withPatients = await Promise.all(
        data.map(async (claim) => {
          const patient = await patientApi.getById(claim.patientId);
          return { ...claim, patient };
        })
      );

      withPatients.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setClaims(withPatients);
    } catch (error) {
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(claim => 
    filterStatus === 'all' || claim.status === filterStatus
  );

  const stats = {
    totalClaims: claims.length,
    pending: claims.filter(c => c.status === 'Submitted' || c.status === 'Draft').length,
    approved: claims.filter(c => c.status === 'Approved').length,
    paid: claims.filter(c => c.status === 'Paid').length,
    revenue: claims
      .filter(c => c.status === 'Paid')
      .reduce((sum, c) => sum + (c.payment?.amountPaid || 0), 0)
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
      'Submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'Approved': 'bg-green-100 text-green-700 border-green-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
      'Paid': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle size={16} />;
      case 'Rejected': return <XCircle size={16} />;
      case 'Submitted': return <Clock size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Billing & Claims</h1>
          <p className="text-slate-600 mt-1">Manage patient billing and insurance claims</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2">
            <Download size={18} />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => navigate('/billing/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Claim</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Claims</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalClaims}</p>
            </div>
            <FileText className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.paid}</p>
            </div>
            <DollarSign className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Total Revenue</p>
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Filter by status:</span>
          {['all', 'Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500">No claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Claim #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Diagnoses</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Insurance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-slate-800">
                        {claim.claimNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {claim.patient?.firstName[0]}{claim.patient?.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-800">
                          {claim.patient?.firstName} {claim.patient?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {format(new Date(claim.visitDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {claim.diagnosisCodes.slice(0, 2).map((code: string, i: number) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {code}
                          </span>
                        ))}
                        {claim.diagnosisCodes.length > 2 && (
                          <span className="text-xs text-slate-500">+{claim.diagnosisCodes.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">${claim.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {claim.insuranceType}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                        {getStatusIcon(claim.status)}
                        <span className="ml-1">{claim.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/billing/${claim.id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details →
                      </button>
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