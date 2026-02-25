import React from 'react';
import { Prescription } from '../../../core/models';
import { Pill, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PrescriptionsListProps {
  prescriptions: Prescription[];
}

export const PrescriptionsList: React.FC<PrescriptionsListProps> = ({ prescriptions }) => {
  const getStatusColor = (status: string) => {
    const colors: any = {
      'Pending': 'bg-gray-100 text-gray-700',
      'Sent to Pharmacy': 'bg-blue-100 text-blue-700',
      'Ready': 'bg-yellow-100 text-yellow-700',
      'Dispensed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <Pill className="mx-auto text-slate-300 mb-2" size={40} />
        <p className="text-slate-500 text-sm">No prescriptions for this encounter</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((rx) => (
        <div key={rx.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 flex items-center">
                <Pill className="mr-2 text-purple-600" size={18} />
                {rx.medicationName}
              </h4>
              <p className="text-sm text-slate-600 mt-1">Rx #{rx.rxNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}>
              {rx.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Dosage</p>
              <p className="text-slate-800 font-medium">{rx.dosage}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Frequency</p>
              <p className="text-slate-800 font-medium">{rx.frequency}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Duration</p>
              <p className="text-slate-800 font-medium">{rx.duration}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Quantity</p>
              <p className="text-slate-800 font-medium">{rx.quantity} • {rx.refills} refills</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center">
              <Calendar size={14} className="mr-1" />
              Prescribed: {format(new Date(rx.createdAt), 'MMM dd, yyyy')}
            </span>
            {rx.dispensedAt && (
              <span>Dispensed: {format(new Date(rx.dispensedAt), 'MMM dd, yyyy')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};