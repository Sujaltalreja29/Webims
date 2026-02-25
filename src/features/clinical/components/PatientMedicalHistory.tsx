import React, { useEffect, useState } from 'react';
import { encounterApi, prescriptionApi, labResultApi } from '../../../core/services/api';
import { Activity, Pill, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PatientMedicalHistoryProps {
  patientId: string;
  currentEncounterId?: string;
}

export const PatientMedicalHistory: React.FC<PatientMedicalHistoryProps> = ({
  patientId,
  currentEncounterId
}) => {
  const [pastEncounters, setPastEncounters] = useState<any[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);
  const [recentLabs, setRecentLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicalHistory();
  }, [patientId]);

  const loadMedicalHistory = async () => {
    try {
      const [encounters, prescriptions, labs] = await Promise.all([
        encounterApi.getByPatient(patientId),
        prescriptionApi.getByPatient(patientId),
        labResultApi.getByPatient(patientId)
      ]);

      // Filter out current encounter and get last 5
      const past = encounters
        .filter(e => e.id !== currentEncounterId)
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        .slice(0, 5);

      // Get active prescriptions
      const active = prescriptions.filter(p => 
        p.status !== 'Cancelled' && p.status !== 'Dispensed'
      );

      // Get recent completed labs
      const completed = labs
        .filter(l => l.status === 'Completed')
        .sort((a, b) => new Date(b.completedDate || b.orderedDate).getTime() - new Date(a.completedDate || a.orderedDate).getTime())
        .slice(0, 5);

      setPastEncounters(past);
      setActivePrescriptions(active);
      setRecentLabs(completed);
    } catch (error) {
      console.error('Failed to load medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Past Encounters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <Activity className="mr-2 text-blue-600" size={18} />
            Past Visits ({pastEncounters.length})
          </h3>
        </div>
        
        {pastEncounters.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No previous encounters</p>
        ) : (
          <div className="space-y-2">
            {pastEncounters.map((encounter) => (
              <div key={encounter.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {format(new Date(encounter.visitDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {encounter.chiefComplaint}
                    </p>
                    {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {encounter.diagnoses.slice(0, 2).map((dx: string, i: number) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {dx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <Pill className="mr-2 text-purple-600" size={18} />
            Active Medications ({activePrescriptions.length})
          </h3>
        </div>
        
        {activePrescriptions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No active prescriptions</p>
        ) : (
          <div className="space-y-2">
            {activePrescriptions.map((rx) => (
              <div key={rx.id} className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-slate-800">{rx.medicationName}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {rx.dosage} • {rx.frequency}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    {rx.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    Refills: {rx.refills}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Lab Results */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center">
            <FileText className="mr-2 text-green-600" size={18} />
            Recent Labs ({recentLabs.length})
          </h3>
        </div>
        
        {recentLabs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No lab results</p>
        ) : (
          <div className="space-y-2">
            {recentLabs.map((lab) => (
              <div key={lab.id} className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{lab.testName}</p>
                    <p className="text-xs text-slate-600 mt-1">{lab.testType}</p>
                    {lab.isAbnormal && (
                      <div className="flex items-center mt-2">
                        <AlertCircle className="text-red-600 mr-1" size={14} />
                        <span className="text-xs text-red-600 font-medium">Abnormal</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(lab.completedDate || lab.orderedDate), 'MMM dd')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};