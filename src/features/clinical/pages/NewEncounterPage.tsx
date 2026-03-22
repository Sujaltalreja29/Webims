import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { encounterApi, patientApi, appointmentApi, authApi, prescriptionApi, labResultApi } from '../../../core/services/api';
import { useAuthStore } from '../../../store/authStore';
import { Patient, Encounter, Prescription, LabResult } from '../../../core/models';
import { COMMON_DIAGNOSES, COMMON_MEDICATIONS } from '../../../core/constants/medical-codes';
import { clinicalSafetyService } from '../../../core/services/clinical-safety.service';
import { ArrowLeft, Save, Search, CheckCircle, Calendar as CalendarIcon, Plus, X, Pill, TestTube, AlertTriangle, Calendar, FileText, Edit, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ManageActiveMedicationsModal } from '../components/ManageActiveMedicationsModal';



interface PrescriptionDraft {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  refills: string;
  instructions: string;
}

interface LabOrderDraft {
  id: string;
  testType: string;
  testName: string;
  priority: string;
  notes: string;
}

// Add this component BEFORE NewEncounterPage
interface CurrentMedicationCardProps {
  prescription: Prescription;
  onUpdate: (updates: Partial<Prescription>) => Promise<void>;
  onDiscontinue: () => Promise<void>;
}

interface CurrentMedicationCardProps {
  prescription: Prescription;
  onUpdate: (updates: Partial<Prescription>) => Promise<void>;
  onDiscontinue: () => Promise<void>;
}

const CurrentMedicationCard: React.FC<CurrentMedicationCardProps> = ({
  prescription,
  onUpdate,
  onDiscontinue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    dosage: prescription.dosage || '',
    frequency: prescription.frequency || '',
    duration: prescription.duration || '',
    quantity: prescription.quantity?.toString() || '0',  // ✅ Safe null handling
    refills: prescription.refills?.toString() || '0',    // ✅ Safe null handling
    instructions: prescription.instructions || ''
  });

  const handleSave = async () => {
    await onUpdate({
      dosage: editData.dosage,
      frequency: editData.frequency,
      duration: editData.duration,
      quantity: parseInt(editData.quantity) || 0,
      refills: parseInt(editData.refills) || 0,
      instructions: editData.instructions
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      quantity: prescription.quantity?.toString() || '0',
      refills: prescription.refills?.toString() || '0',
      instructions: prescription.instructions || ''
    });
    setIsEditing(false);
  };

  const frequencyOptions = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Before meals', 'After meals', 'At bedtime'
  ];

  const durationOptions = [
    '3 days', '5 days', '7 days', '10 days', '14 days',
    '30 days', '60 days', '90 days', 'Ongoing'
  ];

  return (
    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="text-green-600 shrink-0" size={20} />
          <h4 className="font-bold text-slate-800 text-lg">{prescription.medicationName}</h4>
          {prescription.dispensedAt && (
            <span className="text-xs text-slate-500">
              (Active since {format(new Date(prescription.dispensedAt), 'MMM dd, yyyy')})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors text-sm flex items-center space-x-1"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={onDiscontinue}
                className="px-3 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors text-sm flex items-center space-x-1"
              >
                <XCircle size={14} />
                <span>Discontinue</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
              >
                <CheckCircle size={14} />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dosage</label>
            <input
              type="text"
              value={editData.dosage}
              onChange={(e) => setEditData({ ...editData, dosage: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Frequency</label>
            <select
              value={editData.frequency}
              onChange={(e) => setEditData({ ...editData, frequency: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {frequencyOptions.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Duration</label>
            <select
              value={editData.duration}
              onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {durationOptions.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
              min="0"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Refills</label>
            <input
              type="number"
              value={editData.refills}
              onChange={(e) => setEditData({ ...editData, refills: e.target.value })}
              min="0"
              max="12"
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Instructions</label>
            <input
              type="text"
              value={editData.instructions}
              onChange={(e) => setEditData({ ...editData, instructions: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-700">
          <div>
            <span className="font-medium text-slate-600">Dosage:</span>
            <span className="ml-1">{prescription.dosage}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Frequency:</span>
            <span className="ml-1">{prescription.frequency}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Duration:</span>
            <span className="ml-1">{prescription.duration || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Qty:</span>
            <span className="ml-1">{prescription.quantity || 0}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Refills:</span>
            <span className="ml-1">{prescription.refills ?? 0}</span>
          </div>
          {prescription.instructions && (
            <div className="md:col-span-3">
              <span className="font-medium text-slate-600">Instructions:</span>
              <span className="ml-1 italic">{prescription.instructions}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// NOW the main component starts
export const NewEncounterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  
  const appointmentId = searchParams.get('appointmentId');
  const prefilledPatientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);

  // Prescription drafts
  const [prescriptionDrafts, setPrescriptionDrafts] = useState<PrescriptionDraft[]>([]);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const [showManageMedsModal, setShowManageMedsModal] = useState(false);
  
  // Lab order drafts
  const [labOrderDrafts, setLabOrderDrafts] = useState<LabOrderDraft[]>([]);
  const [showLabForm, setShowLabForm] = useState(false);

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
    followUpRequired: false,
    followUpDuration: 30
  });

  // New prescription form state
  const [newPrescription, setNewPrescription] = useState<PrescriptionDraft>({
    id: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    refills: '0',
    instructions: ''
  });

  // New lab order form state
  const [newLabOrder, setNewLabOrder] = useState<LabOrderDraft>({
    id: '',
    testType: '',
    testName: '',
    priority: 'Routine',
    notes: ''
  });

  // Add this state after the existing useState declarations
const [patientHistory, setPatientHistory] = useState<{
  lastEncounter: Encounter | null;
  activePrescriptions: Prescription[];
  recentLabs: LabResult[];
  pastDiagnoses: string[];
}>({
  lastEncounter: null,
  activePrescriptions: [],
  recentLabs: [],
  pastDiagnoses: []
});

const [loadingHistory, setLoadingHistory] = useState(false);

useEffect(() => {
  loadData();
  
}, [appointmentId]); // Add dependency

// Add this useEffect after the existing useEffect
useEffect(() => {
  if (selectedPatient) {
    loadPatientHistory(selectedPatient.id);
  }
}, [selectedPatient]);

 const loadData = async () => {
  const [patientsData, usersData] = await Promise.all([
    patientApi.getActivePatients(),
    authApi.getAllUsers()
  ]);

  setPatients(patientsData);
  const providerUsers = usersData.filter(u => 
    (u.role === 'DOCTOR' || u.role === 'NURSE') && u.isActive
  );
  setProviders(providerUsers);

  // ✅ FIX: Only need appointmentId to auto-load
  if (appointmentId) {
    setIsAutoMode(true);
    await loadAppointmentData(appointmentId);
  }
};

const loadPatientHistory = async (patientId: string) => {
  try {
    setLoadingHistory(true);
    
    const [encounters, prescriptions, labs] = await Promise.all([
      encounterApi.getByPatient(patientId),
      prescriptionApi.getByPatient(patientId),
      labResultApi.getRecentByPatient(patientId, 5)
    ]);

    console.log('🔍 Patient History Debug:');
    console.log('Patient ID:', patientId);
    console.log('All Prescriptions:', prescriptions);

    // Get last encounter
    const lastEncounter = encounters[0] || null;

    // ✅ Get active prescriptions (more lenient filter)
// ✅ Get active prescriptions (includes prescriptions with 0 refills)
const activePrescriptions = prescriptions.filter(p => {
  const isNotCancelled = p.status !== 'Cancelled';
  
  // Accept prescriptions with 0 or more refills (unless dispensed and no refills left)
  const isStillActive = p.status !== 'Dispensed' || p.refills > 0;
  
  const isActiveStatus = 
    p.status === 'Dispensed' || 
    p.status === 'Ready' || 
    p.status === 'Sent to Pharmacy';
  
  console.log(`Checking ${p.medicationName}:`, {
    status: p.status,
    refills: p.refills,
    isNotCancelled,
    isStillActive,
    isActiveStatus,
    passes: isNotCancelled && isStillActive && isActiveStatus
  });

  return isNotCancelled && isStillActive && isActiveStatus;
}).slice(0, 5);

    console.log('Active Prescriptions:', activePrescriptions);

    // Get unique diagnoses from all encounters
    const allDiagnoses = encounters.flatMap(e => e.diagnoses);
    const uniqueDiagnoses = [...new Set(allDiagnoses)];

    setPatientHistory({
      lastEncounter,
      activePrescriptions,
      recentLabs: labs,
      pastDiagnoses: uniqueDiagnoses
    });
  } catch (error) {
    console.error('Failed to load patient history:', error);
    toast.error('Failed to load patient history');
  } finally {
    setLoadingHistory(false);
  }
};

const loadAppointmentData = async (apptId: string) => {
  try {
    const appointment = await appointmentApi.getById(apptId);
    
    if (!appointment) {
      toast.error('Appointment not found');
      return;
    }

    // ✅ Get patientId from the appointment data
    const patient = await patientApi.getById(appointment.patientId);
    
    if (!patient) {
      toast.error('Patient not found');
      return;
    }

    setAppointmentData(appointment);
    setSelectedPatient(patient);
    
    if (appointment.reason) {
      setFormData(prev => ({
        ...prev,
        chiefComplaint: appointment.reason || ''
      }));
    }
  } catch (error) {
    console.error('Error loading appointment:', error);
    toast.error('Failed to load appointment data');
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

  // Prescription handlers
  const handleAddPrescription = () => {
    if (!newPrescription.medicationName || !newPrescription.dosage || !newPrescription.frequency) {
      toast.error('Please fill in required prescription fields');
      return;
    }

    if (selectedPatient?.flags.hasAllergies) {
      const allergyCheck = clinicalSafetyService.checkMedicationAllergy(
        newPrescription.medicationName,
        selectedPatient.flags.allergyList
      );

      if (allergyCheck.hasContraindication) {
        toast.error(`Medication conflict with allergy: ${allergyCheck.matchedAllergens.join(', ')}`);
        return;
      }
    }

    const existingMedicationSources = [
      ...patientHistory.activePrescriptions,
      ...prescriptionDrafts.map((draft) => ({ medicationName: draft.medicationName } as Pick<Prescription, 'medicationName'>))
    ];

    const hasDuplicate = clinicalSafetyService.checkDuplicateMedication(
      newPrescription.medicationName,
      existingMedicationSources
    );

    if (hasDuplicate) {
      toast.error('Duplicate medication detected. This medication is already active or drafted.');
      return;
    }

    const interactionCheck = clinicalSafetyService.checkDrugInteractions(
      newPrescription.medicationName,
      existingMedicationSources
    );

    if (interactionCheck.severe.length > 0) {
      toast.error(`Severe drug interaction detected: ${interactionCheck.severe.map((item) => item.description).join('; ')}`);
      return;
    }

    if (interactionCheck.moderate.length > 0) {
      toast.warning(`Moderate interaction warning: ${interactionCheck.moderate.map((item) => item.description).join('; ')}`);
    }

    const draft: PrescriptionDraft = {
      ...newPrescription,
      id: `draft-rx-${Date.now()}`
    };

    setPrescriptionDrafts(prev => [...prev, draft]);
    setNewPrescription({
      id: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      refills: '0',
      instructions: ''
    });
    setShowPrescriptionForm(false);
    toast.success('Prescription added');
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptionDrafts(prev => prev.filter(p => p.id !== id));
    toast.info('Prescription removed');
  };

  // Lab order handlers
  const handleAddLabOrder = () => {
    if (!newLabOrder.testType || !newLabOrder.testName) {
      toast.error('Please select test type and name');
      return;
    }

    const draft: LabOrderDraft = {
      ...newLabOrder,
      id: `draft-lab-${Date.now()}`
    };

    setLabOrderDrafts(prev => [...prev, draft]);
    setNewLabOrder({
      id: '',
      testType: '',
      testName: '',
      priority: 'Routine',
      notes: ''
    });
    setShowLabForm(false);
    toast.success('Lab test added');
  };

  const handleRemoveLabOrder = (id: string) => {
    setLabOrderDrafts(prev => prev.filter(l => l.id !== id));
    toast.info('Lab order removed');
  };

  const createFollowUpAppointment = async (patientId: string, providerId: string, followUpDate: string, duration: number) => {
    try {
      const followUpAppt = {
        id: `appt-${Date.now()}`,
        appointmentNumber: appointmentApi.generateAppointmentNumber(),
        patientId,
        providerId,
        appointmentType: 'Follow-up' as const,
        date: followUpDate,
        startTime: '09:00',
        duration,
        status: 'Scheduled' as const,
        reason: 'Follow-up appointment (auto-scheduled)',
        notes: 'Created automatically from clinical encounter',
        createdAt: new Date().toISOString(),
        createdBy: user?.id || providerId
      };

      await appointmentApi.create(followUpAppt);
      return true;
    } catch (error) {
      console.error('Failed to create follow-up appointment:', error);
      return false;
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPatient || !user) return;

  if (!formData.chiefComplaint.trim()) {
    toast.error('Chief complaint is required');
    return;
  }

  if (formData.diagnoses.length === 0) {
    toast.error('At least one diagnosis is required before saving the encounter');
    return;
  }

  if (!formData.assessment.trim() || !formData.plan.trim()) {
    toast.error('Assessment and treatment plan are required before saving the encounter');
    return;
  }

  const parsedTemperature = formData.vitals.temperature ? parseFloat(formData.vitals.temperature) : undefined;
  const parsedPulse = formData.vitals.pulse ? parseInt(formData.vitals.pulse) : undefined;

  if (parsedTemperature && (parsedTemperature < 92 || parsedTemperature > 108)) {
    toast.error('Temperature is outside plausible clinical range (92-108 F)');
    return;
  }

  if (parsedPulse && (parsedPulse < 30 || parsedPulse > 220)) {
    toast.error('Pulse is outside plausible clinical range (30-220 bpm)');
    return;
  }

  setIsLoading(true);
  try {
    // Create encounter
    const encounterId = `enc-${Date.now()}`;
    const newEncounter: Encounter = {
      id: encounterId,
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
      prescriptionIds: [],
      labOrderIds: [],
      status: 'Open',
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    await encounterApi.create(newEncounter);

    // Create prescriptions
    const prescriptionIds: string[] = [];
    for (const draft of prescriptionDrafts) {
      const rxId = `rx-${Date.now()}-${Math.random()}`;
      const prescription: Prescription = {
        id: rxId,
        rxNumber: prescriptionApi.generateRxNumber(),
        patientId: selectedPatient.id,
        providerId: user.id,
        encounterId: encounterId,
        medicationName: draft.medicationName,
        dosage: draft.dosage,
        frequency: draft.frequency,
        duration: draft.duration,
        quantity: parseInt(draft.quantity),
        refills: parseInt(draft.refills),
        instructions: draft.instructions,
        status: 'Sent to Pharmacy',
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };
      await prescriptionApi.create(prescription);
      prescriptionIds.push(rxId);
    }

    // Create lab orders
    const labOrderIds: string[] = [];
    for (const draft of labOrderDrafts) {
      const labId = `lab-${Date.now()}-${Math.random()}`;
      const labOrder: LabResult = {
        id: labId,
        labOrderNumber: labResultApi.generateLabOrderNumber(),
        patientId: selectedPatient.id,
        encounterId: encounterId,
        orderedBy: user.id,
        orderedByName: user.fullName,
        testName: draft.testName,
        testType: draft.testType as any,
        status: 'Ordered',
        notes: draft.notes,
        orderedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };
      await labResultApi.create(labOrder);
      labOrderIds.push(labId);
    }

    // Update encounter with prescription and lab IDs
    if (prescriptionIds.length > 0 || labOrderIds.length > 0) {
      await encounterApi.update(encounterId, {
        prescriptionIds,
        labOrderIds
      });
    }

    // ✅ NEW: Update appointment status to Completed
    if (appointmentId) {
      try {
        await appointmentApi.update(appointmentId, { status: 'Completed' });
        console.log('✅ Appointment marked as Completed:', appointmentId);
      } catch (error) {
        console.error('⚠️ Failed to update appointment status:', error);
        // Don't fail the whole encounter if this fails
      }
    }

    // Auto-create follow-up appointment if date is selected
    if (formData.followUpRequired && formData.followUpDate) {
      const followUpCreated = await createFollowUpAppointment(
        selectedPatient.id,
        user.id,
        formData.followUpDate,
        formData.followUpDuration
      );

      if (followUpCreated) {
        toast.success(
          `Encounter saved with ${prescriptionDrafts.length} prescription(s), ${labOrderDrafts.length} lab order(s), and follow-up appointment scheduled!`,
          { duration: 5000 }
        );
      } else {
        toast.warning('Encounter saved but failed to schedule follow-up appointment');
      }
    } else {
      toast.success(
        `Encounter saved with ${prescriptionDrafts.length} prescription(s) and ${labOrderDrafts.length} lab order(s)!`,
        { duration: 4000 }
      );
    }

    // Navigate back to appointments if came from there, otherwise clinical notes
    navigate(appointmentId ? '/appointments' : '/clinical');
    
  } catch (error) {
    toast.error('Failed to create encounter');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

  const frequencyOptions = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Before meals', 'After meals', 'At bedtime'
  ];

  const durationOptions = [
    '3 days', '5 days', '7 days', '10 days', '14 days',
    '30 days', '60 days', '90 days', 'Ongoing'
  ];

  const bloodTestOptions = [
    'Complete Blood Count (CBC)',
    'Basic Metabolic Panel (BMP)',
    'Comprehensive Metabolic Panel (CMP)',
    'Lipid Panel',
    'Liver Function Test (LFT)',
    'Thyroid Function Test (TSH, T3, T4)',
    'Hemoglobin A1C'
  ];

  const getTestNameOptions = () => {
    switch (newLabOrder.testType) {
      case 'Blood Test':
        return bloodTestOptions;
      case 'Urinalysis':
        return ['Routine Urinalysis', 'Urine Culture'];
      case 'X-Ray':
        return ['Chest X-Ray', 'Abdominal X-Ray'];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(isAutoMode ? '/appointments' : '/clinical')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isAutoMode ? 'Complete Visit Documentation' : 'New Clinical Encounter'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isAutoMode 
              ? 'Document the completed appointment and add clinical notes' 
              : 'Document patient visit and clinical findings'}
          </p>
        </div>
      </div>

      {/* Auto-mode Banner */}
      {isAutoMode && appointmentData && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Appointment Completed</h3>
              <p className="text-sm text-green-700 mt-1">
                Appointment #{appointmentData.appointmentNumber} • {appointmentData.appointmentType} • {appointmentData.startTime}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Patient information has been pre-filled. Complete the clinical documentation below.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h2>
          
          {!selectedPatient && !isAutoMode ? (
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
                <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <span className="font-mono">{selectedPatient.mrn}</span>
                    <span>•</span>
                    <span>{selectedPatient.insurance.type}</span>
                  </div>
                </div>
              </div>
              {!isAutoMode && (
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
        </div>

        
        {selectedPatient && (
  <>
    {/* Patient Medical History Sidebar */}
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <FileText className="mr-2 text-blue-600" size={20} />
        Patient Medical History
      </h2>

      {loadingHistory ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Last Visit */}
          {patientHistory.lastEncounter ? (
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-slate-800 flex items-center text-sm mb-2">
                <Calendar className="mr-2 text-blue-600" size={16} />
                Last Visit
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium">Date:</span>{' '}
                  {format(new Date(patientHistory.lastEncounter.visitDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Chief Complaint:</span>{' '}
                  {patientHistory.lastEncounter.chiefComplaint}
                </p>
                {patientHistory.lastEncounter.diagnoses.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Diagnoses:</p>
                    <div className="flex flex-wrap gap-1">
                      {patientHistory.lastEncounter.diagnoses.slice(0, 3).map((diagnosis, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {diagnosis}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/clinical/${patientHistory.lastEncounter?.id}`)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-flex items-center"
                >
                  View Full Note →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">No previous encounters</div>
          )}

          <div className="border-t border-slate-200 pt-4"></div>

          {/* Active Prescriptions */}
          <div className="border-l-4 border-purple-500 pl-4">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-semibold text-slate-800 flex items-center text-sm">
      <Pill className="mr-2 text-purple-600" size={16} />
      Active Prescriptions ({patientHistory.activePrescriptions.length})
    </h3>
    <button
      type="button"
      onClick={() => setShowManageMedsModal(true)}
      className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
    >
      <Edit size={12} />
      <span>Manage</span>
    </button>
  </div>
            {patientHistory.activePrescriptions.length > 0 ? (
              <div className="space-y-2">
                {patientHistory.activePrescriptions.map((rx) => (
                  <div key={rx.id} className="text-sm bg-purple-50 border border-purple-200 rounded p-2">
                    <p className="font-medium text-slate-800">{rx.medicationName}</p>
                    <p className="text-slate-600 text-xs">
                      {rx.dosage} • {rx.frequency}
                    </p>
                    {rx.dispensedAt && (
                      <p className="text-slate-500 text-xs mt-1">
                        Dispensed: {format(new Date(rx.dispensedAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => navigate('/pharmacy/prescriptions')}
                  className="text-purple-600 hover:text-purple-700 text-xs font-medium mt-1 inline-flex items-center"
                >
                  View All →
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No active prescriptions</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4"></div>

          {/* Recent Lab Results */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-slate-800 flex items-center text-sm mb-2">
              <TestTube className="mr-2 text-green-600" size={16} />
              Recent Lab Results ({patientHistory.recentLabs.length})
            </h3>
            {patientHistory.recentLabs.length > 0 ? (
              <div className="space-y-2">
                {patientHistory.recentLabs.map((lab) => (
                  <div key={lab.id} className="text-sm bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{lab.testName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lab.status === 'Completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {lab.status}
                      </span>
                    </div>
                    {lab.result && (
                      <p className={`text-xs mt-1 ${
                        lab.isAbnormal ? 'text-red-600 font-semibold' : 'text-slate-600'
                      }`}>
                        Result: {lab.result}
                        {lab.isAbnormal && ' ⚠️'}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Ordered: {format(new Date(lab.orderedDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No recent lab results</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4"></div>

          {/* Alerts */}
          {(selectedPatient.flags.hasAllergies || selectedPatient.flags.isHighRisk) && (
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-slate-800 flex items-center text-sm mb-2">
                <AlertTriangle className="mr-2 text-red-600" size={16} />
                Active Alerts
              </h3>
              <div className="space-y-1 text-sm">
                {selectedPatient.flags.hasAllergies && selectedPatient.flags.allergyList && (
                  <p className="text-red-700 font-medium">
                    ⚠️ Allergies: {selectedPatient.flags.allergyList}
                  </p>
                )}
                {selectedPatient.flags.isHighRisk && (
                  <p className="text-red-700 font-medium">
                    ⚠️ High Risk Patient
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Rest of the form (Chief Complaint, Vitals, etc.) */}

            {/* Chief Complaint */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Chief Complaint</h2>
              <textarea
                required
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                placeholder="Enter treatment plan..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
{/* PRESCRIPTIONS SECTION */}
<div className="bg-white rounded-lg border border-slate-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
      <Pill className="mr-2 text-purple-600" size={20} />
      Medications Management
    </h2>
  </div>

  {/* CURRENT MEDICATIONS */}
  {patientHistory.activePrescriptions.length > 0 && (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center">
          <CheckCircle className="mr-2 text-green-600" size={16} />
          Current Medications ({patientHistory.activePrescriptions.length})
        </h3>
        <span className="text-xs text-slate-500">Review and update as needed</span>
      </div>

      <div className="space-y-3 mb-4">
        {patientHistory.activePrescriptions.map((rx) => (
          <CurrentMedicationCard
            key={rx.id}
            prescription={rx}
            onUpdate={async (updates) => {
              try {
                await prescriptionApi.update(rx.id, updates);
                toast.success('Medication updated');
                if (selectedPatient) {
                  loadPatientHistory(selectedPatient.id);
                }
              } catch (error) {
                toast.error('Failed to update medication');
              }
            }}
            onDiscontinue={async () => {
              if (window.confirm(`Discontinue ${rx.medicationName}?`)) {
                try {
                  if (user) {
                    await prescriptionApi.cancel(rx.id, 'Discontinued by provider', user.id);
                    toast.success('Medication discontinued');
                    if (selectedPatient) {
                      loadPatientHistory(selectedPatient.id);
                    }
                  }
                } catch (error) {
                  toast.error('Failed to discontinue medication');
                }
              }
            }}
          />
        ))}
      </div>
      <div className="border-t border-slate-200 pt-4"></div>
    </div>
  )}

  {/* NEW PRESCRIPTIONS */}
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-slate-800 text-sm flex items-center">
        <Plus className="mr-2 text-purple-600" size={16} />
        New Prescriptions ({prescriptionDrafts.length})
      </h3>
      {!showPrescriptionForm && (
        <button
          type="button"
          onClick={() => setShowPrescriptionForm(true)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>Add Prescription</span>
        </button>
      )}
    </div>

    {/* Prescription Form */}
    {showPrescriptionForm && (
      <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-purple-900">New Prescription</h3>
          <button
            type="button"
            onClick={() => setShowPrescriptionForm(false)}
            className="text-purple-600 hover:text-purple-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medication <span className="text-red-500">*</span>
            </label>
            <select
              value={newPrescription.medicationName}
              onChange={(e) => setNewPrescription({ ...newPrescription, medicationName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select medication...</option>
              {COMMON_MEDICATIONS.map(med => (
                <option key={med} value={med}>{med}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dosage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPrescription.dosage}
              onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
              placeholder="e.g., 500mg"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              value={newPrescription.frequency}
              onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select...</option>
              {frequencyOptions.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration
            </label>
            <select
              value={newPrescription.duration}
              onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select...</option>
              {durationOptions.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={newPrescription.quantity}
              onChange={(e) => setNewPrescription({ ...newPrescription, quantity: e.target.value })}
              placeholder="30"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions
            </label>
            <input
              type="text"
              value={newPrescription.instructions}
              onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
              placeholder="Take with food..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddPrescription}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Add to List
          </button>
        </div>
      </div>
    )}

    {/* Prescription Drafts List */}
    {prescriptionDrafts.length === 0 ? (
      <p className="text-center text-slate-500 py-4 text-sm">No new prescriptions added</p>
    ) : (
      <div className="space-y-3">
        {prescriptionDrafts.map((rx) => (
          <div key={rx.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{rx.medicationName}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">Dosage:</span> {rx.dosage}
                  </div>
                  <div>
                    <span className="font-medium">Frequency:</span> {rx.frequency}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {rx.duration || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Qty:</span> {rx.quantity || 'N/A'}
                  </div>
                </div>
                {rx.instructions && (
                  <p className="text-xs text-slate-500 mt-2 italic">{rx.instructions}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemovePrescription(rx.id)}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

            {/* LAB ORDERS SECTION */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <TestTube className="mr-2 text-green-600" size={20} />
                  Lab Orders ({labOrderDrafts.length})
                </h2>
                {!showLabForm && (
                  <button
                    type="button"
                    onClick={() => setShowLabForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus size={18} />
                    <span>Order Lab Test</span>
                  </button>
                )}
              </div>

              {/* Lab Order Form */}
              {showLabForm && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-900">New Lab Order</h3>
                    <button
                      type="button"
                      onClick={() => setShowLabForm(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Test Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newLabOrder.testType}
                        onChange={(e) => setNewLabOrder({ ...newLabOrder, testType: e.target.value, testName: '' })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select type...</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="Urinalysis">Urinalysis</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="ECG">ECG</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Test Name <span className="text-red-500">*</span>
                      </label>
                      {getTestNameOptions().length > 0 ? (
                        <select
                          value={newLabOrder.testName}
                          onChange={(e) => setNewLabOrder({ ...newLabOrder, testName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select test...</option>
                          {getTestNameOptions().map(test => (
                            <option key={test} value={test}>{test}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newLabOrder.testName}
                          onChange={(e) => setNewLabOrder({ ...newLabOrder, testName: e.target.value })}
                          placeholder="Enter test name"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Clinical Notes
                      </label>
                      <textarea
                        value={newLabOrder.notes}
                        onChange={(e) => setNewLabOrder({ ...newLabOrder, notes: e.target.value })}
                        placeholder="Reason for test..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddLabOrder}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              )}

              {/* Lab Orders List */}
              {labOrderDrafts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No lab tests ordered</p>
              ) : (
                <div className="space-y-3">
                  {labOrderDrafts.map((lab) => (
                    <div key={lab.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{lab.testName}</h4>
                          <p className="text-sm text-slate-600 mt-1">{lab.testType}</p>
                          {lab.notes && (
                            <p className="text-xs text-slate-500 mt-2 italic">{lab.notes}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLabOrder(lab.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-up with Auto-Booking */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <CalendarIcon className="mr-2 text-blue-600" size={20} />
                Follow-up Appointment
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="mr-3 w-5 h-5"
                  />
                  <label htmlFor="followUpRequired" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Schedule follow-up appointment
                  </label>
                </div>

                {formData.followUpRequired && (
                  <div className="pl-8 space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">
                      📅 A follow-up appointment will be automatically scheduled when you save this encounter
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Follow-up Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                          min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                          max={format(addDays(new Date(), 90), 'yyyy-MM-dd')}
                          required={formData.followUpRequired}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Duration
                        </label>
                        <select
                          value={formData.followUpDuration}
                          onChange={(e) => setFormData({ ...formData, followUpDuration: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>1 hour</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(isAutoMode ? '/appointments' : '/clinical')}
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
                    : `Save Encounter ${prescriptionDrafts.length > 0 || labOrderDrafts.length > 0 ? '& Orders' : ''}`}
                </span>
              </button>
            </div>
            
          </>
        )}
      </form>

      {showManageMedsModal && selectedPatient && (
  <ManageActiveMedicationsModal
    patientId={selectedPatient.id}
    onClose={() => setShowManageMedsModal(false)}
    onUpdate={() => loadPatientHistory(selectedPatient.id)}
  />
)}
    </div>
  );
};