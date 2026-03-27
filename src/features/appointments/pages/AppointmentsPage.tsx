import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, patientApi } from '../../../core/services/api';
import { Appointment } from '../../../core/models';
import { FileText } from 'lucide-react';
import { 
  Calendar, Plus, Clock, User, Filter, 
  CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { PageShell } from '../../../shared/components/PageShell';
import { LoadingState } from '../../../shared/components/states/LoadingState';
import { EmptyState } from '../../../shared/components/states/EmptyState';


export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | Appointment['status']>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await appointmentApi.getByDate(dateStr);
      
      const withPatients = await Promise.all(
        data.map(async (appt) => {
          const patient = await patientApi.getById(appt.patientId);
          return { ...appt, patient };
        })
      );

      withPatients.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setAppointments(withPatients);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const filteredAppointments = appointments.filter(appt => 
    filterStatus === 'all' || appt.status === filterStatus
  );

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
      case 'Completed': return <CheckCircle size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      case 'No-show': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    try {
      await appointmentApi.update(id, { status: newStatus });
      toast.success('Appointment status updated');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'Scheduled').length,
    checkedIn: appointments.filter(a => a.status === 'Checked-in').length,
    completed: appointments.filter(a => a.status === 'Completed').length
  };

  return (
    <PageShell
      title="Appointment Scheduling"
      subtitle="Manage patient appointments and schedule"
      actions={(
        <button
          onClick={() => navigate('/appointments/new')}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>New Appointment</span>
        </button>
      )}
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Scheduled</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.scheduled}</p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Checked-in</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.checkedIn}</p>
            </div>
            <User className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Week View</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isToday
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-2xl font-bold mt-1">{format(day, 'd')}</div>
                <div className="text-xs mt-1">{format(day, 'MMM')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filter by status:</span>
          {['all', 'Scheduled', 'Checked-in', 'In-Progress', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Appointments for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <LoadingState message="Loading appointments..." className="h-40" />
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title="No appointments scheduled"
              description="Try selecting another day or create a new appointment."
              icon={<Calendar size={26} />}
              action={(
                <button
                  onClick={() => navigate('/appointments/new')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Create Appointment
                </button>
              )}
            />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                      <span className="text-lg font-bold text-blue-700">{appt.startTime}</span>
                      <span className="text-xs text-slate-600">{appt.duration}min</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {appt.patient?.firstName} {appt.patient?.lastName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appt.status)}`}>
                          {getStatusIcon(appt.status)}
                          <span className="ml-1">{appt.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{appt.appointmentType}</p>
                      {appt.reason && (
                        <p className="text-sm text-slate-500 mt-1">Reason: {appt.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
  {appt.status === 'Scheduled' && (
    <button
      onClick={() => handleStatusChange(appt.id, 'Checked-in')}
      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
    >
      Check In
    </button>
  )}
  {appt.status === 'Checked-in' && (
    <button
      onClick={() => handleStatusChange(appt.id, 'In-Progress')}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
    >
      Start Visit
    </button>
  )}
  {appt.status === 'In-Progress' && (
    <button
      onClick={() => navigate(`/clinical/new?appointmentId=${appt.id}`)}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center space-x-2"
    >
      <FileText size={16} />
      <span>Complete Visit</span>
    </button>
  )}
  {appt.status === 'Completed' && (
    <span className="text-sm text-green-600 font-medium flex items-center">
      <CheckCircle size={16} className="mr-1" />
      Completed
    </span>
  )}
  <button
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/appointments/${appt.id}`);
    }}
    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
  >
    View Details
  </button>
</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};