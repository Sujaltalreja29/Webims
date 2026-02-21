import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientApi, appointmentApi, encounterApi, prescriptionApi } from '../../../core/services/api';
import { Patient } from '../../../core/models';
import { Button } from '../../../shared/components/ui/Button';
import { Edit, Calendar, FileText, Pill, ArrowLeft, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [stats, setStats] = useState({
    appointments: 0,
    encounters: 0,
    prescriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  const loadPatientData = async (patientId: string) => {
    try {
      const [patientData, appointments, encounters, prescriptions] = await Promise.all([
        patientApi.getById(patientId),
        appointmentApi.getByPatient(patientId),
        encounterApi.getByPatient(patientId),
        prescriptionApi.getByPatient(patientId)
      ]);

      if (patientData) {
        setPatient(patientData);
        setStats({
          appointments: appointments.length,
          encounters: encounters.length,
          prescriptions: prescriptions.length
        });
      } else {
        toast.error('Patient not found');
        navigate('/patients');
      }
    } catch (error) {
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
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
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center text-gray-500">Patient not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/patients')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600">MRN: {patient.mrn}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/patients/${id}/edit`)}>
          <Edit size={18} className="mr-2" />
          Edit Patient
        </Button>
      </div>

      {/* Alerts */}
      {(patient.flags.hasAllergies || patient.flags.isHighRisk) && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Medical Alerts</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-800">
                {patient.flags.hasAllergies && (
                  <li>⚠️ Allergies: {patient.flags.allergyList || 'Not specified'}</li>
                )}
                {patient.flags.isHighRisk && <li>⚠️ High-risk patient</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/appointments')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.appointments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Encounters</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.encounters}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/pharmacy')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prescriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.prescriptions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Pill className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Date of Birth</dt>
              <dd className="text-sm font-medium text-gray-900">
                {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')} ({calculateAge(patient.dateOfBirth)} years old)
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Gender</dt>
              <dd className="text-sm font-medium text-gray-900">{patient.gender}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Phone</dt>
              <dd className="text-sm font-medium text-gray-900">{patient.phone}</dd>
            </div>
            {patient.email && (
              <div>
                <dt className="text-sm text-gray-600">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.email}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Address */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <address className="text-sm text-gray-900 not-italic">
            {patient.address.street}
            <br />
            {patient.address.city}, {patient.address.state} {patient.address.zipCode}
          </address>
        </div>

        {/* Emergency Contact */}
        {patient.emergencyContact?.name && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Name</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.emergencyContact.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Relationship</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.emergencyContact.relationship}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.emergencyContact.phone}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Insurance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Type</dt>
              <dd className="text-sm font-medium text-gray-900">{patient.insurance.type}</dd>
            </div>
            {patient.insurance.insuranceId && (
              <div>
                <dt className="text-sm text-gray-600">Insurance ID</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.insurance.insuranceId}</dd>
              </div>
            )}
            {patient.insurance.payerName && (
              <div>
                <dt className="text-sm text-gray-600">Payer</dt>
                <dd className="text-sm font-medium text-gray-900">{patient.insurance.payerName}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};