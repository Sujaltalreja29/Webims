import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { medicationInventoryApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import type { MedicationInventory } from '../../../core/models';
import { toast } from 'sonner';

const medicationSchema = z.object({
  medicationName: z.string().min(2, 'Medication name is required'),
  genericName: z.string().optional(),
  dosageForm: z.enum(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Patch']),
  strength: z.string().min(1, 'Strength is required'),
  manufacturer: z.string().min(2, 'Manufacturer is required'),
  ndc: z.string().min(10, 'Valid NDC is required'),
  stockQuantity: z.number().min(0, 'Stock quantity cannot be negative'),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative'),
  reorderQuantity: z.number().min(1, 'Reorder quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  location: z.string().min(1, 'Storage location is required'),
  isControlled: z.boolean()
});

type MedicationFormData = z.infer<typeof medicationSchema>;

export const AddEditMedicationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [existingMedication, setExistingMedication] = useState<MedicationInventory | null>(null);

  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medicationName: '',
      genericName: '',
      dosageForm: 'Tablet',
      strength: '',
      manufacturer: '',
      ndc: '',
      stockQuantity: 0,
      reorderLevel: 50,
      reorderQuantity: 200,
      unitPrice: 0,
      expiryDate: '',
      lotNumber: '',
      location: '',
      isControlled: false
    }
  });

  const isControlled = watch('isControlled');

  useEffect(() => {
    if (isEditMode && id) {
      loadMedication();
    }
  }, [id, isEditMode]);

  const loadMedication = async () => {
    if (!id) return;
    
    try {
      const medication = await medicationInventoryApi.getById(id);
      if (medication) {
        setExistingMedication(medication);
        reset({
          medicationName: medication.medicationName,
          genericName: medication.genericName || '',
          dosageForm: medication.dosageForm,
          strength: medication.strength,
          manufacturer: medication.manufacturer,
          ndc: medication.ndc,
          stockQuantity: medication.stockQuantity,
          reorderLevel: medication.reorderLevel,
          reorderQuantity: medication.reorderQuantity,
          unitPrice: medication.unitPrice,
          expiryDate: medication.expiryDate,
          lotNumber: medication.lotNumber,
          location: medication.location,
          isControlled: medication.isControlled
        });
      }
    } catch (error) {
      console.error('Failed to load medication:', error);
      toast.error('Failed to load medication');
      navigate('/pharmacy/inventory');
    }
  };

  const onSubmit = async (data: MedicationFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      if (isEditMode && existingMedication) {
        // Update existing medication
        const updated: MedicationInventory = {
          ...existingMedication,
          ...data,
          updatedAt: new Date().toISOString()
        };
        await medicationInventoryApi.update(existingMedication.id, updated);
        toast.success('Medication updated successfully');
      } else {
        // Create new medication
        const allMedications = await medicationInventoryApi.getAll();
        const nextId = allMedications.length + 1;
        
        const newMedication: MedicationInventory = {
          id: `med-${nextId}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await medicationInventoryApi.create(newMedication);
        toast.success('Medication added successfully');
      }
      navigate('/pharmacy/inventory');
    } catch (error) {
      console.error('Failed to save medication:', error);
      toast.error('Failed to save medication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pharmacy/inventory')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Edit Medication' : 'Add New Medication'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isEditMode 
              ? 'Update medication details and inventory information'
              : 'Add a new medication to the inventory'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Medication Information */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            Medication Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                {...register('medicationName')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Amoxicillin"
              />
              {errors.medicationName && (
                <p className="text-sm text-red-600 mt-1">{errors.medicationName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Generic Name
              </label>
              <input
                type="text"
                {...register('genericName')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Amoxicillin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dosage Form *
              </label>
              <select
                {...register('dosageForm')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Drops">Drops</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Patch">Patch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Strength *
              </label>
              <input
                type="text"
                {...register('strength')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 500mg, 10mg/5ml"
              />
              {errors.strength && (
                <p className="text-sm text-red-600 mt-1">{errors.strength.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Pfizer"
              />
              {errors.manufacturer && (
                <p className="text-sm text-red-600 mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                NDC (National Drug Code) *
              </label>
              <input
                type="text"
                {...register('ndc')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 00093-4150-73"
              />
              {errors.ndc && (
                <p className="text-sm text-red-600 mt-1">{errors.ndc.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Details */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Inventory Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Stock Quantity *
              </label>
              <input
                type="number"
                {...register('stockQuantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
              {errors.stockQuantity && (
                <p className="text-sm text-red-600 mt-1">{errors.stockQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reorder Level *
              </label>
              <input
                type="number"
                {...register('reorderLevel', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Alert when stock reaches this level</p>
              {errors.reorderLevel && (
                <p className="text-sm text-red-600 mt-1">{errors.reorderLevel.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reorder Quantity *
              </label>
              <input
                type="number"
                {...register('reorderQuantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="200"
                min="1"
              />
              <p className="text-xs text-slate-500 mt-1">Suggested order amount</p>
              {errors.reorderQuantity && (
                <p className="text-sm text-red-600 mt-1">{errors.reorderQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
              />
              {errors.unitPrice && (
                <p className="text-sm text-red-600 mt-1">{errors.unitPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                {...register('expiryDate')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-600 mt-1">{errors.expiryDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lot Number *
              </label>
              <input
                type="text"
                {...register('lotNumber')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., LOT2024-A1"
              />
              {errors.lotNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.lotNumber.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Storage Location *
              </label>
              <input
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Shelf A-3, Refrigerator 1, Locked Cabinet 1"
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isControlled')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Controlled Substance
                </span>
              </label>
            </div>
          </div>

          {isControlled && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                ⚠️ This medication is marked as a controlled substance. Additional tracking and logging will be applied.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/pharmacy/inventory')}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Saving...' : isEditMode ? 'Update Medication' : 'Add Medication'}
          </button>
        </div>
      </form>
    </div>
  );
};