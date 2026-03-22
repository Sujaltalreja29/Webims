import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/auth/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { AccessDeniedPage } from '../features/auth/pages/AccessDeniedPage';
import { MainLayout } from '../layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import type { UserRole } from '../core/models';
import { ACCESS_CONTROL } from '../core/constants/access-control';

const ClinicDashboard = lazy(() => import('../features/dashboard/pages/ClinicDashboard').then((m) => ({ default: m.ClinicDashboard })));
const PatientsListPage = lazy(() => import('../features/patients/pages/PatientsListPage').then((m) => ({ default: m.PatientsListPage })));
const CreatePatientPage = lazy(() => import('../features/patients/pages/CreatePatientPage').then((m) => ({ default: m.CreatePatientPage })));
const EditPatientPage = lazy(() => import('../features/patients/pages/EditPatientPage').then((m) => ({ default: m.EditPatientPage })));
const PatientDetailsPage = lazy(() => import('../features/patients/pages/PatientDetailsPage').then((m) => ({ default: m.PatientDetailsPage })));
const AppointmentsPage = lazy(() => import('../features/appointments/pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const NewAppointmentPage = lazy(() => import('../features/appointments/pages/NewAppointmentPage').then((m) => ({ default: m.NewAppointmentPage })));
const AppointmentDetailsPage = lazy(() => import('../features/appointments/pages/AppointmentDetailsPage').then((m) => ({ default: m.AppointmentDetailsPage })));
const RescheduleAppointmentPage = lazy(() => import('../features/appointments/pages/RescheduleAppointmentPage').then((m) => ({ default: m.RescheduleAppointmentPage })));
const ClinicalNotesPage = lazy(() => import('../features/clinical/pages/ClinicalNotesPage').then((m) => ({ default: m.ClinicalNotesPage })));
const NewEncounterPage = lazy(() => import('../features/clinical/pages/NewEncounterPage').then((m) => ({ default: m.NewEncounterPage })));
const EncounterDetailsPage = lazy(() => import('../features/clinical/pages/EncounterDetailsPage').then((m) => ({ default: m.EncounterDetailsPage })));
const RefillRequestsPage = lazy(() => import('../features/clinical/pages/RefillRequestsPage').then((m) => ({ default: m.RefillRequestsPage })));
const BillingPage = lazy(() => import('../features/billing/pages/BillingPage').then((m) => ({ default: m.BillingPage })));
const NewClaimPage = lazy(() => import('../features/billing/pages/NewClaimPage').then((m) => ({ default: m.NewClaimPage })));
const ClaimDetailsPage = lazy(() => import('../features/billing/pages/ClaimDetailsPage').then((m) => ({ default: m.ClaimDetailsPage })));
const PrescriptionsPage = lazy(() => import('../features/pharmacy/pages/PrescriptionsPage').then((m) => ({ default: m.PrescriptionsPage })));
const PrescriptionDetailsPage = lazy(() => import('../features/pharmacy/pages/PrescriptionDetailsPage').then((m) => ({ default: m.PrescriptionDetailsPage })));
const InventoryPage = lazy(() => import('../features/pharmacy/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const AddEditMedicationPage = lazy(() => import('../features/pharmacy/pages/AddEditMedicationPage').then((m) => ({ default: m.AddEditMedicationPage })));
const MedicationDetailsPage = lazy(() => import('../features/pharmacy/pages/MedicationDetailsPage').then((m) => ({ default: m.MedicationDetailsPage })));
const LabResultsPage = lazy(() => import('../features/lab/pages/LabResultsPage').then((m) => ({ default: m.LabResultsPage })));
const EnterResultsPage = lazy(() => import('../features/lab/pages/EnterResultsPage').then((m) => ({ default: m.EnterResultsPage })));
const LabResultDetailsPage = lazy(() => import('../features/lab/pages/LabResultDetailsPage').then((m) => ({ default: m.LabResultDetailsPage })));
const ResidentsPage = lazy(() => import('../features/ltc/pages/ResidentsPage').then((m) => ({ default: m.ResidentsPage })));
const AddEditResidentPage = lazy(() => import('../features/ltc/pages/AddEditResidentPage').then((m) => ({ default: m.AddEditResidentPage })));
const ResidentDetailsPage = lazy(() => import('../features/ltc/pages/ResidentDetailsPage').then((m) => ({ default: m.ResidentDetailsPage })));
const CareNotesPage = lazy(() => import('../features/ltc/pages/CareNotesPage').then((m) => ({ default: m.CareNotesPage })));
const NewCareNotePage = lazy(() => import('../features/ltc/pages/NewCareNotePage').then((m) => ({ default: m.NewCareNotePage })));
const CareNoteDetailsPage = lazy(() => import('../features/ltc/pages/CareNoteDetailsPage').then((m) => ({ default: m.CareNoteDetailsPage })));

const withSuspense = (element: JSX.Element) => (
  <Suspense
    fallback={
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">Loading module...</div>
    }
  >
    {element}
  </Suspense>
);

const withRoles = (roles: UserRole[], element: JSX.Element) => (
  <RoleProtectedRoute roles={roles}>{withSuspense(element)}</RoleProtectedRoute>
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
        path: 'access-denied',
        element: <AccessDeniedPage />
      },
      {
        path: 'dashboard',
        element: withSuspense(<ClinicDashboard />)
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