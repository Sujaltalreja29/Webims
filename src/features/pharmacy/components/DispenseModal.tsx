import React, { useState } from 'react';
import { prescriptionApi } from '../../../core/services/api';
import { Prescription, Patient } from '../../../core/models';
import { useAuthStore } from '../../../store/authStore';
import { CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DispenseModalProps {
  prescription: Prescription;
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  prescription,
  patient,
  onClose,
  onSuccess
}) => {
  const currentUser = useAuthStore(state => state.user);
  const [checklist, setChecklist] = useState({
    patientIdVerified: false,
    medicationConfirmed: false,
    counselingProvided: false,
    sideEffectsDiscussed: false
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = Object.values(checklist).every(Boolean);

  const handleDispense = async () => {
    if (!allChecked) {
      toast.error('Please complete all verification steps');
      return;
    }

    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      await prescriptionApi.dispense(
        prescription.id,
        currentUser.id,
        currentUser.fullName,
        notes || undefined
      );
      toast.success('Prescription dispensed successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to dispense prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dispense Prescription</h2>
            <p className="text-slate-600 mt-1">Complete verification before dispensing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 font-medium">Patient</p>
                <p className="font-semibold text-slate-800 text-lg">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-slate-500 text-xs mt-1">{patient.mrn}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Rx Number</p>
                <p className="font-semibold text-slate-800 font-mono">{prescription.rxNumber}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Medication</p>
                <p className="font-semibold text-slate-800">{prescription.medicationName}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Dosage</p>
                <p className="font-semibold text-slate-800">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Quantity</p>
                <p className="font-semibold text-slate-800">{prescription.quantity}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Refills</p>
                <p className="font-semibold text-slate-800">{prescription.refills}</p>
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
              <CheckCircle className="mr-2 text-purple-600" size={20} />
              Verification Checklist
            </h3>
            <div className="space-y-3">
              {[
                { key: 'patientIdVerified', label: '✓ Patient ID verified' },
                { key: 'medicationConfirmed', label: '✓ Medication details confirmed' },
                { key: 'counselingProvided', label: '✓ Patient counseled on proper usage' },
                { key: 'sideEffectsDiscussed', label: '✓ Potential side effects discussed' }
              ].map(({ key, label }) => (
                <label 
                  key={key} 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checklist[key as keyof typeof checklist]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dispensing Info */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <p className="text-sm text-slate-600 mb-1 font-medium">Dispensed By</p>
              <p className="font-semibold text-slate-800">{currentUser?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1 font-medium">Date & Time</p>
              <p className="font-semibold text-slate-800">
                {format(new Date(), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or observations..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end space-x-3 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDispense}
            disabled={!allChecked || isSubmitting}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Dispensing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Complete Dispensing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};