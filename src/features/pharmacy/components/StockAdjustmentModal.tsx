import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, TrendingUp, Activity } from 'lucide-react';
import { medicationInventoryApi, stockTransactionApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import type { MedicationInventory, StockTransaction } from '../../../core/models';
import { toast } from 'sonner';

interface StockAdjustmentModalProps {
  medication: MedicationInventory;
  onClose: () => void;
  onSuccess: () => void;
}

const adjustmentSchema = z.object({
  transactionType: z.enum(['Received', 'Adjustment', 'Expired', 'Returned']),
  quantityChange: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'Reason is required (minimum 3 characters)'),
  notes: z.string().optional()
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export const StockAdjustmentModal = ({ medication, onClose, onSuccess }: StockAdjustmentModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      transactionType: 'Received',
      quantityChange: 0,
      reason: '',
      notes: ''
    }
  });

  const transactionType = watch('transactionType');
  const quantityChange = watch('quantityChange');

  // Auto-set adjustment type based on transaction type
  const handleTransactionTypeChange = (type: AdjustmentFormData['transactionType']) => {
    if (type === 'Received' || type === 'Returned') {
      setAdjustmentType('increase');
    } else if (type === 'Expired') {
      setAdjustmentType('decrease');
    }
  };

  const calculateNewQuantity = () => {
    const change = adjustmentType === 'increase' ? quantityChange : -quantityChange;
    return medication.stockQuantity + change;
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!user) return;

    const newQuantity = calculateNewQuantity();

    if (newQuantity < 0) {
      toast.error('Cannot reduce stock below 0');
      return;
    }

    setLoading(true);
    try {
      const actualQuantityChange = adjustmentType === 'increase' ? data.quantityChange : -data.quantityChange;

      // Create stock transaction
      const transaction: Omit<StockTransaction, 'id' | 'createdAt'> = {
        medicationId: medication.id,
        transactionType: data.transactionType,
        quantityChange: actualQuantityChange,
        quantityBefore: medication.stockQuantity,
        quantityAfter: newQuantity,
        reason: data.reason,
        performedBy: user.id,
        performedByName: user.fullName,
        notes: data.notes || undefined
      };

      await stockTransactionApi.createTransaction(transaction);

      // Update medication stock
      const updatedMedication: MedicationInventory = {
        ...medication,
        stockQuantity: newQuantity,
        lastRestocked: adjustmentType === 'increase' ? new Date().toISOString() : medication.lastRestocked,
        updatedAt: new Date().toISOString()
      };

      await medicationInventoryApi.update(medication.id, updatedMedication);

      toast.success('Stock adjusted successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Adjust Stock</h2>
            <p className="text-sm text-slate-600 mt-1">{medication.medicationName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Current Stock Display */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Current Stock</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{medication.stockQuantity}</p>
              </div>
              <Activity size={32} className="text-slate-400" />
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transaction Type *
            </label>
            <select
              {...register('transactionType')}
              onChange={(e) => {
                register('transactionType').onChange(e);
                handleTransactionTypeChange(e.target.value as AdjustmentFormData['transactionType']);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Received">Received Shipment</option>
              <option value="Returned">Patient Return</option>
              <option value="Adjustment">Manual Adjustment</option>
              <option value="Expired">Expired/Damaged</option>
            </select>
            {errors.transactionType && (
              <p className="text-sm text-red-600 mt-1">{errors.transactionType.message}</p>
            )}
          </div>

          {/* Adjustment Type Toggle */}
          {transactionType === 'Adjustment' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adjustment Direction
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('increase')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    adjustmentType === 'increase'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Increase Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('decrease')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    adjustmentType === 'decrease'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Activity size={20} className="mx-auto mb-1" />
                  <span className="text-sm font-medium">Decrease Stock</span>
                </button>
              </div>
            </div>
          )}

          {/* Quantity Change */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity {adjustmentType === 'increase' ? 'to Add' : 'to Remove'} *
            </label>
            <input
              type="number"
              {...register('quantityChange', { valueAsNumber: true })}
              min="1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
            />
            {errors.quantityChange && (
              <p className="text-sm text-red-600 mt-1">{errors.quantityChange.message}</p>
            )}
          </div>

          {/* New Stock Preview */}
          {quantityChange > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">New Stock Level:</span>
                <span className="text-xl font-bold text-blue-900">
                  {calculateNewQuantity()} units
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                {medication.stockQuantity} {adjustmentType === 'increase' ? '+' : '-'} {quantityChange} = {calculateNewQuantity()}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason *
            </label>
            <input
              type="text"
              {...register('reason')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Weekly shipment, Inventory correction, Damaged items"
            />
            {errors.reason && (
              <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional information..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adjusting...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};