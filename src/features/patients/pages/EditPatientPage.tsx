import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient } from '../../../core/models';
import { PatientForm } from '../components/PatientForm';
import { toast } from 'sonner';

export const EditPatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPatient(id);
    }
  }, [id]);

  const loadPatient = async (patientId: string) => {
    try {
      const data = await patientApi.getById(patientId);
      if (data) {
        setPatient(data);
      } else {
        toast.error('Patient not found');
        navigate('/patients');
      }
    } catch (error) {
      toast.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Patient>) => {
    if (!id || !user) return;

    setIsLoading(true);
    try {
      await patientApi.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      toast.success('Patient updated successfully!');
      navigate(`/patients/${id}`);
    } catch (error) {
      toast.error('Failed to update patient');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center text-gray-500">Patient not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Patient</h1>
        <p className="text-gray-600">
          Update information for {patient.firstName} {patient.lastName}
        </p>
      </div>

      <PatientForm initialData={patient} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};