import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionApi, patientApi, encounterApi, authApi } from '../../../core/services/api';
import { Prescription, Patient, Encounter } from '../../../core/models';
import { useAuthStore } from '../../../store/authStore';
import {
  ArrowLeft, Pill, User, Calendar, Clock, FileText,
  Package, CheckCircle, XCircle, AlertTriangle, Printer,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react'; // Add to imports
import { RefillRequest } from '../../../core/models';
import { refillRequestApi } from '../../../core/services/api'; // Add to imports

export const PrescriptionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDispenseModal, setShowDispenseModal] = useState(false);

  const [showRequestRefillModal, setShowRequestRefillModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

 const loadData = async () => {
  if (!id) {
    console.log('❌ No ID in URL params');
    return;
  }

  console.log('🔍 Loading prescription with ID:', id);

  try {
    setLoading(true);
    const rx = await prescriptionApi.getById(id);

    console.log('📦 Prescription data received:', rx);

    if (!rx) {
      console.log('❌ Prescription is null/undefined');
      toast.error('Prescription not found');
      navigate('/pharmacy/prescriptions');
      return;
    }

    setPrescription(rx);

    // Load related data
    console.log('👤 Loading patient with ID:', rx.patientId);
    const [patientData, providerData] = await Promise.all([
      patientApi.getById(rx.patientId),
      authApi.getUserById(rx.providerId)
    ]);

    console.log('👤 Patient data received:', patientData);
    console.log('👨‍⚕️ Provider data received:', providerData);

    setPatient(patientData);
    setProvider(providerData);

    // Load encounter if exists
    if (rx.encounterId) {
      console.log('📋 Loading encounter with ID:', rx.encounterId);
      const encounterData = await encounterApi.getById(rx.encounterId);
      console.log('📋 Encounter data received:', encounterData);
      setEncounter(encounterData);
    }

    console.log('✅ All data loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load prescription:', error);
    toast.error('Failed to load prescription details');
  } finally {
    setLoading(false);
  }
};

  const handleRequestRefill = async () => {
  if (!prescription) return;
  
  // Check if prescription has refills
  if (prescription.refills <= 0) {
    toast.error('No refills remaining on this prescription');
    return;
  }
  
  // Check if prescription is dispensed
  if (prescription.status !== 'Dispensed') {
    toast.error('Can only request refill for dispensed prescriptions');
    return;
  }
  
  try {
    const allRequests = await refillRequestApi.getAll();
    const nextId = allRequests.length + 1;
    const refillRequestNumber = `RFR${Date.now()}`;
    
    const newRequest: RefillRequest = {
      id: `refill-req-${nextId}`,
      refillRequestNumber,
      originalPrescriptionId: prescription.id,
      patientId: prescription.patientId,
      medicationName: prescription.medicationName,
      requestedDate: new Date().toISOString(),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    await refillRequestApi.create(newRequest);
    toast.success('Refill request submitted to doctor for review');
  } catch (error) {
    console.error('Failed to request refill:', error);
    toast.error('Failed to request refill');
  }
};

  const handleMarkReady = async () => {
    if (!prescription || !currentUser) return;

    try {
      await prescriptionApi.markAsReady(prescription.id, currentUser.id, currentUser.fullName);
      toast.success('Prescription marked as ready for pickup');
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCancelPrescription = async () => {
    if (!prescription || !currentUser) return;

    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await prescriptionApi.cancel(prescription.id, reason, currentUser.id);
      toast.success('Prescription cancelled');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel prescription');
    }
  };

  const getStatusColor = (status: Prescription['status']) => {
    const colors: Record<Prescription['status'], string> = {
      'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
      'Sent to Pharmacy': 'bg-amber-100 text-amber-700 border-amber-200',
      'Ready': 'bg-green-100 text-green-700 border-green-200',
      'Dispensed': 'bg-purple-100 text-purple-700 border-purple-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Prescription['status']) => {
    switch (status) {
      case 'Pending':
      case 'Sent to Pharmacy':
        return <Clock size={20} />;
      case 'Ready':
        return <Package size={20} />;
      case 'Dispensed':
        return <CheckCircle size={20} />;
      case 'Cancelled':
        return <XCircle size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!prescription || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/pharmacy/prescriptions')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Prescription Details</h1>
            <p className="text-slate-600 mt-1 font-mono">{prescription.rxNumber}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(prescription.status)}`}>
          {getStatusIcon(prescription.status)}
          <span className="ml-2">{prescription.status}</span>
        </span>
      </div>

      {/* Patient Alerts */}
      {(patient.flags.hasAllergies || patient.flags.isHighRisk) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ PATIENT ALERTS</h3>
              <div className="space-y-1 text-sm text-red-800">
                {patient.flags.hasAllergies && patient.flags.allergyList && (
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Allergies:</span>
                    <span className="font-semibold">{patient.flags.allergyList}</span>
                  </p>
                )}
                {patient.flags.isHighRisk && (
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    <span className="font-semibold">High Risk Patient</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {prescription.status === 'Dispensed' && prescription.refills > 0 && (
  <button
    onClick={handleRequestRefill}
    className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
  >
    <RefreshCcw size={18} className="mr-2" />
    Request Refill
  </button>
)}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            Patient Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-sm text-slate-500 font-mono">{patient.mrn}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Date of Birth:</span>
                <span className="font-medium text-slate-800">
                  {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                  {' '}({new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Gender:</span>
                <span className="font-medium text-slate-800">{patient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Phone:</span>
                <span className="font-medium text-slate-800">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Email:</span>
                  <span className="font-medium text-slate-800">{patient.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Insurance:</span>
                <span className="font-medium text-slate-800">{patient.insurance.type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medication Details */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Pill className="mr-2 text-purple-600" size={20} />
            Medication Details
          </h2>
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-800 mb-1">
                {prescription.medicationName}
              </p>
              <p className="text-sm text-slate-600">Prescription Medication</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Dosage</p>
                <p className="font-semibold text-slate-800">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Form</p>
                <p className="font-semibold text-slate-800">
                  {prescription.medicationName.toLowerCase().includes('tablet') ? 'Tablet' : 
                   prescription.medicationName.toLowerCase().includes('capsule') ? 'Capsule' : 
                   prescription.medicationName.toLowerCase().includes('syrup') ? 'Syrup' : 'Oral'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Quantity</p>
                <p className="font-semibold text-slate-800">{prescription.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Refills Remaining</p>
                <p className="font-semibold text-slate-800">{prescription.refills}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directions for Use */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <FileText className="mr-2 text-green-600" size={20} />
          Directions for Use
        </h2>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-slate-800 font-medium mb-2">
              {prescription.frequency}
            </p>
            {prescription.duration && (
              <p className="text-sm text-slate-600">
                Duration: {prescription.duration}
              </p>
            )}
          </div>
          {prescription.instructions && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Special Instructions:</p>
              <p className="text-slate-800">{prescription.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Prescriber Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <User className="mr-2 text-blue-600" size={20} />
          Prescriber Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{provider?.fullName || 'Unknown Provider'}</p>
              <p className="text-sm text-slate-600">{provider?.role || 'Provider'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center">
                <Calendar className="mr-2" size={16} />
                Date Prescribed:
              </span>
              <span className="font-medium text-slate-800">
                {format(new Date(prescription.createdAt), 'MMM dd, yyyy h:mm a')}
              </span>
            </div>
            {encounter && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center">
                  <FileText className="mr-2" size={16} />
                  Encounter:
                </span>
                <button
                  onClick={() => navigate(`/clinical/${encounter.id}`)}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  {encounter.encounterNumber}
                  <ArrowLeft className="ml-1 rotate-180" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Activity className="mr-2 text-purple-600" size={20} />
          Status Timeline
        </h2>
        
        <div className="relative">
          {/* Timeline */}
          <div className="flex items-center justify-between mb-8">
            {/* Prescribed */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                prescription.status !== 'Cancelled' ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-500'
              }`}>
                <CheckCircle size={20} />
              </div>
              <p className="text-xs font-medium text-slate-700 mt-2">Prescribed</p>
              <p className="text-xs text-slate-500 mt-1">
                {format(new Date(prescription.createdAt), 'MMM dd')}
              </p>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-1 ${
              prescription.status === 'Ready' || prescription.status === 'Dispensed' 
                ? 'bg-purple-600' 
                : 'bg-slate-300'
            }`} />

            {/* Sent to Pharmacy */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                prescription.status !== 'Pending' && prescription.status !== 'Cancelled'
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-300 text-slate-500'
              }`}>
                <Package size={20} />
              </div>
              <p className="text-xs font-medium text-slate-700 mt-2">Sent</p>
              <p className="text-xs text-slate-500 mt-1">
                {prescription.status !== 'Pending' && prescription.status !== 'Cancelled'
                  ? format(new Date(prescription.createdAt), 'MMM dd')
                  : '-'}
              </p>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-1 ${
              prescription.status === 'Ready' || prescription.status === 'Dispensed'
                ? 'bg-purple-600' 
                : 'bg-slate-300'
            }`} />

            {/* Ready */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                prescription.status === 'Ready' || prescription.status === 'Dispensed'
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-300 text-slate-500'
              }`}>
                <Package size={20} />
              </div>
              <p className="text-xs font-medium text-slate-700 mt-2">Ready</p>
              <p className="text-xs text-slate-500 mt-1">
                {prescription.status === 'Ready' || prescription.status === 'Dispensed'
                  ? prescription.updatedAt ? format(new Date(prescription.updatedAt), 'MMM dd') : '-'
                  : '-'}
              </p>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-1 ${
              prescription.status === 'Dispensed' ? 'bg-purple-600' : 'bg-slate-300'
            }`} />

            {/* Dispensed */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                prescription.status === 'Dispensed'
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-300 text-slate-500'
              }`}>
                <CheckCircle size={20} />
              </div>
              <p className="text-xs font-medium text-slate-700 mt-2">Dispensed</p>
              <p className="text-xs text-slate-500 mt-1">
                {prescription.dispensedAt 
                  ? format(new Date(prescription.dispensedAt), 'MMM dd')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Dispensing Info */}
          {prescription.status === 'Dispensed' && prescription.dispensedBy && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Dispensed by:</span> {prescription.dispensedBy}
              </p>
              {prescription.dispensedAt && (
                <p className="text-sm text-slate-700 mt-1">
                  <span className="font-medium">Date & Time:</span>{' '}
                  {format(new Date(prescription.dispensedAt), 'MMMM dd, yyyy h:mm a')}
                </p>
              )}
            </div>
          )}

          {/* Cancellation Info */}
          {prescription.status === 'Cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-red-900 mb-1">Prescription Cancelled</p>
              {prescription.cancellationReason && (
                <p className="text-sm text-red-700">Reason: {prescription.cancellationReason}</p>
              )}
              {prescription.cancelledAt && (
                <p className="text-xs text-red-600 mt-1">
                  {format(new Date(prescription.cancelledAt), 'MMM dd, yyyy h:mm a')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center bg-white rounded-lg border border-slate-200 p-6">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2"
        >
          <Printer size={18} />
          <span>Print</span>
        </button>

        <div className="flex space-x-3">
          {prescription.status !== 'Cancelled' && prescription.status !== 'Dispensed' && (
            <button
              onClick={handleCancelPrescription}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel Prescription
            </button>
          )}

          {(prescription.status === 'Pending' || prescription.status === 'Sent to Pharmacy') && (
            <button
              onClick={handleMarkReady}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Package size={18} />
              <span>Mark as Ready</span>
            </button>
          )}

          {prescription.status === 'Ready' && (
            <button
              onClick={() => setShowDispenseModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle size={18} />
              <span>Dispense Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Dispense Modal */}
      {showDispenseModal && (
        <DispenseModal
          prescription={prescription}
          patient={patient}
          onClose={() => setShowDispenseModal(false)}
          onSuccess={() => {
            setShowDispenseModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Dispense Modal Component
interface DispenseModalProps {
  prescription: Prescription;
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}

const DispenseModal: React.FC<DispenseModalProps> = ({
  prescription,
  patient,
  onClose,
  onSuccess
}) => {
  const currentUser = useAuthStore(state => state.user);
  const [checklist, setChecklist] = useState({
    patientIdVerified: false,
    medicationConfirmed: false,
    counselingProvided: false,
    sideEffectsDiscussed: false
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = Object.values(checklist).every(Boolean);

  const handleDispense = async () => {
    if (!allChecked) {
      toast.error('Please complete all verification steps');
      return;
    }

    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      await prescriptionApi.dispense(
        prescription.id,
        currentUser.id,
        currentUser.fullName,
        notes || undefined
      );
      toast.success('Prescription dispensed successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to dispense prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Dispense Prescription</h2>
          <p className="text-slate-600 mt-1">Complete verification before dispensing</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Patient</p>
                <p className="font-semibold text-slate-800">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Medication</p>
                <p className="font-semibold text-slate-800">{prescription.medicationName}</p>
              </div>
              <div>
                <p className="text-slate-600">Dosage</p>
                <p className="font-semibold text-slate-800">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-slate-600">Quantity</p>
                <p className="font-semibold text-slate-800">{prescription.quantity}</p>
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Verification Checklist</h3>
            <div className="space-y-3">
              {Object.entries({
                patientIdVerified: 'Patient ID verified',
                medicationConfirmed: 'Medication details confirmed',
                counselingProvided: 'Patient counseled on proper usage',
                sideEffectsDiscussed: 'Potential side effects discussed'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist[key as keyof typeof checklist]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dispensing Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Dispensed By</p>
              <p className="font-medium text-slate-800">{currentUser?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Date & Time</p>
              <p className="font-medium text-slate-800">
                {format(new Date(), 'MMM dd, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or observations..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDispense}
            disabled={!allChecked || isSubmitting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Dispensing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Complete Dispensing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};