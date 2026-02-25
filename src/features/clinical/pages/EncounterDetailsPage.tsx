import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  encounterApi, patientApi, authApi, prescriptionApi, 
  labResultApi, billingApi, appointmentApi 
} from '../../../core/services/api';
import { PatientMedicalHistory } from '../components/PatientMedicalHistory';
import { VitalsDisplay } from '../components/VitalsDisplay';
import { PrescriptionsList } from '../components/PrescriptionsList';
import { 
  ArrowLeft, FileText, Calendar, User, Activity, 
  AlertCircle, Pill, DollarSign, TestTube, 
  Printer, Edit, CheckCircle, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreatePrescriptionModal } from '../components/CreatePrescriptionModal';
import { OrderLabTestModal } from '../components/OrderLabTestModal';

export const EncounterDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [encounter, setEncounter] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [claim, setClaim] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
const [isLabModalOpen, setIsLabModalOpen] = useState(false);
const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);
const [isOrderingLab, setIsOrderingLab] = useState(false);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    setCurrentUser(user);
    if (id) {
      loadEncounterDetails(id);
    }
  }, [id]);

  const loadEncounterDetails = async (encounterId: string) => {
    try {
      const enc = await encounterApi.getById(encounterId);
      if (!enc) {
        toast.error('Encounter not found');
        navigate('/clinical');
        return;
      }

      const [pat, prov, rxList, labs, claims, appts] = await Promise.all([
        patientApi.getById(enc.patientId),
        Promise.resolve(authApi.getAllUsers().find(u => u.id === enc.providerId)),
        prescriptionApi.search(rx => rx.encounterId === encounterId),
        labResultApi.search(lab => lab.encounterId === encounterId),
        billingApi.search(c => c.encounterId === encounterId),
        enc.appointmentId ? appointmentApi.getById(enc.appointmentId) : Promise.resolve(null)
      ]);

      setEncounter(enc);
      setPatient(pat);
      setProvider(prov);
      setPrescriptions(rxList);
      setLabResults(labs);
      setClaim(claims[0] || null);
      setAppointment(appts);
    } catch (error) {
      toast.error('Failed to load encounter details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseEncounter = async () => {
    if (!encounter) return;
    if (!confirm('Close this encounter? It cannot be reopened.')) return;

    try {
      await encounterApi.update(encounter.id, {
        status: 'Closed',
        closedAt: new Date().toISOString()
      });
      toast.success('Encounter closed');
      loadEncounterDetails(encounter.id);
    } catch (error) {
      toast.error('Failed to close encounter');
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

  if (!encounter || !patient) {
    return null;
  }

  const handleCreatePrescription = async (data: any) => {
  if (!encounter || !currentUser) return;

  setIsCreatingPrescription(true);
  try {
    const newPrescription = {
      id: `rx-${Date.now()}`,
      rxNumber: prescriptionApi.generateRxNumber(),
      patientId: encounter.patientId,
      providerId: currentUser.id,
      encounterId: encounter.id,
      medicationName: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      quantity: parseInt(data.quantity),
      refills: parseInt(data.refills),
      instructions: data.instructions,
      status: 'Sent to Pharmacy' as const,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    await prescriptionApi.create(newPrescription);

    // Update encounter to link prescription
    const existingRxIds = encounter.prescriptionIds || [];
    await encounterApi.update(encounter.id, {
      prescriptionIds: [...existingRxIds, newPrescription.id]
    });

    toast.success('Prescription created and sent to pharmacy!');
    setIsPrescriptionModalOpen(false);
    loadEncounterDetails(encounter.id);
  } catch (error) {
    toast.error('Failed to create prescription');
  } finally {
    setIsCreatingPrescription(false);
  }
};

const handleOrderLabTest = async (data: any) => {
  if (!encounter || !currentUser) return;

  setIsOrderingLab(true);
  try {
    const newLabOrder = {
      id: `lab-${Date.now()}`,
      labOrderNumber: labResultApi.generateLabOrderNumber(),
      patientId: encounter.patientId,
      encounterId: encounter.id,
      orderedBy: currentUser.id,
      orderedByName: currentUser.fullName,
      testName: data.testName,
      testType: data.testType,
      status: 'Ordered' as const,
      priority: data.priority,
      notes: data.notes,
      orderedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    await labResultApi.create(newLabOrder);

    // Update encounter to link lab order
    const existingLabIds = encounter.labOrderIds || [];
    await encounterApi.update(encounter.id, {
      labOrderIds: [...existingLabIds, newLabOrder.id]
    });

    toast.success('Lab test ordered successfully!');
    setIsLabModalOpen(false);
    loadEncounterDetails(encounter.id);
  } catch (error) {
    toast.error('Failed to order lab test');
  } finally {
    setIsOrderingLab(false);
  }
};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clinical')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Clinical Encounter</h1>
            <p className="text-slate-600 mt-1">#{encounter.encounterNumber}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {encounter.status === 'Closed' ? (
            <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300">
              <Lock size={18} className="mr-2" />
              Encounter Closed
            </span>
          ) : (
            <button
              onClick={handleCloseEncounter}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle size={18} />
              <span>Close Encounter</span>
            </button>
          )}
          
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-2"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>

          {encounter.status === 'Open' && (
            <button
              onClick={() => toast.info('Edit functionality coming soon')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit size={18} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Print Header (hidden on screen) */}
      <div className="hidden print:block mb-8">
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold">WebIMS Healthcare</h1>
          <p className="text-sm text-slate-600">Clinical Encounter Report</p>
        </div>
      </div>

      {/* Alerts */}
      {(patient.flags?.hasAllergies || patient.flags?.isHighRisk) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 print:border print:border-red-600">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-semibold text-red-900 text-lg">⚠️ PATIENT ALERTS</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-800">
                {patient.flags.hasAllergies && (
                  <li className="font-medium">
                    🔴 ALLERGIES: {patient.flags.allergyList || 'See patient record'}
                  </li>
                )}
                {patient.flags.isHighRisk && (
                  <li className="font-medium">⚠️ HIGH RISK PATIENT</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encounter Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Patient Information</h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-slate-600">Patient Name</p>
                    <p className="font-semibold text-slate-800 text-lg">
                      {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">MRN</p>
                    <p className="font-mono font-semibold text-slate-800">{patient.mrn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Age / Gender</p>
                    <p className="text-slate-800">
                      {calculateAge(patient.dateOfBirth)} years / {patient.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Insurance</p>
                    <p className="text-slate-800">{patient.insurance.type}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Visit Information</h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-slate-600">Visit Date</p>
                    <p className="font-semibold text-slate-800">
                      {format(new Date(encounter.visitDate), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Provider</p>
                    <p className="text-slate-800">{provider?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{provider?.role}</p>
                  </div>
                  {appointment && (
                    <div>
                      <p className="text-sm text-slate-600">Appointment Type</p>
                      <p className="text-slate-800">{appointment.appointmentType}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <FileText className="mr-2 text-blue-600" size={20} />
              Chief Complaint
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:border print:border-blue-600">
              <p className="text-slate-800 leading-relaxed">{encounter.chiefComplaint}</p>
            </div>
          </div>

          {/* Vitals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Activity className="mr-2 text-red-600" size={20} />
              Vital Signs
            </h2>
            <VitalsDisplay vitals={encounter.vitals} />
          </div>

          {/* Physical Examination */}
          {encounter.physicalExam && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Physical Examination</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{encounter.physicalExam}</p>
            </div>
          )}

          {/* Diagnoses */}
          {encounter.diagnoses && encounter.diagnoses.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Diagnoses</h2>
              <div className="flex flex-wrap gap-3">
                {encounter.diagnoses.map((diagnosis: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg border border-purple-200 font-medium"
                  >
                    <Activity size={16} className="mr-2" />
                    {diagnosis}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assessment */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Assessment</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{encounter.assessment}</p>
          </div>

          {/* Treatment Plan */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Treatment Plan</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{encounter.plan}</p>
          </div>

          {/* Follow-up */}
          {encounter.followUpDate && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <Calendar className="mr-2 text-green-600" size={20} />
                Follow-up Scheduled
              </h2>
              <p className="text-slate-700">
                {format(new Date(encounter.followUpDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          )}

          {/* Prescriptions */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Pill className="mr-2 text-purple-600" size={20} />
                Prescriptions ({prescriptions.length})
              </h2>
{encounter.status === 'Open' && (
  <button
    onClick={() => setIsPrescriptionModalOpen(true)}
    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
  >
    + Add Prescription
  </button>
)}
            </div>
            <PrescriptionsList prescriptions={prescriptions} />
          </div>

          {/* Lab Results */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <TestTube className="mr-2 text-green-600" size={20} />
                Lab Results ({labResults.length})
              </h2>
{encounter.status === 'Open' && (
  <button
    onClick={() => setIsLabModalOpen(true)}
    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
  >
    + Order Lab Test
  </button>
)}
            </div>
            
            {labResults.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-sm">No lab tests ordered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {labResults.map((lab) => (
                  <div key={lab.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">{lab.testName}</h4>
                        <p className="text-sm text-slate-600">{lab.testType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lab.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {lab.status}
                      </span>
                    </div>
                    {lab.result && (
                      <div className="mt-3 p-3 bg-slate-50 rounded">
                        <p className="text-sm font-medium text-slate-700">Result:</p>
                        <p className="text-slate-800 mt-1">{lab.result}</p>
                        {lab.isAbnormal && (
                          <div className="flex items-center mt-2">
                            <AlertCircle className="text-red-600 mr-1" size={16} />
                            <span className="text-sm text-red-600 font-medium">Abnormal Result</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 print:border-2 print:break-before-page">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <DollarSign className="mr-2 text-amber-600" size={20} />
                Billing Information
              </h2>
              {!claim && encounter.status === 'Open' && (
                <button
                  onClick={() => navigate(`/billing/new?encounterId=${encounter.id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Generate Claim
                </button>
              )}
            </div>

            {claim ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">Claim #{claim.claimNumber}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Amount: ${claim.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    claim.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    claim.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {claim.status}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/billing/${claim.id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Claim Details →
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 text-sm">No billing claim generated</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Medical History */}
        <div className="lg:col-span-1 print:hidden">
          <div className="sticky top-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Medical History</h2>
            <PatientMedicalHistory patientId={patient.id} currentEncounterId={encounter.id} />
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300">
        <div className="flex justify-between text-xs text-slate-600">
          <div>
            <p>Provider: {provider?.fullName}</p>
            <p>Encounter: {encounter.encounterNumber}</p>
          </div>
          <div className="text-right">
            <p>Printed: {format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
            <p>Page 1 of 1</p>
          </div>
        </div>
      </div>

      
         {/* Modals */}
      <CreatePrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSubmit={handleCreatePrescription}
        patientName={`${patient?.firstName} ${patient?.lastName}`}
        isLoading={isCreatingPrescription}
      />

      <OrderLabTestModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        onSubmit={handleOrderLabTest}
        patientName={`${patient?.firstName} ${patient?.lastName}`}
        isLoading={isOrderingLab}
      />
    </div>
  );
};