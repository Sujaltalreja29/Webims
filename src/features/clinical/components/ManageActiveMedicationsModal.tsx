import React, { useState, useEffect } from 'react';
import { prescriptionApi } from '../../../core/services/api';
import { Prescription } from '../../../core/models';
import { X, CheckCircle, XCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ManageActiveMedicationsModalProps {
  patientId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const ManageActiveMedicationsModal: React.FC<ManageActiveMedicationsModalProps> = ({
  patientId,
  onClose,
  onUpdate
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  const loadPrescriptions = async () => {
    try {
      const all = await prescriptionApi.getByPatient(patientId);
      // Show all non-cancelled prescriptions
      const active = all.filter(p => p.status !== 'Cancelled');
      setPrescriptions(active);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscontinue = async (rxId: string, medicationName: string) => {
    const confirm = window.confirm(
      `Are you sure you want to discontinue ${medicationName}?`
    );
    
    if (!confirm) return;

    try {
      await prescriptionApi.cancel(
        rxId,
        'Discontinued by provider',
        'user-doctor' // In real app, use current user
      );
      toast.success('Medication discontinued');
      loadPrescriptions();
      onUpdate();
    } catch (error) {
      toast.error('Failed to discontinue medication');
    }
  };

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
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Manage Active Medications</h2>
            <p className="text-slate-600 mt-1">Review and update patient's current medications</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No medications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="border-2 border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-800">
                          {rx.medicationName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          rx.status === 'Dispensed' 
                            ? 'bg-purple-100 text-purple-700' 
                            : rx.status === 'Ready'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rx.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-slate-600 font-medium">Dosage:</span>
                          <span className="ml-2 text-slate-800">{rx.dosage}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Frequency:</span>
                          <span className="ml-2 text-slate-800">{rx.frequency}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Duration:</span>
                          <span className="ml-2 text-slate-800">{rx.duration}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Refills Left:</span>
                          <span className="ml-2 text-slate-800">{rx.refills}</span>
                        </div>
                      </div>

                      {rx.instructions && (
                        <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded">
                          "{rx.instructions}"
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                        <span>Rx #{rx.rxNumber}</span>
                        {rx.dispensedAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Dispensed: {format(new Date(rx.dispensedAt), 'MMM dd, yyyy')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      {rx.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleDiscontinue(rx.id, rx.medicationName)}
                          className="px-3 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center space-x-2"
                        >
                          <XCircle size={16} />
                          <span>Discontinue</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};