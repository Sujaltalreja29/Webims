import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, XCircle } from 'lucide-react';
import { refillRequestApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import type { RefillRequest } from '../../../core/models';
import { toast } from 'sonner';

interface DenyRefillModalProps {
  request: RefillRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const denySchema = z.object({
  denialReason: z.string().min(5, 'Denial reason must be at least 5 characters')
});

type DenyFormData = z.infer<typeof denySchema>;

export const DenyRefillModal = ({ request, onClose, onSuccess }: DenyRefillModalProps) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DenyFormData>({
    resolver: zodResolver(denySchema)
  });

  const onSubmit = async (data: DenyFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      await refillRequestApi.deny(request.id, user.id, user.fullName, data.denialReason);

      toast.success('Refill request denied');
      onSuccess();
    } catch (error) {
      console.error('Failed to deny refill:', error);
      toast.error('Failed to deny refill');
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
            <h2 className="text-xl font-bold text-slate-900">Deny Refill Request</h2>
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
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              You are about to deny this refill request. Please provide a clear clinical reason. The patient may need to schedule an appointment.
            </p>
          </div>

          {/* Denial Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Clinical Reason for Denial *
            </label>
            <textarea
              {...register('denialReason')}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Patient requires in-person evaluation, Medication needs adjustment, Lab work needed before refill..."
            />
            {errors.denialReason && (
              <p className="text-sm text-red-600 mt-1">{errors.denialReason.message}</p>
            )}
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
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={18} className="mr-2" />
              {loading ? 'Denying...' : 'Deny Refill Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};