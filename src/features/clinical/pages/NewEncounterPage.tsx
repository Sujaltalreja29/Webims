import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { encounterApi, patientApi, appointmentApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient, Encounter, Appointment } from '../../../core/models';
import { COMMON_DIAGNOSES } from '../../../core/constants/medical-codes';
import { ArrowLeft, Save, Search, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

export const NewEncounterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const user = useAuthStore((state) => state.user);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sourceAppointment, setSourceAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

  const [formData, setFormData] = useState({
    chiefComplaint: '',
    vitals: {
      bloodPressure: '',
      pulse: '',
      temperature: '',
      weight: '',
      height: ''
    },
    diagnoses: [] as string[],
    assessment: '',
    plan: '',
    followUpDate: '',
    followUpDuration: 30, // Default duration for follow-up
    followUpType: 'Follow-up' as Appointment['appointmentType']
  });

  useEffect(() => {
    loadPatients();
    if (appointmentId) {
      loadAppointmentData(appointmentId);
    }
  }, [appointmentId]);

  const loadPatients = async () => {
    const data = await patientApi.getActivePatients();
    setPatients(data);
  };

  const loadAppointmentData = async (apptId: string) => {
    setLoadingAppointment(true);
    try {
      const appointment = await appointmentApi.getById(apptId);
      if (appointment) {
        setSourceAppointment(appointment);
        
        // Load patient
        const patient = await patientApi.getById(appointment.patientId);
        if (patient) {
          setSelectedPatient(patient);
        }

        // Pre-fill chief complaint from appointment reason
        if (appointment.reason) {
          setFormData(prev => ({
            ...prev,
            chiefComplaint: appointment.reason || ''
          }));
        }

        toast.success('Appointment data loaded');
      }
    } catch (error) {
      toast.error('Failed to load appointment data');
      console.error(error);
    } finally {
      setLoadingAppointment(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term)
    );
  }).slice(0, 5);

  const handleDiagnosisToggle = (diagnosis: string) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.includes(diagnosis)
        ? prev.diagnoses.filter(d => d !== diagnosis)
        : [...prev.diagnoses, diagnosis]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !user) return;

    setIsLoading(true);
    try {
      // Create encounter
      const newEncounter: Encounter = {
        id: `enc-${Date.now()}`,
        encounterNumber: encounterApi.generateEncounterNumber(),
        patientId: selectedPatient.id,
        providerId: user.id,
        appointmentId: appointmentId || undefined,
        visitDate: new Date().toISOString(),
        chiefComplaint: formData.chiefComplaint,
        vitals: {
          bloodPressure: formData.vitals.bloodPressure || undefined,
          pulse: formData.vitals.pulse ? parseInt(formData.vitals.pulse) : undefined,
          temperature: formData.vitals.temperature ? parseFloat(formData.vitals.temperature) : undefined,
          weight: formData.vitals.weight ? parseFloat(formData.vitals.weight) : undefined,
          height: formData.vitals.height ? parseFloat(formData.vitals.height) : undefined
        },
        diagnoses: formData.diagnoses,
        assessment: formData.assessment,
        plan: formData.plan,
        followUpDate: formData.followUpDate || undefined,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      await encounterApi.create(newEncounter);

      // If follow-up date is set, create follow-up appointment
      if (formData.followUpDate) {
        await createFollowUpAppointment(newEncounter);
      }

      // If this encounter was from an appointment, mark it as completed
      if (appointmentId) {
        await appointmentApi.update(appointmentId, { status: 'Completed' });
      }

      toast.success(
        formData.followUpDate 
          ? 'Encounter saved and follow-up appointment scheduled!' 
          : 'Clinical encounter created successfully!'
      );
      
      // Navigate back to appropriate page
      if (appointmentId) {
        navigate('/appointments'); // Return to appointments if came from there
      } else {
        navigate('/clinical'); // Return to clinical notes if manual entry
      }
    } catch (error) {
      toast.error('Failed to create encounter');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFollowUpAppointment = async (encounter: Encounter) => {
    if (!formData.followUpDate || !user) return;

    try {
      const followUpAppointment: Appointment = {
        id: `appt-${Date.now()}-followup`,
        appointmentNumber: appointmentApi.generateAppointmentNumber(),
        patientId: encounter.patientId,
        providerId: encounter.providerId,
        appointmentType: formData.followUpType,
        date: formData.followUpDate,
        startTime: '09:00', // Default morning slot
        duration: formData.followUpDuration,
        status: 'Scheduled',
        reason: `Follow-up from ${format(new Date(), 'MMM dd, yyyy')} visit`,
        notes: `Auto-scheduled from encounter ${encounter.encounterNumber}`,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      await appointmentApi.create(followUpAppointment);
      
      toast.success(
        `Follow-up appointment scheduled for ${format(new Date(formData.followUpDate), 'MMM dd, yyyy')}`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Failed to create follow-up appointment:', error);
      toast.error('Encounter saved but follow-up appointment could not be created');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingAppointment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading appointment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(appointmentId ? '/appointments' : '/clinical')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {appointmentId ? 'Complete Visit Documentation' : 'New Clinical Encounter'}
          </h1>
          <p className="text-slate-600 mt-1">
            {appointmentId 
              ? 'Document patient visit and clinical findings' 
              : 'Create a new clinical encounter manually'}
          </p>
        </div>
      </div>

      {/* Source Indicator */}
      {sourceAppointment && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <Calendar className="text-blue-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-blue-900">Documenting Appointment</p>
              <p className="text-sm text-blue-800 mt-1">
                Appointment #{sourceAppointment.appointmentNumber} • {sourceAppointment.appointmentType} • 
                {format(new Date(sourceAppointment.date), 'MMM dd, yyyy')} at {sourceAppointment.startTime}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {appointmentId ? 'Patient Information' : 'Select Patient'}
          </h2>
          
          {!selectedPatient && !appointmentId ? (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or MRN..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {searchTerm && (
                <div className="mt-2 border border-slate-200 rounded-lg divide-y">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No patients found</div>
                  ) : (
                    filteredPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchTerm('');
                        }}
                        className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-slate-500">{patient.mrn}</p>
                        </div>
                        <span className="text-blue-600 text-sm">Select →</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : selectedPatient ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span>{selectedPatient.mrn}</span>
                    <span>•</span>
                    <span>{selectedPatient.gender}</span>
                    <span>•</span>
                    <span>{selectedPatient.insurance.type}</span>
                  </div>
                </div>
              </div>
              {!appointmentId && (
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              )}
            </div>
          ) : null}

          {/* Allergy Alerts */}
          {selectedPatient?.flags.hasAllergies && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-800">Allergy Alert</p>
                <p className="text-sm text-red-700 mt-1">
                  {selectedPatient.flags.allergyList || 'Patient has documented allergies'}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            {/* Chief Complaint */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Chief Complaint</h2>
              <textarea
                required
                value={formData.chiefComplaint}
                onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                placeholder="Enter patient's chief complaint..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vitals */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Vital Signs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    value={formData.vitals.bloodPressure}
                    onChange={(e) => setFormData({
                      ...formData,
                      vitals: { ...formData.vitals, bloodPressure: e.target.value }
                    })}
                    placeholder="120/80"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    value={formData.vitals.pulse}
                    onChange={(e) => setFormData({
                      ...formData,
                      vitals: { ...formData.vitals, pulse: e.target.value }
                    })}
                    placeholder="72"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals.temperature}
                    onChange={(e) => setFormData({
                      ...formData,
                      vitals: { ...formData.vitals, temperature: e.target.value }
                    })}
                    placeholder="98.6"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals.weight}
                    onChange={(e) => setFormData({
                      ...formData,
                      vitals: { ...formData.vitals, weight: e.target.value }
                    })}
                    placeholder="70"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      vitals: { ...formData.vitals, height: e.target.value }
                    })}
                    placeholder="170"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Diagnoses */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Diagnoses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMMON_DIAGNOSES.map((diagnosis) => (
                  <label
                    key={diagnosis}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.diagnoses.includes(diagnosis)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.diagnoses.includes(diagnosis)}
                      onChange={() => handleDiagnosisToggle(diagnosis)}
                      className="mr-3"
                    />
                    <span className="text-sm text-slate-700">{diagnosis}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assessment */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Assessment</h2>
              <textarea
                required
                value={formData.assessment}
                onChange={(e) => handleChange('assessment', e.target.value)}
                placeholder="Enter clinical assessment..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Plan */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Treatment Plan</h2>
              <textarea
                required
                value={formData.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
                placeholder="Enter treatment plan..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Follow-up */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Follow-up Appointment (Optional)
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                If a follow-up is needed, set a date and an appointment will be automatically scheduled with the same provider.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => handleChange('followUpDate', e.target.value)}
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.followUpDate && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Appointment will be auto-scheduled
                    </p>
                  )}
                </div>

                {formData.followUpDate && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Duration
                      </label>
                      <select
                        value={formData.followUpDuration}
                        onChange={(e) => handleChange('followUpDuration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Type
                      </label>
                      <select
                        value={formData.followUpType}
                        onChange={(e) => handleChange('followUpType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Follow-up">Follow-up</option>
                        <option value="New Patient">New Patient</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Telehealth">Telehealth</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(appointmentId ? '/appointments' : '/clinical')}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={18} />
                <span>
                  {isLoading 
                    ? 'Saving...' 
                    : formData.followUpDate 
                      ? 'Save & Schedule Follow-up' 
                      : 'Save Encounter'}
                </span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};