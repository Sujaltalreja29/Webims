import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentApi, patientApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Appointment } from '../../../core/models';
import { ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

export const RescheduleAppointmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (id) {
      loadAppointment(id);
    }
  }, [id]);

  useEffect(() => {
    if (newDate && newTime && appointment) {
      checkConflict();
    }
  }, [newDate, newTime]);

  const loadAppointment = async (appointmentId: string) => {
    try {
      const appt = await appointmentApi.getById(appointmentId);
      if (appt) {
        const patient = await patientApi.getById(appt.patientId);
        setAppointment({ ...appt, patient });
        // Pre-fill with current date/time
        setNewDate(appt.date);
        setNewTime(appt.startTime);
      } else {
        toast.error('Appointment not found');
        navigate('/appointments');
      }
    } catch (error) {
      toast.error('Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const checkConflict = async () => {
    if (!appointment) return;
    const conflict = await appointmentApi.checkTimeConflict(
      appointment.providerId,
      newDate,
      newTime,
      appointment.duration,
      appointment.id // exclude current appointment
    );
    setHasConflict(conflict);
  };

  const handleReschedule = async () => {
    if (!appointment || !user || hasConflict) return;

    setIsSubmitting(true);
    try {
      const result = await appointmentApi.rescheduleAppointment(
        appointment.id,
        newDate,
        newTime,
        user.id
      );

      if (result.new) {
        toast.success('Appointment rescheduled successfully!');
        navigate('/appointments');
      } else {
        toast.error('Failed to reschedule appointment');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/appointments')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reschedule Appointment</h1>
          <p className="text-slate-600 mt-1">Change appointment date and time</p>
        </div>
      </div>

      {/* Original Appointment Info */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Current Appointment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Patient</p>
            <p className="font-semibold text-slate-800">
              {appointment.patient?.firstName} {appointment.patient?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Appointment Type</p>
            <p className="font-semibold text-slate-800">{appointment.appointmentType}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Current Date</p>
            <p className="font-semibold text-slate-800">
              {format(new Date(appointment.date), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Current Time</p>
            <p className="font-semibold text-slate-800">
              {appointment.startTime} ({appointment.duration} min)
            </p>
          </div>
        </div>
      </div>

      {/* New Date & Time Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Calendar className="mr-2 text-blue-600" size={20} />
          Select New Date & Time
        </h2>

        {hasConflict && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-red-800">Time Conflict</p>
              <p className="text-xs text-red-700 mt-1">
                This time slot is already booked. Please choose a different time.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Time <span className="text-red-500">*</span>
            </label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                hasConflict
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-blue-900">Reschedule Policy</p>
              <p className="text-xs text-blue-700 mt-1">
                The original appointment will be cancelled and a new appointment will be created 
                with the selected date and time. The patient will keep the same duration ({appointment.duration} minutes).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReschedule}
          disabled={isSubmitting || hasConflict || !newDate || !newTime}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Rescheduling...</span>
            </>
          ) : (
            <>
              <Calendar size={18} />
              <span>Confirm Reschedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};