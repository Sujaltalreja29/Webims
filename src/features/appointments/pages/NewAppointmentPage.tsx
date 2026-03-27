import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, patientApi, authApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient, User, Appointment } from '../../../core/models';
import { ArrowLeft, Save, Search, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [providerDayAppointments, setProviderDayAppointments] = useState<Appointment[]>([]);

  const [formData, setFormData] = useState({
    providerId: '',
    appointmentType: 'Follow-up' as Appointment['appointmentType'],
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    duration: 30,
    reason: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check for conflicts when provider, date, or time changes
    if (formData.providerId && formData.date && formData.startTime) {
      checkTimeConflict();
    }
  }, [formData.providerId, formData.date, formData.startTime, formData.duration]);

  useEffect(() => {
    const loadProviderDayAppointments = async () => {
      if (!formData.providerId || !formData.date) {
        setProviderDayAppointments([]);
        return;
      }

      const schedule = await appointmentApi.getProviderSchedule(formData.providerId, formData.date);
      setProviderDayAppointments(schedule);
    };

    loadProviderDayAppointments();
  }, [formData.providerId, formData.date]);

  const isPastDateTime = (date: string, time: string): boolean => {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
      return false;
    }

    const selectedDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return selectedDateTime.getTime() <= Date.now();
  };

  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const hasSlotOverlap = (slot: string): boolean => {
    const slotStart = toMinutes(slot);
    const slotEnd = slotStart + formData.duration;

    return providerDayAppointments.some((appointment) => {
      const appointmentStart = toMinutes(appointment.startTime);
      const appointmentEnd = appointmentStart + (appointment.duration || 30);
      return slotStart < appointmentEnd && appointmentStart < slotEnd;
    });
  };

  const loadData = async () => {
    const [patientsData, usersData] = await Promise.all([
      patientApi.getActivePatients(),
      authApi.getAllUsers()
    ]);

    setPatients(patientsData);
    
    // Filter providers (doctors and nurses)
    const providerUsers = usersData.filter(u => 
      (u.role === 'DOCTOR' || u.role === 'NURSE') && u.isActive
    );
    setProviders(providerUsers);

    // Auto-select current user if they're a provider
    if (currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE')) {
      setFormData(prev => ({ ...prev, providerId: currentUser.id }));
    }
  };

  const checkTimeConflict = async () => {
    setIsCheckingConflict(true);
    try {
      const conflict = await appointmentApi.checkTimeConflict(
        formData.providerId,
        formData.date,
        formData.startTime,
        formData.duration
      );
      setHasConflict(conflict);
    } catch (error) {
      console.error('Error checking conflict:', error);
    } finally {
      setIsCheckingConflict(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  }).slice(0, 5);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPatient) {
      newErrors.patient = 'Please select a patient';
    }

    if (!formData.providerId) {
      newErrors.providerId = 'Please select a provider';
    }

    if (!formData.appointmentType) {
      newErrors.appointmentType = 'Please select appointment type';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Please select a time';
    }

    if (formData.date && formData.startTime && isPastDateTime(formData.date, formData.startTime)) {
      newErrors.startTime = 'Please choose a future time slot';
    }

    if (hasConflict) {
      newErrors.conflict = 'This time slot conflicts with another appointment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedPatient || !currentUser) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      const newAppointment: Appointment = {
        id: `appt-${Date.now()}`,
        appointmentNumber: appointmentApi.generateAppointmentNumber(),
        patientId: selectedPatient.id,
        providerId: formData.providerId,
        appointmentType: formData.appointmentType,
        date: formData.date,
        startTime: formData.startTime,
        duration: formData.duration,
        status: 'Scheduled',
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
      };

      await appointmentApi.create(newAppointment);
      toast.success('Appointment scheduled successfully!');
      navigate('/appointments');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create appointment';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const isSlotPast = (time: string): boolean => isPastDateTime(formData.date, time);
  const isSlotBooked = (time: string): boolean => hasSlotOverlap(time);
  const isSlotDisabled = (time: string): boolean => isSlotPast(time) || isSlotBooked(time);

  const availableTimeSlots = timeSlots.filter((time) => !isSlotDisabled(time));

  useEffect(() => {
    if (!formData.startTime || availableTimeSlots.length === 0) {
      return;
    }

    if (!availableTimeSlots.includes(formData.startTime)) {
      setFormData((prev) => ({ ...prev, startTime: availableTimeSlots[0] }));
    }
  }, [formData.startTime, availableTimeSlots]);

  const appointmentTypes: Appointment['appointmentType'][] = [
    'New Patient',
    'Follow-up',
    'Urgent',
    'Telehealth'
  ];

  const durations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/appointments')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Schedule Appointment</h1>
          <p className="text-slate-600 mt-1">Book a new patient appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Search className="mr-2 text-blue-600" size={20} />
            Select Patient
          </h2>

          {!selectedPatient ? (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, MRN, or phone number..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errors.patient && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.patient}
                </p>
              )}

              {searchTerm && (
                <div className="mt-3 border border-slate-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No patients found. Try different search terms.
                    </div>
                  ) : (
                    filteredPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setSearchTerm('');
                          if (errors.patient) {
                            setErrors(prev => ({ ...prev, patient: '' }));
                          }
                        }}
                        className="w-full p-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <div className="flex items-center space-x-3 text-sm text-slate-500">
                              <span className="font-mono">{patient.mrn}</span>
                              <span>•</span>
                              <span>{patient.phone}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-blue-600 text-sm font-medium">Select →</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-lg">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <span className="font-mono">{selectedPatient.mrn}</span>
                    <span>•</span>
                    <span>{selectedPatient.phone}</span>
                    <span>•</span>
                    <span>{selectedPatient.insurance.type}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Change Patient
              </button>
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            {/* Provider & Type */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Appointment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.providerId}
                    onChange={(e) => handleChange('providerId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a provider...</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.fullName} ({provider.role})
                      </option>
                    ))}
                  </select>
                  {errors.providerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.providerId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Appointment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => handleChange('appointmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {appointmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Schedule
              </h2>

              {hasConflict && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-red-800">Time Conflict Detected</p>
                    <p className="text-xs text-red-700 mt-1">
                      This provider already has an appointment at this time. Please choose a different time slot.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('date', format(new Date(), 'yyyy-MM-dd'))}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('date', format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('date', format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                    >
                      +7 Days
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                      className="w-full rounded-xl border border-slate-200 bg-linear-to-r from-white to-slate-50 px-4 py-3 pr-10 text-slate-900 shadow-sm transition focus:border-blue-400 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Selected: {format(new Date(formData.date), 'EEEE, MMM d')}</p>
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Pick a time slot</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span>Open</span>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400"></span>Unavailable</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {timeSlots.map((time) => {
                        const disabled = isSlotDisabled(time);
                        const selected = formData.startTime === time;

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => !disabled && handleChange('startTime', time)}
                            disabled={disabled}
                            className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                              selected
                                ? 'border-blue-600 bg-blue-600 text-white shadow'
                                : disabled
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            aria-label={`${time} ${disabled ? 'unavailable' : 'available'}`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {availableTimeSlots.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">No open slots left for this provider on this date.</p>
                  )}
                  {isCheckingConflict && (
                    <p className="mt-1 text-xs text-slate-500">Checking availability...</p>
                  )}
                  {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {durations.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reason & Notes */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason for Visit
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="e.g., Annual checkup, Follow-up for blood pressure, Flu symptoms..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Internal notes (not visible to patient)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || hasConflict}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span>{isLoading ? 'Scheduling...' : 'Schedule Appointment'}</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};