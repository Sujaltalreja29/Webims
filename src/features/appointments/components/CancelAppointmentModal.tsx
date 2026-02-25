import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { AlertCircle } from 'lucide-react';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointmentInfo: {
    patientName: string;
    date: string;
    time: string;
  };
  isLoading?: boolean;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointmentInfo,
  isLoading = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const predefinedReasons = [
    'Patient requested cancellation',
    'Provider unavailable',
    'Emergency/urgent matter',
    'Patient illness',
    'Weather conditions',
    'Facility closure',
    'Insurance issues',
    'Other'
  ];

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  const isValid = selectedReason && (selectedReason !== 'Other' || customReason.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Appointment" size="md">
      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-yellow-900">
              You are about to cancel this appointment
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              This action cannot be undone. The time slot will become available for other patients.
            </p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Appointment Details:</h4>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Patient:</strong> {appointmentInfo.patientName}</p>
            <p><strong>Date:</strong> {appointmentInfo.date}</p>
            <p><strong>Time:</strong> {appointmentInfo.time}</p>
          </div>
        </div>

        {/* Cancellation Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason for Cancellation <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {predefinedReasons.map((reason) => (
              <label
                key={reason}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedReason === reason
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancellation-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mr-3"
                />
                <span className="text-sm text-slate-700">{reason}</span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Other' && (
            <div className="mt-3">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Appointment
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            isLoading={isLoading}
          >
            Cancel Appointment
          </Button>
        </div>
      </div>
    </Modal>
  );
};