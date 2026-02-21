import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encounterApi, patientApi } from '../../../core/services/api';
import { Encounter } from '../../../core/models';
import { 
  FileText, Plus, Search, Calendar, User, 
  Stethoscope, Activity, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const ClinicalNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEncounters();
  }, []);

  const loadEncounters = async () => {
    try {
      const data = await encounterApi.getAll();
      
      const withPatients = await Promise.all(
        data.map(async (encounter) => {
          const patient = await patientApi.getById(encounter.patientId);
          return { ...encounter, patient };
        })
      );

      // Sort by visit date descending
      withPatients.sort((a, b) => 
        new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );

      setEncounters(withPatients);
    } catch (error) {
      toast.error('Failed to load clinical notes');
    } finally {
      setLoading(false);
    }
  };

  const filteredEncounters = encounters.filter(enc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      enc.patient?.firstName.toLowerCase().includes(term) ||
      enc.patient?.lastName.toLowerCase().includes(term) ||
      enc.encounterNumber.toLowerCase().includes(term) ||
      enc.chiefComplaint.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Clinical Documentation</h1>
          <p className="text-slate-600 mt-1">Patient encounters and clinical notes</p>
        </div>
        <button
          onClick={() => navigate('/clinical/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>New Encounter</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Encounters</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{encounters.length}</p>
            </div>
            <FileText className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">This Week</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {encounters.filter(e => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(e.visitDate) > weekAgo;
                }).length}
              </p>
            </div>
            <Calendar className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {encounters.filter(e => 
                  format(new Date(e.visitDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </p>
            </div>
            <Stethoscope className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Unique Patients</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {new Set(encounters.map(e => e.patientId)).size}
              </p>
            </div>
            <User className="text-amber-600" size={24} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, encounter number, or chief complaint..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Encounters List */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEncounters.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500">No clinical encounters found</p>
            <button
              onClick={() => navigate('/clinical/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Encounter
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredEncounters.map((encounter) => (
              <div
                key={encounter.id}
                onClick={() => navigate(`/clinical/${encounter.id}`)}
                className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {encounter.patient?.firstName[0]}{encounter.patient?.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {encounter.patient?.firstName} {encounter.patient?.lastName}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-slate-500">
                          <span className="font-mono">{encounter.encounterNumber}</span>
                          <span>•</span>
                          <span>{format(new Date(encounter.visitDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chief Complaint */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Chief Complaint:</p>
                      <p className="text-slate-700">{encounter.chiefComplaint}</p>
                    </div>

                    {/* Vitals */}
                    {encounter.vitals && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        {encounter.vitals.bloodPressure && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-600">BP</p>
                            <p className="font-semibold text-slate-800">{encounter.vitals.bloodPressure}</p>
                          </div>
                        )}
                        {encounter.vitals.pulse && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-600">Pulse</p>
                            <p className="font-semibold text-slate-800">{encounter.vitals.pulse} bpm</p>
                          </div>
                        )}
                        {encounter.vitals.temperature && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-600">Temp</p>
                            <p className="font-semibold text-slate-800">{encounter.vitals.temperature}°F</p>
                          </div>
                        )}
                        {encounter.vitals.weight && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-600">Weight</p>
                            <p className="font-semibold text-slate-800">{encounter.vitals.weight} kg</p>
                          </div>
                        )}
                        {encounter.vitals.height && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-600">Height</p>
                            <p className="font-semibold text-slate-800">{encounter.vitals.height} cm</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Diagnoses */}
                    {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Diagnoses:</p>
                        <div className="flex flex-wrap gap-2">
                          {encounter.diagnoses.map((diagnosis: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              <Activity size={14} className="mr-1" />
                              {diagnosis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assessment Preview */}
                    {encounter.assessment && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Assessment:</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{encounter.assessment}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      View Full Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};