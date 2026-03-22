import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle } from 'lucide-react';
import { refillRequestApi, prescriptionApi } from '../../../core/services/api';
import { clinicalSafetyService } from '../../../core/services/clinical-safety.service';
import { useAuthStore } from '../../../store/authStore';
import type { RefillRequest, Prescription } from '../../../core/models';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApproveRefillModalProps {
  request: RefillRequest;
  prescription: Prescription;
  onClose: () => void;
  onSuccess: () => void;
}

const approveSchema = z.object({
  notes: z.string().optional()
});

type ApproveFormData = z.infer<typeof approveSchema>;

export const ApproveRefillModal = ({ request, prescription, onClose, onSuccess }: ApproveRefillModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit
  } = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema)
  });

  const eligibility = clinicalSafetyService.validateRefillEligibility(prescription);

  const onSubmit = async (data: ApproveFormData) => {
    if (!user) return;

    if (!eligibility.eligible) {
      toast.error(eligibility.reason || 'This refill request is not eligible for approval.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create new prescription (refill)
      const allPrescriptions = await prescriptionApi.getAll();
      const nextId = allPrescriptions.length + 1;
      const nextRxNumber = `RX${Date.now()}`;

      const newPrescription: Prescription = {
        id: `rx-${nextId}`,
        rxNumber: nextRxNumber,
        patientId: prescription.patientId,
        providerId: user.id, // Current doctor
        encounterId: prescription.encounterId,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        quantity: prescription.quantity,
        refills: prescription.refills > 0 ? prescription.refills - 1 : 0, // Reduce refills by 1
        instructions: prescription.instructions,
        status: 'Sent to Pharmacy',
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      await prescriptionApi.create(newPrescription);

      // 2. Update refill request status to Approved
      await refillRequestApi.approve(request.id, user.id, user.fullName, newPrescription.id);

      // 3. Update original prescription refill count
      const updatedOriginal: Prescription = {
        ...prescription,
        refills: prescription.refills > 0 ? prescription.refills - 1 : 0
      };
      await prescriptionApi.update(prescription.id, updatedOriginal);

      toast.success('Refill approved - New prescription sent to pharmacy');
      onSuccess();
    } catch (error) {
      console.error('Failed to approve refill:', error);
      toast.error('Failed to approve refill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Approve Refill Request</h2>
            <p className="text-sm text-slate-600 mt-1">Request #{request.refillRequestNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Prescription Summary */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
            <h3 className="font-semibold text-green-900">New Prescription Details</h3>
            <div className="text-sm space-y-1 text-green-800">
              <p><span className="text-green-700">Medication:</span> <span className="font-medium">{prescription.medicationName}</span></p>
              <p><span className="text-green-700">Dosage:</span> {prescription.dosage}</p>
              <p><span className="text-green-700">Frequency:</span> {prescription.frequency}</p>
              <p><span className="text-green-700">Quantity:</span> {prescription.quantity}</p>
              <p><span className="text-green-700">Refills Remaining:</span> {prescription.refills > 0 ? prescription.refills - 1 : 0} (after this refill)</p>
            </div>
          </div>

          {prescription.refills <= 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                ⚠️ This is the last refill available. Patient will need a new prescription after this.
              </p>
            </div>
          )}

          {!eligibility.eligible && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">Refill not eligible</p>
              <p className="text-sm text-red-700 mt-1">{eligibility.reason}</p>
              {eligibility.nextEligibleDate && (
                <p className="text-xs text-red-600 mt-2">
                  Next eligible date: {format(new Date(eligibility.nextEligibleDate), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Clinical Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any clinical notes about this refill approval..."
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
              disabled={loading || !eligibility.eligible}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} className="mr-2" />
              {loading ? 'Approving...' : 'Approve & Send to Pharmacy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};