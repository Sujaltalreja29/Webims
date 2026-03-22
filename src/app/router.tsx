import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/auth/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { MainLayout } from '../layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import type { UserRole } from '../core/models';
import { ACCESS_CONTROL } from '../core/constants/access-control';
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

const withRoles = (roles: UserRole[], element: JSX.Element) => (
  <RoleProtectedRoute roles={roles}>{element}</RoleProtectedRoute>
);


export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
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
        path: 'dashboard',
        element: <ClinicDashboard />
      },
      // Patients
      {
        path: 'patients',
        children: [
          {
            index: true,
            element: withRoles(ACCESS_CONTROL.routes.patients, <PatientsListPage />)
          },
          {
            path: 'new',
            element: withRoles(ACCESS_CONTROL.routes.patients, <CreatePatientPage />)
          },
          {
            path: ':id',
            element: withRoles(ACCESS_CONTROL.routes.patients, <PatientDetailsPage />)
          },
          {
            path: ':id/edit',
            element: withRoles(ACCESS_CONTROL.routes.patients, <EditPatientPage />)
          }
        ]
      },
      // Appointments
      {
        path: 'appointments',
        children: [
          {
            index: true,
            element: withRoles(ACCESS_CONTROL.routes.appointments, <AppointmentsPage />)
          },
          {
            path: 'new',
            element: withRoles(ACCESS_CONTROL.routes.appointments, <NewAppointmentPage />)
          },
          {
            path: ':id',
            element: withRoles(ACCESS_CONTROL.routes.appointments, <AppointmentDetailsPage />)
          },
          {
            path: ':id/reschedule',
            element: withRoles(ACCESS_CONTROL.routes.appointments, <RescheduleAppointmentPage />)
          }
        ]
      },
      // Clinical
      {
        path: 'clinical',
        children: [
          {
            index: true,
            element: withRoles(ACCESS_CONTROL.routes.clinical, <ClinicalNotesPage />)
          },
          {
            path: 'new',
            element: withRoles(ACCESS_CONTROL.routes.clinical, <NewEncounterPage />)
          },
          {
            path: ':id',
            element: withRoles(ACCESS_CONTROL.routes.clinical, <EncounterDetailsPage />)
          },
              {
      path: 'refill-requests',  // ✅ Add this
      element: withRoles(ACCESS_CONTROL.routes.refillRequests, <RefillRequestsPage />)
    }
        ]
      },
      // Billing
{
  path: 'billing',
  children: [
    {
      index: true,
      element: withRoles(ACCESS_CONTROL.routes.billing, <BillingPage />)
    },
    {
      path: 'new',
      element: withRoles(ACCESS_CONTROL.routes.billing, <NewClaimPage />)         // ✅ was placeholder
    },
    {
      path: ':id',
      element: withRoles(ACCESS_CONTROL.routes.billing, <ClaimDetailsPage />)     // ✅ was placeholder
    }
  ]
},
{
  path: 'lab',
  children: [
    {
      index: true,
      element: withRoles(ACCESS_CONTROL.routes.lab, <LabResultsPage />)
    },
    {
      path: ':id',
      element: withRoles(ACCESS_CONTROL.routes.lab, <LabResultDetailsPage />)
    },
    {
      path: ':id/enter-results',
      element: withRoles(ACCESS_CONTROL.routes.lab, <EnterResultsPage />)
    }
  ]
},
      // Pharmacy - ✅ FIXED: Removed duplicate MainLayout wrapper
      {
        path: 'pharmacy',
        children: [
          {
            path: 'prescriptions',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyQueue, <PrescriptionsPage />)
          },
          {
            path: 'prescriptions/:id',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyQueue, <PrescriptionDetailsPage />)
          },
          {
            path: 'inventory',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyInventory, <InventoryPage />)
          },
          {
            path: 'inventory/new',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyInventory, <AddEditMedicationPage />)
          },
          {
            path: 'inventory/:id',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyInventory, <MedicationDetailsPage />)
          },
          {
            path: 'inventory/:id/edit',
            element: withRoles(ACCESS_CONTROL.routes.pharmacyInventory, <AddEditMedicationPage />)
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
        { index: true,       element: withRoles(ACCESS_CONTROL.routes.ltc, <ResidentsPage />) },
        { path: 'new',       element: withRoles(ACCESS_CONTROL.routes.ltc, <AddEditResidentPage />) },
        { path: ':id',       element: withRoles(ACCESS_CONTROL.routes.ltc, <ResidentDetailsPage />) },
        { path: ':id/edit',  element: withRoles(ACCESS_CONTROL.routes.ltc, <AddEditResidentPage />) }
      ]
    },
    {
      path: 'care-notes',
      children: [
        { index: true,  element: withRoles(ACCESS_CONTROL.routes.ltc, <CareNotesPage />) },
        { path: 'new',  element: withRoles(ACCESS_CONTROL.routes.ltc, <NewCareNotePage />) },
        { path: ':id',  element: withRoles(ACCESS_CONTROL.routes.ltc, <CareNoteDetailsPage />) }
      ]
    }
  ]
},
    ]
  }
]);