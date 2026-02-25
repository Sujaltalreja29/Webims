import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Select } from '../../../shared/components/ui/Select';
import { TestTube } from 'lucide-react';

interface OrderLabTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  patientName: string;
  isLoading?: boolean;
}

export const OrderLabTestModal: React.FC<OrderLabTestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    testType: '',
    testName: '',
    priority: 'Routine',
    notes: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const testTypeOptions = [
    { value: 'Blood Test', label: 'Blood Test' },
    { value: 'Urinalysis', label: 'Urinalysis' },
    { value: 'X-Ray', label: 'X-Ray' },
    { value: 'ECG', label: 'ECG (Electrocardiogram)' },
    { value: 'MRI', label: 'MRI' },
    { value: 'CT Scan', label: 'CT Scan' },
    { value: 'Ultrasound', label: 'Ultrasound' },
    { value: 'Other', label: 'Other' }
  ];

  const bloodTestOptions = [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel (BMP)',
    'Comprehensive Metabolic Panel (CMP)',
    'Lipid Panel',
    'Liver Function Test (LFT)',
    'Thyroid Function Test (TSH, T3, T4)',
    'Hemoglobin A1C',
    'Vitamin D',
    'Vitamin B12',
    'Iron Studies'
  ];

  const urinalysisOptions = [
    'Routine Urinalysis',
    'Urine Culture',
    'Urine Drug Screen',
    '24-hour Urine Collection'
  ];

  const imagingOptions = [
    'Chest X-Ray',
    'Abdominal X-Ray',
    'Bone X-Ray',
    'Joint X-Ray'
  ];

  const getTestNameOptions = () => {
    switch (formData.testType) {
      case 'Blood Test':
        return bloodTestOptions;
      case 'Urinalysis':
        return urinalysisOptions;
      case 'X-Ray':
        return imagingOptions;
      default:
        return [];
    }
  };

  const testNameOptions = getTestNameOptions();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Lab Test" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TestTube className="text-green-600" size={20} />
            <div>
              <p className="text-sm font-medium text-green-900">Ordering test for:</p>
              <p className="text-lg font-semibold text-green-800">{patientName}</p>
            </div>
          </div>
        </div>

        {/* Test Type */}
        <Select
          label="Test Type"
          value={formData.testType}
          onChange={(e) => {
            handleChange('testType', e.target.value);
            handleChange('testName', ''); // Reset test name when type changes
          }}
          options={testTypeOptions}
          required
        />

        {/* Test Name */}
        {formData.testType && (
          <>
            {testNameOptions.length > 0 ? (
              <Select
                label="Specific Test"
                value={formData.testName}
                onChange={(e) => handleChange('testName', e.target.value)}
                options={testNameOptions.map(test => ({ value: test, label: test }))}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.testName}
                  onChange={(e) => handleChange('testName', e.target.value)}
                  placeholder="Enter test name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Priority */}
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={[
            { value: 'Routine', label: 'Routine' },
            { value: 'Urgent', label: 'Urgent' },
            { value: 'STAT', label: 'STAT (Immediate)' }
          ]}
        />

        {/* Clinical Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Clinical Indication / Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Reason for test, clinical indication, or special instructions..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Lab orders will be marked as "Ordered" and can be updated 
            with results once completed by the laboratory.
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
            Order Test
          </Button>
        </div>
      </form>
    </Modal>
  );
};