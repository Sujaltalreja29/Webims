import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient } from '../../../core/models';
import { PatientForm } from '../components/PatientForm';
import { toast } from 'sonner';

export const CreatePatientPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPatientId, setNextPatientId] = useState<number>(1);

  // ✅ Load existing patients to get next ID
  useEffect(() => {
    loadNextId();
  }, []);

  const loadNextId = async () => {
    try {
      const existingPatients = await patientApi.getAll();
      
      // Find the highest patient number
      const patientNumbers = existingPatients
        .map(p => {
          const match = p.id.match(/^patient-(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);
      
      const maxId = patientNumbers.length > 0 ? Math.max(...patientNumbers) : 0;
      setNextPatientId(maxId + 1);
    } catch (error) {
      console.error('Failed to load patients:', error);
      // Fallback to timestamp if error
      setNextPatientId(Date.now());
    }
  };

  const handleSubmit = async (data: Partial<Patient>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newPatient: Patient = {
        ...data,
        id: `patient-${nextPatientId}`,  // ✅ Use counter-based ID
        mrn: patientApi.generateMRN(),
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        isActive: true
      } as Patient;

      await patientApi.create(newPatient);
      toast.success('Patient registered successfully!');
      navigate('/patients');
    } catch (error) {
      toast.error('Failed to register patient');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
        <p className="text-gray-600">Enter patient information to create a new record</p>
      </div>

      <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};