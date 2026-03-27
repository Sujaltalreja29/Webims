import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, patientApi, prescriptionApi, billingApi } from '../../../core/services/api';
import { Users, Calendar, Activity, DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { PageShell } from '../../../shared/components/PageShell';
import { ACCESS_CONTROL } from '../../../core/constants/access-control';
import { useQueueData } from '../hooks/useQueueData';
import { QueueCard } from '../components/QueueCard';
import { LoadingState } from '../../../shared/components/states/LoadingState';

export const ClinicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingPrescriptions: 0,
    revenue: 0,
    checkIns: 0,
    completed: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { loading: loadingQueues, queueItems } = useQueueData(user?.role);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patients, appointments, prescriptions, claims] = await Promise.all([
        patientApi.getActivePatients(),
        appointmentApi.getTodayAppointments(),
        prescriptionApi.getPharmacyQueue(),
        billingApi.getAll()
      ]);

      const revenue = claims
        .filter(c => c.status === 'Paid')
        .reduce((sum, c) => sum + (c.payment?.amountPaid || 0), 0);

      setStats({
        totalPatients: patients.length,
        todayAppointments: appointments.length,
        pendingPrescriptions: prescriptions.length,
        revenue,
        checkIns: appointments.filter(a => a.status === 'Checked-in').length,
        completed: appointments.filter(a => a.status === 'Completed').length
      });

      const appointmentsWithPatients = await Promise.all(
        [...appointments]
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .slice(0, 6)
          .map(async (appt) => {
          const patient = await patientApi.getById(appt.patientId);
          return { ...appt, patient };
        })
      );

      setTodayAppointments(appointmentsWithPatients);
      setRecentPatients(
        [...patients]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
      'Checked-in': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'In-Progress': 'bg-purple-100 text-purple-700 border-purple-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const actionButtons = [
    {
      label: 'Register New Patient',
      path: '/patients/new',
      classes: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      roles: ACCESS_CONTROL.routes.patients
    },
    {
      label: 'Schedule Appointment',
      path: '/appointments/new',
      classes: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      roles: ACCESS_CONTROL.routes.appointments
    },
    {
      label: 'New Clinical Note',
      path: '/clinical/new',
      classes: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
      roles: ACCESS_CONTROL.routes.clinical
    },
    {
      label: 'Add New Care Note',
      path: '/ltc/care-notes/new',
      classes: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
      roles: ACCESS_CONTROL.routes.ltc
    },
    {
      label: 'Add Resident (LTC)',
      path: '/ltc/residents/new',
      classes: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      roles: ACCESS_CONTROL.routes.ltc
    },
    {
      label: 'Add Medication',
      path: '/pharmacy/inventory/new',
      classes: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      roles: ACCESS_CONTROL.routes.pharmacyInventory
    }
  ].filter((action) => (user ? action.roles.includes(user.role) : false));

  return (
    <PageShell
      title="Clinic Dashboard"
      subtitle={format(new Date(), 'EEEE, MMMM do, yyyy')}
      actions={(
        <>
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/appointments/new')} size="sm">
            New Appointment
          </Button>
        </>
      )}
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div
          onClick={() => navigate('/patients')}
          className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users size={24} />
            </div>
            <TrendingUp size={20} className="opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Patients</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalPatients}</p>
          <p className="text-sm opacity-75 mt-2">Active in system</p>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => navigate('/appointments')}
          className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar size={24} />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-75">Checked-in</div>
              <div className="text-lg font-semibold">{stats.checkIns}</div>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">Today's Appointments</h3>
          <p className="text-3xl font-bold mt-2">{stats.todayAppointments}</p>
          <p className="text-sm opacity-75 mt-2">{stats.completed} completed</p>
        </div>

        {/* Pending Prescriptions */}
        <div
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Activity size={24} />
            </div>
            {stats.pendingPrescriptions > 0 && (
              <AlertCircle size={20} className="opacity-70" />
            )}
          </div>
          <h3 className="text-sm font-medium opacity-90">Pending Prescriptions</h3>
          <p className="text-3xl font-bold mt-2">{stats.pendingPrescriptions}</p>
          <p className="text-sm opacity-75 mt-2">Awaiting fulfillment</p>
        </div>

        {/* Revenue */}
        <div
          onClick={() => navigate('/billing')}
          className="bg-linear-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="opacity-70" />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">${stats.revenue.toFixed(2)}</p>
          <p className="text-sm opacity-75 mt-2">All-time earnings</p>
        </div>
      </div>

      {/* Role-Based Work Queues */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Role Work Queues</h2>
          <p className="text-xs text-slate-500">Prioritized operational actions by role</p>
        </div>

        {loadingQueues ? (
          <LoadingState message="Loading role queues..." className="h-28" />
        ) : queueItems.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No role-specific queues are available for your current profile.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {queueItems.map((queue) => (
              <QueueCard
                key={queue.key}
                title={queue.title}
                description={queue.description}
                count={queue.count}
                path={queue.path}
                icon={queue.icon}
                colorClasses={queue.colorClasses}
                onNavigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold text-slate-800">Today's Schedule</h2>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
          </div>

          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => navigate(`/appointments/${appt.id}`)}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg border-2 border-blue-200">
                        <span className="text-lg font-bold text-blue-600">
                          {appt.startTime}
                        </span>
                        <span className="text-xs text-slate-500">{appt.duration}min</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {appt.patient?.firstName} {appt.patient?.lastName}
                        </p>
                        <p className="text-sm text-slate-600">{appt.appointmentType}</p>
                        {appt.reason && (
                          <p className="text-xs text-slate-500 mt-1">{appt.reason}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Patients */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
            {actionButtons.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No quick actions available for your current role.
              </p>
            ) : (
              <div className="space-y-2">
                {actionButtons.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className={`w-full rounded-lg px-4 py-3 text-left font-medium transition-colors ${action.classes}`}
                  >
                    + {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Patients</h2>
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{patient.mrn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};