import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Building2,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const modules = [
    {
      title: 'Clinic EHR',
      description: 'Patient records, encounters, appointments, and claims in one flow.',
      icon: Stethoscope,
      accent: 'text-blue-600 bg-blue-100 border-blue-200'
    },
    {
      title: 'Pharmacy',
      description: 'Prescription queue, dispensing checks, and inventory intelligence.',
      icon: Pill,
      accent: 'text-emerald-600 bg-emerald-100 border-emerald-200'
    },
    {
      title: 'Lab Management',
      description: 'Order tracking, results entry, and abnormal result review controls.',
      icon: FlaskConical,
      accent: 'text-cyan-600 bg-cyan-100 border-cyan-200'
    },
    {
      title: 'Long-Term Care',
      description: 'Resident records, care notes, and continuity across facility staff.',
      icon: Building2,
      accent: 'text-amber-600 bg-amber-100 border-amber-200'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-100 via-white to-blue-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/30">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">WebIMS</p>
              <p className="text-xs font-medium text-slate-500">Integrated Medical Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Request Access
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pt-16">
        <section className="lg:col-span-7">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheck size={14} className="mr-2" />
            Enterprise Clinical Experience
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Professional-grade healthcare operations,
            <span className="text-blue-700"> built for modern clinical teams.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            WebIMS unifies clinical documentation, patient workflows, billing, pharmacy, lab results, and long-term care.
            Designed as a realistic US healthcare software experience with role-based access and production-ready architecture.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Open Platform'}
              <ArrowRight size={16} className="ml-2" />
            </button>
            <Link
              to="/signup"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Create User Account
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">70%+</p>
              <p className="mt-1 text-sm text-slate-600">End-to-end platform completion with live workflows.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">6 Roles</p>
              <p className="mt-1 text-sm text-slate-600">Role-aware navigation and permission-based feature access.</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Platform Modules</h2>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Live Demo
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border ${module.accent}`}>
                      <module.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center text-sm font-semibold text-slate-800">
                <CalendarCheck size={16} className="mr-2 text-blue-600" />
                Start in under one minute
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Use demo credentials on the sign-in page to preview role-based EHR, pharmacy, lab, billing, and LTC workflows.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};