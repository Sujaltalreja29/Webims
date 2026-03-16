import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Package, AlertTriangle, Calendar, Lock,
  Edit, Eye, TrendingDown, TrendingUp, Clock
} from 'lucide-react';
import { medicationInventoryApi } from '../../../core/services/api';
import type { MedicationInventory } from '../../../core/models';

export const InventoryPage = () => {
  const [medications, setMedications] = useState<MedicationInventory[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low-stock' | 'expiring' | 'out-of-stock' | 'controlled'>('all');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    expiringSoon: 0,
    outOfStock: 0
  });

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [medications, searchQuery, filterStatus]);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const [all, lowStock, expiring, outOfStock] = await Promise.all([
        medicationInventoryApi.getAll(),
        medicationInventoryApi.getLowStock(),
        medicationInventoryApi.getExpiringSoon(),
        medicationInventoryApi.getOutOfStock()
      ]);

      setMedications(all);
      setStats({
        total: all.length,
        lowStock: lowStock.length,
        expiringSoon: expiring.length,
        outOfStock: outOfStock.length
      });
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...medications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.medicationName.toLowerCase().includes(query) ||
        med.genericName?.toLowerCase().includes(query) ||
        med.ndc.includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(med => {
        switch (filterStatus) {
          case 'low-stock':
            return med.stockQuantity <= med.reorderLevel && med.stockQuantity > 0;
          case 'expiring':
            const expiryDate = new Date(med.expiryDate);
            return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
          case 'out-of-stock':
            return med.stockQuantity === 0;
          case 'controlled':
            return med.isControlled;
          default:
            return true;
        }
      });
    }

    setFilteredMedications(filtered);
  };

  const getStockStatus = (med: MedicationInventory): {
    status: 'good' | 'low' | 'out' | 'expiring';
    label: string;
    color: string;
  } => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(med.expiryDate);

    if (med.stockQuantity === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (expiryDate <= thirtyDaysFromNow && expiryDate >= now) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (med.stockQuantity <= med.reorderLevel) {
      return { status: 'low', label: 'Low Stock', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    return { status: 'good', label: 'In Stock', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medication Inventory</h1>
          <p className="text-slate-600 mt-1">Manage medication stock levels and track inventory</p>
        </div>
        <Link
          to="/pharmacy/inventory/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Medication
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total Items</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Package size={24} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100">Low Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.lowStock}</p>
            </div>
            <TrendingDown size={24} className="text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100">Expiring Soon</p>
              <p className="text-3xl font-bold mt-1">{stats.expiringSoon}</p>
            </div>
            <Clock size={24} className="text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{stats.outOfStock}</p>
            </div>
            <AlertTriangle size={24} className="text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by medication name, generic name, or NDC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
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
              onClick={() => setFilterStatus('low-stock')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterStatus === 'low-stock'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilterStatus('expiring')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterStatus === 'expiring'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Expiring
            </button>
            <button
              onClick={() => setFilterStatus('out-of-stock')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterStatus === 'out-of-stock'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Out of Stock
            </button>
            <button
              onClick={() => setFilterStatus('controlled')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterStatus === 'controlled'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Lock size={16} className="inline mr-1" />
              Controlled
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  NDC / Lot
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMedications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No medications found
                  </td>
                </tr>
              ) : (
                filteredMedications.map((med) => {
                  const stockStatus = getStockStatus(med);
                  const stockPercentage = (med.stockQuantity / (med.reorderLevel + med.reorderQuantity)) * 100;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {med.isControlled && (
                            <Lock size={16} className="text-purple-600 mr-2" />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{med.medicationName}</div>
                            <div className="text-sm text-slate-500">
                              {med.genericName} • {med.strength} {med.dosageForm}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-slate-900 font-mono">{med.ndc}</div>
                          <div className="text-slate-500">Lot: {med.lotNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{med.stockQuantity}</span>
                            <span className="text-slate-500">/ {med.reorderLevel + med.reorderQuantity}</span>
                          </div>
                          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                stockPercentage > 50 ? 'bg-green-500' :
                                stockPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {med.location}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-slate-900">
                            {new Date(med.expiryDate).toLocaleDateString()}
                          </div>
                          {getStockStatus(med).status === 'expiring' && (
                            <div className="text-amber-600 text-xs mt-1">
                              <Calendar size={12} className="inline mr-1" />
                              Expires soon
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/pharmacy/inventory/${med.id}`}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/pharmacy/inventory/${med.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};