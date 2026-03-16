import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Package, Calendar, MapPin, DollarSign, 
  TrendingUp, TrendingDown, Lock, AlertTriangle, Activity,
  Plus, Minus
} from 'lucide-react';
import { medicationInventoryApi, stockTransactionApi } from '../../../core/services/api';
import type { MedicationInventory, StockTransaction } from '../../../core/models';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';

export const MedicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<MedicationInventory | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [medData, txData] = await Promise.all([
        medicationInventoryApi.getById(id),
        stockTransactionApi.getByMedication(id)
      ]);

      if (!medData) {
        toast.error('Medication not found');
        navigate('/pharmacy/inventory');
        return;
      }

      setMedication(medData);
      setTransactions(txData);
    } catch (error) {
      console.error('Failed to load medication details:', error);
      toast.error('Failed to load medication details');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentComplete = () => {
    setShowAdjustmentModal(false);
    loadData(); // Reload data to show updated stock
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading medication details...</div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Medication not found</div>
      </div>
    );
  }

  const getStockStatus = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(medication.expiryDate);

    if (medication.stockQuantity === 0) {
      return { 
        status: 'out', 
        label: 'Out of Stock', 
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle 
      };
    }
    if (expiryDate <= thirtyDaysFromNow && expiryDate >= now) {
      return { 
        status: 'expiring', 
        label: 'Expiring Soon', 
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Calendar 
      };
    }
    if (medication.stockQuantity <= medication.reorderLevel) {
      return { 
        status: 'low', 
        label: 'Low Stock', 
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: TrendingDown 
      };
    }
    return { 
      status: 'good', 
      label: 'In Stock', 
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: Package 
    };
  };

  const stockStatus = getStockStatus();
  const stockPercentage = (medication.stockQuantity / (medication.reorderLevel + medication.reorderQuantity)) * 100;
  const totalValue = medication.stockQuantity * medication.unitPrice;

  const getTransactionIcon = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'Received':
        return <TrendingUp className="text-green-600" size={18} />;
      case 'Dispensed':
        return <TrendingDown className="text-blue-600" size={18} />;
      case 'Adjustment':
        return <Activity className="text-purple-600" size={18} />;
      case 'Expired':
        return <AlertTriangle className="text-red-600" size={18} />;
      case 'Returned':
        return <Plus className="text-teal-600" size={18} />;
      default:
        return <Activity className="text-slate-600" size={18} />;
    }
  };

  const getTransactionColor = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'Received':
        return 'bg-green-50 border-green-200';
      case 'Dispensed':
        return 'bg-blue-50 border-blue-200';
      case 'Adjustment':
        return 'bg-purple-50 border-purple-200';
      case 'Expired':
        return 'bg-red-50 border-red-200';
      case 'Returned':
        return 'bg-teal-50 border-teal-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pharmacy/inventory')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{medication.medicationName}</h1>
              {medication.isControlled && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  <Lock size={12} className="mr-1" />
                  Controlled
                </span>
              )}
            </div>
            <p className="text-slate-600 mt-1">
              {medication.genericName} • {medication.strength} {medication.dosageForm}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Activity size={18} className="mr-2" />
            Adjust Stock
          </button>
          <Link
            to={`/pharmacy/inventory/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      {(stockStatus.status === 'out' || stockStatus.status === 'low' || stockStatus.status === 'expiring') && (
        <div className={`p-4 rounded-lg border ${stockStatus.color}`}>
          <div className="flex items-center gap-2">
            <stockStatus.icon size={20} />
            <div>
              <p className="font-semibold">{stockStatus.label}</p>
              {stockStatus.status === 'out' && (
                <p className="text-sm mt-1">This medication is out of stock. Please reorder immediately.</p>
              )}
              {stockStatus.status === 'low' && (
                <p className="text-sm mt-1">
                  Stock level is below reorder threshold ({medication.reorderLevel} units). Consider reordering {medication.reorderQuantity} units.
                </p>
              )}
              {stockStatus.status === 'expiring' && (
                <p className="text-sm mt-1">
                  This medication expires on {format(new Date(medication.expiryDate), 'MMM dd, yyyy')}. Use or dispose before expiry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Stock Overview</h2>
            
            <div className="space-y-4">
              {/* Stock Level Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Current Stock Level</span>
                  <span className="text-2xl font-bold text-slate-900">{medication.stockQuantity}</span>
                </div>
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      stockPercentage > 50 ? 'bg-green-500' :
                      stockPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>Reorder: {medication.reorderLevel}</span>
                  <span>Max: {medication.reorderLevel + medication.reorderQuantity}</span>
                </div>
              </div>

              {/* Stock Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Reorder Level</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{medication.reorderLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reorder Quantity</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{medication.reorderQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Unit Price</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">${medication.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Value</p>
                  <p className="text-lg font-semibold text-green-600 mt-1">${totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Transaction History */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Transaction History</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No transactions recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-4 rounded-lg border ${getTransactionColor(tx.transactionType)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTransactionIcon(tx.transactionType)}
                        <div>
                          <div className="font-medium text-slate-900">{tx.transactionType}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            By {tx.performedByName} • {format(new Date(tx.createdAt), 'MMM dd, yyyy h:mm a')}
                          </div>
                          {tx.notes && (
                            <div className="text-sm text-slate-600 mt-1">{tx.notes}</div>
                          )}
                          {tx.reason && (
                            <div className="text-sm text-slate-600 mt-1">Reason: {tx.reason}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${tx.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {tx.quantityBefore} → {tx.quantityAfter}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Medication Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Medication Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">NDC</p>
                <p className="text-sm font-medium text-slate-900 font-mono">{medication.ndc}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500">Manufacturer</p>
                <p className="text-sm font-medium text-slate-900">{medication.manufacturer}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500">Dosage Form</p>
                <p className="text-sm font-medium text-slate-900">{medication.dosageForm}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500">Strength</p>
                <p className="text-sm font-medium text-slate-900">{medication.strength}</p>
              </div>
            </div>
          </div>

          {/* Storage Information */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Storage Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-medium text-slate-900">{medication.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Expiry Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(medication.expiryDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Package size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Lot Number</p>
                  <p className="text-sm font-medium text-slate-900">{medication.lotNumber}</p>
                </div>
              </div>
              
              {medication.lastRestocked && (
                <div className="flex items-start gap-2">
                  <TrendingUp size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Last Restocked</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(medication.lastRestocked), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status</h3>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${stockStatus.color}`}>
              <stockStatus.icon size={16} className="mr-2" />
              {stockStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <StockAdjustmentModal
          medication={medication}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={handleAdjustmentComplete}
        />
      )}
    </div>
  );
};