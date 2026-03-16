import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { prescriptionApi, medicationInventoryApi, stockTransactionApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import type { Prescription, MedicationInventory } from '../../../core/models';
import { toast } from 'sonner';

interface DispenseModalProps {
  prescription: Prescription;
  onClose: () => void;
  onSuccess: () => void;
}

const dispenseSchema = z.object({
  verifyPatient: z.boolean().refine((val) => val === true, {
    message: 'Patient verification is required'
  }),
  verifyMedication: z.boolean().refine((val) => val === true, {
    message: 'Medication verification is required'
  }),
  verifyDosage: z.boolean().refine((val) => val === true, {
    message: 'Dosage verification is required'
  }),
  verifyInstructions: z.boolean().refine((val) => val === true, {
    message: 'Instructions verification is required'
  }),
  notes: z.string().optional()
});

type DispenseFormData = z.infer<typeof dispenseSchema>;

export const DispenseModal = ({ prescription, onClose, onSuccess }: DispenseModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [inventoryItem, setInventoryItem] = useState<MedicationInventory | null>(null);
  const [stockCheckLoading, setStockCheckLoading] = useState(true);
  const [stockWarning, setStockWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<DispenseFormData>({
    resolver: zodResolver(dispenseSchema),
    defaultValues: {
      verifyPatient: false,
      verifyMedication: false,
      verifyDosage: false,
      verifyInstructions: false,
      notes: ''
    }
  });

  const allChecked = watch(['verifyPatient', 'verifyMedication', 'verifyDosage', 'verifyInstructions']);
  const isAllVerified = allChecked.every(Boolean);

  // Check inventory on mount
  useEffect(() => {
    checkInventory();
  }, []);

  const checkInventory = async () => {
    setStockCheckLoading(true);
    try {
      // Find medication in inventory by name
      const inventory = await medicationInventoryApi.findByName(prescription.medicationName);
      
      if (!inventory) {
        setStockWarning(`⚠️ ${prescription.medicationName} not found in inventory. Stock will not be deducted.`);
        setInventoryItem(null);
      } else {
        setInventoryItem(inventory);
        
        // Check if sufficient stock
        if (inventory.stockQuantity === 0) {
          setStockWarning(`❌ ${prescription.medicationName} is OUT OF STOCK. Cannot dispense.`);
        } else if (inventory.stockQuantity < prescription.quantity) {
          setStockWarning(
            `⚠️ Insufficient stock: Only ${inventory.stockQuantity} units available, but ${prescription.quantity} units needed.`
          );
        } else if (inventory.stockQuantity - prescription.quantity <= inventory.reorderLevel) {
          setStockWarning(
            `⚠️ Dispensing will bring stock below reorder level (${inventory.reorderLevel}). Consider reordering.`
          );
        }
      }
    } catch (error) {
      console.error('Failed to check inventory:', error);
      setStockWarning('⚠️ Unable to verify inventory. Proceeding without stock check.');
    } finally {
      setStockCheckLoading(false);
    }
  };

  const onSubmit = async (data: DispenseFormData) => {
    if (!user) return;

    // Block dispensing if out of stock
    if (inventoryItem && inventoryItem.stockQuantity === 0) {
      toast.error('Cannot dispense - medication is out of stock');
      return;
    }

    // Warn but allow if insufficient (pharmacist may have received stock not yet logged)
    if (inventoryItem && inventoryItem.stockQuantity < prescription.quantity) {
      const confirmDispense = window.confirm(
        `Only ${inventoryItem.stockQuantity} units available. Do you want to dispense partial quantity?`
      );
      if (!confirmDispense) return;
    }

    setLoading(true);
    try {
      // 1. Update prescription status to Dispensed
      const updatedPrescription: Prescription = {
        ...prescription,
        status: 'Dispensed',
        dispensedAt: new Date().toISOString(),
        dispensedBy: user.id
      };

      await prescriptionApi.update(prescription.id, updatedPrescription);

      // 2. Deduct stock from inventory (if medication exists in inventory)
      if (inventoryItem) {
        const quantityToDeduct = Math.min(prescription.quantity, inventoryItem.stockQuantity);
        const newStockQuantity = inventoryItem.stockQuantity - quantityToDeduct;

        // Update inventory
        const updatedInventory: MedicationInventory = {
          ...inventoryItem,
          stockQuantity: newStockQuantity,
          updatedAt: new Date().toISOString()
        };

        await medicationInventoryApi.update(inventoryItem.id, updatedInventory);

        // 3. Create stock transaction record
        await stockTransactionApi.createTransaction({
          medicationId: inventoryItem.id,
          transactionType: 'Dispensed',
          quantityChange: -quantityToDeduct,
          quantityBefore: inventoryItem.stockQuantity,
          quantityAfter: newStockQuantity,
          prescriptionId: prescription.id,
          performedBy: user.id,
          performedByName: user.fullName,
          notes: data.notes || `Dispensed for prescription ${prescription.rxNumber}`
        });

        // Show low stock alert if needed
        if (newStockQuantity <= inventoryItem.reorderLevel && newStockQuantity > 0) {
          toast.warning(`Low stock alert: ${inventoryItem.medicationName} now at ${newStockQuantity} units`);
        } else if (newStockQuantity === 0) {
          toast.error(`${inventoryItem.medicationName} is now OUT OF STOCK`);
        }
      }

      toast.success('Prescription dispensed successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to dispense prescription:', error);
      toast.error('Failed to dispense prescription');
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
            <h2 className="text-xl font-bold text-slate-900">Dispense Prescription</h2>
            <p className="text-sm text-slate-600 mt-1">Rx# {prescription.rxNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Inventory Status Banner */}
        {stockCheckLoading ? (
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm text-slate-600">Checking inventory...</p>
          </div>
        ) : stockWarning ? (
          <div className={`p-4 border-b ${
            stockWarning.includes('OUT OF STOCK') || stockWarning.includes('Insufficient')
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className={
                stockWarning.includes('OUT OF STOCK') || stockWarning.includes('Insufficient')
                  ? 'text-red-600 mt-0.5'
                  : 'text-amber-600 mt-0.5'
              } />
              <p className={`text-sm ${
                stockWarning.includes('OUT OF STOCK') || stockWarning.includes('Insufficient')
                  ? 'text-red-700'
                  : 'text-amber-700'
              }`}>
                {stockWarning}
              </p>
            </div>
          </div>
        ) : inventoryItem ? (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-green-600" />
                <p className="text-sm text-green-700">
                  Stock available: <span className="font-semibold">{inventoryItem.stockQuantity} units</span>
                </p>
              </div>
              <p className="text-xs text-green-600">
                After dispensing: {inventoryItem.stockQuantity - prescription.quantity} units
              </p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Prescription Details */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
            <div>
              <p className="text-xs text-slate-500">Medication</p>
              <p className="font-semibold text-slate-900">{prescription.medicationName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Dosage</p>
                <p className="text-sm text-slate-900">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Frequency</p>
                <p className="text-sm text-slate-900">{prescription.frequency}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Quantity</p>
                <p className="text-sm text-slate-900">{prescription.quantity} units</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Refills</p>
                <p className="text-sm text-slate-900">{prescription.refills}</p>
              </div>
            </div>
            {prescription.instructions && (
              <div>
                <p className="text-xs text-slate-500">Instructions</p>
                <p className="text-sm text-slate-900">{prescription.instructions}</p>
              </div>
            )}
          </div>

          {/* Verification Checklist */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Verification Checklist</h3>
            
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                {...register('verifyPatient')}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Patient Identification</p>
                <p className="text-sm text-slate-600">Verified patient name and date of birth</p>
              </div>
              {watch('verifyPatient') && <CheckCircle2 size={20} className="text-green-600 mt-1" />}
            </label>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                {...register('verifyMedication')}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Medication Match</p>
                <p className="text-sm text-slate-600">Confirmed correct medication and strength</p>
              </div>
              {watch('verifyMedication') && <CheckCircle2 size={20} className="text-green-600 mt-1" />}
            </label>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                {...register('verifyDosage')}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Dosage Verification</p>
                <p className="text-sm text-slate-600">Verified dosage and quantity are correct</p>
              </div>
              {watch('verifyDosage') && <CheckCircle2 size={20} className="text-green-600 mt-1" />}
            </label>

            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                {...register('verifyInstructions')}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">Patient Counseling</p>
                <p className="text-sm text-slate-600">Provided instructions and answered questions</p>
              </div>
              {watch('verifyInstructions') && <CheckCircle2 size={20} className="text-green-600 mt-1" />}
            </label>

            {Object.keys(errors).length > 0 && (
              <p className="text-sm text-red-600">Please complete all verification steps</p>
            )}
          </div>

          {/* Dispenser Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">
              Dispensed by: <span className="font-semibold">{user?.fullName}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {new Date().toLocaleString()}
            </p>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dispensing Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about the dispensing..."
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
              disabled={loading || !isAllVerified || (inventoryItem?.stockQuantity === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Dispensing...' : 'Confirm & Dispense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};