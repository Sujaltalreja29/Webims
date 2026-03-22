import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { ROLE_LABELS } from '../../../core/constants/roles';
import type { UserRole } from '../../../core/models';

interface AccessDeniedState {
  requiredRoles?: UserRole[];
  currentRole?: UserRole;
  attemptedPath?: string;
}

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const state = (location.state || {}) as AccessDeniedState;

  const currentRole = state.currentRole || user?.role;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <ShieldX size={30} />
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Access Denied</h1>
        <p className="mt-2 text-slate-600">
          You do not have permission to access this page in your current role.
        </p>

        <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {state.attemptedPath ? (
            <p className="text-slate-700">
              <span className="font-semibold">Attempted Route:</span> {state.attemptedPath}
            </p>
          ) : null}
          {currentRole ? (
            <p className="text-slate-700">
              <span className="font-semibold">Current Role:</span> {ROLE_LABELS[currentRole]}
            </p>
          ) : null}
          {state.requiredRoles?.length ? (
            <p className="text-slate-700">
              <span className="font-semibold">Allowed Roles:</span>{' '}
              {state.requiredRoles.map((role) => ROLE_LABELS[role]).join(', ')}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
