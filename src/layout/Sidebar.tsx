import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROLE_LABELS } from '../core/constants/roles';
import { ACCESS_CONTROL } from '../core/constants/access-control';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  Activity,
  ChevronDown,
  Stethoscope,
  ClipboardList,
  Building2,
  Package,
  RefreshCcw,
  FlaskConical
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: any;
  label: string;
  roles: string[];
  badge?: string;
  children?: NavItem[];
}

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [expandedModules, setExpandedModules] = useState<string[]>(['clinic']);

  const navModules: { id: string; label: string; icon: any; items: NavItem[] }[] = [
    {
      id: 'clinic',
      label: 'Clinic EHR',
      icon: Stethoscope,
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
        { path: '/patients', icon: Users, label: 'Patients', roles: ACCESS_CONTROL.routes.patients },
        { path: '/appointments', icon: Calendar, label: 'Appointments', roles: ACCESS_CONTROL.routes.appointments },
        { path: '/clinical', icon: ClipboardList, label: 'Clinical Notes', roles: ACCESS_CONTROL.routes.clinical },
        {
          path: '/lab',
          icon: FlaskConical,
          label: 'Lab Results',
          roles: ACCESS_CONTROL.routes.lab
        },
        { path: '/clinical/refill-requests', icon: RefreshCcw, label: 'Refill Requests', roles: ACCESS_CONTROL.routes.refillRequests },
        { path: '/billing', icon: DollarSign, label: 'Billing', roles: ACCESS_CONTROL.routes.billing }
      ]
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: Pill,
      items: [
        { path: '/pharmacy/prescriptions', icon: FileText, label: 'Prescriptions', roles: ACCESS_CONTROL.routes.pharmacyQueue },
        { path: '/pharmacy/inventory', icon: Package, label: 'Inventory', roles: ACCESS_CONTROL.routes.pharmacyInventory }
      ]
    },
    {
      id: 'ltc',
      label: 'CareCatalyst (LTC)',
      icon: Building2,
      items: [
        {
          path: '/ltc/residents',
          icon: Users,
          label: 'Residents',
          roles: ACCESS_CONTROL.routes.ltc
        },
        {
          path: '/ltc/care-notes',
          icon: FileText,
          label: 'Care Notes',
          roles: ACCESS_CONTROL.routes.ltc
        }
      ]
    }
  ];

  const canAccessRoute = (roles: string[]) => {
    if (roles.includes('all')) return true;
    return user && roles.includes(user.role);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isModuleActive = (items: NavItem[]) => {
    return items.some(item => location.pathname.startsWith(item.path));
  };

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }

    if (path === '/clinical') {
      return (
        location.pathname === '/clinical' ||
        (location.pathname.startsWith('/clinical/') && !location.pathname.startsWith('/clinical/refill-requests'))
      );
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-400/30">
          <Activity className="text-white" size={20} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900">WebIMS</span>
          <p className="text-xs font-medium text-slate-500">Clinical Operations Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {navModules.map((module) => {
          const hasAccess = module.items.some(item => canAccessRoute(item.roles));
          if (!hasAccess) return null;

          const isExpanded = expandedModules.includes(module.id);
          const isActive = isModuleActive(module.items);

          return (
            <div key={module.id} className="mb-1">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition-all ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center">
                  <module.icon size={18} className="mr-3" />
                  <span className="text-sm font-semibold">{module.label}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Module Items */}
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
                  {module.items.map((item) => {
                    if (!canAccessRoute(item.roles)) return null;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={() =>
                          `flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                            isItemActive(item.path)
                              ? 'bg-slate-100 font-semibold text-slate-900'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          }`
                        }
                      >
                        <div className="flex items-center">
                          <item.icon size={16} className="mr-3" />
                          {item.label}
                        </div>
                        {item.badge && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed In</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.fullName || 'Unknown User'}</p>
          <p className="text-xs text-slate-600">{user ? ROLE_LABELS[user.role] : 'No active role'}</p>
        </div>
      </div>
    </aside>
  );
};