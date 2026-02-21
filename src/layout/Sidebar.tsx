import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  Package
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
        { path: '/patients', icon: Users, label: 'Patients', roles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] },
        { path: '/appointments', icon: Calendar, label: 'Appointments', roles: ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'] },
        { path: '/clinical', icon: ClipboardList, label: 'Clinical Notes', roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
        { path: '/billing', icon: DollarSign, label: 'Billing', roles: ['BILLING', 'ADMIN'] }
      ]
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: Pill,
      items: [
        { path: '/pharmacy/prescriptions', icon: FileText, label: 'Prescriptions', roles: ['PHARMACIST', 'DOCTOR', 'ADMIN'] },
        { path: '/pharmacy/inventory', icon: Package, label: 'Inventory', roles: ['PHARMACIST', 'ADMIN'] }
      ]
    },
    {
      id: 'ltc',
      label: 'CareCatalyst (LTC)',
      icon: Building2,
      items: [
        { path: '/ltc/residents', icon: Users, label: 'Residents', roles: ['NURSE', 'ADMIN'], badge: 'Soon' },
        { path: '/ltc/care-notes', icon: FileText, label: 'Care Notes', roles: ['NURSE', 'ADMIN'], badge: 'Soon' }
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

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 h-screen fixed left-0 top-0 shadow-2xl">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Activity className="text-blue-400 mr-3" size={28} strokeWidth={2.5} />
        <div>
          <span className="text-xl font-bold text-white">WebIMS</span>
          <p className="text-xs text-slate-400">Healthcare Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)]">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
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
                <div className="mt-1 ml-4 space-y-1">
                  {module.items.map((item) => {
                    if (!canAccessRoute(item.roles)) return null;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-slate-700 text-white font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                          }`
                        }
                      >
                        <div className="flex items-center">
                          <item.icon size={16} className="mr-3" />
                          {item.label}
                        </div>
                        {item.badge && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
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
    </div>
  );
};