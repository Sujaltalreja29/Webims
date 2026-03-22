# WebIMS Project Documentation

## 1. Project Summary
WebIMS is a role-based, single-page Electronic Health Record (EHR) and clinic operations system built with React + TypeScript + Vite. It covers outpatient clinical workflows, billing/claims, pharmacy inventory and dispensing, lab operations, and long-term care (LTC) resident management.

The application is designed as a front-end-first system with localStorage persistence and modular API service wrappers, making it suitable for:
- product demos
- feature prototyping
- workflow validation before backend integration

---

## 2. Technology Stack

### Frontend
- React 19
- TypeScript
- React Router DOM (route-based application shell)
- Zustand (authentication/session state)
- Tailwind CSS 4
- Lucide React (icon system)
- Sonner (toast notifications)

### Forms and Validation
- React Hook Form
- Zod + `@hookform/resolvers`

### Build and Tooling
- Vite 7
- ESLint 9
- PostCSS + Autoprefixer

### Data Persistence
- Browser localStorage via a typed wrapper service (`webims_` key prefix)

---

## 3. High-Level Architecture

### 3.1 App Shell
- Public entry routes for landing/login/signup.
- Protected route wrapper for authenticated areas.
- Role-protected route wrapper for module authorization.
- Main layout with sidebar + top header.
- Header includes global quick launcher (`Ctrl/Cmd + K`) with cross-entity search.

### 3.2 Data Layer Pattern
- `BaseApiService<T>` provides CRUD + search operations.
- Domain APIs extend the base service per entity (patients, appointments, claims, labs, etc.).
- Seed data initializes localStorage and includes migration/backfill behavior.
- Audit logging captures create/update/delete events.

### 3.3 Domain Modules
- Auth
- Dashboard
- Patients
- Appointments
- Clinical
- Billing
- Lab
- Pharmacy
- LTC

### 3.4 Performance Strategy
- Route-level lazy loading is implemented in router.
- Suspense fallback renders module loader while lazy routes load.
- This reduces initial bundle pressure and improves first-load behavior.

---

## 4. Authentication and Access Control

### 4.1 Authentication Flow
- User login validates email/password from seeded users in localStorage.
- Auth state is tracked in Zustand (`user`, `isAuthenticated`).
- Registration supports role/department and auto-login.
- Logout clears `current_user` from localStorage.

### 4.2 Roles
- ADMIN
- DOCTOR
- NURSE
- RECEPTIONIST
- BILLING
- PHARMACIST

### 4.3 Role-Protected Functional Domains
- Dashboard: all roles
- Patients: DOCTOR, NURSE, RECEPTIONIST, ADMIN
- Appointments: DOCTOR, NURSE, RECEPTIONIST, ADMIN
- Clinical: DOCTOR, NURSE, ADMIN
- Refill Requests: DOCTOR, ADMIN
- Billing: BILLING, ADMIN
- Lab: DOCTOR, NURSE, ADMIN
- Pharmacy Queue: PHARMACIST, DOCTOR, ADMIN
- Pharmacy Inventory: PHARMACIST, ADMIN
- LTC: NURSE, DOCTOR, ADMIN

### 4.4 Access Denied UX
- Unauthorized route attempts redirect to `/access-denied`.
- Page displays attempted path, current role, and allowed roles.

---

## 5. Routing and Page Inventory

## 5.1 Public/Auth Pages
- `LandingPage`
  - Public marketing/introduction entry page.
- `LoginPage`
  - Credential login and role-based app entry.
- `SignUpPage`
  - User registration flow with role/department capture.
- `AccessDeniedPage`
  - Permission denial explanation and redirect actions.

## 5.2 Dashboard
- `ClinicDashboard`
  - Role-aware summary widgets.
  - Queue cards for operational backlogs.
  - Fast navigation and workload visibility.

## 5.3 Patients Module
- `PatientsListPage`
  - Patient search/listing and navigation to details/edit.
- `CreatePatientPage`
  - New patient registration.
- `EditPatientPage`
  - Demographics/insurance/contact updates.
- `PatientDetailsPage`
  - Full patient profile, history indicators, and linked record stats.

## 5.4 Appointments Module
- `AppointmentsPage`
  - Appointment list, status, and triage navigation.
- `NewAppointmentPage`
  - New scheduling workflow with patient/provider/time.
- `AppointmentDetailsPage`
  - Timeline, status transitions, cancellation/no-show actions.
- `RescheduleAppointmentPage`
  - Controlled reschedule path with conflict checks.

## 5.5 Clinical Module
- `ClinicalNotesPage`
  - Encounter listing and clinical charting entry points.
- `NewEncounterPage`
  - New encounter creation with diagnostics, vitals, Rx/lab ordering.
  - Clinical guardrails:
    - required complaint/diagnosis/assessment/plan
    - vitals plausibility bounds
    - medication allergy checks
    - duplicate medication prevention
    - severe/moderate interaction checks
- `EncounterDetailsPage`
  - Full encounter review, linked records, close encounter action.
- `RefillRequestsPage`
  - Refill work queue and review actions.

## 5.6 Billing Module
- `BillingPage`
  - Claims list and status filtering (`Draft`, `Submitted`, `Resubmitted`, `Approved`, `Rejected`, `Paid`).
  - KPI cards: total, pending, approved, denied, paid, revenue.
  - A/R aging buckets: 0-30, 31-60, 61-90, 90+ days.
  - Collections trend (last 6 months).
  - Payer mix analytics.
  - Denials rework queue.
  - CSV analytics export.
- `NewClaimPage`
  - Claim creation from patient + optional encounter linkage.
  - Diagnosis/procedure multi-select coding.
  - Integrated claim scrubber preview with quality score.
- `ClaimDetailsPage`
  - Full claim profile and status timeline.
  - Actions:
    - submit
    - approve
    - deny (structured)
    - record payment
    - reopen rejected claim
    - corrected resubmission with appeal notes
  - Displays scrubber summary and structured denial metadata.
  - Payer-specific denial playbook guidance for rework.

## 5.7 Lab Module
- `LabResultsPage`
  - Lab order queue and status visibility.
- `LabResultDetailsPage`
  - Detailed result review including abnormal markers.
- `EnterResultsPage`
  - Structured result-entry workflow for pending orders.

## 5.8 Pharmacy Module
- `PrescriptionsPage`
  - Pharmacy queue and prescription state progression.
- `PrescriptionDetailsPage`
  - Rx detail and dispense workflow.
- `InventoryPage`
  - Medication stock levels, low-stock monitoring, inventory actions.
- `AddEditMedicationPage`
  - Medication catalog and stock metadata create/edit.
- `MedicationDetailsPage`
  - Medication-level details including stock/expiry context.

## 5.9 LTC Module
- `ResidentsPage`
  - Resident census and active resident management.
- `AddEditResidentPage`
  - Create/update resident demographics and care settings.
- `ResidentDetailsPage`
  - Resident care profile with key risk/care attributes.
- `CareNotesPage`
  - LTC note list and status/history context.
- `NewCareNotePage`
  - New care note authoring.
- `CareNoteDetailsPage`
  - Note detail and longitudinal care review.

---

## 6. Component Inventory by Module

### 6.1 Appointments Components
- `CancelAppointmentModal`
  - Capture cancellation reason and state transition.

### 6.2 Patients Components
- `PatientForm`
  - Shared create/edit patient form component.

### 6.3 Clinical Components
- `ApproveRefillModal`
  - Approval workflow with refill-eligibility safety checks.
- `DenyRefillModal`
  - Structured denial for refill requests.
- `CreatePrescriptionModal`
  - New prescription capture inside encounter workflow.
- `OrderLabTestModal`
  - Lab ordering capture inside encounter workflow.
- `ManageActiveMedicationsModal`
  - Active medication management controls.
- `PatientMedicalHistory`
  - Prior encounter/history snapshot during charting.
- `PrescriptionsList`
  - Encounter-linked Rx display.
- `VitalsDisplay`
  - Clinical vitals rendering with layout consistency.

### 6.4 Billing Components
- `RecordPaymentModal`
  - Payment posting workflow for approved claims.

### 6.5 Pharmacy Components
- `DispenseModal`
  - Medication dispense workflow.
- `StockAdjustmentModal`
  - Manual stock adjustment transaction capture.

### 6.6 Dashboard Components
- `QueueCard`
  - Reusable queue visualization card.

---

## 7. Core Services and Functional Engines

### 7.1 Storage and Seed
- `storage.service.ts`
  - Typed localStorage wrapper (`set`, `get`, `remove`, `clear`, key enumeration).
- `seed-data.ts`
  - Seeds users/patients/appointments/encounters/prescriptions/claims/labs/refills/inventory/LTC data.
  - Includes migration backfills for older localStorage installs.

### 7.2 API Services
- `auth.api.ts`
- `patient.api.ts`
- `appointment.api.ts`
- `encounter.api.ts`
- `prescription.api.ts`
- `billing.api.ts`
- `lab-result.api.ts`
- `medication-inventory.api.ts`
- `refill-request.api.ts`
- `resident.api.ts`
- `care-note.api.ts`

Common behavior:
- CRUD/search operations
- domain-specific helpers (generators, queues, stats, transitions)
- persistent state via localStorage

### 7.3 Clinical Safety Engine
- `clinical-safety.service.ts`
  - Medication-allergy matching
  - Duplicate medication detection
  - Drug interaction severity checks
  - Refill timing eligibility validation

Supporting constants:
- `medication-allergy-map.ts`
- `drug-interactions.ts`

### 7.4 Billing Safety and Revenue Cycle Engines
- `billing-scrubber.service.ts`
  - pre-submit claim validation
  - blocking errors vs warnings
  - quality scoring
- `denial-reasons.ts`
  - denial categories and reason codes taxonomy
- `payer-denial-playbooks.ts`
  - payer-specific denial correction playbooks

### 7.5 Global Search Engine
- `global-search.service.ts`
  - role-filtered, ranked search across:
    - quick actions
    - patients
    - appointments
    - encounters
    - prescriptions
    - claims
    - labs

### 7.6 Audit Layer
- `audit-log.service.ts`
- `audit-log.model.ts`
- `base-api.service.ts` integration

Tracks:
- CREATE / UPDATE / DELETE
- entity type/id
- actor metadata
- before/after snapshots

---

## 8. Billing Module Deep Functionality (Current)

### 8.1 Claim Lifecycle States
- Draft
- Submitted
- Resubmitted
- Approved
- Rejected
- Paid

### 8.2 Submission Quality Controls
- Claim scrubber evaluates:
  - required fields
  - date validity/timely filing warning
  - diagnosis/procedure presence
  - amount validity
  - duplicate coding hints
  - encounter linkage warning
  - high amount warning

### 8.3 Denial and Rework
- Structured denial input:
  - category
  - reason code
  - optional details
- Reopen rejected claim into draft
- Corrected resubmission with appeal note
- Denial metadata retained on claim

### 8.4 Payer Playbooks
- Dynamic guidance by insurance type (Medicare/Medicaid/Private/Self-Pay/default)
- Action checklist + target turnaround displayed in denial workflow

### 8.5 Analytics and Export
- KPI summary cards
- A/R aging buckets
- 6-month collections trend
- payer mix distribution
- exportable CSV analytics snapshot

---

## 9. Dashboard and Operational Queue System

### 9.1 Queue Data Hook
`useQueueData` aggregates operational backlogs:
- pending refills
- pending lab orders
- billing actions (draft/submitted/denied)
- low stock alerts

### 9.2 Role Filtering
Queues are filtered by role permissions before rendering.

### 9.3 Queue Card UX
Each queue card shows:
- title
- description
- pending count
- navigation route

---

## 10. Header and Navigation Intelligence

### 10.1 Global Quick Launcher
- Trigger: `Ctrl/Cmd + K`
- Search supports keyboard navigation:
  - up/down arrows
  - enter to open
  - escape to close
- Grouped result sections by entity type.

### 10.2 Role-Safe Discovery
Search result visibility respects route permission model.

---

## 11. Data Models (Core Entities)
- User
- Patient
- Appointment
- Encounter
- Prescription
- Claim
- LabResult
- MedicationInventory
- RefillRequest
- Resident
- CareNote
- AuditLog

Each model is strongly typed and referenced by API/service layers.

---

## 12. Demo Data and Accounts
Seeded accounts (password: `password`):
- doctor@webims.com
- nurse@webims.com
- reception@webims.com
- billing@webims.com
- pharmacist@webims.com
- admin@webims.com

Seeded data includes records across all major modules for immediate workflow testing.

---

## 13. Run and Build

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 14. Current Implementation Notes
- The app is fully frontend/localStorage based and does not yet use a server database.
- Route-level lazy loading is active for major feature pages.
- Access control is centralized and enforced at route level.
- Clinical and billing safety guardrails are implemented in reusable core services.
- Billing now includes structured denials, rework flow, corrected resubmission, and analytics export.

---

## 15. Suggested Future Enhancements
- Backend API integration with persistent datastore and auth token flow.
- Automated testing (unit/integration/e2e) for high-risk workflows.
- Real-world medical coding dictionaries (ICD/CPT) and payer rule engines.
- Multi-tenant clinic/facility support.
- Offline sync conflict handling and audit reporting dashboards.
