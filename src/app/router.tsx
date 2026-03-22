import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { MainLayout } from '../layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { ClinicDashboard } from '../features/dashboard/pages/ClinicDashboard';
import { PatientsListPage } from '../features/patients/pages/PatientsListPage';
import { CreatePatientPage } from '../features/patients/pages/CreatePatientPage';
import { EditPatientPage } from '../features/patients/pages/EditPatientPage';
import { PatientDetailsPage } from '../features/patients/pages/PatientDetailsPage';
import { AppointmentsPage } from '../features/appointments/pages/AppointmentsPage';
import { NewAppointmentPage } from '../features/appointments/pages/NewAppointmentPage';
import { ClinicalNotesPage } from '../features/clinical/pages/ClinicalNotesPage';
import { NewEncounterPage } from '../features/clinical/pages/NewEncounterPage';
import { BillingPage } from '../features/billing/pages/BillingPage';
import { AppointmentDetailsPage } from '../features/appointments/pages/AppointmentDetailsPage';
import { RescheduleAppointmentPage } from '../features/appointments/pages/RescheduleAppointmentPage';
import { EncounterDetailsPage } from '../features/clinical/pages/EncounterDetailsPage';
import { PrescriptionsPage } from '../features/pharmacy/pages/PrescriptionsPage';
import { PrescriptionDetailsPage } from '../features/pharmacy/pages/PrescriptionDetailsPage';
import { InventoryPage } from '../features/pharmacy/pages/InventoryPage';
import { AddEditMedicationPage } from '../features/pharmacy/pages/AddEditMedicationPage';
import { MedicationDetailsPage } from '../features/pharmacy/pages/MedicationDetailsPage';
import { RefillRequestsPage } from '../features/clinical/pages/RefillRequestsPage';
import { NewClaimPage } from '../features/billing/pages/NewClaimPage';
import { ClaimDetailsPage } from '../features/billing/pages/ClaimDetailsPage';
import { LabResultsPage }      from '../features/lab/pages/LabResultsPage';
import { EnterResultsPage }    from '../features/lab/pages/EnterResultsPage';
import { LabResultDetailsPage } from '../features/lab/pages/LabResultDetailsPage';
import { ResidentsPage }       from '../features/ltc/pages/ResidentsPage';
import { AddEditResidentPage } from '../features/ltc/pages/AddEditResidentPage';
import { ResidentDetailsPage } from '../features/ltc/pages/ResidentDetailsPage';
import { CareNotesPage }       from '../features/ltc/pages/CareNotesPage';
import { NewCareNotePage }     from '../features/ltc/pages/NewCareNotePage';
import { CareNoteDetailsPage } from '../features/ltc/pages/CareNoteDetailsPage';


export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignUpPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <ClinicDashboard />
      },
      // Patients
      {
        path: 'patients',
        children: [
          {
            index: true,
            element: <PatientsListPage />
          },
          {
            path: 'new',
            element: <CreatePatientPage />
          },
          {
            path: ':id',
            element: <PatientDetailsPage />
          },
          {
            path: ':id/edit',
            element: <EditPatientPage />
          }
        ]
      },
      // Appointments
      {
        path: 'appointments',
        children: [
          {
            index: true,
            element: <AppointmentsPage />
          },
          {
            path: 'new',
            element: <NewAppointmentPage />
          },
          {
            path: ':id',
            element: <AppointmentDetailsPage />
          },
          {
            path: ':id/reschedule',
            element: <RescheduleAppointmentPage />
          }
        ]
      },
      // Clinical
      {
        path: 'clinical',
        children: [
          {
            index: true,
            element: <ClinicalNotesPage />
          },
          {
            path: 'new',
            element: <NewEncounterPage />
          },
          {
            path: ':id',
            element: <EncounterDetailsPage />
          },
              {
      path: 'refill-requests',  // ✅ Add this
      element: <RefillRequestsPage />
    }
        ]
      },
      // Billing
{
  path: 'billing',
  children: [
    {
      index: true,
      element: <BillingPage />
    },
    {
      path: 'new',
      element: <NewClaimPage />         // ✅ was placeholder
    },
    {
      path: ':id',
      element: <ClaimDetailsPage />     // ✅ was placeholder
    }
  ]
},
{
  path: 'lab',
  children: [
    {
      index: true,
      element: <LabResultsPage />
    },
    {
      path: ':id',
      element: <LabResultDetailsPage />
    },
    {
      path: ':id/enter-results',
      element: <EnterResultsPage />
    }
  ]
},
      // Pharmacy - ✅ FIXED: Removed duplicate MainLayout wrapper
      {
        path: 'pharmacy',
        children: [
          {
            path: 'prescriptions',
            element: <PrescriptionsPage />
          },
          {
            path: 'prescriptions/:id',
            element: <PrescriptionDetailsPage />
          },
          {
            path: 'inventory',
            element: <InventoryPage />
          },
          {
            path: 'inventory/new',
            element: <AddEditMedicationPage />
          },
          {
            path: 'inventory/:id',
            element: <MedicationDetailsPage />
          },
          {
            path: 'inventory/:id/edit',
            element: <AddEditMedicationPage />
          }
        ]
      },
      // LTC (placeholder)
{
  path: 'ltc',
  children: [
    {
      path: 'residents',
      children: [
        { index: true,       element: <ResidentsPage /> },
        { path: 'new',       element: <AddEditResidentPage /> },
        { path: ':id',       element: <ResidentDetailsPage /> },
        { path: ':id/edit',  element: <AddEditResidentPage /> }
      ]
    },
    {
      path: 'care-notes',
      children: [
        { index: true,  element: <CareNotesPage /> },
        { path: 'new',  element: <NewCareNotePage /> },
        { path: ':id',  element: <CareNoteDetailsPage /> }
      ]
    }
  ]
},
    ]
  }
]);