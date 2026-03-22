import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { billingApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Claim, PaymentInfo } from '../../../core/models';
import { X, DollarSign, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Schema ─────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['Cash', 'Check', 'Credit Card', 'Insurance', 'Other'] as const;

const schema = z.object({
  amountPaid: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  paidDate: z.string().min(1, 'Payment date is required'),
  method: z.enum(PAYMENT_METHODS, {
    message: 'Payment method is required'
  }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

type FormData = z.infer<typeof schema>;

// ─── Props ───────────────────────────────────────────────────────────────────
interface RecordPaymentModalProps {
  claim: Claim;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  claim,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amountPaid: claim.totalAmount,
      paidDate: new Date().toISOString().split('T')[0],
      method: 'Insurance',
      referenceNumber: '',
      notes: ''
    }
  });

  const watchedAmount = watch('amountPaid');
  const isPartialPayment = watchedAmount > 0 && watchedAmount < claim.totalAmount;
  const isOverpayment   = watchedAmount > claim.totalAmount;

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const payment: PaymentInfo = {
        amountPaid: data.amountPaid,
        paidDate: data.paidDate,
        method: data.method,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined
      };

      await billingApi.recordPayment(claim.id, payment, user.id);
      toast.success(`Payment of
$$
{data.amountPaid.toFixed(2)} recorded successfully`);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const methodIcons: Record<string, React.ReactNode> = {
    'Cash': '💵',
    'Check': '📄',
    'Credit Card': '💳',
    'Insurance': '🏥',
    'Other': '💰'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
              <p className="text-sm text-slate-500">{claim.claimNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* ── Claim Summary ── */}
        <div className="mx-6 mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Claim Total</span>
            <span className="text-lg font-bold text-slate-800">
              ${claim.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-slate-600">Insurance</span>
            <span className="text-sm text-slate-700">{claim.insuranceType}</span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amountPaid', { valueAsNumber: true })}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {/* Warnings */}
            {isPartialPayment && (
              <p className="mt-1 text-xs text-amber-600 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Partial payment — ${(claim.totalAmount - watchedAmount).toFixed(2)} remaining
              </p>
            )}
            {isOverpayment && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Amount exceeds claim total by ${(watchedAmount - claim.totalAmount).toFixed(2)}
              </p>
            )}
            {watchedAmount === claim.totalAmount && watchedAmount > 0 && (
              <p className="mt-1 text-xs text-green-600 flex items-center">
                <CheckCircle size={12} className="mr-1" />
                Full payment
              </p>
            )}
            {errors.amountPaid && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.amountPaid.message}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('paidDate')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.paidDate && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.paidDate.message}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(method => (
                <label
                  key={method}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    value={method}
                    {...register('method')}
                    className="peer sr-only"
                  />
                  <div className="border border-slate-200 rounded-lg p-2.5 text-center text-xs hover:border-green-300 transition-colors peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 font-medium">
                    <div className="text-lg mb-0.5">{methodIcons[method]}</div>
                    {method}
                  </div>
                </label>
              ))}
            </div>
            {errors.method && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.method.message}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reference Number{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              {...register('referenceNumber')}
              placeholder="Check #, transaction ID, etc."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverpayment}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};