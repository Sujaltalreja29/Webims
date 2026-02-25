import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { COMMON_MEDICATIONS } from '../../../core/constants/medical-codes';
import { Pill } from 'lucide-react';

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  patientName: string;
  isLoading?: boolean;
}

export const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    medicationName: '',
    customMedication: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    refills: '0',
    instructions: ''
  });

  const [useCustom, setUseCustom] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medication = useCustom ? formData.customMedication : formData.medicationName;
    onSubmit({
      ...formData,
      medicationName: medication
    });
  };

  const frequencyOptions = [
    { value: 'Once daily', label: 'Once daily' },
    { value: 'Twice daily', label: 'Twice daily' },
    { value: 'Three times daily', label: 'Three times daily' },
    { value: 'Four times daily', label: 'Four times daily' },
    { value: 'Every 4 hours', label: 'Every 4 hours' },
    { value: 'Every 6 hours', label: 'Every 6 hours' },
    { value: 'Every 8 hours', label: 'Every 8 hours' },
    { value: 'Every 12 hours', label: 'Every 12 hours' },
    { value: 'As needed', label: 'As needed' },
    { value: 'Before meals', label: 'Before meals' },
    { value: 'After meals', label: 'After meals' },
    { value: 'At bedtime', label: 'At bedtime' }
  ];

  const durationOptions = [
    { value: '3 days', label: '3 days' },
    { value: '5 days', label: '5 days' },
    { value: '7 days', label: '7 days' },
    { value: '10 days', label: '10 days' },
    { value: '14 days', label: '14 days' },
    { value: '30 days', label: '30 days' },
    { value: '60 days', label: '60 days' },
    { value: '90 days', label: '90 days' },
    { value: 'Ongoing', label: 'Ongoing' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Prescription" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Pill className="text-blue-600" size={20} />
            <div>
              <p className="text-sm font-medium text-blue-900">Prescribing for:</p>
              <p className="text-lg font-semibold text-blue-800">{patientName}</p>
            </div>
          </div>
        </div>

        {/* Medication Selection */}
        <div>
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-slate-700">Common Medications</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-slate-700">Custom Medication</span>
            </label>
          </div>

          {!useCustom ? (
            <Select
              label="Medication"
              value={formData.medicationName}
              onChange={(e) => handleChange('medicationName', e.target.value)}
              options={COMMON_MEDICATIONS.map(med => ({ value: med, label: med }))}
              required
            />
          ) : (
            <Input
              label="Medication Name"
              value={formData.customMedication}
              onChange={(e) => handleChange('customMedication', e.target.value)}
              placeholder="Enter medication name"
              required
            />
          )}
        </div>

        {/* Dosage & Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Dosage"
            value={formData.dosage}
            onChange={(e) => handleChange('dosage', e.target.value)}
            placeholder="e.g., 500mg, 10ml, 1 tablet"
            required
          />

          <Select
            label="Frequency"
            value={formData.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            options={frequencyOptions}
            required
          />
        </div>

        {/* Duration & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Duration"
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            options={durationOptions}
            required
          />

          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="e.g., 30"
            required
          />
        </div>

        {/* Refills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Refills"
            value={formData.refills}
            onChange={(e) => handleChange('refills', e.target.value)}
            options={[
              { value: '0', label: 'No refills' },
              { value: '1', label: '1 refill' },
              { value: '2', label: '2 refills' },
              { value: '3', label: '3 refills' },
              { value: '4', label: '4 refills' },
              { value: '5', label: '5 refills' },
              { value: '6', label: '6 refills' }
            ]}
          />
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Special Instructions
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            placeholder="e.g., Take with food, Avoid alcohol, etc."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> This prescription will be sent to the pharmacy for dispensing. 
            The patient can pick it up once ready.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Create Prescription
          </Button>
        </div>
      </form>
    </Modal>
  );
};