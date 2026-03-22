import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi, patientApi } from '../../../core/services/api';
import { Claim } from '../../../core/models';
import { 
  DollarSign, Plus, TrendingUp, Clock, 
  CheckCircle, XCircle, FileText, Download 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const getOutstandingAmount = (claim: Claim): number => {
  const paidAmount = claim.payment?.amountPaid || 0;
  return Math.max(0, claim.totalAmount - paidAmount);
};

const getClaimAgeDays = (visitDate: string): number => {
  const visit = new Date(visitDate);
  if (Number.isNaN(visit.getTime())) return 0;
  const diff = Date.now() - visit.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const monthLabel = (date: Date): string =>
  date.toLocaleString(undefined, { month: 'short' });

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
    pending: claims.filter(c => c.status === 'Submitted' || c.status === 'Draft' || c.status === 'Resubmitted').length,
    approved: claims.filter(c => c.status === 'Approved').length,
    denied: claims.filter(c => c.status === 'Rejected').length,
    paid: claims.filter(c => c.status === 'Paid').length,
    revenue: claims
      .filter(c => c.status === 'Paid')
      .reduce((sum, c) => sum + (c.payment?.amountPaid || 0), 0)
  };

  const agingBuckets = claims
    .filter(c => c.status !== 'Paid')
    .reduce(
      (acc, claim) => {
        const age = getClaimAgeDays(claim.visitDate);
        const amount = getOutstandingAmount(claim);
        if (age <= 30) acc.bucket0to30 += amount;
        else if (age <= 60) acc.bucket31to60 += amount;
        else if (age <= 90) acc.bucket61to90 += amount;
        else acc.bucket90Plus += amount;
        return acc;
      },
      { bucket0to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90Plus: 0 }
    );

  const deniedClaims = claims
    .filter(c => c.status === 'Rejected')
    .slice(0, 5);

  const collectionsTrend = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const amount = claims
      .filter(claim => claim.status === 'Paid' && claim.payment?.paidDate)
      .filter(claim => {
        const paidDate = new Date(claim.payment.paidDate);
        return `${paidDate.getFullYear()}-${paidDate.getMonth()}` === key;
      })
      .reduce((sum, claim) => sum + (claim.payment?.amountPaid || 0), 0);

    return { label: monthLabel(date), amount };
  });

  const maxCollection = Math.max(...collectionsTrend.map(item => item.amount), 1);

  const payerMixRaw = claims.reduce<Record<string, { count: number; amount: number }>>((acc, claim) => {
    const key = claim.insuranceType || 'Unknown';
    if (!acc[key]) {
      acc[key] = { count: 0, amount: 0 };
    }
    acc[key].count += 1;
    acc[key].amount += claim.totalAmount;
    return acc;
  }, {});

  const totalPayerClaims = Math.max(claims.length, 1);
  const payerMix = Object.entries(payerMixRaw)
    .map(([payer, value]) => ({
      payer,
      count: value.count,
      amount: value.amount,
      percent: Math.round((value.count / totalPayerClaims) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const analyticsSummaryRows = useMemo(() => {
    const rows: string[] = [];
    rows.push('Metric,Value');
    rows.push(`Total Claims,${stats.totalClaims}`);
    rows.push(`Pending Claims,${stats.pending}`);
    rows.push(`Approved Claims,${stats.approved}`);
    rows.push(`Denied Claims,${stats.denied}`);
    rows.push(`Paid Claims,${stats.paid}`);
    rows.push(`Total Revenue,${stats.revenue.toFixed(2)}`);
    rows.push(`AR 0-30,${agingBuckets.bucket0to30.toFixed(2)}`);
    rows.push(`AR 31-60,${agingBuckets.bucket31to60.toFixed(2)}`);
    rows.push(`AR 61-90,${agingBuckets.bucket61to90.toFixed(2)}`);
    rows.push(`AR 90+,${agingBuckets.bucket90Plus.toFixed(2)}`);

    rows.push('');
    rows.push('Collections Trend (6 months),Amount');
    collectionsTrend.forEach((item) => rows.push(`${item.label},${item.amount.toFixed(2)}`));

    rows.push('');
    rows.push('Payer Mix,Pct/Count/Amount');
    payerMix.forEach((item) =>
      rows.push(`${item.payer},${item.percent}% / ${item.count} / ${item.amount.toFixed(2)}`)
    );

    return rows;
  }, [
    agingBuckets.bucket0to30,
    agingBuckets.bucket31to60,
    agingBuckets.bucket61to90,
    agingBuckets.bucket90Plus,
    collectionsTrend,
    payerMix,
    stats.approved,
    stats.denied,
    stats.paid,
    stats.pending,
    stats.revenue,
    stats.totalClaims
  ]);

  const handleExportAnalytics = () => {
    const csv = analyticsSummaryRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `billing-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Billing analytics summary exported');
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
      'Submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'Resubmitted': 'bg-indigo-100 text-indigo-700 border-indigo-200',
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
      case 'Resubmitted': return <Clock size={16} />;
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
          <button
            onClick={handleExportAnalytics}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export Analytics</span>
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Denied</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.denied}</p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Total Revenue</p>
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* AR Aging */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">A/R Aging (Outstanding)</h2>
          <span className="text-xs text-slate-500">By visit date</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">0-30 days</p>
            <p className="mt-1 text-xl font-bold text-slate-800">${agingBuckets.bucket0to30.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">31-60 days</p>
            <p className="mt-1 text-xl font-bold text-amber-700">${agingBuckets.bucket31to60.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">61-90 days</p>
            <p className="mt-1 text-xl font-bold text-orange-700">${agingBuckets.bucket61to90.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">90+ days</p>
            <p className="mt-1 text-xl font-bold text-red-700">${agingBuckets.bucket90Plus.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Filter by status:</span>
          {['all', 'Draft', 'Submitted', 'Resubmitted', 'Approved', 'Rejected', 'Paid'].map((status) => (
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

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Collections Trend</h2>
            <span className="text-xs text-slate-500">Last 6 months</span>
          </div>
          <div className="space-y-2">
            {collectionsTrend.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">${item.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(8, (item.amount / maxCollection) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Payer Mix</h2>
            <span className="text-xs text-slate-500">By claim count</span>
          </div>
          <div className="space-y-2">
            {payerMix.length === 0 ? (
              <p className="text-sm text-slate-500">No payer data available.</p>
            ) : (
              payerMix.map((item) => (
                <div key={item.payer} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{item.payer}</span>
                    <span className="text-slate-600">{item.count} claims ({item.percent}%)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Billed amount: ${item.amount.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Analytics Summary Export</h2>
            <p className="mt-1 text-xs text-slate-500">Exports KPI, A/R aging, trend, and payer-mix snapshot as CSV.</p>
          </div>
          <button
            onClick={handleExportAnalytics}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Download CSV
          </button>
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
                        <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
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

      {/* Denials Work Queue */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Denials Work Queue</h2>
          <span className="text-xs text-slate-500">Top 5 rejected claims</span>
        </div>

        {deniedClaims.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            No denied claims pending rework.
          </div>
        ) : (
          <div className="space-y-2">
            {deniedClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{claim.claimNumber} • {claim.patient?.firstName} {claim.patient?.lastName}</p>
                  <p className="text-xs text-red-700 truncate">{claim.rejectionReason || 'No rejection reason captured'}</p>
                </div>
                <button
                  onClick={() => navigate(`/billing/${claim.id}`)}
                  className="ml-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Rework
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};