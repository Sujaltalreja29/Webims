import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, patientApi, prescriptionApi, billingApi } from '../../../core/services/api';
import { Users, Calendar, Activity, DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ClinicDashboard: React.FC = () => {
  const navigate = useNavigate();
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
        appointments.slice(0, 6).map(async (appt) => {
          const patient = await patientApi.getById(appt.patientId);
          return { ...appt, patient };
        })
      );

      setTodayAppointments(appointmentsWithPatients);
      setRecentPatients(patients.slice(0, 5));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Clinic Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
            Export Report
          </button> */}
          <button
            onClick={() => navigate('/appointments/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <div
          onClick={() => navigate('/patients')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
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
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
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
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
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
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
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
            <div className="space-y-2">
              <button
                onClick={() => navigate('/patients/new')}
                className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                + Register New Patient
              </button>
              <button
                onClick={() => navigate('/appointments/new')}
                className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                + Schedule Appointment
              </button>
              <button
                onClick={() => navigate('/clinical/new')}
                className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                + New Clinical Note
              </button>
            </div>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
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
    </div>
  );
};