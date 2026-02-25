import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentApi, patientApi, authApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Appointment } from '../../../core/models';
import { CancelAppointmentModal } from '../components/CancelAppointmentModal';
import { 
  ArrowLeft, Calendar, Clock, User, MapPin, Phone, 
  Mail, AlertCircle, Edit, XCircle, RefreshCw, 
  CheckCircle, FileText 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [appointment, setAppointment] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppointmentDetails(id);
    }
  }, [id]);

  const loadAppointmentDetails = async (appointmentId: string) => {
    try {
      const appt = await appointmentApi.getById(appointmentId);
      if (appt) {
        const [patient, prov] = await Promise.all([
          patientApi.getById(appt.patientId),
          Promise.resolve(authApi.getAllUsers().find(u => u.id === appt.providerId))
        ]);
        setAppointment({ ...appt, patient });
        setProvider(prov);
      } else {
        toast.error('Appointment not found');
        navigate('/appointments');
      }
    } catch (error) {
      toast.error('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (reason: string) => {
    if (!appointment || !currentUser) return;

    setIsCancelling(true);
    try {
      await appointmentApi.cancelAppointment(
        appointment.id,
        reason,
        currentUser.id,
        currentUser.fullName
      );
      toast.success('Appointment cancelled successfully');
      navigate('/appointments');
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
    }
  };

  const handleMarkNoShow = async () => {
    if (!appointment || !currentUser) return;
    if (!confirm('Mark this appointment as No-show?')) return;

    try {
      await appointmentApi.markAsNoShow(appointment.id, currentUser.id, currentUser.fullName);
      toast.success('Marked as No-show');
      loadAppointmentDetails(appointment.id);
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
      'Checked-in': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'In-Progress': 'bg-purple-100 text-purple-700 border-purple-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200',
      'No-show': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={18} />;
      case 'Cancelled': return <XCircle size={18} />;
      case 'No-show': return <AlertCircle size={18} />;
      default: return <Clock size={18} />;
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  const canCancel = appointment.status === 'Scheduled' || appointment.status === 'Checked-in';
  const canReschedule = appointment.status === 'Scheduled' || appointment.status === 'No-show';
  const canMarkNoShow = appointment.status === 'Checked-in' || appointment.status === 'Scheduled';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/appointments')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Appointment Details</h1>
            <p className="text-slate-600 mt-1">#{appointment.appointmentNumber}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(appointment.status)}`}>
          {getStatusIcon(appointment.status)}
          <span className="ml-2">{appointment.status}</span>
        </span>
      </div>

      {/* Cancellation Alert */}
      {appointment.status === 'Cancelled' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Appointment Cancelled</h3>
              <p className="text-sm text-red-700 mt-1">
                <strong>Reason:</strong> {appointment.cancellationReason}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Cancelled by {appointment.cancelledByName} on {format(new Date(appointment.cancelledAt), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Info */}
      {appointment.rescheduledFrom && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="text-blue-600" size={18} />
            <p className="text-sm text-blue-800">
              This appointment was rescheduled from a previous booking
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Appointment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Calendar className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-semibold text-slate-800">
                    {format(new Date(appointment.date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="font-semibold text-slate-800">
                    {appointment.startTime} ({appointment.duration} minutes)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-slate-600">Provider</p>
                  <p className="font-semibold text-slate-800">
                    {provider?.fullName || 'Unknown Provider'}
                  </p>
                  <p className="text-xs text-slate-500">{provider?.role}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="text-blue-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-slate-600">Type</p>
                  <p className="font-semibold text-slate-800">{appointment.appointmentType}</p>
                </div>
              </div>
            </div>

            {appointment.reason && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Reason for Visit:</p>
                <p className="text-sm text-blue-800">{appointment.reason}</p>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-1">Internal Notes:</p>
                <p className="text-sm text-slate-600">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Status History */}
          {appointment.statusHistory && appointment.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Status History</h2>
              <div className="space-y-4">
                {appointment.statusHistory.map((change: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-slate-200 last:border-0">
                    <div className={`p-2 rounded-full ${getStatusColor(change.status).split(' ')[0]}`}>
                      {getStatusIcon(change.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{change.status}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(change.changedAt), 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        By {change.changedByName || 'System'}
                      </p>
                      {change.reason && (
                        <p className="text-xs text-slate-500 mt-1 italic">{change.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Patient Info & Actions */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h2>
            
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {appointment.patient?.firstName[0]}{appointment.patient?.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </p>
                <p className="text-sm text-slate-600">{appointment.patient?.mrn}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="text-slate-400" size={16} />
                <span className="text-slate-600">
                  {calculateAge(appointment.patient?.dateOfBirth)} years old • {appointment.patient?.gender}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Phone className="text-slate-400" size={16} />
                <span className="text-slate-600">{appointment.patient?.phone}</span>
              </div>

              {appointment.patient?.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="text-slate-400" size={16} />
                  <span className="text-slate-600">{appointment.patient?.email}</span>
                </div>
              )}

              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="text-slate-400 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-slate-600">
                  {appointment.patient?.address.street}<br />
                  {appointment.patient?.address.city}, {appointment.patient?.address.state} {appointment.patient?.address.zipCode}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Insurance</p>
                <p className="text-sm font-medium text-slate-700">{appointment.patient?.insurance.type}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/patients/${appointment.patientId}`)}
              className="w-full mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
            >
              View Full Patient Profile
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Actions</h2>
            <div className="space-y-2">
              {canReschedule && (
                <button
                  onClick={() => navigate(`/appointments/${appointment.id}/reschedule`)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>Reschedule</span>
                </button>
              )}

              {canMarkNoShow && (
                <button
                  onClick={handleMarkNoShow}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <AlertCircle size={18} />
                  <span>Mark as No-show</span>
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle size={18} />
                  <span>Cancel Appointment</span>
                </button>
              )}

              {appointment.status === 'Completed' && (
                <button
                  onClick={() => navigate(`/clinical?patientId=${appointment.patientId}`)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileText size={18} />
                  <span>View Clinical Notes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelAppointment}
        appointmentInfo={{
          patientName: `${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
          date: format(new Date(appointment.date), 'MMMM dd, yyyy'),
          time: appointment.startTime
        }}
        isLoading={isCancelling}
      />
    </div>
  );
};